---
phase: 19-e2e-testy-publiczne-api
verified: 2026-03-25T08:10:00Z
status: gaps_found
score: 12/13 must-haves verified
re_verification: false
gaps:
  - truth: "activateWorkflow uses POST /activate with PATCH fallback to handle both n8n API variants"
    status: failed
    reason: "Implementation uses PATCH only (no POST /activate attempt). The fallback strategy described in Plan 01 truth #3 and acceptance criteria was not implemented — only the fallback path exists."
    artifacts:
      - path: "__tests__/e2e/helpers.ts"
        issue: "activateWorkflow (line 119-135) sends PATCH /api/v1/workflows/{id} directly. No attempt at POST /api/v1/workflows/{id}/activate, no fallback logic."
    missing:
      - "Try POST /api/v1/workflows/{id}/activate first in activateWorkflow; fall back to PATCH /api/v1/workflows/{id} with {active: true} only on 404/405"
human_verification:
  - test: "Run pnpm run test:e2e with Docker available and verify all 5 public API tests pass (NBP, NFZ, KRS, Biala Lista VAT, VIES)"
    expected: "5 tests PASS — real API calls return expected data; CEIDG suite is skipped (no key)"
    why_human: "Requires running Docker, live internet access to real Polish government APIs, and observing actual test output"
  - test: "Run pnpm run test:e2e with CEIDG_API_KEY set to a valid key"
    expected: "CEIDG E2E suite runs (not skipped) and returns company data for NIP 6351723862"
    why_human: "Requires valid CEIDG API key from dane.biznes.gov.pl and live network"
---

# Phase 19: E2E Tests — Public APIs Verification Report

**Phase Goal:** E2E tests for public API nodes (NBP, NFZ, KRS, Biala Lista VAT, VIES, CEIDG) — webhook-triggered workflows calling real APIs through n8n Docker container
**Verified:** 2026-03-25T08:10:00Z
**Status:** gaps_found (1 gap: activateWorkflow missing POST/activate with fallback)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | jest.config.e2e.js exists and targets `__tests__/e2e/` with 30s timeout | ✓ VERIFIED | File exists, line 12: `testTimeout: 30000`, line 6: `testMatch: ['<rootDir>/__tests__/e2e/**/*.test.ts']` |
| 2 | helpers.ts provides createWorkflow, activateWorkflow, deactivateWorkflow, deleteWorkflow, callWebhook, createCredential, setupN8nAuth | ✓ VERIFIED | All 7 functions exported, properly implemented (lines 13-292) |
| 3 | activateWorkflow uses POST /activate with PATCH fallback to handle both n8n API variants | ✗ FAILED | helpers.ts lines 119-135: only PATCH, no POST /activate attempt, no fallback logic |
| 4 | 6 webhook workflow fixtures exist with deterministic paths and responseMode lastNode | ✓ VERIFIED | All 6 files exist; each has exactly 2 nodes, responseMode=lastNode, typeVersion=2 |
| 5 | scripts/e2e-test.sh builds all packages, starts Docker, runs E2E tests, tears down | ✓ VERIFIED | Script contains pnpm build:all, docker compose up -d --wait, npx jest, cleanup trap |
| 6 | pnpm run test:e2e script exists in root package.json | ✓ VERIFIED | package.json line 22: `"test:e2e": "bash scripts/e2e-test.sh"` |
| 7 | NBP E2E test calls real API and verifies EUR rate has numeric mid value | ✓ VERIFIED | e2e.test.ts lines 52-70: callWebhook('e2e-nbp'), asserts rates[0].mid is number > 0 |
| 8 | NFZ E2E test calls real API and verifies queue search returns results | ✓ VERIFIED | e2e.test.ts lines 92-117: callWebhook('e2e-nfz'), flexible assertions on data array |
| 9 | KRS E2E test calls real API and verifies PKN Orlen data for KRS 0000019193 | ✓ VERIFIED | e2e.test.ts lines 139-155: asserts numerKRS='0000019193', rodzaj='Aktualny' |
| 10 | Biala Lista VAT E2E test calls real API and verifies ZUS data for NIP 5213017228 | ✓ VERIFIED | e2e.test.ts lines 180-197: date patched via todayDateString(), asserts statusVat='Czynny' |
| 11 | VIES E2E test calls real API and verifies PL5213017228 is valid | ✓ VERIFIED | e2e.test.ts lines 219-244: asserts isValid=true, handles MS_UNAVAILABLE gracefully |
| 12 | CEIDG E2E test skips when CEIDG_API_KEY not set, runs with API key | ✓ VERIFIED | e2e.test.ts lines 249-252: `const ceidgDescribe = CEIDG_API_KEY ? describe : describe.skip` |
| 13 | All tests gracefully skip on network errors instead of hard-failing | ✓ VERIFIED | isNetworkError used in 7 catch blocks across all 6 test suites |

