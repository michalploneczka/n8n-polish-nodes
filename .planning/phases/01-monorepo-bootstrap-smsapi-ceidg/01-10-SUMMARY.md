---
phase: 01-monorepo-bootstrap-smsapi-ceidg
plan: 10
subsystem: infra
tags: [n8n, pnpm-link, npm-publish, dry-run, node-discovery, docker, ceidg, smsapi]

# Dependency graph
requires:
  - phase: 01-monorepo-bootstrap-smsapi-ceidg
    provides: Built CEIDG and SMSAPI packages (plans 01-04 through 01-09)
provides:
  - Validated end-to-end pipeline: build -> link -> n8n node discovery -> publish dry-run
  - Confirmed npm link works for n8n custom node development
  - Docker-based dev environment with N8N_CUSTOM_EXTENSIONS
  - dev-install.sh script for automated local dev setup
  - CEIDG API v3 endpoint confirmed working with real token
affects: [phase-02-fakturownia, all-future-nodes]

# Tech tracking
tech-stack:
  added: [docker-compose for n8n dev]
  patterns: [npm-link for n8n custom nodes, docker N8N_CUSTOM_EXTENSIONS volume mount]

key-files:
  created:
    - scripts/dev-install.sh
  modified:
    - docker-compose.yml
    - packages/n8n-nodes-ceidg/credentials/CeidgApi.credentials.ts
    - packages/n8n-nodes-ceidg/nodes/Ceidg/Ceidg.node.ts

key-decisions:
  - "npm link (not pnpm link) for n8n custom node development -- pnpm link not compatible with n8n node discovery"
  - "CEIDG API v3 (not v2) -- v2 deprecated, v3 uses Bearer auth and /firma endpoint"
  - "Docker with N8N_CUSTOM_EXTENSIONS for dev environment verification"

patterns-established:
  - "Dev workflow: build -> npm link -> verify in n8n UI (or Docker with volume mount)"
  - "npm publish --dry-run as pre-publish validation step"

requirements_completed: []

# Metrics
duration: 15min
completed: 2026-03-21
---

# Phase 01 Plan 10: Pipeline Validation Summary

**End-to-end pipeline validated: npm link node discovery in n8n, CEIDG publish dry-run passes, CEIDG API v3 confirmed working with real credentials**

## Performance

- **Duration:** 15 min (across checkpoint session)
- **Started:** 2026-03-21T09:00:00Z
- **Completed:** 2026-03-21T10:23:09Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Both CEIDG and SMSAPI nodes visible in n8n node picker with correct operations and credentials
- CEIDG npm publish dry-run passes (D-18 guinea pig validation)
- CEIDG API v3 confirmed working with real API token -- search by NIP returns structured JSON
- Docker-based dev environment configured with N8N_CUSTOM_EXTENSIONS for easy node testing

## Task Commits

Each task was committed atomically:

1. **Task 1: Link CEIDG and SMSAPI packages to n8n custom nodes** - `4cf208b` (chore) -- includes link setup, CEIDG v3 fixes, docker-compose updates
2. **Task 2: Run CEIDG publish dry-run with provenance** - `4cf208b` (part of same commit)
3. **Task 3: Verify nodes appear in n8n UI** - Human checkpoint, approved by user

_Note: Tasks 1-2 were committed together in a single checkpoint session commit. Task 3 was a human verification checkpoint._

## Files Created/Modified
- `docker-compose.yml` - Added N8N_CUSTOM_EXTENSIONS volume mount for dev
- `scripts/dev-install.sh` - Automated dev install script for linking nodes to n8n
- `packages/n8n-nodes-ceidg/credentials/CeidgApi.credentials.ts` - Updated to API v3 with Bearer auth
- `packages/n8n-nodes-ceidg/nodes/Ceidg/Ceidg.node.ts` - Updated baseURL to v3, fixed endpoint paths
- `README.md` - Updated with project status
- `claude.md` - Development notes

## Decisions Made
- **npm link over pnpm link:** n8n resolves custom nodes via npm, not pnpm -- npm link is the compatible method
- **CEIDG API v3:** The v2 API is deprecated; v3 uses Bearer token auth and `/firma` (singular) endpoint instead of `/firmy`
- **Docker dev environment:** docker-compose.yml with N8N_CUSTOM_EXTENSIONS provides reproducible dev testing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] CEIDG API v2 to v3 migration**
- **Found during:** Task 1 (linking and testing in n8n)
- **Issue:** CEIDG API v2 endpoints returned errors; API has been updated to v3
- **Fix:** Updated baseURL to `https://dane.biznes.gov.pl/api/ceidg/v3`, changed Authorization to Bearer prefix, fixed endpoint from `/firmy` to `/firma`
- **Files modified:** packages/n8n-nodes-ceidg/credentials/CeidgApi.credentials.ts, packages/n8n-nodes-ceidg/nodes/Ceidg/Ceidg.node.ts
- **Verification:** Real API call with NIP returns valid JSON response
- **Committed in:** 4cf208b

**2. [Rule 3 - Blocking] Docker dev environment setup**
- **Found during:** Task 1 (needed reproducible n8n environment for testing)
- **Issue:** No standardized way to test nodes in n8n locally
- **Fix:** Added docker-compose.yml N8N_CUSTOM_EXTENSIONS config and created dev-install.sh script
- **Files modified:** docker-compose.yml, scripts/dev-install.sh
- **Committed in:** 4cf208b

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes necessary for successful validation. CEIDG v3 migration was essential as v2 is deprecated. Docker setup enables reproducible testing.

## Issues Encountered
- CEIDG API v2 returned errors during live testing -- discovered the API had been updated to v3 with different auth and endpoint patterns. Fixed inline during the checkpoint session.

## User Setup Required
None - no external service configuration required beyond existing API tokens.

## Known Stubs
None - this plan validates existing implementations, no new functional code with stubs.

## Next Phase Readiness
- Phase 1 is now complete: all 10 plans executed successfully
- Both CEIDG and SMSAPI nodes are built, tested, linked, and verified in n8n
- CEIDG publish dry-run confirms package structure is valid for npm publication
- Ready for Phase 2 (Fakturownia) -- all infrastructure and patterns established
- Remaining: actual npm publish with provenance (requires GitHub Actions with tag trigger)

---
*Phase: 01-monorepo-bootstrap-smsapi-ceidg*
*Completed: 2026-03-21*
