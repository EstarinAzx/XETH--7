/**
 * Prompt templates for the background memory extraction agent.
 *
 * The extraction agent runs as a perfect fork of the main conversation — same
 * system prompt, same message prefix. The main agent's system prompt always
 * has full save instructions; when the main agent writes memories itself,
 * extractMemories.ts skips that turn (hasMemoryWritesSince). This prompt
 * fires only when the main agent didn't write, so the save-criteria here
 * overlap the system prompt's harmlessly.
 */

import { feature } from 'bun:bundle'
import {
  DIRECT_MEMORY_WRITE_WORKFLOW_SECTION,
  KNOWLEDGE_ARTICLE_FORMAT_SECTION,
  KNOWLEDGE_GRAPH_STRUCTURE_SECTION,
  KNOWLEDGE_ROUTING_SECTION,
  MEMORY_FRONTMATTER_EXAMPLE,
  REMEMBER_FORGET_BEHAVIOR_SECTION,
  TYPES_SECTION_COMBINED,
  TYPES_SECTION_INDIVIDUAL,
  WHAT_NOT_TO_SAVE_SECTION,
} from '../../memdir/memoryTypes.js'
import { BASH_TOOL_NAME } from '../../tools/BashTool/toolName.js'
import { FILE_EDIT_TOOL_NAME } from '../../tools/FileEditTool/constants.js'
import { FILE_READ_TOOL_NAME } from '../../tools/FileReadTool/prompt.js'
import { FILE_WRITE_TOOL_NAME } from '../../tools/FileWriteTool/prompt.js'
import { GLOB_TOOL_NAME } from '../../tools/GlobTool/prompt.js'
import { GREP_TOOL_NAME } from '../../tools/GrepTool/prompt.js'

/**
 * Shared opener for both extract-prompt variants.
 */
function opener(newMessageCount: number, existingMemories: string): string {
  const manifest =
    existingMemories.length > 0
      ? `\n\n## Existing memory files\n\n${existingMemories}\n\nCheck this list before writing — update an existing file rather than creating a duplicate.`
      : ''
  return [
    `You are now acting as the memory extraction subagent. Analyze the most recent ~${newMessageCount} messages above and use them to update your persistent memory systems.`,
    '',
    `Available tools: ${FILE_READ_TOOL_NAME}, ${GREP_TOOL_NAME}, ${GLOB_TOOL_NAME}, read-only ${BASH_TOOL_NAME} (ls/find/cat/stat/wc/head/tail and similar), and ${FILE_EDIT_TOOL_NAME}/${FILE_WRITE_TOOL_NAME} for paths inside the memory directory only. ${BASH_TOOL_NAME} rm is not permitted. All other tools — MCP, Agent, write-capable ${BASH_TOOL_NAME}, etc — will be denied.`,
    '',
    `You have a limited turn budget. ${FILE_EDIT_TOOL_NAME} requires a prior ${FILE_READ_TOOL_NAME} of the same file, so the efficient strategy is: turn 1 — issue all ${FILE_READ_TOOL_NAME} calls in parallel for every file you might update; turn 2 — issue all ${FILE_WRITE_TOOL_NAME}/${FILE_EDIT_TOOL_NAME} calls in parallel. Do not interleave reads and writes across multiple turns.`,
    '',
    `Do NOT use ${BASH_TOOL_NAME} to check whether memory files or directories exist. Never run shell probes like ls/test/stat/printf yes-no against the memory paths. If you need to inspect a known note, use ${FILE_READ_TOOL_NAME}. If a file should be created, use ${FILE_WRITE_TOOL_NAME} directly.`,
    '',
    `You MUST only use content from the last ~${newMessageCount} messages to update your persistent memories. Do not waste any turns attempting to investigate or verify that content further — no grepping source files, no reading code to confirm a pattern exists, no git commands.` +
      manifest,
  ].join('\n')
}

/**
 * Build the extraction prompt for auto-only memory (no team memory).
 * Four-type taxonomy, no scope guidance (single directory).
 */
