import { feature } from 'bun:bundle'
import { logForDebugging } from '../utils/debug.js'
import { errorMessage } from '../utils/errors.js'
import { getDefaultSonnetModel } from '../utils/model/model.js'
import { sideQuery } from '../utils/sideQuery.js'
import { jsonParse } from '../utils/slowOperations.js'
import {
  formatMemoryManifest,
  type MemoryHeader,
  scanMemoryFiles,
} from './memoryScan.js'

export type RelevantMemory = {
  path: string
  mtimeMs: number
}

const SELECT_MEMORIES_SYSTEM_PROMPT = `You are selecting memories that will be useful to XETH--7 as it processes a user's query. You will be given the user's query and a list of available memory files with their filenames, descriptions, categories, tags, titles, and wikilinks.

Return a list of filenames for the memories that will clearly be useful to XETH--7 as it processes the user's query (up to 5). Only include memories that you are certain will be helpful based on their name, description, title, category, tags, and graph connections.
- If you are unsure if a memory will be useful in processing the user's query, then do not include it in your list. Be selective and discerning.
- If there are no memories in the list that would clearly be useful, feel free to return an empty list.
- If a list of recently-used tools is provided, do not select memories that are usage reference or API documentation for those tools (XETH--7 is already exercising them). DO still select memories containing warnings, gotchas, or known issues about those tools — active use is exactly when those matter.
- Prefer durable knowledge notes over daily logs or indexes (those are already handled elsewhere).
`

const MAX_CANDIDATES_FOR_MODEL = 30
const MAX_SELECTED_MEMORIES = 5
const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
  'from',
  'into',
  'your',
  'have',
  'what',
  'when',
  'where',
  'which',
  'will',
  'about',
  'there',
  'them',
  'they',
  'does',
  'using',
  'used',
  'need',
  'want',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .map(token => token.trim())
    .filter(token => token.length >= 3 && !STOP_WORDS.has(token))
}

function countMatches(haystack: string, tokens: readonly string[]): number {
  const lower = haystack.toLowerCase()
  let count = 0
  for (const token of tokens) {
    if (lower.includes(token)) count++
  }
  return count
}

function scoreMemoryForTokens(
  memory: MemoryHeader,
  tokens: readonly string[],
): number {
  let score = 0
  score += countMatches(memory.filename, tokens) * 5
  score += countMatches(memory.description ?? '', tokens) * 4
  score += countMatches(memory.title ?? '', tokens) * 4
  score += countMatches(memory.tags.join(' '), tokens) * 3
  score += countMatches(memory.wikilinks.join(' '), tokens) * 2
  score += countMatches(memory.category ?? '', tokens) * 2

  if (memory.category === 'connections') score += 2
  if (memory.wikilinks.length > 0) score += 1

  return score
}

export function rankMemoriesForQuery(
  query: string,
  memories: MemoryHeader[],
): MemoryHeader[] {
  const tokens = tokenize(query)
  if (tokens.length === 0) {
    return [...memories].sort((a, b) => b.mtimeMs - a.mtimeMs)
  }

  const scored = memories.map(memory => {
    return { memory, score: scoreMemoryForTokens(memory, tokens) }
  })

  return scored
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return b.memory.mtimeMs - a.memory.mtimeMs
    })
    .map(entry => entry.memory)
}

function expandWithLinkedMemories(
  selected: MemoryHeader[],
  allCandidates: MemoryHeader[],
): MemoryHeader[] {
  if (selected.length >= MAX_SELECTED_MEMORIES) return selected.slice(0, MAX_SELECTED_MEMORIES)

  const byBasename = new Map<string, MemoryHeader>()
  const byStem = new Map<string, MemoryHeader>()
  for (const memory of allCandidates) {
    const normalized = memory.filename.replace(/\\/g, '/')
    const base = normalized.split('/').pop() ?? normalized
    byBasename.set(base.toLowerCase(), memory)
    byStem.set(base.replace(/\.md$/i, '').toLowerCase(), memory)
  }

  const result = [...selected]
  const seen = new Set(result.map(memory => memory.filename))

  for (const memory of selected) {
    for (const link of memory.wikilinks) {
      const normalized = link.replace(/\\/g, '/').split('/').pop()?.toLowerCase() ?? ''
      const candidate =
        byBasename.get(`${normalized}.md`) ??
        byBasename.get(normalized) ??
        byStem.get(normalized)
      if (!candidate || seen.has(candidate.filename)) continue
      result.push(candidate)
      seen.add(candidate.filename)
      if (result.length >= MAX_SELECTED_MEMORIES) {
        return result
      }
    }
  }

  return result
}

