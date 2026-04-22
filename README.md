<div align="center">

```
 ██████  ████████ ██████   █████  ████████  █████   ██████  ███████ ███    ███
██          ██    ██   ██ ██   ██    ██    ██   ██ ██       ██      ████  ████
 █████      ██    ██████  ███████    ██    ███████ ██   ███ █████   ██ ████ ██
     ██     ██    ██   ██ ██   ██    ██    ██   ██ ██    ██ ██      ██  ██  ██
██████      ██    ██   ██ ██   ██    ██    ██   ██  ██████  ███████ ██      ██
                              ═══ X 7 ═══
```

**A cyberpunk agentic coding CLI. Multi-provider. Terminal-first. No leash.**

[![npm](https://img.shields.io/npm/v/stratagem-x7?color=ff2a6d&label=npm)](https://www.npmjs.com/package/stratagem-x7)
[![Release](https://img.shields.io/github/v/tag/EstarinAzx/XETH--7?label=release&color=0ea5e9)](https://github.com/EstarinAzx/XETH--7/tags)
[![License](https://img.shields.io/badge/license-MIT-2563eb)](LICENSE)
[![Discussions](https://img.shields.io/badge/discussions-open-7c3aed)](https://github.com/EstarinAzx/XETH--7/discussions)

</div>

---

## What is Stratagem X7?

Stratagem X7 is an autonomous coding agent that lives in your terminal. It reads your codebase, writes code, runs commands, manages files, searches the web, and orchestrates multi-agent swarms — all from a single TUI with a cyberpunk aesthetic.

It works with **any provider**: OpenAI, Gemini, Ollama, DeepSeek, Groq, Mistral, GitHub Models, Codex, LM Studio, OpenRouter, and any OpenAI-compatible API. Cloud or local. Your choice.

```
┌──────────────────────────────────────────┐
│ Provider  Ollama                         │
│ Model     qwen2.5-coder:32b             │
│ Uplink    http://localhost:11434/v1      │
├──────────────────────────────────────────┤
│ ● local    buffer ready — /help          │
└──────────────────────────────────────────┘
 STRATAGEM X7 v0.3.2 // breach link stable
```

---

## Install

```bash
npm install -g stratagem-x7
```

Then launch:

```bash
stx7
```

That's it. Run `/provider` inside to configure your backend, or set environment variables before launching.

> **Node 20+** required. If you get a `ripgrep not found` warning, install ripgrep system-wide (`rg --version` should work in the same terminal).

---

## Quick Setup

### OpenAI

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=sk-your-key
export OPENAI_MODEL=gpt-4o
stx7
```

### Local Ollama

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_BASE_URL=http://localhost:11434/v1
export OPENAI_MODEL=qwen2.5-coder:7b
stx7
```

### Ollama Launch (zero config)

```bash
ollama launch stx7 --model qwen2.5-coder:7b
```

### Windows (PowerShell)

```powershell
$env:CLAUDE_CODE_USE_OPENAI="1"
$env:OPENAI_API_KEY="sk-your-key"
$env:OPENAI_MODEL="gpt-4o"
stx7
```

### Interactive Setup

Don't want to touch environment variables? Just run:

```bash
stx7
# then type: /provider
```

The `/provider` command walks you through guided setup and saves profiles to disk.

---

## Supported Providers

| Provider | Setup | Notes |
|----------|-------|-------|
| **OpenAI** | `/provider` or env vars | GPT-4o, o1, o3, etc. |
| **Ollama** | `/provider`, env vars, or `ollama launch` | Local inference, no API key |
| **Gemini** | `/provider` or env vars | API key, access token, or ADC |
| **DeepSeek** | `/provider` or env vars | OpenAI-compatible |
| **GitHub Models** | `/onboard-github` | Interactive onboarding |
| **Codex** | `/provider` | OAuth or CLI auth |
| **OpenRouter** | `/provider` or env vars | OpenAI-compatible multi-model gateway |
| **Groq / Mistral** | `/provider` or env vars | OpenAI-compatible |
| **LM Studio** | `/provider` or env vars | Local OpenAI-compatible server |
| **Bedrock / Vertex** | env vars | AWS and GCP provider integrations |
| **Any `/v1` compatible** | env vars | Point `OPENAI_BASE_URL` at it |

---

## Features

### 🔧 Tool-Driven Coding
Bash execution, file read/write/edit, grep, glob, web search, web fetch — all as structured tool calls the agent orchestrates automatically.

### 🤖 Autonomous Buffer Modes
Three autonomy levels via `shift+tab`:
- **`BUFFER:OFF`** — Ask permission for everything
- **`BUFFER:SMART`** — Auto-approve safe operations
- **`BUFFER:AGGRESSIVE`** — Full autonomy including self-command injection

### ⚡ Self-Command Injection
On `BUFFER:AGGRESSIVE`, Stratagem can invoke its own slash commands — `/compact` when context gets full, `/new` to start fresh sessions, `/model` to switch models mid-task. No human in the loop.

### 🐝 Agent Swarms
Spawn multi-agent teams that work in parallel. Route different agents to different models. Coordinate via message injection.

### 🔌 MCP Support
Full Model Context Protocol support. Connect external tools, data sources, and services.

### 📡 Cockpit API Rotation
Built-in API key rotation system for high-throughput operations. Monitors rate limits and rotates keys automatically.

### 🎮 Cyberpunk TUI
Not your average terminal app. Custom BREACH PROTOCOL splash screen, STATUS BUS footer with live model/cockpit indicators, and a color scheme that looks like it belongs in Night City.

### 📋 Plan Mode
Enter plan mode to explore, research, and design before writing code. Stratagem presents a structured plan for your approval before executing.

### 🔍 Web Search & Fetch
DuckDuckGo-powered web search works out of the box on all providers. Optional Firecrawl integration for JS-rendered pages.

### 💾 Session Persistence
Conversations are saved to disk. Resume any session with `/resume`. Start fresh with `/new`.

---

## Slash Commands

| Command | Description |
|---------|-------------|
| `/help` | Show all available commands |
| `/provider` | Guided provider setup |
| `/model` | Switch active model |
| `/compact` | Compress conversation context |
| `/new` | Start a fresh session |
| `/clear` | Same as `/new` |
| `/resume` | Resume a previous session |
| `/config` | View/edit configuration |
| `/memory` | Edit memory files |
| `/stats` | Usage statistics |
| `/status` | System status and connectivity |
| `/onboard-github` | GitHub Models setup |

---

## Agent Routing

Route different agents to different models for cost optimization:

```json
{
  "agentModels": {
    "deepseek-chat": {
      "base_url": "https://api.deepseek.com/v1",
      "api_key": "sk-your-key"
    },
    "gpt-4o": {
      "base_url": "https://api.openai.com/v1",
      "api_key": "sk-your-key"
    }
  },
  "agentRouting": {
    "Explore": "deepseek-chat",
    "Plan": "gpt-4o",
    "default": "gpt-4o"
  }
}
```

Add to `~/.claude/settings.json`. When no routing match is found, the global provider is the fallback.

> ⚠️ `api_key` values in `settings.json` are stored in plaintext. Keep this file private.

---

## Web Search

`WebSearch` uses DuckDuckGo by default on all non-Anthropic providers — free, no API key needed.

For better reliability and JS-rendered page support, set up [Firecrawl](https://firecrawl.dev):

```bash
export FIRECRAWL_API_KEY=your-key-here
```

Free tier includes 500 credits.

---

## Headless gRPC Server

Run Stratagem as a headless service for CI/CD, custom UIs, or programmatic access:

```bash
npm run dev:grpc        # Start server on localhost:50051
npm run dev:grpc:cli    # Test CLI client
```

| Variable | Default | Description |
|----------|---------|-------------|
| `GRPC_PORT` | `50051` | Server port |
| `GRPC_HOST` | `localhost` | Bind address |

Proto definitions: `src/proto/openclaude.proto`

---

## Build From Source

```bash
git clone https://github.com/EstarinAzx/XETH--7.git
cd XETH--7
bun install
bun run build
node dist/cli.mjs
```

### Dev Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Build + launch |
| `bun run dev:ollama` | Launch with Ollama profile |
| `bun test` | Run tests |
| `bun run test:coverage` | Coverage report |
| `bun run smoke` | Build + version check |
| `bun run doctor:runtime` | System diagnostics |
| `bun run verify:privacy` | Verify no telemetry |

---

## Project Structure

```
src/            Core CLI runtime
src/tools/      Tool implementations (Bash, FileEdit, UserInput, etc.)
src/components/ TUI components (Ink/React)
src/screens/    Main screens (REPL, Doctor)
src/utils/      Utilities and helpers
src/commands/   Slash command handlers
scripts/        Build and maintenance scripts
bin/            CLI launchers (stx7, openclaude)
docs/           Documentation
```

---

## Contributing

Contributions welcome. For larger changes, open an issue first.

Before submitting:

```bash
bun run build
bun run smoke
bun test
```

---

## Security

Found a vulnerability? See [SECURITY.md](SECURITY.md).

---

## Community

- [GitHub Discussions](https://github.com/EstarinAzx/XETH--7/discussions) — Q&A, ideas, conversation
- [GitHub Issues](https://github.com/EstarinAzx/XETH--7/issues) — Bugs and feature requests

---

## Disclaimer

Stratagem X7 is an independent community project. Not affiliated with, endorsed by, or sponsored by Anthropic.

Stratagem X7 originated from the Claude Code codebase and has been substantially modified to support multiple providers and open use. "Claude" and "Claude Code" are trademarks of Anthropic PBC. See [LICENSE](LICENSE) for details.

---

<div align="center">

```
◢ STRATAGEM X7 // breach shell // protocol online. ◣
```

**[Install](#install) · [Setup](#quick-setup) · [Providers](#supported-providers) · [Features](#features) · [Build](#build-from-source)**

</div>
