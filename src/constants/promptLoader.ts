/**
 * Xethryon-style model-specific system prompt loader.
 * Selects the correct prompt based on the active model ID.
 */

import PROMPT_DEFAULT from './prompt/default.js'
import PROMPT_BEAST from './prompt/beast.js'
import PROMPT_GPT from './prompt/gpt.js'
import PROMPT_ANTHROPIC from './prompt/anthropic.js'
import PROMPT_GEMINI from './prompt/gemini.js'
import PROMPT_KIMI from './prompt/kimi.js'
import PROMPT_CODEX from './prompt/codex.js'
import PROMPT_TRINITY from './prompt/trinity.js'

/**
 * Select the system prompt based on the model ID.
 * Falls back to PROMPT_DEFAULT for unknown models.
 */
export function getModelPrompt(modelId?: string): string {
  if (!modelId) return PROMPT_DEFAULT

  const id = modelId.toLowerCase()

  // GPT-4/5 and o-series → beast mode (autonomous, thorough)
  if (
    id.includes('gpt-4') ||
    id.includes('gpt-5') ||
    id.includes('o1') ||
    id.includes('o3')
  ) {
    return PROMPT_BEAST
  }

  // GPT codex variants
  if (id.includes('codex')) {
    return PROMPT_CODEX
  }

  // General GPT
  if (id.includes('gpt')) {
    return PROMPT_GPT
  }

  // Gemini
  if (id.includes('gemini')) {
    return PROMPT_GEMINI
  }

  // Claude / Anthropic
  if (id.includes('claude')) {
    return PROMPT_ANTHROPIC
  }

  // Trinity
  if (id.includes('trinity')) {
    return PROMPT_TRINITY
  }

  // Kimi / Moonshot
  if (id.includes('kimi')) {
    return PROMPT_KIMI
  }

  return PROMPT_DEFAULT
}