**Score:** 12/13 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `jest.config.e2e.js` | E2E Jest configuration with 30s timeout | ✓ VERIFIED | 13 lines, testTimeout=30000, correct testMatch |
| `__tests__/e2e/helpers.ts` | Shared E2E helper functions | ✓ VERIFIED | 293 lines, all 8 required exports present |
| `__tests__/e2e/fixtures/e2e-nbp.json` | NBP webhook workflow fixture | ✓ VERIFIED | 2 nodes, responseMode=lastNode, EUR/table-A params |
| `__tests__/e2e/fixtures/e2e-nfz.json` | NFZ webhook workflow fixture | ✓ VERIFIED | 2 nodes, responseMode=lastNode, ortop/case-1 params |
| `__tests__/e2e/fixtures/e2e-krs.json` | KRS webhook workflow fixture | ✓ VERIFIED | 2 nodes, responseMode=lastNode, krsNumber=0000019193 |
| `__tests__/e2e/fixtures/e2e-biala-lista-vat.json` | Biala Lista VAT webhook workflow fixture | ✓ VERIFIED | 2 nodes, responseMode=lastNode, nip=5213017228 |
| `__tests__/e2e/fixtures/e2e-vies.json` | VIES webhook workflow fixture | ✓ VERIFIED | 2 nodes, responseMode=lastNode, PL/5213017228 |
| `__tests__/e2e/fixtures/e2e-ceidg.json` | CEIDG webhook workflow fixture | ✓ VERIFIED | 2 nodes, responseMode=lastNode, credential PLACEHOLDER |
| `scripts/e2e-test.sh` | E2E test orchestration script | ✓ VERIFIED | Executable, docker compose + jest + cleanup trap |
| `__tests__/e2e/e2e.test.ts` | All 6 E2E test suites | ✓ VERIFIED | 301 lines, 6 describe blocks, all imports from ./helpers |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `scripts/e2e-test.sh` | `jest.config.e2e.js` | `npx jest --config jest.config.e2e.js` | ✓ WIRED | Line 20 of e2e-test.sh |
| `__tests__/e2e/helpers.ts` | `http://localhost:5679` | N8N_BASE_URL constant | ✓ WIRED | Line 4: `export const N8N_BASE_URL = 'http://localhost:5679'` |
| `__tests__/e2e/e2e.test.ts` | `__tests__/e2e/helpers.ts` | `import { ... } from './helpers'` | ✓ WIRED | Lines 1-14, all required functions imported |
| `__tests__/e2e/e2e.test.ts` | `__tests__/e2e/fixtures/` | `loadFixture('e2e-*.json')` | ✓ WIRED | 6 loadFixture calls for each fixture |
| `__tests__/e2e/e2e.test.ts` | `http://localhost:5679/webhook/` | `callWebhook(path)` | ✓ WIRED | 6 callWebhook calls, one per describe block |
| `helpers.ts` | n8n REST API | POST /api/v1/workflows, PATCH, DELETE | ✓ WIRED | createWorkflow, activateWorkflow, deactivateWorkflow, deleteWorkflow all use X-N8N-API-KEY |

### Data-Flow Trace (Level 4)

Not applicable — this phase produces test infrastructure code, not rendering components. The data flows at runtime when tests execute against the live container.

### Behavioral Spot-Checks

