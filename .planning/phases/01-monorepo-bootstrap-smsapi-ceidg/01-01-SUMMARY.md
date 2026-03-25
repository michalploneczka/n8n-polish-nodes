---
phase: 01-monorepo-bootstrap-smsapi-ceidg
plan: 01
subsystem: infra
tags: [pnpm, monorepo, typescript, jest, n8n-node-cli]

# Dependency graph
requires: []
provides:
  - Root pnpm workspace config (package.json, pnpm-workspace.yaml)
  - Shared TypeScript base config (tsconfig.base.json)
  - Shared Jest base config (jest.config.base.js)
  - Codex copy utility script (scripts/copy-codex.js)
  - MIT LICENSE and .gitignore
affects: [01-02, 01-03, 01-04, 01-05, 01-06, 01-07, 01-08, 01-09, 01-10]

# Tech tracking
tech-stack:
  added: [pnpm-workspaces, typescript-5.9, jest-29, ts-jest, nock-14, eslint-9, prettier-3.6, "@n8n/node-cli-0.23", n8n-workflow, fast-glob]
  patterns: [pnpm-filter-scripts, tsconfig-extends-base, jest-config-extends-base, codex-copy-postbuild]

key-files:
  created:
    - package.json
    - pnpm-workspace.yaml
    - .npmrc
    - .gitignore
    - LICENSE
    - tsconfig.base.json
    - jest.config.base.js
    - scripts/copy-codex.js
  modified: []

key-decisions:
  - "tsconfig targets es2019 matching @n8n/node-cli official template (not ES2021)"
  - "shamefully-hoist=true in .npmrc for @n8n/node-cli compatibility"
  - "copy-codex.js uses fast-glob (transitive dep of @n8n/node-cli) — no extra install needed"

patterns-established:
  - "Per-package tsconfig extends root tsconfig.base.json (no outDir/include in base)"
  - "Per-package jest.config.js extends root jest.config.base.js"
  - "Post-build codex copy via scripts/copy-codex.js for .node.json files"
  - "Root scripts use pnpm --filter './packages/*' pattern"

requirements_completed: [INFRA-01, INFRA-02, INFRA-03, INFRA-07]

# Metrics
duration: 2min
completed: 2026-03-20
---

# Phase 01 Plan 01: Monorepo Root Bootstrap Summary

**pnpm workspace with shared TypeScript/Jest configs and codex copy utility for n8n community node monorepo**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-20T21:59:50Z
- **Completed:** 2026-03-20T22:01:43Z
- **Tasks:** 2
- **Files created:** 8

## Accomplishments
- Root pnpm workspace with packages/* and shared/* globs, private root package
- Shared TypeScript base config matching @n8n/node-cli official template (es2019, strict, commonjs)
- Shared Jest base config with ts-jest preset for per-package extension
- Post-build codex copy script to handle .node.json files that n8n-node build does not copy

## Task Commits

Each task was committed atomically:

1. **Task 1: Create root workspace configuration files** - `7fe4ad5` (chore)
2. **Task 2: Create shared TypeScript config, Jest base, and codex copy script** - `81212b1` (chore)

## Files Created/Modified
- `package.json` - Root workspace config with pnpm scripts and shared devDependencies
- `pnpm-workspace.yaml` - Workspace glob definitions (packages/*, shared/*)
- `.npmrc` - pnpm config with shamefully-hoist for n8n compatibility
- `.gitignore` - Excludes node_modules, dist, .idea, coverage, .n8n
- `LICENSE` - MIT license (2026 Michal Ploneczka)
- `tsconfig.base.json` - Shared TypeScript config (strict, es2019, commonjs, declaration)
- `jest.config.base.js` - Shared Jest config (ts-jest, node env, __tests__ pattern)
- `scripts/copy-codex.js` - Post-build utility to copy .node.json codex files to dist/

## Decisions Made
- tsconfig targets es2019 (not ES2021) to match the @n8n/node-cli official template exactly
- shamefully-hoist=true required because @n8n/node-cli expects certain packages to be hoisted
- copy-codex.js uses synchronous fs APIs (cpSync, mkdirSync) since it is a simple build script

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Workspace foundation ready for package creation (plans 01-02 through 01-10)
- All packages can extend tsconfig.base.json and jest.config.base.js
- codex copy script ready for use in per-package build scripts
- pnpm install will be needed after first package is added

---
*Phase: 01-monorepo-bootstrap-smsapi-ceidg*
*Completed: 2026-03-20*

## Self-Check: PASSED
