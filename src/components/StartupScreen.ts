/**
 * XETH--7 startup screen â€” breach HUD splash.
 * Called once at CLI startup before the Ink UI renders.
 *
 * Addresses: https://github.com/Gitlawb/openclaude/issues/55
 */

import { isLocalProviderUrl, resolveProviderRequest } from '../services/api/providerConfig.js'
import { getLocalOpenAICompatibleProviderLabel } from '../utils/providerDiscovery.js'
import { getSettings_DEPRECATED } from '../utils/settings/settings.js'
import { parseUserSpecifiedModel } from '../utils/model/model.js'

declare const MACRO: { VERSION: string; DISPLAY_VERSION?: string }

const ESC = '\x1b['
const RESET = `${ESC}0m`
const DIM = `${ESC}2m`

type RGB = [number, number, number]
const rgb = (r: number, g: number, b: number) => `${ESC}38;2;${r};${g};${b}m`
const bg = (r: number, g: number, b: number) => `${ESC}48;2;${r};${g};${b}m`

function lerp(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

function gradAt(stops: RGB[], t: number): RGB {
  const c = Math.max(0, Math.min(1, t))
  const s = c * (stops.length - 1)
  const i = Math.floor(s)
  if (i >= stops.length - 1) return stops[stops.length - 1]
  return lerp(stops[i], stops[i + 1], s - i)
}

function paintLine(text: string, stops: RGB[], lineT: number): string {
  let out = ''
  for (let i = 0; i < text.length; i++) {
    const t = text.length > 1 ? lineT * 0.5 + (i / (text.length - 1)) * 0.5 : lineT
    const [r, g, b] = gradAt(stops, t)
    out += `${rgb(r, g, b)}${text[i]}`
  }
  return out + RESET
}

// â”€â”€â”€ Colors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const SUNSET_GRAD: RGB[] = [
  [214, 255, 61],
  [202, 248, 70],
  [182, 240, 78],
  [84, 236, 255],
  [120, 242, 255],
]

const ACCENT: RGB = [214, 255, 61]
const CYAN: RGB = [84, 236, 255]
const CREAM: RGB = [236, 245, 223]
const DIMCOL: RGB = [124, 150, 70]
const BORDER: RGB = [214, 255, 61]
const PANEL_BG: RGB = [14, 16, 10]

// â”€â”€â”€ Filled Block Text Logo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const LOGO_XETH7 = [
  `  ██╗  ██╗███████╗████████╗██╗  ██╗      ███████╗`,
  `  ╚██╗██╔╝██╔════╝╚══██╔══╝██║  ██║      ╚════██║`,
  `   ╚███╔╝ █████╗     ██║   ███████║█████╗    ██╔╝`,
  `   ██╔██╗ ██╔══╝     ██║   ██╔══██║╚════╝   ██╔╝ `,
  `  ██╔╝ ██╗███████╗   ██║   ██║  ██║        ██╔╝  `,
  `  ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝        ╚═╝   `,
]


// â”€â”€â”€ Provider detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function detectProvider(): { name: string; model: string; baseUrl: string; isLocal: boolean } {
  const useGemini = process.env.CLAUDE_CODE_USE_GEMINI === '1' || process.env.CLAUDE_CODE_USE_GEMINI === 'true'
  const useGithub = process.env.CLAUDE_CODE_USE_GITHUB === '1' || process.env.CLAUDE_CODE_USE_GITHUB === 'true'
  const useOpenAI = process.env.CLAUDE_CODE_USE_OPENAI === '1' || process.env.CLAUDE_CODE_USE_OPENAI === 'true'
  const useMistral = process.env.CLAUDE_CODE_USE_MISTRAL === '1' || process.env.CLAUDE_CODE_USE_MISTRAL === 'true'

  if (useGemini) {
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
    const baseUrl = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai'
    return { name: 'Google Gemini', model, baseUrl, isLocal: false }
  }

  if (useMistral) {
    const model = process.env.MISTRAL_MODEL || 'devstral-latest'
    const baseUrl = process.env.MISTRAL_BASE_URL || 'https://api.mistral.ai/v1'
    return { name: 'Mistral', model, baseUrl, isLocal: false }
  }

  if (useGithub) {
    const model = process.env.OPENAI_MODEL || 'github:copilot'
    const baseUrl =
      process.env.OPENAI_BASE_URL || 'https://api.githubcopilot.com'
    return { name: 'GitHub Copilot', model, baseUrl, isLocal: false }
  }

  if (useOpenAI) {
    const rawModel = process.env.OPENAI_MODEL || 'gpt-4o'
    const resolvedRequest = resolveProviderRequest({
      model: rawModel,
      baseUrl: process.env.OPENAI_BASE_URL,
    })
    const baseUrl = resolvedRequest.baseUrl
    const isLocal = isLocalProviderUrl(baseUrl)
    let name = 'OpenAI'
    if (/nvidia/i.test(baseUrl) || /nvidia/i.test(rawModel) || process.env.NVIDIA_NIM)
      name = 'NVIDIA NIM'
    else if (/minimax/i.test(baseUrl) || /minimax/i.test(rawModel) || process.env.MINIMAX_API_KEY)
      name = 'MiniMax'
    else if (resolvedRequest.transport === 'codex_responses' || baseUrl.includes('chatgpt.com/backend-api/codex'))
      name = 'Codex'
    else if (/deepseek/i.test(baseUrl) || /deepseek/i.test(rawModel))
      name = 'DeepSeek'
    else if (/openrouter/i.test(baseUrl))
      name = 'OpenRouter'
    else if (/together/i.test(baseUrl))
      name = 'Together AI'
    else if (/groq/i.test(baseUrl))
      name = 'Groq'
    else if (/mistral/i.test(baseUrl) || /mistral/i.test(rawModel))
      name = 'Mistral'
    else if (/azure/i.test(baseUrl))
      name = 'Azure OpenAI'
    else if (/llama/i.test(rawModel))
      name = 'Meta Llama'
    else if (isLocal)
      name = getLocalOpenAICompatibleProviderLabel(baseUrl)
    
    // Resolve model alias to actual model name + reasoning effort
    let displayModel = resolvedRequest.resolvedModel
    if (resolvedRequest.reasoning?.effort) {
      displayModel = `${displayModel} (${resolvedRequest.reasoning.effort})`
    }
    
    return { name, model: displayModel, baseUrl, isLocal }
  }

  // Default: Anthropic - check settings.model first, then env vars
  const settings = getSettings_DEPRECATED() || {}
  const modelSetting = settings.model || process.env.ANTHROPIC_MODEL || process.env.CLAUDE_MODEL || 'claude-sonnet-4-6'
  const resolvedModel = parseUserSpecifiedModel(modelSetting)
  return { name: 'Anthropic', model: resolvedModel, baseUrl: 'https://api.anthropic.com', isLocal: false }
}

