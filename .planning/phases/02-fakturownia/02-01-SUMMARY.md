---
phase: 02-fakturownia
plan: 01
subsystem: api
tags: [fakturownia, invoices, credentials, pagination, typescript]

# Dependency graph
requires:
  - phase: 01-monorepo-bootstrap-smsapi-ceidg
    provides: monorepo structure, shared tooling, tsconfig.base.json, jest.config.base.js, test-utils
provides:
  - Fakturownia package scaffold (package.json, tsconfig, eslint, jest)
  - FakturowniaApi credentials (apiToken + subdomain with test endpoint)
  - fakturowniaApiRequest helper (dynamic URL, api_token in qs, subdomain sanitization)
  - fakturowniaApiRequestAllItems pagination helper (page loop, per_page=100)
  - Test infrastructure with credential validation tests
affects: [02-02, 02-03, 02-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [subdomain-based dynamic URL construction, api_token query parameter auth, page-based pagination with end detection]

key-files:
  created:
    - packages/n8n-nodes-fakturownia/package.json
    - packages/n8n-nodes-fakturownia/tsconfig.json
    - packages/n8n-nodes-fakturownia/eslint.config.mjs
    - packages/n8n-nodes-fakturownia/jest.config.js
    - packages/n8n-nodes-fakturownia/credentials/FakturowniaApi.credentials.ts
    - packages/n8n-nodes-fakturownia/nodes/Fakturownia/GenericFunctions.ts
    - packages/n8n-nodes-fakturownia/__tests__/Fakturownia.node.test.ts
  modified: []

key-decisions:
  - "No authenticate block on credentials -- auth handled manually via api_token query param in GenericFunctions due to dynamic subdomain URL"
  - "Subdomain sanitization strips .fakturownia.pl suffix if user accidentally includes full URL"
  - "Pagination uses per_page=100 (Fakturownia max) with end detection by response.length < perPage"

patterns-established:
  - "Dynamic subdomain URL: credentials provide subdomain, GenericFunctions constructs full URL"
  - "Query parameter auth: api_token appended to qs in every request"
  - "Pagination helper reads returnAll/limit at index 0, matching official n8n convention"

requirements-completed: [FAKT-01, FAKT-07, FAKT-08]

# Metrics
duration: 3min
completed: 2026-03-21
---

# Phase 2 Plan 1: Fakturownia Package Scaffold Summary

**Fakturownia package scaffold with apiToken+subdomain credentials, dynamic URL API helper, page-based pagination, and Wave 0 test stub**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-21T14:34:00Z
- **Completed:** 2026-03-21T14:37:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Package scaffold mirroring SMSAPI pattern (package.json, tsconfig, eslint, jest configs)
- FakturowniaApi credentials with apiToken (password field) + subdomain, test request to /account.json
- GenericFunctions with fakturowniaApiRequest (dynamic subdomain URL, api_token in qs, English-prefixed NodeApiError) and fakturowniaApiRequestAllItems (page loop, per_page=100, returnAll/limit)
- Test stub with 3 passing credential tests and 14 todo placeholders for future plans

## Task Commits

Each task was committed atomically:

1. **Task 1: Package scaffold and credentials** - `d817abd` (feat)
2. **Task 2: GenericFunctions -- API request helper and pagination helper** - `7afaf41` (feat)
3. **Task 3: Wave 0 test stub for Nyquist compliance** - `4506689` (test)

## Files Created/Modified
- `packages/n8n-nodes-fakturownia/package.json` - npm package metadata with n8n config
- `packages/n8n-nodes-fakturownia/tsconfig.json` - TypeScript config extending base
- `packages/n8n-nodes-fakturownia/eslint.config.mjs` - ESLint config with test exclusion
- `packages/n8n-nodes-fakturownia/jest.config.js` - Jest config with test-utils mapper
- `packages/n8n-nodes-fakturownia/credentials/FakturowniaApi.credentials.ts` - Credential type with apiToken + subdomain
- `packages/n8n-nodes-fakturownia/nodes/Fakturownia/GenericFunctions.ts` - API request and pagination helpers
- `packages/n8n-nodes-fakturownia/__tests__/Fakturownia.node.test.ts` - Credential tests + operation placeholders

## Decisions Made
- No authenticate block on credentials -- auth handled manually via api_token query param in GenericFunctions due to dynamic subdomain URL
- Subdomain sanitization strips .fakturownia.pl suffix if user accidentally includes full URL
- Pagination uses per_page=100 (Fakturownia max) with end detection by response.length < perPage

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Package scaffold compiles, credentials and API helpers ready
- Plan 02-02 can build the Fakturownia.node.ts with execute() method using GenericFunctions
- Test infrastructure validated, Plan 02-04 can add nock-based operation tests

---
*Phase: 02-fakturownia*
*Completed: 2026-03-21*
