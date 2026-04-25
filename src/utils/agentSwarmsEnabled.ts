/**
 * Centralized runtime check for agent teams/teammate features.
 * Stratagem: agent teams are always available — no feature gate needed.
 */
export function isAgentSwarmsEnabled(): boolean {
  return true
}
