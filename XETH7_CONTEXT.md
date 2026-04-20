# XETH--7 Context

## Repo

- Path: `D:\Mods\xethryon\new agent\XETH--7`
- Active branch: `xeth-7-dev`
- Local launcher: `xeth7`

## Core architectural context

- **XETHRYON** and **XETH--7** do **not** share the same base.
- **XETHRYON** is a fork of **OpenCode**.
- **XETH--7** is a fork of **OpenClaude**.
- XETHRYON should be used for **inspiration**, not 1:1 parity or blind architectural copying.

## User goals

The user wants XETH--7 to stop feeling like “OpenClaude recolored/rebranded” and become a more original shell with its own identity.

Main direction:

- strong rebrand to **XETH--7**
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

## Major completed work so far

### Branding / shell commits

- `0c1ad48` — `feat(ui): cyberpunk rebrand XETH--7`
- `002b593` — `feat(brand): complete XETH--7 rebrand`
- `8519e72` — `feat(shell): add autonomy and breach HUD revamp`
- `9394596` — `feat(shell): expand breach HUD surfaces`
- `cbb09cb` — `feat(shell): polish breach startup and pickers`

### Memory commit

- `a43a14d` — `feat(memory): upgrade Obsidian-style knowledge graph`

## Current implemented capabilities

### 1. Rebrand

Visible XETH--7 branding has already been pushed across many user-facing surfaces:

- startup / logo / welcome text
- CLI version text
- provider / picker / help wording
- docs and extension branding in prior passes

### 2. Autonomy system

Implemented autonomy modes:

- `OFF`
- `SMART`
- `AGGRESSIVE`

Behavior:

- `/autonomy off`
- `/autonomy smart`
- `/autonomy aggressive`
- `/autonomy status`
- `Shift+Tab` cycles autonomy tiers on the main agent

High-level mapping:

- `OFF` → normal approvals
- `SMART` → smarter auto handling (`auto` if available, fallback to `acceptEdits`)
- `AGGRESSIVE` → `bypassPermissions`

Relevant files:

- `src/utils/autonomy.ts`
- `src/utils/autonomy.test.ts`
- `src/commands/autonomy/index.ts`
- `src/commands/autonomy/autonomy.tsx`
- `src/utils/permissions/permissionSetup.ts`
- `src/utils/settings/types.ts`
- `src/utils/settings/settings.ts`
- `src/utils/settings/applySettingsChange.ts`
- `src/components/PromptInput/PromptInput.tsx`
- `src/components/PromptInput/PromptInputFooterLeftSide.tsx`
- `src/main.tsx`

### 3. Memory system

XETH--7 memory has already been reworked toward an Obsidian-friendly graph model.

Implemented:

- `index.md` entrypoint instead of `MEMORY.md`
- `daily/` logs
- `knowledge/` subtree with categories
- stronger remember / forget rules
- graph-aware recall/ranking
- prompt guidance to avoid dumb bash existence checks during memory saves

Key files:

- `src/memdir/memdir.ts`
- `src/memdir/memoryTypes.ts`
- `src/memdir/paths.ts`
- `src/memdir/memoryScan.ts`
- `src/memdir/findRelevantMemories.ts`
- `src/services/extractMemories/prompts.ts`
- `src/services/extractMemories/extractMemories.ts`
- `src/services/autoDream/consolidationPrompt.ts`

### 4. Current shell styling state

Already changed:

- breach-HUD themed startup shell
- breach-themed prompt deck
- breach-themed status bus
- breach-themed dialogs/panes/action surfaces in later passes
- provider/model/theme picker wording moved further into XETH shell language

However:

- the shell is **still mid-revamp**
- some surfaces still retain upstream OpenClaude layout DNA
- the failed persistent-header experiment was reverted

## Current known issue / recent revert

There was a recent attempt to:

- make the startup/header persistent inside the live Ink UI
- centralize the logo and breach protocol section
- keep it visible across maximize/minimize

That attempt caused bad duplication / collapse / resize behavior and was **reverted**.

So current working assumption should be:

- use the stable shell state from commit `cbb09cb` as the baseline
- avoid reintroducing giant live-resizing ASCII header logic without a more robust approach

## Good next targets

Best remaining areas for another agent to improve:

- settings/config surfaces
- permission dialogs
- MCP panels
- task detail/dialog views
- transcript layout further away from upstream
- picker and modal consistency
- deeper shell architecture rewrite instead of only color/chrome work

## Testing / validation workflow

Preferred practical checks:

- `bun run build`
- `bun test src/utils/autonomy.test.ts` when autonomy-related work changes
- targeted tests for changed areas
- `xeth7 --version`

Note:

- full typecheck may still surface unrelated pre-existing repo issues
- build + targeted tests are the practical verification baseline used so far

## Collaboration style / preferences

- user prefers direct action
- user wants minimal hesitation
- user wants XETH--7 to feel truly distinct, not like upstream with a skin
- user is fine with aggressive redesign if it improves originality
- user explicitly wants useful concepts borrowed from XETHRYON, but not forced architectural parity
