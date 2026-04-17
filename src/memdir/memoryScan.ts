/**
 * Memory-directory scanning primitives. Split out of findRelevantMemories.ts
 * so extractMemories can import the scan without pulling in sideQuery and
 * the API-client chain (which closed a cycle through memdir.ts — #25372).
 */

import { readdir } from 'fs/promises'
import { basename, join } from 'path'
import { parseFrontmatter } from '../utils/frontmatterParser.js'
import { readFileInRange } from '../utils/readFileInRange.js'
import { type MemoryType, parseMemoryType } from './memoryTypes.js'

export type MemoryHeader = {
  filename: string
  filePath: string
  mtimeMs: number
  description: string | null
  type: MemoryType | undefined
  title: string | null
  tags: string[]
  wikilinks: string[]
  category: string | null
}

const MAX_MEMORY_FILES = 200
const FRONTMATTER_MAX_LINES = 80

function normalizeTag(value: string): string {
  return value.trim().toLowerCase()
}

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((tag): tag is string => typeof tag === 'string')
      .map(normalizeTag)
      .filter(Boolean)
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      return trimmed
        .slice(1, -1)
        .split(',')
        .map(tag => tag.replace(/^['"]|['"]$/g, ''))
        .map(normalizeTag)
        .filter(Boolean)
    }
    return trimmed
      .split(',')
      .map(normalizeTag)
      .filter(Boolean)
  }
  return []
}

function extractWikilinks(content: string): string[] {
  const matches = content.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g) ?? []
  return matches
    .map(match => match.slice(2, -2).split('|')[0]?.trim() ?? '')
    .filter(Boolean)
}

function getCategoryFromFilename(filename: string): string | null {
  const normalized = filename.replace(/\\/g, '/')
  const parts = normalized.split('/')
  const knowledgeIndex = parts.indexOf('knowledge')
  if (knowledgeIndex >= 0 && parts.length > knowledgeIndex + 1) {
    return parts[knowledgeIndex + 1] ?? null
  }
  return null
}

/**
 * Scan a memory directory for .md files, read their frontmatter, and return
 * a header list sorted newest-first (capped at MAX_MEMORY_FILES). Shared by
 * findRelevantMemories (query-time recall) and extractMemories (pre-injects
 * the listing so the extraction agent doesn't spend a turn on `ls`).
 *
 * Single-pass: readFileInRange stats internally and returns mtimeMs, so we
 * read-then-sort rather than stat-sort-read. For the common case (N ≤ 200)
 * this halves syscalls vs a separate stat round; for large N we read a few
 * extra small files but still avoid the double-stat on the surviving 200.
 */
export async function scanMemoryFiles(
  memoryDir: string,
  signal: AbortSignal,
): Promise<MemoryHeader[]> {
  try {
    const scanRoot = memoryDir
    const entries = await readdir(scanRoot, { recursive: true })
    // Limit depth to 3 levels to prevent DoS from deep/symlinked directory trees.
    // Relative paths from readdir use the OS separator, so count separators.
    const sep = require('path').sep as string
    const MAX_DEPTH = 3
    const mdFiles = entries.filter(
      f =>
        f.endsWith('.md') &&
        basename(f) !== 'index.md' &&
        !f.startsWith(`daily${sep}`) &&
        (f.split(sep).length - 1) < MAX_DEPTH,
    )

    const headerResults = await Promise.allSettled(
      mdFiles.map(async (relativePath): Promise<MemoryHeader> => {
        const filePath = join(scanRoot, relativePath)
        const { content, mtimeMs } = await readFileInRange(
          filePath,
          0,
          FRONTMATTER_MAX_LINES,
          undefined,
          signal,
        )
        const { frontmatter } = parseFrontmatter(content, filePath)
        return {
          filename: relativePath,
          filePath,
          mtimeMs,
          description: frontmatter.description || null,
          type: parseMemoryType(frontmatter.type),
          title:
            typeof frontmatter.title === 'string' ? frontmatter.title : null,
          tags: parseTags(frontmatter.tags),
          wikilinks: extractWikilinks(content),
          category: getCategoryFromFilename(relativePath),
        }
      }),
    )

    return headerResults
      .filter(
        (r): r is PromiseFulfilledResult<MemoryHeader> =>
          r.status === 'fulfilled',
      )
      .map(r => r.value)
      .sort((a, b) => b.mtimeMs - a.mtimeMs)
      .slice(0, MAX_MEMORY_FILES)
  } catch {
    return []
  }
}

/**
 * Format memory headers as a text manifest: one line per file with
 * [type] filename (timestamp): description. Used by both the recall
 * selector prompt and the extraction-agent prompt.
 */
export function formatMemoryManifest(memories: MemoryHeader[]): string {
  return memories
    .map(m => {
      const tag = m.type ? `[${m.type}] ` : ''
      const category = m.category ? `{${m.category}} ` : ''
      const ts = new Date(m.mtimeMs).toISOString()
      const title = m.title ? ` title="${m.title}"` : ''
      const tags = m.tags.length > 0 ? ` tags=${m.tags.join(',')}` : ''
      const links = m.wikilinks.length > 0 ? ` links=${m.wikilinks.join(',')}` : ''
      return m.description
        ? `- ${tag}${category}${m.filename} (${ts})${title}${tags}${links}: ${m.description}`
        : `- ${tag}${category}${m.filename} (${ts})${title}${tags}${links}`
    })
    .join('\n')
}
