/**
 * UserInputTool — allows the model to inject user-level input into the REPL.
 *
 * On BUFFER:AGGRESSIVE mode, the model can autonomously invoke slash commands
 * (/compact, /new, /clear, /model, etc.) or inject any text as if the user typed it.
 * This is inspired by Xethryon's agent swarm message injection pattern.
 *
 * The tool uses the same `enqueuePendingNotification` mechanism that the swarm
 * and cron systems use to inject messages into the command queue.
 */
import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { enqueuePendingNotification } from '../../utils/messageQueueManager.js'
import { getAutonomyModeFromSettings } from '../../utils/autonomy.js'
import { getSettings_DEPRECATED } from '../../utils/settings/settings.js'

export const USER_INPUT_TOOL_NAME = 'user_input'

const DESCRIPTION = 'Inject user-level input into the REPL command queue. Use this to autonomously execute slash commands (/compact, /new, /clear, /model, /provider) or inject text as if the user typed it. Only available in BUFFER:AGGRESSIVE mode.'

const inputSchema = lazySchema(() =>
  z.strictObject({
    command: z
      .string()
      .describe(
        'The input to inject, exactly as the user would type it. For slash commands, include the leading slash (e.g. "/compact", "/new", "/clear"). For model switching: "/model <model-name>". For plain text, it will be processed as a user message.',
      ),
    reason: z
      .string()
      .describe(
        'Brief explanation of why this input injection is needed (e.g. "context window is 80% full, compacting to free space").',
      ),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

const outputSchema = lazySchema(() =>
  z.object({
    status: z.enum(['injected', 'rejected']),
    command: z.string(),
    message: z.string(),
  }),
)
type OutputSchema = ReturnType<typeof outputSchema>
export type Output = z.infer<OutputSchema>

export const UserInputTool = buildTool({
  name: USER_INPUT_TOOL_NAME,
  searchHint: 'inject user input, run slash commands autonomously, self-execute commands',
  maxResultSizeChars: 1000,
  userFacingName() {
    return 'User Input'
  },
  get inputSchema(): InputSchema {
    return inputSchema()
  },
  get outputSchema(): OutputSchema {
    return outputSchema()
  },
  isEnabled() {
    // Only available on BUFFER:AGGRESSIVE
    const settings = getSettings_DEPRECATED()
    const mode = getAutonomyModeFromSettings(settings ?? undefined)
    return mode === 'aggressive'
  },
  isConcurrencySafe() {
    return false // Commands should execute sequentially
  },
  isReadOnly() {
    return false // Slash commands can modify state
  },
  async description() {
    return DESCRIPTION
  },
  mapToolResultToToolResultBlockParam(output, toolUseID) {
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: `${output.status}: ${output.message}`,
    }
  },
  async prompt() {
    return `Use this tool to inject user-level input into the REPL. This allows you to autonomously execute slash commands or send text as if the user typed it.

## Available slash commands you can invoke:
- \`/compact\` — Compress conversation context to free up space
- \`/new\` — Start a fresh session (preserves old session on disk)
- \`/clear\` — Same as /new, clears and starts fresh
- \`/model <name>\` — Switch the active model
- \`/provider\` — Open the provider manager (interactive, prefer /model)

## When to use:
- Context is getting full → inject "/compact" to free space
- Task is complete and user wants a fresh start → inject "/new"
- Need to switch models mid-task → inject "/model <model-name>"

## Rules:
- ALWAYS provide a reason for the injection
- Prefer specific slash commands over raw text
- Do NOT use this for normal conversation — use your regular response instead
- This tool is ONLY available in BUFFER:AGGRESSIVE mode`
  },
  async call({ command, reason }) {
    // Double-check autonomy mode at call time
    const settings = getSettings_DEPRECATED()
    const mode = getAutonomyModeFromSettings(settings ?? undefined)
    if (mode !== 'aggressive') {
      return {
        data: {
          status: 'rejected' as const,
          command,
          message: `UserInput rejected: BUFFER mode is "${mode}", not "aggressive". This tool is only available in BUFFER:AGGRESSIVE mode.`,
        },
      }
    }

    // Inject the command into the REPL queue
    enqueuePendingNotification({
      value: command,
      mode: 'prompt',
      priority: 'next', // Process before background tasks but after user input
      isMeta: true, // System-generated, not user-visible in queue preview
    })

    return {
      data: {
        status: 'injected' as const,
        command,
        message: `Injected "${command}" into REPL queue. Reason: ${reason}. It will execute after the current turn completes.`,
      },
    }
  },
} satisfies ToolDef<InputSchema, Output>)