Step 7b: SKIPPED — tests require running Docker container and live internet access. Cannot verify without external services.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| E2E-01 | 19-01-PLAN.md | E2E test infrastructure — jest config, test:e2e script, env var loading | ✓ SATISFIED | jest.config.e2e.js, package.json test:e2e, CEIDG_API_KEY in e2e-test.sh |
| E2E-02 | 19-02-PLAN.md | NBP E2E — EUR exchange rate returns numeric mid value | ✓ SATISFIED | e2e.test.ts NBP describe block, rates[0].mid assertions |
| E2E-03 | 19-02-PLAN.md | NFZ E2E — queue search returns non-empty results | ✓ SATISFIED | e2e.test.ts NFZ describe block, data array assertions |
| E2E-04 | 19-02-PLAN.md | KRS E2E — known KRS number returns company data | ✓ SATISFIED | e2e.test.ts KRS describe block, numerKRS assertion |
| E2E-05 | 19-02-PLAN.md | Biala Lista VAT E2E — known NIP returns subject data | ✓ SATISFIED | e2e.test.ts BL describe block, nip+statusVat assertions |
| E2E-06 | 19-02-PLAN.md | VIES E2E — known valid EU VAT returns valid=true | ✓ SATISFIED | e2e.test.ts VIES describe block, isValid=true assertion |
| E2E-07 | 19-02-PLAN.md | CEIDG E2E — skip if no API key, run with key | ✓ SATISFIED | describe.skip conditional, createCredential + patching pattern |

All 7 required E2E requirements (E2E-01 through E2E-07) are satisfied by existing code. No orphaned requirements found — REQUIREMENTS.md maps E2E-01..07 to Phase 19, and all 7 are claimed across Plan 01 and Plan 02.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `__tests__/e2e/fixtures/e2e-ceidg.json` | 31 | `"id": "PLACEHOLDER"` | ℹ️ Info | Intentional — replaced at runtime by createCredential() in beforeAll. Not a stub. |

No blocking anti-patterns found. The PLACEHOLDER in the CEIDG fixture is by design — the test code explicitly patches it before creating the workflow.

### Human Verification Required

#### 1. Full E2E Run Against Live Public APIs

**Test:** Run `pnpm run test:e2e` (with Docker daemon running)
**Expected:** NBP, NFZ, KRS, Biala Lista VAT, VIES tests all PASS; CEIDG is SKIPPED (no key); no hard failures
**Why human:** Requires Docker, live internet access to real Polish government APIs, actual test runner output

#### 2. CEIDG Full-Run With API Key

**Test:** Set `CEIDG_API_KEY=<valid-key> pnpm run test:e2e`
**Expected:** CEIDG E2E suite is NOT skipped, test passes and returns data for NIP 6351723862
**Why human:** Requires valid free API key from dane.biznes.gov.pl and live network

### Gaps Summary

**1 gap found:** The `activateWorkflow` function in `__tests__/e2e/helpers.ts` was specified in Plan 01 (truth #3, acceptance criteria) to use `POST /api/v1/workflows/{id}/activate` first, falling back to `PATCH /api/v1/workflows/{id}` with `{active: true}` on 404/405. The implementation skips the POST attempt entirely and only sends PATCH.

**Impact assessment:** The PATCH-only approach works functionally on current n8n versions. However, the POST /activate strategy was explicitly called out in the plan to handle API version differences across n8n releases — the fallback logic was designed to make tests resilient to future n8n upgrades. Without it, if a newer n8n version removes PATCH-to-activate support, tests will break without a fallback.

**Root cause:** Plan deviation — the implementation chose the simpler PATCH-only path rather than the prescribed POST-with-PATCH-fallback strategy.

**To fix:** Update `activateWorkflow` in `__tests__/e2e/helpers.ts` to try `POST /api/v1/workflows/${id}/activate` first, and only fall back to `PATCH /api/v1/workflows/${id}` with `{active: true}` if the POST returns 404 or 405. Mirror the same pattern in `deactivateWorkflow` (try `POST /deactivate`, fall back to `PATCH {active: false}`).

---

_Verified: 2026-03-25T08:10:00Z_
_Verifier: Claude (gsd-verifier)_
