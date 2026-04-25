# XETH--7 / STRATAGEM X7 Context

## Repo

- Path: `D:\Mods\xethryon\new agent\XETH--7`
- Active branch: `xeth-7-dev`
- Local launcher: `xeth7`
- NPM package: `stratagem-x7` (published on npmjs.com)
- Latest published version: `0.3.12`
- Global install: `npm i -g stratagem-x7`
- Global CLI commands: `stx7`, `openclaude`, `xeth7`
- Build command: `bun run build` (produces `dist/cli.mjs`)
- Publish workflow: `bun run build` → `npm version patch --no-git-tag-version` → `git commit` → `npm publish`

## Core architectural context

- **XETHRYON** and **XETH--7** do **not** share the same base.
- **XETHRYON** is a fork of **OpenCode**.
- **XETH--7** is a fork of **OpenClaude** (Anthropic's CLI agent).
- XETHRYON should be used for **inspiration**, not 1:1 parity or blind architectural copying.
- The project has been rebranded to **STRATAGEM X7** for the npm package name.

## User goals

The user wants XETH--7 to stop feeling like "OpenClaude recolored/rebranded" and become a more original shell with its own identity.

Main direction:

- strong rebrand to **STRATAGEM X7**
- distinct visual identity
- iterative experimentation is welcome
- direct execution preferred over long theory

## Current visual direction

The shell direction evolved over time:

1. cyberpunk rebrand
2. red/cyan daemon shell
3. stronger bright red tuning
4. user then pivoted to a more radical **NET//TECH / breach-HUD / cyberdeck** direction

Current preferred vibe:

- acid lime / yellow-green primary chrome
- cyan active signal accents
- dark olive-black / near-black backgrounds
- segmented protocol panels
- breach / buffer / matrix / uplink language

Important: a recent attempt to centralize/persist the startup header caused ugly resize/maximize issues and was **reverted**. Do **not** assume the centered persistent header work is still present.

## Branch / workflow constraints

- Work stays on `xeth-7-dev`
- Do **not** continue work on `main`
- Leave the repo buildable/testable after changes
- Keep `xeth7` runnable from any directory for easy testing
- Commit substantial phases when asked / as the workflow requires

## Major completed work

### Branding / shell commits

- `0c1ad48` — `feat(ui): cyberpunk rebrand XETH--7`
- `002b593` — `feat(brand): complete XETH--7 rebrand`
- `8519e72` — `feat(shell): add autonomy and breach HUD revamp`
- `9394596` — `feat(shell): expand breach HUD surfaces`
- `cbb09cb` — `feat(shell): polish breach startup and pickers`

### Memory commit

- `a43a14d` — `feat(memory): upgrade Obsidian-style knowledge graph`

### Cross-provider compatibility (v0.3.7)

- `2aa2ed1` — `fix: sanitize tool call IDs for cross-provider compatibility`
- Added `sanitizeToolId()` in `src/services/api/openaiShim.ts` to strip illegal characters (colons) from tool IDs
- Fixes `400 Bad Request` errors when switching between disparate LLM providers (e.g., Kimi K2.6 → GPT-5.4)

### Message display improvements (v0.3.6)

- `29042ac` — `feat: add USER and STRATAGEM prefix labels to messages`
- `25b00f9` — `style: add spacing between labels and content, mute TRACE color`
- User messages display `USER` prefix, AI messages display `STRATAGEM`
- Thinking/reasoning blocks show `TRACE//COGNITION` prefix in muted color
- Modified files: `src/screens/REPL.tsx`, `src/components/PromptInput/PromptInput.tsx`, `src/components/PromptInput/PromptInputFooter.tsx`

### Thinking/reasoning trace fixes (v0.3.5 - v0.3.6)

- `5f55b00` — `fix: preserve reasoning_content on assistant replay for Kimi/Moonshot`
- `d312deb` — `fix: emit thinking traces before collapsed tool groups, not after`
- `a3d1a3b` — `fix: thinking blocks break collapsed groups for interleaved flow`
- Fixes for providers that use `reasoning_content` field (Kimi, Moonshot, DeepSeek)

### Provider model discovery (v0.3.8 - v0.3.9)

- `233fc31` — `feat: enable model discovery for all OpenAI-compatible providers`
- `58cbb6a` — `feat: auto-discover models in provider setup form`
- Provider setup wizard now auto-fetches available models via `/v1/models` endpoint
- Form step order changed to: **Name → Base URL → API Key → Model** (API key before model so discovery can authenticate)
- Model step shows a `Select` list with discovered models + "Enter manually" fallback
- Removed restrictive `isLocalProviderUrl` checks in `src/services/api/providerConfig.ts`
- Key file: `src/components/ProviderManager.tsx` (lines ~978-1021 for discovery effect, ~1189-1227 for model UI)

### Ripgrep fix for npm installs (v0.3.10)

- `f67b2da` — `fix: bundle @vscode/ripgrep for npm installs missing rg`
- Added `@vscode/ripgrep` as a dependency — downloads correct platform-specific `rg` binary during `npm install`
- Resolution chain: **Embedded (Bun compiled)** → **Vendored binary** → **@vscode/ripgrep** → **System rg on PATH**
- Key file: `src/utils/ripgrep.ts` (`getVscodeRipgrepPath()` function resolves binary from `node_modules/@vscode/ripgrep/bin/`)
- This fixed the "file search command failed" error for users who installed via `npm i -g stratagem-x7` without having `rg` on PATH

### Agent teams / swarm unlocked (v0.3.11 - v0.3.12)

- `a948b50` — `feat: unlock agent teams for Stratagem users`
- `de5be41` — `feat: agent teams always on — no flag needed`
- Removed GrowthBook killswitch gate from `isAgentSwarmsEnabled()` — Stratagem doesn't connect to Anthropic's feature flag infrastructure
- Agent teams are **always enabled** — no env var or `--agent-teams` flag needed
- Key file: `src/utils/agentSwarmsEnabled.ts` (just returns `true`)
- On Windows, teams use **in-process mode** (background threads, no tmux needed)
- Team tools available: `TeamCreate`, `TeamDelete`, `SendMessage`, `AgentTool`, `TaskCreate/Update/List`

## Current implemented capabilities

### 1. Rebrand

Visible STRATAGEM X7 branding across all user-facing surfaces:

- startup / logo / welcome text
- CLI version text
- provider / picker / help wording
- docs and extension branding
- message prefixes: `USER` for user, `STRATAGEM` for AI, `TRACE//COGNITION` for thinking

### 2. Autonomy system

Implemented autonomy modes:

- `OFF` → normal approvals
- `SMART` → smarter auto handling (`auto` if available, fallback to `acceptEdits`)
- `AGGRESSIVE` → `bypassPermissions`

Commands: `/autonomy off|smart|aggressive|status`, `Shift+Tab` cycles tiers

Relevant files:

- `src/utils/autonomy.ts`
- `src/utils/autonomy.test.ts`
- `src/commands/autonomy/index.ts`
- `src/commands/autonomy/autonomy.tsx`
- `src/utils/permissions/permissionSetup.ts`

### 3. Memory system

Obsidian-friendly graph model:

- `index.md` entrypoint instead of `MEMORY.md`
- `daily/` logs
- `knowledge/` subtree with categories
- stronger remember / forget rules
- graph-aware recall/ranking

Key files:

- `src/memdir/memdir.ts`
- `src/memdir/memoryTypes.ts`
- `src/memdir/paths.ts`
- `src/memdir/memoryScan.ts`
- `src/memdir/findRelevantMemories.ts`

### 4. Provider system

- OpenAI-compatible shim (`src/services/api/openaiShim.ts`) with `sanitizeToolId()` for cross-provider compat
- Auto model discovery via `/v1/models` endpoint in provider setup wizard
- Provider profiles in `src/utils/providerProfiles.ts`
- Provider manager UI in `src/components/ProviderManager.tsx`

### 5. Agent teams / swarm

Always enabled. Supports:

- `TeamCreate` — creates a team with shared task board
- `TeamDelete` — disbands the team
- `SendMessage` — inter-agent messaging via mailboxes
- `AgentTool` — spawns sub-agents as teammates
- `TaskCreate/TaskUpdate/TaskList` — shared task board
- In-process backend on Windows (no tmux), tmux/iTerm2 on macOS/Linux

Key files:

- `src/utils/agentSwarmsEnabled.ts` — always returns `true`
- `src/utils/swarm/` — full swarm module (backends, runners, team helpers)
- `src/tools/TeamCreateTool/` — team creation tool
- `src/tools/TeamDeleteTool/` — team deletion tool
- `src/tools/SendMessageTool/` — inter-agent messaging
- `src/utils/swarm/backends/registry.ts` — backend detection (auto-selects in-process on Windows)

### 6. Shell styling

- breach-HUD themed startup shell
- breach-themed prompt deck
- breach-themed status bus
- breach-themed dialogs/panes/action surfaces
- the shell is **still mid-revamp** — some surfaces still retain upstream OpenClaude layout DNA

## Current known issues

### Analytics / telemetry

- `src/services/analytics/config.ts` — `isAnalyticsDisabled()` always returns `true` (no telemetry sent)
- GrowthBook is effectively disabled (depends on 1P event logging which is disabled)
- This is intentional — Stratagem is a standalone fork

### Shell styling

- Failed persistent-header experiment was reverted
- Use commit `cbb09cb` as the baseline for shell work
- Avoid reintroducing giant live-resizing ASCII header logic

### Build system

- Build uses `bun run scripts/build.ts` which uses Bun's bundler
- Feature flags via `bun:bundle` — `feature('FLAG_NAME')` for dead code elimination
- Telemetry modules are stubbed during build (21 modules)
- Feature flags are pre-processed across 206 files

## Good next targets

Best remaining areas for improvement:

- settings/config surfaces
- permission dialogs
- MCP panels
- task detail/dialog views
- transcript layout further away from upstream
- picker and modal consistency
- deeper shell architecture rewrite instead of only color/chrome work
- swarm/team UX improvements (visual feedback for running teammates)

## Testing / validation workflow

Preferred practical checks:

- `bun run build` — must pass
- `bun test src/utils/autonomy.test.ts` — when autonomy changes
- targeted tests for changed areas
- `stx7 --version` — quick smoke test

Note:

- full typecheck may still surface unrelated pre-existing repo issues
- build + targeted tests are the practical verification baseline

## Collaboration style / preferences

- user prefers direct action
- user wants minimal hesitation
- user wants STRATAGEM X7 to feel truly distinct, not like upstream with a skin
- user is fine with aggressive redesign if it improves originality
- user explicitly wants useful concepts borrowed from XETHRYON, but not forced architectural parity
- user says "just do it" — don't ask for permission on obvious fixes
