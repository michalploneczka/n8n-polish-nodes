---
phase: 01-monorepo-bootstrap-smsapi-ceidg
plan: 04
subsystem: infra
tags: [ceidg, n8n-node, declarative, api-key, polish-registry]

requires:
  - phase: 01-monorepo-bootstrap-smsapi-ceidg
    provides: "Root workspace config, tsconfig.base.json, jest.config.base.js, copy-codex script"
provides:
  - "Complete CEIDG node package with credential, declarative node (3 operations), codex, icon"
  - "CEIDG API key credential with IAuthenticateGeneric and test request"
affects: [01-monorepo-bootstrap-smsapi-ceidg, publish-pipeline]

tech-stack:
  added: []
  patterns: [declarative-node-single-resource, api-key-auth-generic, query-param-routing, url-param-routing]

key-files:
  created:
    - packages/n8n-nodes-ceidg/package.json
    - packages/n8n-nodes-ceidg/tsconfig.json
    - packages/n8n-nodes-ceidg/jest.config.js
    - packages/n8n-nodes-ceidg/credentials/CeidgApi.credentials.ts
    - packages/n8n-nodes-ceidg/nodes/Ceidg/Ceidg.node.ts
    - packages/n8n-nodes-ceidg/nodes/Ceidg/Ceidg.node.json
    - packages/n8n-nodes-ceidg/icons/ceidg.svg
  modified: []

key-decisions:
  - "Single resource (Company) with 3 operations - no resource selector complexity needed"
  - "Placeholder SVG icon per D-09 - real logo before v1.0 publish"

patterns-established:
  - "Declarative single-resource node: resource options + operation options + field routing"
  - "Query param routing via send.type='query' for search operations"
  - "URL param routing via url='=/path/{{$value}}' for get-by-id operations"

requirements-completed: [CEIDG-01, CEIDG-02, CEIDG-03, CEIDG-04, CEIDG-05, CEIDG-08]

duration: 2min
completed: 2026-03-20
---

# Phase 01 Plan 04: CEIDG Node Summary

**Declarative CEIDG node with API key credential and 3 GET operations (Search by NIP, Search by Name, Get by ID) for Polish company registry lookup**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-20T22:11:37Z
- **Completed:** 2026-03-20T22:13:57Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Complete CEIDG package structure with package.json, tsconfig, jest config
- API key credential using IAuthenticateGeneric with test request validation
- Purely declarative node with 3 operations: Search by NIP, Search by Name, Get by ID
- Codex metadata file and placeholder SVG icon

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CEIDG package config, credential, icon, and codex** - `93be585` (chore)
2. **Task 2: Create CEIDG declarative node with 3 operations** - `e5239ff` (feat)

## Files Created/Modified
- `packages/n8n-nodes-ceidg/package.json` - Package config with n8n field, dist paths, scripts
- `packages/n8n-nodes-ceidg/tsconfig.json` - TypeScript config extending base
- `packages/n8n-nodes-ceidg/jest.config.js` - Jest config extending base with test-utils mapper
- `packages/n8n-nodes-ceidg/credentials/CeidgApi.credentials.ts` - API key credential with IAuthenticateGeneric
- `packages/n8n-nodes-ceidg/nodes/Ceidg/Ceidg.node.ts` - Declarative node with 3 operations
- `packages/n8n-nodes-ceidg/nodes/Ceidg/Ceidg.node.json` - Codex metadata
- `packages/n8n-nodes-ceidg/icons/ceidg.svg` - Placeholder 60x60 SVG icon

## Decisions Made
- Single resource (Company) with 3 operations keeps the node simple and matches CEIDG's 3-endpoint API
- Placeholder SVG icon per D-09 decision - real official logo to be sourced before v1.0 publish

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CEIDG package ready for build/test pipeline validation (plan 01-05 or later)
- Package can be used as publish pipeline guinea pig per D-18

---
*Phase: 01-monorepo-bootstrap-smsapi-ceidg*
*Completed: 2026-03-20*
