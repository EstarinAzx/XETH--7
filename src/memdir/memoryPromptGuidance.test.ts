import { expect, test } from 'bun:test'
import { buildMemoryLines } from './memdir.ts'
import { buildExtractAutoOnlyPrompt } from '../services/extractMemories/prompts.ts'

test('buildMemoryLines warns against bash existence checks for memory saves', () => {
  const text = buildMemoryLines('auto memory', '/tmp/memory/').join('\n')

  expect(text).toContain('Never use Bash to probe the memory directory')
  expect(text).toContain('For new memories, prefer Write directly')
})

test('buildExtractAutoOnlyPrompt explicitly forbids shell probes for memory files', () => {
  const text = buildExtractAutoOnlyPrompt(12, '')

  expect(text).toContain('Do NOT use Bash to check whether memory files or directories exist')
  expect(text).toContain('If a file should be created, use Write directly')
})
