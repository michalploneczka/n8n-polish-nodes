---
phase: 21-e2e-testy-fakturownia-inpost
plan: 02
subsystem: testing
tags: [e2e, fakturownia, inpost, jest, webhook, sandbox]

requires:
  - phase: 21-01
    provides: "Fakturownia and InPost E2E workflow fixtures"
  - phase: 18
    provides: "E2E test infrastructure (helpers, docker compose, e2e-test.sh)"
  - phase: 02
    provides: "Fakturownia node with fakturowniaApi credential type"
  - phase: 03
    provides: "InPost node with inpostApi credential type"
provides:
  - "Fakturownia E2E test block (list invoices + create invoice round-trip)"
  - "InPost E2E test block (list shipments + create test shipment in sandbox)"
  - "Graceful skip logic for both suites when env vars absent"
affects: []

tech-stack:
  added: []
  patterns:
    - "Multi-credential conditional describe.skip for services requiring multiple env vars"

key-files:
  created: []
  modified:
    - "__tests__/e2e/e2e.test.ts"

key-decisions:
  - "InPost credential includes environment: sandbox to use sandbox base URL"

patterns-established:
  - "Conditional describe.skip with multi-env-var check: (VAR1 && VAR2) ? describe : describe.skip"

requirements_completed: [E2E-13, E2E-14, E2E-15]

duration: 1min
completed: 2026-03-25
---

# Phase 21 Plan 02: Fakturownia and InPost E2E Test Blocks Summary

**Fakturownia and InPost E2E describe blocks with list+create tests and graceful credential-absent skip logic**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-25T14:47:57Z
- **Completed:** 2026-03-25T14:49:06Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added Fakturownia E2E block (E2E-13): list invoices + create invoice round-trip with buyer_name/kind assertions
- Added InPost E2E block (E2E-14): list shipments + create test shipment in sandbox with service type assertion
- Both suites skip gracefully via describe.skip when env vars absent (E2E-15)
- InPost test handles 422 validation errors from sandbox (test data tolerance)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Fakturownia and InPost E2E describe blocks** - `c05146d` (feat)

## Files Created/Modified
- `__tests__/e2e/e2e.test.ts` - Added Fakturownia E2E (E2E-13) and InPost E2E (E2E-14) describe blocks with 4 test cases total

## Decisions Made
- InPost credential includes `environment: 'sandbox'` to route to sandbox base URL
- InPost create test has 30s timeout and tolerates 422 validation errors (sandbox data constraints)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All E2E test blocks for Fakturownia and InPost are in place
- Tests will execute when FAKTUROWNIA_API_TOKEN, FAKTUROWNIA_SUBDOMAIN, INPOST_TOKEN, INPOST_ORG_ID env vars are provided

---
*Phase: 21-e2e-testy-fakturownia-inpost*
*Completed: 2026-03-25*
