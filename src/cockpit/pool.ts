/**
 * Cockpit — Pool Manager.
 *
 * In-memory pool state with periodic disk persistence.
 * Manages key rotation, exhaustion tracking, and usage recording.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { loadConfig, getConfigPath } from './config.js'
import type {
  CockpitState,
  PoolState,
  PoolKeyState,
  PoolStatus,
  PoolKeyConfig,
} from './types.js'

const STATE_DIR = join(homedir(), '.stratagem')
const STATE_PATH = join(STATE_DIR, 'cockpit-state.json')

// ─── In-memory state ───────────────────────────────────────

let _state: CockpitState | undefined
let _flushTimer: ReturnType<typeof setInterval> | undefined

function defaultKeyState(id: string): PoolKeyState {
  return {
    id,
    status: 'active',
    sessionTokens: 0,
    weeklyTokens: 0,
    totalRequests: 0,
    totalFailures: 0,
  }
}

// ─── State I/O ─────────────────────────────────────────────

function loadState(): CockpitState {
  try {
    if (!existsSync(STATE_PATH)) return { pools: {} }
    const raw = readFileSync(STATE_PATH, 'utf-8')
    return JSON.parse(raw) as CockpitState
  } catch {
    return { pools: {} }
  }
}

function flushState(): void {
  if (!_state) return
  try {
    for (const pool of Object.values(_state.pools)) {
      pool.lastFlushed = Date.now()
    }
    mkdirSync(STATE_DIR, { recursive: true })
    writeFileSync(STATE_PATH, JSON.stringify(_state, null, 2), {
      encoding: 'utf-8',
      mode: 0o600,
    })
  } catch {
    // silent — state flush is best-effort
  }
}

// ─── Initialization ────────────────────────────────────────

let _initialized = false

export function ensureInit(): void {
  if (_initialized) return
  initPool()
}

export function initPool(): void {
  const config = loadConfig()
  const savedState = loadState()
  _state = { pools: {} }

  for (const [provider, poolConfig] of Object.entries(config.pools)) {
    const saved = savedState.pools[provider]
    const keyStates: PoolKeyState[] = poolConfig.keys.map((k) => {
      const existing = saved?.keys.find((s) => s.id === k.id)
      if (existing) return existing
      return defaultKeyState(k.id)
    })

    _state.pools[provider] = {
      provider,
      activeIndex: saved?.activeIndex ?? 0,
      keys: keyStates,
      lastFlushed: Date.now(),
    }

    // Clamp active index
    if (_state.pools[provider].activeIndex >= poolConfig.keys.length) {
      _state.pools[provider].activeIndex = 0
    }
  }

  // Auto-flush every 30s
  if (_flushTimer) clearInterval(_flushTimer)
  _flushTimer = setInterval(() => flushState(), 30_000)

  _initialized = true
}

// ─── Pool Queries ──────────────────────────────────────────

function getState(): CockpitState {
  if (!_state) return { pools: {} }
  return _state
}

export function hasCockpitPool(provider: string): boolean {
  // Fast path: already initialized
  if (_initialized && _state) {
    const pool = _state.pools[provider]
    return pool !== undefined && pool.keys.length > 0
  }

  // First-time synchronous check: does the config file even exist?
  if (!_initialized) {
    try {
      const configPath = getConfigPath()
      if (!existsSync(configPath)) {
        _initialized = true
        _state = { pools: {} }
        return false
      }
      // Config exists — do synchronous init
      const raw = readFileSync(configPath, 'utf-8')
      const config = JSON.parse(raw)
      if (!config.pools || Object.keys(config.pools).length === 0) {
        _initialized = true
        _state = { pools: {} }
        return false
      }
      // We have pools — trigger full init
      ensureInit()

      // Check if this provider has keys in the raw config
      const pool = config.pools[provider]
      return (
        pool !== undefined &&
        Array.isArray(pool.keys) &&
        pool.keys.length > 0
      )
    } catch {
      _initialized = true
      _state = { pools: {} }
      return false
    }
  }

  return false
}

export function getActiveKey(
  provider: string,
): (PoolKeyConfig & { _stateIndex: number }) | undefined {
  const state = getState()
  const pool = state.pools[provider]
  if (!pool || pool.keys.length === 0) return undefined

  // Walk from activeIndex, find first non-exhausted key
  for (let i = 0; i < pool.keys.length; i++) {
    const idx = (pool.activeIndex + i) % pool.keys.length
    const keyState = pool.keys[idx]

    // Check if session exhaustion has expired (~5h rolling window)
    if (keyState.status === 'session_exhausted' && keyState.exhaustedAt) {
      const elapsed = Date.now() - keyState.exhaustedAt
      if (elapsed > 5 * 60 * 60 * 1000) {
        keyState.status = 'active'
        keyState.sessionTokens = 0
        keyState.exhaustedAt = undefined
      }
    }

    // Check weekly exhaustion — retry after 24h
    if (keyState.status === 'weekly_exhausted' && keyState.exhaustedAt) {
      const elapsed = Date.now() - keyState.exhaustedAt
      if (elapsed > 24 * 60 * 60 * 1000) {
        keyState.status = 'active'
        keyState.weeklyTokens = 0
        keyState.exhaustedAt = undefined
      }
    }

    if (keyState.status === 'active') {
      pool.activeIndex = idx
      const configKey = getConfigKey(provider, keyState.id)
      if (configKey) {
        return { ...configKey, _stateIndex: idx }
      }
    }
  }

  // All keys exhausted
  return undefined
}

function getConfigKey(
  provider: string,
  keyId: string,
): PoolKeyConfig | undefined {
  try {
    const configStr = readFileSync(getConfigPath(), 'utf-8')
    const config = JSON.parse(configStr)
    return config.pools?.[provider]?.keys?.find(
      (k: PoolKeyConfig) => k.id === keyId,
    )
  } catch {
    return undefined
  }
}

// ─── Rotation ──────────────────────────────────────────────

export function rotateToNext(
  provider: string,
): (PoolKeyConfig & { _stateIndex: number }) | undefined {
  const state = getState()
  const pool = state.pools[provider]
  if (!pool) return undefined

  // Move past current
  pool.activeIndex = (pool.activeIndex + 1) % pool.keys.length

  return getActiveKey(provider)
}

export function markExhausted(
  provider: string,
  keyId: string,
  type: 'session_exhausted' | 'weekly_exhausted',
): void {
  const state = getState()
  const pool = state.pools[provider]
  if (!pool) return

  const key = pool.keys.find((k) => k.id === keyId)
  if (!key) return

  // If it was already session_exhausted and gets another 429 quickly,
  // escalate to weekly_exhausted
  if (key.status === 'session_exhausted' && type === 'session_exhausted') {
    const timeSince = key.exhaustedAt ? Date.now() - key.exhaustedAt : Infinity
    if (timeSince < 30_000) {
      // Got 429 again within 30s → probably weekly
      type = 'weekly_exhausted'
    }
  }

  key.status = type
  key.exhaustedAt = Date.now()
  key.totalFailures++

  // Flush immediately on rotation
  flushState()
}

export function recordUsage(
  provider: string,
  keyId: string,
  tokens: number,
): void {
  if (!_state) return
  const pool = _state.pools[provider]
  if (!pool) return

  const key = pool.keys.find((k) => k.id === keyId)
  if (!key) return

  key.sessionTokens += tokens
  key.weeklyTokens += tokens
  key.totalRequests++
}

// ─── Status ────────────────────────────────────────────────

export function getPoolStatus(provider: string): PoolStatus | undefined {
  // Try in-memory state first, then fall back to disk
  let pool = _state?.pools[provider]

  if (!pool) {
    try {
      const raw = readFileSync(STATE_PATH, 'utf-8')
      const fileState = JSON.parse(raw) as CockpitState
      pool = fileState.pools[provider]
    } catch {
      return undefined
    }
  }

  if (!pool || pool.keys.length === 0) return undefined

  const configKeys = (() => {
    try {
      const raw = readFileSync(getConfigPath(), 'utf-8')
      return (JSON.parse(raw).pools?.[provider]?.keys ?? []) as PoolKeyConfig[]
    } catch {
      return [] as PoolKeyConfig[]
    }
  })()

  const combined = pool.keys.map((s) => {
    const cfg = configKeys.find((c) => c.id === s.id) ?? {
      id: s.id,
      apiKey: '',
    }
    return { ...cfg, ...s }
  })

  const activeKey = combined[pool.activeIndex] ?? combined[0]
  const allExhausted = combined.every((k) => k.status !== 'active')

  return {
    provider,
    totalKeys: combined.length,
    activeKey,
    activeIndex: pool.activeIndex,
    keys: combined,
    strategy: 'failover',
    allExhausted,
  }
}

// ─── Cleanup ───────────────────────────────────────────────

export function shutdown(): void {
  if (_flushTimer) {
    clearInterval(_flushTimer)
    _flushTimer = undefined
  }
  flushState()
}
