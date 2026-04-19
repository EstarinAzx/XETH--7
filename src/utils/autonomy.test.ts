import { expect, test } from 'bun:test'
import {
  applyAutonomyModeToPermissionContext,
  autonomyModeToPermissionMode,
  getNextAutonomyMode,
} from './autonomy.ts'
import type { ToolPermissionContext } from '../Tool.js'

function context(overrides: Partial<ToolPermissionContext> = {}): ToolPermissionContext {
  return {
    mode: 'default',
    additionalWorkingDirectories: new Map(),
    alwaysAllowRules: {},
    alwaysDenyRules: {},
    alwaysAskRules: {},
    isBypassPermissionsModeAvailable: false,
    isAutoModeAvailable: true,
    ...overrides,
  }
}

test('getNextAutonomyMode cycles off -> smart -> aggressive -> off', () => {
  expect(getNextAutonomyMode('off')).toBe('smart')
  expect(getNextAutonomyMode('smart')).toBe('aggressive')
  expect(getNextAutonomyMode('aggressive')).toBe('off')
})

test('autonomyModeToPermissionMode maps aggressive to bypass permissions', () => {
  expect(autonomyModeToPermissionMode('aggressive', context())).toBe(
    'bypassPermissions',
  )
})

test('applyAutonomyModeToPermissionContext enables bypass availability for aggressive mode', () => {
  const result = applyAutonomyModeToPermissionContext(context(), 'aggressive')

  expect(result.mode).toBe('bypassPermissions')
  expect(result.isBypassPermissionsModeAvailable).toBe(true)
})
