---
phase: 23-ci-test-reliability
plan: 01
subsystem: testing
tags: [ci, github-actions, nock, integration-tests, dependency-management]

# Dependency graph
requires:
  - phase: 16-structural-tests
    provides: "test:structural script and 499 structural tests"
  - phase: 18-integration-tests
    provides: "INT-03 workflow import tests and integration test infrastructure"
provides:
  - "CI pipeline runs structural tests on every push/PR"
  - "Explicit nock dependency in shared/test-utils (no hoisting reliance)"
  - "Fail-fast auth assertion in INT-03 tests"
affects: [ci-pipeline, integration-tests]

# Tech tracking
tech-stack:
  added: []
  patterns: ["fail-fast auth assertion in test beforeAll blocks"]

key-files:
  created: []
  modified:
    - ".github/workflows/ci.yml"
    - "shared/test-utils/package.json"
    - "pnpm-lock.yaml"
    - "__tests__/integration/integration.test.ts"

key-decisions:
  - "No code change for activateWorkflow -- POST+PATCH fallback confirmed already correct"
  - "Pre-existing structural test failures (author.email mismatch) are out of scope for this plan"

patterns-established:
  - "Fail-fast auth: test beforeAll blocks throw if required credentials not obtained"

requirements_completed: []

# Metrics
duration: 3min
completed: 2026-03-25
---

# Phase 23 Plan 01: CI & Test Reliability Summary

**Structural tests wired into CI pipeline, nock dependency declared explicitly, INT-03 fail-fast auth assertion added**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-25T19:51:34Z
- **Completed:** 2026-03-25T19:55:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- CI pipeline now runs 499 structural tests on every push/PR between test:all and verify-packages.js
- nock ^14.0.0 explicitly declared in shared/test-utils/package.json (no reliance on pnpm hoisting)
- INT-03 workflow import tests throw Error immediately if auth setup fails, instead of silently skipping 401s
- Confirmed activateWorkflow POST+PATCH fallback already correctly implemented in E2E helpers

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire test:structural into CI and declare nock dependency** - `ee96d34` (chore)
2. **Task 2: Fix INT-03 silent 401 skip and verify activateWorkflow** - `dedf6d8` (fix)

## Files Created/Modified
- `.github/workflows/ci.yml` - Added test:structural step between test:all and verify-packages.js
- `shared/test-utils/package.json` - Added nock ^14.0.0 to devDependencies
- `pnpm-lock.yaml` - Updated dependency resolution for nock in test-utils
- `__tests__/integration/integration.test.ts` - Added fail-fast throw, removed silent 401 skip

## Decisions Made
- No code change needed for activateWorkflow -- POST-first with PATCH fallback on 404/405 already implemented at lines 120-160 of helpers.ts
- 13 pre-existing structural test failures (author.email mismatch across all packages) noted but not fixed -- out of scope per deviation rules

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- CI pipeline is now complete with lint, build, unit tests, structural tests, and package verification
- Integration tests will fail visibly if Docker auth setup breaks
- Pre-existing author.email structural test failures should be addressed in a future plan

---
*Phase: 23-ci-test-reliability*
*Completed: 2026-03-25*