// â”€â”€â”€ Box drawing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function boxRow(content: string, width: number, rawLen: number): string {
  const pad = Math.max(0, width - 2 - rawLen)
  return `${rgb(...BORDER)}\u2502${RESET}${content}${' '.repeat(pad)}${rgb(...BORDER)}\u2502${RESET}`
}

// â”€â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function printStartupScreen(): void {
  // Skip in non-interactive / CI / print mode
  if (process.env.CI || !process.stdout.isTTY) return

  const p = detectProvider()
  const W = 84
  const out: string[] = []

  out.push('')

  // Gradient logo
  const allLogo = LOGO_XETH7
  const total = allLogo.length
  for (let i = 0; i < total; i++) {
    const t = total > 1 ? i / (total - 1) : 0
    if (allLogo[i] === '') {
      out.push('')
    } else {
      out.push(paintLine(allLogo[i], SUNSET_GRAD, t))
    }
  }

  out.push('')

  // Tagline
  out.push(`  ${rgb(...ACCENT)}NET//TECH${RESET} ${DIM}${rgb(...DIMCOL)}${'─'.repeat(28)}${RESET}`)
  out.push(`  ${rgb(...ACCENT)}\u25e2${RESET} ${rgb(...CREAM)}XETH--7 // breach shell // protocol online.${RESET} ${rgb(...CYAN)}\u25e3${RESET}`)
  out.push('')

  // Provider info box
  const title = ' BREACH PROTOCOL INTERFACE '
  out.push(`${bg(...BORDER)}${rgb(...PANEL_BG)}${title}${' '.repeat(Math.max(0, W - title.length))}${RESET}`)
  out.push(`${rgb(...BORDER)}\u250c${'\u2500'.repeat(W - 2)}\u2510${RESET}`)

  const lbl = (k: string, v: string, c: RGB = CREAM): [string, number] => {
    const padK = k.padEnd(9)
    return [` ${DIM}${rgb(...DIMCOL)}${padK}${RESET} ${rgb(...c)}${v}${RESET}`, ` ${padK} ${v}`.length]
  }

  const provC: RGB = p.isLocal ? [160, 255, 214] : CYAN
  let [r, l] = lbl('Provider', p.name, provC)
  out.push(boxRow(r, W, l))
  ;[r, l] = lbl('Cipher', p.model)
  out.push(boxRow(r, W, l))
  const ep = p.baseUrl.length > 46 ? p.baseUrl.slice(0, 43) + '...' : p.baseUrl
  ;[r, l] = lbl('Uplink', ep)
  out.push(boxRow(r, W, l))

  out.push(`${rgb(...BORDER)}\u251c${'\u2500'.repeat(W - 2)}\u2524${RESET}`)

  const sC: RGB = p.isLocal ? [160, 255, 214] : CYAN
  const sL = p.isLocal ? 'local' : 'cloud'
  const sRow = ` ${rgb(...sC)}\u25cf${RESET} ${DIM}${rgb(...DIMCOL)}${sL}${RESET}    ${rgb(...ACCENT)}buffer ready${RESET} ${DIM}${rgb(...DIMCOL)}\u2014 /help for breach controls${RESET}`
  const sLen = ` \u25cf ${sL}    buffer ready \u2014 /help for breach controls`.length
  out.push(boxRow(sRow, W, sLen))

  out.push(`${rgb(...BORDER)}\u2514${'\u2500'.repeat(W - 2)}\u2518${RESET}`)
  out.push(`  ${rgb(...DIMCOL)}xeth--7${RESET} ${rgb(...ACCENT)}v${MACRO.DISPLAY_VERSION ?? MACRO.VERSION}${RESET} ${rgb(...CYAN)}// breach link stable${RESET}`)
  out.push('')

  process.stdout.write(out.join('\n') + '\n')
}
