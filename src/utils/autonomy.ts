import { feature } from 'bun:bundle'
import type { ToolPermissionContext } from '../Tool.js'
import type { SettingsJson } from './settings/types.js'
import type { PermissionMode } from './permissions/PermissionMode.js'
import {
  isAutoModeGateEnabled,
  transitionPermissionMode,
} from './permissions/permissionSetup.js'

export const AUTONOMY_MODES = ['off', 'smart', 'aggressive'] as const
export type AutonomyMode = (typeof AUTONOMY_MODES)[number]

export function normalizeAutonomyMode(value: unknown): AutonomyMode {
  return typeof value === 'string' && (AUTONOMY_MODES as readonly string[]).includes(value)
    ? (value as AutonomyMode)
    : 'off'
}

export function getAutonomyModeFromSettings(settings?: SettingsJson): AutonomyMode {
  return normalizeAutonomyMode(settings?.autonomyMode)
}

export function autonomyModeTitle(mode: AutonomyMode): string {
  switch (mode) {
    case 'smart':
      return 'SMART'
    case 'aggressive':
      return 'AGGRESSIVE'
    default:
      return 'OFF'
  }
}

export function autonomyModeDescription(mode: AutonomyMode): string {
  switch (mode) {
    case 'smart':
      return 'Classifier-driven autonomy with minimal prompts for routine work.'
    case 'aggressive':
      return 'Maximum autonomy with bypass-style execution and no permission prompts.'
    default:
      return 'Manual approval flow stays in control.'
  }
}

export function autonomyModeColor(mode: AutonomyMode):
  | 'inactive'
  | 'promptBorder'
  | 'claude' {
  switch (mode) {
    case 'smart':
      return 'promptBorder'
    case 'aggressive':
      return 'claude'
    default:
      return 'inactive'
  }
}

export function getNextAutonomyMode(mode: AutonomyMode): AutonomyMode {
  switch (mode) {
    case 'off':
      return 'smart'
    case 'smart':
      return 'aggressive'
    default:
      return 'off'
  }
}

export function autonomyModeToPermissionMode(
  mode: AutonomyMode,
  context: ToolPermissionContext,
): PermissionMode {
  switch (mode) {
    case 'aggressive':
      return 'bypassPermissions'
    case 'smart':
      if (feature('TRANSCRIPT_CLASSIFIER') && context.isAutoModeAvailable && isAutoModeGateEnabled()) {
        return 'auto'
      }
      return 'acceptEdits'
    default:
      return 'default'
  }
}

export function permissionModeToAutonomyMode(mode: PermissionMode): AutonomyMode {
  switch (mode) {
    case 'auto':
    case 'acceptEdits':
      return 'smart'
    case 'bypassPermissions':
      return 'aggressive'
    default:
      return 'off'
  }
}

export function applyAutonomyModeToPermissionContext(
  context: ToolPermissionContext,
  autonomyMode: AutonomyMode,
): ToolPermissionContext {
  const targetMode = autonomyModeToPermissionMode(autonomyMode, context)
  const contextWithAvailability =
    autonomyMode === 'aggressive'
      ? { ...context, isBypassPermissionsModeAvailable: true }
      : context
  const transitioned = transitionPermissionMode(
    context.mode,
    targetMode,
    contextWithAvailability,
  )
  return {
    ...transitioned,
    mode: targetMode,
    ...(autonomyMode === 'aggressive'
      ? { isBypassPermissionsModeAvailable: true }
      : {}),
  }
}
