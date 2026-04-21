/**
 * Cockpit — API Key Pool Rotation System.
 *
 * Public API for the cockpit subsystem.
 * Import from 'src/cockpit/index.js' to use.
 */

// --- Types ---
export type {
  PoolKeyConfig,
  PoolKeyState,
  PoolConfig,
  PoolState,
  PoolStatus,
  CockpitConfig,
  CockpitState,
  KeyStatus,
  RotationStrategy,
} from './types.js'

// --- Config ---
export {
  loadConfig,
  saveConfig,
  getPool,
  setPool,
  addKey,
  removeKey,
  listPools,
  getConfigDir,
  getConfigPath,
} from './config.js'

// --- Pool Manager ---
export {
  initPool,
  ensureInit,
  hasCockpitPool,
  getActiveKey,
  rotateToNext,
  markExhausted,
  recordUsage,
  getPoolStatus,
  shutdown,
} from './pool.js'

// --- Interceptor ---
export { cockpitFetch, recordCockpitUsage } from './interceptor.js'