/**
 * Find memory files relevant to a query by scanning memory file headers
 * and asking Sonnet to select the most relevant ones.
 *
 * Returns absolute file paths + mtime of the most relevant memories
 * (up to 5). Excludes MEMORY.md (already loaded in system prompt).
 * mtime is threaded through so callers can surface freshness to the
 * main model without a second stat.
 *
 * `alreadySurfaced` filters paths shown in prior turns before the
 * Sonnet call, so the selector spends its 5-slot budget on fresh
 * candidates instead of re-picking files the caller will discard.
 */
export async function findRelevantMemories(
  query: string,
  memoryDir: string,
  signal: AbortSignal,
  recentTools: readonly string[] = [],
  alreadySurfaced: ReadonlySet<string> = new Set(),
): Promise<RelevantMemory[]> {
  const memories = (await scanMemoryFiles(memoryDir, signal)).filter(
    m => !alreadySurfaced.has(m.filePath),
  )
  if (memories.length === 0) {
    return []
  }

  const ranked = rankMemoriesForQuery(query, memories)
  const candidatePool = ranked.slice(0, MAX_CANDIDATES_FOR_MODEL)
  const queryTokens = tokenize(query)

  const selectedFilenames = await selectRelevantMemories(
    query,
    candidatePool,
    signal,
    recentTools,
  )
  const byFilename = new Map(candidatePool.map(m => [m.filename, m]))
  const selectedFromModel = selectedFilenames
    .map(filename => byFilename.get(filename))
    .filter((m): m is MemoryHeader => m !== undefined)
  const selected =
    selectedFromModel.length > 0
      ? expandWithLinkedMemories(selectedFromModel, candidatePool)
      : candidatePool
          .filter(memory => scoreMemoryForTokens(memory, queryTokens) > 0)
          .slice(0, MAX_SELECTED_MEMORIES)

  // Fires even on empty selection: selection-rate needs the denominator,
  // and -1 ages distinguish "ran, picked nothing" from "never ran".
  if (feature('MEMORY_SHAPE_TELEMETRY')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { logMemoryRecallShape } =
      require('./memoryShapeTelemetry.js') as typeof import('./memoryShapeTelemetry.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    logMemoryRecallShape(candidatePool, selected)
  }

  return selected.slice(0, MAX_SELECTED_MEMORIES).map(m => ({ path: m.filePath, mtimeMs: m.mtimeMs }))
}

async function selectRelevantMemories(
  query: string,
  memories: MemoryHeader[],
  signal: AbortSignal,
  recentTools: readonly string[],
): Promise<string[]> {
  const validFilenames = new Set(memories.map(m => m.filename))

  const manifest = formatMemoryManifest(memories)

  // When Claude Code is actively using a tool (e.g. mcp__X__spawn),
  // surfacing that tool's reference docs is noise — the conversation
  // already contains working usage.  The selector otherwise matches
  // on keyword overlap ("spawn" in query + "spawn" in a memory
  // description → false positive).
  const toolsSection =
    recentTools.length > 0
      ? `\n\nRecently used tools: ${recentTools.join(', ')}`
      : ''

  try {
    const result = await sideQuery({
      model: getDefaultSonnetModel(),
      system: SELECT_MEMORIES_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Query: ${query}\n\nAvailable memories:\n${manifest}${toolsSection}`,
        },
      ],
      max_tokens: 256,
      output_format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            selected_memories: { type: 'array', items: { type: 'string' } },
          },
          required: ['selected_memories'],
          additionalProperties: false,
        },
      },
      signal,
      querySource: 'memdir_relevance',
    })

    const textBlock = result.content.find(block => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return []
    }

    const parsed: { selected_memories: string[] } = jsonParse(textBlock.text)
    return parsed.selected_memories.filter(f => validFilenames.has(f))
  } catch (e) {
    if (signal.aborted) {
      return []
    }
    logForDebugging(
      `[memdir] selectRelevantMemories failed: ${errorMessage(e)}`,
      { level: 'warn' },
    )
    return []
  }
}
