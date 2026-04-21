/**
 * Cockpit — Config persistence.
 *
 * Stores pool configuration (keys, strategy, limits) in
 * ~/.stratagem/cockpit.json with restricted file permissions.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import type { CockpitConfig, PoolConfig, PoolKeyConfig } from './types.js'

const CONFIG_DIR = join(homedir(), '.stratagem')
const CONFIG_PATH = join(CONFIG_DIR, 'cockpit.json')

function defaultConfig(): CockpitConfig {
  return { pools: {} }
}

export function getConfigDir(): string {
  return CONFIG_DIR
}

export function getConfigPath(): string {
  return CONFIG_PATH
}

export function loadConfig(): CockpitConfig {
  try {
    if (!existsSync(CONFIG_PATH)) return defaultConfig()
    const raw = readFileSync(CONFIG_PATH, 'utf-8')
    const parsed = JSON.parse(raw)
    return { pools: parsed.pools ?? {} }
  } catch {
    return defaultConfig()
  }
}

export function saveConfig(config: CockpitConfig): void {
  try {
    mkdirSync(CONFIG_DIR, { recursive: true })
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), {
      encoding: 'utf-8',
      mode: 0o600,
    })
  } catch (e) {
    // biome-ignore lint/suspicious/noConsole: cockpit logging
    console.error('[cockpit] failed to save config', e)
  }
}

export function getPool(provider: string): PoolConfig | undefined {
  const config = loadConfig()
  return config.pools[provider]
}

export function setPool(provider: string, pool: PoolConfig): void {
  const config = loadConfig()
  config.pools[provider] = pool
  saveConfig(config)
}

export function addKey(provider: string, key: PoolKeyConfig): void {
  const config = loadConfig()
  if (!config.pools[provider]) {
    config.pools[provider] = {
      provider,
      keys: [],
      strategy: 'failover',
      switchAtPercent: 85,
    }
  }
  // Deduplicate by id
  const existing = config.pools[provider].keys.findIndex(
    (k) => k.id === key.id,
  )
  if (existing >= 0) {
    config.pools[provider].keys[existing] = key
  } else {
    config.pools[provider].keys.push(key)
  }
  saveConfig(config)
}

export function removeKey(provider: string, keyId: string): void {
  const config = loadConfig()
  const pool = config.pools[provider]
  if (!pool) return
  pool.keys = pool.keys.filter((k) => k.id !== keyId)
  if (pool.keys.length === 0) {
    delete config.pools[provider]
  }
  saveConfig(config)
}

export function listPools(): Record<string, PoolConfig> {
  const config = loadConfig()
  return config.pools
}
