/**
 * Cockpit — Fetch Interceptor.
 *
 * Wraps the provider's fetch function to:
 * 1. Track requests per key
 * 2. Ensure the request uses the cockpit's active key (fixes SDK retry using stale key)
 * 3. On 429 → mark key exhausted → rotate for next request
 */

import {
  hasCockpitPool,
  getActiveKey,
  markExhausted,
  rotateToNext,
  recordUsage,
  ensureInit,
} from './pool.js'

/**
 * Extract the Bearer token from a headers object (any format).
 */
function extractBearerToken(headers: unknown): string | undefined {
  if (!headers) return undefined
  if (headers instanceof Headers) {
    const auth = headers.get('Authorization') ?? headers.get('authorization')
    return auth?.replace('Bearer ', '') ?? undefined
  }
  if (typeof headers === 'object' && headers !== null) {
    const h = headers as Record<string, string>
    const auth = h['Authorization'] ?? h['authorization']
    return auth?.replace('Bearer ', '') ?? undefined
  }
  return undefined
}

/**
 * Override the Authorization header in a fetch init, preserving all other headers.
 */
function patchAuth(
  init: RequestInit | undefined,
  apiKey: string,
): RequestInit {
  const newInit = { ...init }
  if (newInit.headers instanceof Headers) {
    newInit.headers = new Headers(newInit.headers)
    newInit.headers.set('Authorization', `Bearer ${apiKey}`)
  } else if (newInit.headers && typeof newInit.headers === 'object') {
    newInit.headers = {
      ...(newInit.headers as Record<string, string>),
      Authorization: `Bearer ${apiKey}`,
    }
  } else {
    newInit.headers = { Authorization: `Bearer ${apiKey}` }
  }
  return newInit
}

/**
 * Create a cockpit-aware fetch function that wraps the original.
 */
export function cockpitFetch(
  providerID: string,
  originalFetch: typeof fetch,
): typeof fetch {
  return (async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    if (!hasCockpitPool(providerID)) {
      return originalFetch(input, init)
    }

    // Ensure pool state is fully loaded before first use
    ensureInit()

    const activeKey = getActiveKey(providerID)
    if (!activeKey) {
      return originalFetch(input, init)
    }

    // Check if the request's auth matches the cockpit's active key.
    // On SDK retries after rotation, the SDK still uses the OLD key.
    // We detect this mismatch and patch the Authorization header.
    const currentToken = extractBearerToken(init?.headers)
    let finalInit = init
    if (currentToken && currentToken !== activeKey.apiKey) {
      finalInit = patchAuth(init, activeKey.apiKey)
    }

    // Track the request
    recordUsage(providerID, activeKey.id, 0)

    const response = await originalFetch(input, finalInit)

    // Handle 429 — rate limit hit → rotate for next request
    if (response.status === 429) {
      // Determine exhaustion type from response body
      const bodyText = await response.clone().text().catch(() => '')
      const isWeekly = bodyText.includes('weekly')
      markExhausted(
        providerID,
        activeKey.id,
        isWeekly ? 'weekly_exhausted' : 'session_exhausted',
      )

      // Rotate to next key
      rotateToNext(providerID)
    }

    return response
  }) as typeof fetch
}

/**
 * After an LLM response completes, record token usage for the active key.
 */
export function recordCockpitUsage(
  providerID: string,
  tokens: number,
): void {
  if (!hasCockpitPool(providerID)) return
  const key = getActiveKey(providerID)
  if (!key) return
  recordUsage(providerID, key.id, tokens)
}
