---
phase: 01-monorepo-bootstrap-smsapi-ceidg
plan: 11
subsystem: testing
tags: [ceidg, jest, nock, api-v3, test-alignment]

requires:
  - phase: 01-monorepo-bootstrap-smsapi-ceidg
    provides: CEIDG node v3 implementation (plans 04, 09, 10)
provides:
  - All 14 CEIDG tests passing against v3 API assertions
  - CI-ready test suite (test:all exits 0)
affects: [ci-pipeline, ceidg-node]

tech-stack:
  added: []
  patterns:
    - "Test assertions must match actual API version (v3 not v2)"

key-files:
  created: []
  modified:
    - packages/n8n-nodes-ceidg/__tests__/Ceidg.node.test.ts

key-decisions:
  - "No code changes to node/credential files -- only test assertions were stale"
  - "n8n-node prerelease blocking local publish is expected behavior, not a bug"

patterns-established:
  - "CEIDG v3 API: /firma (singular) for NIP lookup, /firmy (plural) for name search"

requirements-completed: [CEIDG-06, CEIDG-07]

duration: 2min
completed: 2026-03-21
---

# Phase 01 Plan 11: CEIDG Test v3 API Alignment Summary

**Fixed 5 stale CEIDG test assertions referencing deprecated v2 API, restoring 14/14 test pass rate against live v3 implementation**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-21T13:24:05Z
- **Completed:** 2026-03-21T13:26:27Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Updated API_PATH constant and baseURL assertion from v2 to v3
- Fixed NIP routing URL assertions from /firmy to /firma (singular)
- Fixed credential auth assertion to match non-optional chaining ($credentials.apiKey)
- Fixed credential test URL to match /firma?nip=6351723862
- Updated all 6 HTTP integration test nock URLs and https.get calls from /firmy to /firma
- All 14 CEIDG tests pass; full test suite (38 tests: 24 SMSAPI + 14 CEIDG) exits 0

## Task Commits

Each task was committed atomically:

1. **Task 1: Update CEIDG test assertions to match v3 API implementation** - `ec89dc0` (fix)

**Plan metadata:** [pending] (docs: complete plan)

## Files Created/Modified
- `packages/n8n-nodes-ceidg/__tests__/Ceidg.node.test.ts` - Updated 13 lines: v2->v3 paths, /firmy->/firma for NIP lookup, credential auth and test URL assertions

## Decisions Made
- No changes to node implementation or credential files -- only test assertions were stale after v2->v3 migration in plans 09/10
- The `n8n-node prerelease` script intentionally blocks local publishes to enforce the GitHub Actions publish path; this is expected behavior per @n8n/node-cli design, not a bug

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed https.get URLs in HTTP integration tests**
- **Found during:** Task 1 (test execution)
- **Issue:** Plan specified updating nock intercept URLs but the corresponding https.get call URLs also used /firmy hardcoded (not via API_PATH template), causing nock mismatch and 5s timeouts on 3 HTTP integration tests
- **Fix:** Updated 3 https.get URL strings from /firmy to /firma to match nock intercepts
- **Files modified:** packages/n8n-nodes-ceidg/__tests__/Ceidg.node.test.ts
- **Verification:** All 14 tests pass, no timeouts
- **Committed in:** ec89dc0 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Fix was necessary for test correctness. The plan's Change 7 only mentioned nock intercept URLs but missed the corresponding https.get URLs. No scope creep.

## Issues Encountered
None beyond the deviation documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CEIDG node fully tested and aligned with v3 API
- CI pipeline unblocked: `pnpm run test:all` exits 0 with 38/38 tests passing
- Ready for npm publish via GitHub Actions workflow

## Self-Check: PASSED

---
*Phase: 01-monorepo-bootstrap-smsapi-ceidg*
*Completed: 2026-03-21*
