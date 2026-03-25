---
phase: 14-node-do-pobierania-kursu-walut-z-nbp
plan: 01
subsystem: api
tags: [nbp, exchange-rate, currency, gold, declarative-node, public-api]

requires:
  - phase: 01-monorepo-bootstrap-smsapi-ceidg
    provides: monorepo scaffold, declarative node pattern, build tooling

provides:
  - n8n-nodes-nbp package scaffold (package.json, tsconfig, eslint, jest)
  - Nbp declarative node with 2 resources and 10 operations
  - No-credential declarative node pattern (public API)

affects: [14-02, testing, packaging]

tech-stack:
  added: []
  patterns: [no-credential declarative node, hidden routing property for parameterless operations, prefixed param names for multi-resource collision avoidance]

key-files:
  created:
    - packages/n8n-nodes-nbp/package.json
    - packages/n8n-nodes-nbp/tsconfig.json
    - packages/n8n-nodes-nbp/eslint.config.mjs
    - packages/n8n-nodes-nbp/jest.config.js
    - packages/n8n-nodes-nbp/nodes/Nbp/Nbp.node.ts
  modified: []

key-decisions:
  - "No credentials property at all for public API (omitted, not empty array)"
  - "String type for date fields instead of dateTime to ensure YYYY-MM-DD format"
  - "Hidden tableRouting property for getCurrentTable to trigger routing without extra visible params"
  - "Routing on operation option itself for getCurrentPrice (no-param gold operation)"
  - "Prefixed gold param names (goldDate, goldStartDate, goldEndDate, goldCount) to avoid collisions"

patterns-established:
  - "No-credential node: omit credentials property entirely from description"
  - "Hidden routing property for operations with shared params only"
  - "Operation-level routing for parameterless operations"

requirements_completed: [NBP-01, NBP-02, NBP-03, NBP-04, NBP-05]

duration: 2min
completed: 2026-03-22
---

# Phase 14 Plan 01: NBP Node Scaffold and Declarative Node Summary

**Declarative NBP node with Exchange Rate (6 ops) and Gold Price (4 ops) resources, no credentials, routing to api.nbp.pl**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-22T13:44:49Z
- **Completed:** 2026-03-22T13:46:43Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Package scaffold with empty credentials array for public API pattern
- Complete declarative node with 10 operations across 2 resources
- TypeScript compiles cleanly with no errors
- All NBP API endpoints covered: exchange rates (tables A/B/C), gold prices

## Task Commits

Each task was committed atomically:

1. **Task 1: Package scaffold** - `a6cd54d` (chore)
2. **Task 2: NBP declarative node** - `d5c89f3` (feat)

## Files Created/Modified
- `packages/n8n-nodes-nbp/package.json` - NPM package config with empty credentials, n8n-community-node-package keyword
- `packages/n8n-nodes-nbp/tsconfig.json` - TypeScript config without credentials include
- `packages/n8n-nodes-nbp/eslint.config.mjs` - ESLint with configWithoutCloudSupport
- `packages/n8n-nodes-nbp/jest.config.js` - Jest config with test-utils mapper
- `packages/n8n-nodes-nbp/nodes/Nbp/Nbp.node.ts` - Declarative node with 2 resources, 10 operations

## Decisions Made
- No credentials property at all (not even empty array in node description) -- NBP is public API
- Used string type for date fields with YYYY-MM-DD placeholder instead of dateTime to avoid ISO timestamp issues
- Hidden tableRouting property for getCurrentTable operation to trigger URL routing using shared table param
- Routing placed on operation option for getCurrentPrice (parameterless gold price fetch)
- Gold Price params prefixed with "gold" (goldDate, goldStartDate, etc.) to avoid name collisions with Exchange Rate params

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. NBP API is public with no authentication.

## Next Phase Readiness
- Node scaffold and main code ready for Plan 02 (tests, codex, icon, README)
- TypeScript compiles cleanly
- All 10 operations have correct URL routing patterns

---
*Phase: 14-node-do-pobierania-kursu-walut-z-nbp*
*Completed: 2026-03-22*
