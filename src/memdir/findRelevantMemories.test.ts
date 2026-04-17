import { expect, test } from 'bun:test'
import { rankMemoriesForQuery } from './findRelevantMemories.ts'
import type { MemoryHeader } from './memoryScan.ts'

function memory(overrides: Partial<MemoryHeader>): MemoryHeader {
  return {
    filename: 'knowledge/concepts/example.md',
    filePath: '/tmp/example.md',
    mtimeMs: 1,
    description: 'generic note',
    type: 'project',
    title: 'Example',
    tags: [],
    wikilinks: [],
    category: 'concepts',
    ...overrides,
  }
}

test('rankMemoriesForQuery prefers connection notes with matching tags and links', () => {
  const ranked = rankMemoriesForQuery('payment retry flow bug', [
    memory({
      filename: 'knowledge/concepts/retry-policy.md',
      description: 'General retry guidance',
      title: 'Retry Policy',
      tags: ['retry'],
      category: 'concepts',
      mtimeMs: 10,
    }),
    memory({
      filename: 'knowledge/connections/order-payment-flow.md',
      description: 'Links checkout failures with payment retry behavior',
      title: 'Order Payment Flow',
      tags: ['payment', 'retry', 'checkout'],
      wikilinks: ['payment-retries', 'checkout-errors'],
      category: 'connections',
      mtimeMs: 5,
    }),
  ])

  expect(ranked[0]?.filename).toBe('knowledge/connections/order-payment-flow.md')
})

test('rankMemoriesForQuery falls back to recency when query has no useful tokens', () => {
  const ranked = rankMemoriesForQuery('the and for', [
    memory({ filename: 'knowledge/concepts/older.md', mtimeMs: 1 }),
    memory({ filename: 'knowledge/concepts/newer.md', mtimeMs: 2 }),
  ])

  expect(ranked[0]?.filename).toBe('knowledge/concepts/newer.md')
})