export function buildExtractAutoOnlyPrompt(
  newMessageCount: number,
  existingMemories: string,
  skipIndex = false,
): string {
  const knowledgeDir = 'knowledge/'
  const dailyPath = 'daily/YYYY-MM-DD.md'
  const howToSave = skipIndex
    ? [
        '## How to save memories',
        '',
        `Write each durable memory as its own knowledge note under \`${knowledgeDir}\` using this frontmatter format:`,
        '',
        ...MEMORY_FRONTMATTER_EXAMPLE,
        '',
        `- Place the note in the best matching category folder under \`${knowledgeDir}\``,
        '- Update `index.md` with a one-line wikilink to the note',
        `- Append a short bullet to today's daily log at \`${dailyPath}\``,
        '- Use wikilinks in note bodies to connect related ideas for Obsidian graph view',
        '- Organize memory semantically by topic, not chronologically',
        '- Update or remove memories that turn out to be wrong or outdated',
        '- Do not write duplicate memories. First check if there is an existing memory you can update before writing a new one.',
      ]
    : [
        '## How to save memories',
        '',
        'Saving a memory is a three-step process:',
        '',
        `**Step 1** — write the durable knowledge note to the best matching folder under \`${knowledgeDir}\` using this frontmatter format:`,
        '',
        ...MEMORY_FRONTMATTER_EXAMPLE,
        '',
        '**Step 2** — add a pointer to that note in `index.md`. `index.md` is an index, not a memory — each entry should be one line, under ~150 characters, and should use a wikilink such as `- [[knowledge/concepts/branch-workflow]] — ongoing work stays on xeth-7-dev`.',
        '',
        `**Step 3** — append a brief note to today's daily log at \`${dailyPath}\` so the raw chronology is preserved.`,
        '',
        '- `index.md` is always loaded into your system prompt — lines after 200 will be truncated, so keep the index concise',
        '- Use wikilinks in note bodies to connect related ideas for Obsidian graph view',
        '- Organize memory semantically by topic, not chronologically',
        '- Update or remove memories that turn out to be wrong or outdated',
        '- Do not write duplicate memories. First check if there is an existing memory you can update before writing a new one.',
      ]

  return [
    opener(newMessageCount, existingMemories),
    '',
    'If the user explicitly asks you to remember something, save it immediately as whichever type fits best. If they ask you to forget something, find and remove the relevant entry.',
    '',
    ...TYPES_SECTION_INDIVIDUAL,
    ...WHAT_NOT_TO_SAVE_SECTION,
    '',
    ...KNOWLEDGE_GRAPH_STRUCTURE_SECTION,
    ...KNOWLEDGE_ROUTING_SECTION,
    ...KNOWLEDGE_ARTICLE_FORMAT_SECTION,
    ...REMEMBER_FORGET_BEHAVIOR_SECTION,
    ...DIRECT_MEMORY_WRITE_WORKFLOW_SECTION,
    '',
    ...howToSave,
  ].join('\n')
}

/**
 * Build the extraction prompt for combined auto + team memory.
 * Four-type taxonomy with per-type <scope> guidance (directory choice
 * is baked into each type block, no separate routing section needed).
 */
export function buildExtractCombinedPrompt(
  newMessageCount: number,
  existingMemories: string,
  skipIndex = false,
): string {
  if (!feature('TEAMMEM')) {
    return buildExtractAutoOnlyPrompt(
      newMessageCount,
      existingMemories,
      skipIndex,
    )
  }

  const knowledgeDir = 'knowledge/'
  const dailyPath = 'daily/YYYY-MM-DD.md'
  const howToSave = skipIndex
    ? [
        '## How to save memories',
        '',
        `Write each durable memory as its own knowledge note under the chosen directory's \`${knowledgeDir}\` subtree (private or team, per the type's scope guidance) using this frontmatter format:`,
        '',
        ...MEMORY_FRONTMATTER_EXAMPLE,
        '',
        '- Update the matching `index.md` with a one-line wikilink to the note',
        `- Append a short bullet to today's daily log at \`${dailyPath}\` in the same memory root`,
        '- Use wikilinks in note bodies to connect related ideas for Obsidian graph view',
        '- Organize memory semantically by topic, not chronologically',
        '- Update or remove memories that turn out to be wrong or outdated',
        '- Do not write duplicate memories. First check if there is an existing memory you can update before writing a new one.',
      ]
    : [
        '## How to save memories',
        '',
        'Saving a memory is a three-step process:',
        '',
        `**Step 1** — write the durable knowledge note to the best matching folder under the chosen directory's \`${knowledgeDir}\` subtree (private or team, per the type's scope guidance) using this frontmatter format:`,
        '',
        ...MEMORY_FRONTMATTER_EXAMPLE,
        '',
        "**Step 2** — add a pointer to that note in the same directory's `index.md`. Each directory (private and team) has its own `index.md` index — each entry should be one line, under ~150 characters, and should use a wikilink such as `- [[knowledge/connections/order-payment-flow]] — ties checkout failures to payment retries`. Never write full memory content directly into an index.",
        '',
        `**Step 3** — append a brief note to today's daily log at \`${dailyPath}\` in the same memory root.`,
        '',
        '- Both `index.md` indexes are loaded into your system prompt — lines after 200 will be truncated, so keep them concise',
        '- Use wikilinks in note bodies to connect related ideas for Obsidian graph view',
        '- Organize memory semantically by topic, not chronologically',
        '- Update or remove memories that turn out to be wrong or outdated',
        '- Do not write duplicate memories. First check if there is an existing memory you can update before writing a new one.',
      ]

  return [
    opener(newMessageCount, existingMemories),
    '',
    'If the user explicitly asks you to remember something, save it immediately as whichever type fits best. If they ask you to forget something, find and remove the relevant entry.',
    '',
    ...TYPES_SECTION_COMBINED,
    ...WHAT_NOT_TO_SAVE_SECTION,
    '- You MUST avoid saving sensitive data within shared team memories. For example, never save API keys or user credentials.',
    '',
    ...KNOWLEDGE_GRAPH_STRUCTURE_SECTION,
    ...KNOWLEDGE_ROUTING_SECTION,
    ...KNOWLEDGE_ARTICLE_FORMAT_SECTION,
    ...REMEMBER_FORGET_BEHAVIOR_SECTION,
    ...DIRECT_MEMORY_WRITE_WORKFLOW_SECTION,
    '',
    ...howToSave,
  ].join('\n')
}
