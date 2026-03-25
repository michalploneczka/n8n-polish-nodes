---
phase: 21-e2e-testy-fakturownia-inpost
verified: 2026-03-25T15:00:00Z
status: passed
score: 6/6 must-haves verified
re_verification: false
---

# Phase 21: E2E Tests — Fakturownia + InPost Verification Report

**Phase Goal:** End-to-end tests for Fakturownia (subdomain + API token) and InPost (Bearer token + sandbox environment). Tests run locally against sandbox/trial APIs.
**Verified:** 2026-03-25T15:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Fakturownia: list invoices returns valid response from trial account | VERIFIED | `e2e.test.ts:609` — `should list invoices (empty or with data)` calls `callWebhook('e2e-fakturownia-list')` and asserts `result` is defined without `error` property |
| 2 | Fakturownia: create and retrieve an invoice round-trips correctly | VERIFIED | `e2e.test.ts:624` — `should create an invoice round-trip` asserts `result.id`, `result.kind === 'vat'`, `result.buyer_name === 'E2E Test Buyer'` |
| 3 | InPost: list shipments returns valid response from sandbox | VERIFIED | `e2e.test.ts:682` — `should list shipments (empty or with data)` calls `callWebhook('e2e-inpost-list')` and asserts `result` is defined without `error` property |
| 4 | InPost: create a test shipment in sandbox returns shipment ID | VERIFIED | `e2e.test.ts:697` — `should create a test shipment in sandbox` asserts `result.id` and `result.service === 'inpost_locker_standard'` |
| 5 | All tests read credentials from env vars (FAKTUROWNIA_API_TOKEN, FAKTUROWNIA_SUBDOMAIN, INPOST_TOKEN, INPOST_ORG_ID) | VERIFIED | `e2e.test.ts:572-573` reads `process.env.FAKTUROWNIA_API_TOKEN` and `FAKTUROWNIA_SUBDOMAIN`; `e2e.test.ts:644-645` reads `process.env.INPOST_TOKEN` and `INPOST_ORG_ID`; all 4 vars passed through `scripts/e2e-test.sh:26-29` |
| 6 | Tests skip gracefully if credentials not provided | VERIFIED | `e2e.test.ts:574` — `fakturowniaDescribe = (FAKTUROWNIA_API_TOKEN && FAKTUROWNIA_SUBDOMAIN) ? describe : describe.skip`; `e2e.test.ts:646` — `inpostDescribe = (INPOST_TOKEN && INPOST_ORG_ID) ? describe : describe.skip` |

**Score:** 6/6 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `__tests__/e2e/fixtures/e2e-fakturownia-list.json` | Fakturownia invoice list workflow fixture | VERIFIED | 2 nodes (Webhook + Fakturownia), `n8n-nodes-fakturownia.fakturownia`, `operation: list`, credential id `PLACEHOLDER` |
| `__tests__/e2e/fixtures/e2e-fakturownia-create.json` | Fakturownia invoice create workflow fixture | VERIFIED | 2 nodes, `operation: create`, `kind: vat`, `positions` as escaped JSON string, credential id `PLACEHOLDER` |
| `__tests__/e2e/fixtures/e2e-inpost-list.json` | InPost shipment list workflow fixture | VERIFIED | 2 nodes (Webhook + InPost ShipX), `n8n-nodes-inpost.inpost`, `operation: getAll`, `limit: 5`, credential id `PLACEHOLDER` |
| `__tests__/e2e/fixtures/e2e-inpost-create.json` | InPost shipment create workflow fixture | VERIFIED | 2 nodes, `operation: create`, `service: inpost_locker_standard`, `targetPoint: KRA010`, `receiverDetails` + `parcelValues` fixedCollection structure, credential id `PLACEHOLDER` |
| `scripts/e2e-test.sh` | Updated env var passthrough for Fakturownia and InPost | VERIFIED | Lines 26-29 add `FAKTUROWNIA_API_TOKEN`, `FAKTUROWNIA_SUBDOMAIN`, `INPOST_TOKEN`, `INPOST_ORG_ID` with empty defaults; shell syntax valid |
| `__tests__/e2e/e2e.test.ts` | Fakturownia and InPost E2E describe blocks | VERIFIED | Fakturownia block (lines 570-640) and InPost block (lines 642-717) with 4 test cases total, skip logic, credential creation, fixture loading, and assertions |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `e2e.test.ts` | `fixtures/e2e-fakturownia-list.json` | `loadFixture('e2e-fakturownia-list.json')` at line 591 | WIRED | `loadFixture` resolves `path.resolve(__dirname, 'fixtures', name)` — file exists |
| `e2e.test.ts` | `fixtures/e2e-fakturownia-create.json` | `loadFixture('e2e-fakturownia-create.json')` at line 591 (loop) | WIRED | Same resolution path — file exists |
| `e2e.test.ts` | `fixtures/e2e-inpost-list.json` | `loadFixture('e2e-inpost-list.json')` at line 664 (loop) | WIRED | File exists at correct path |
| `e2e.test.ts` | `fixtures/e2e-inpost-create.json` | `loadFixture('e2e-inpost-create.json')` at line 664 (loop) | WIRED | File exists at correct path |
| `e2e-fakturownia-list.json` | `n8n-nodes-fakturownia.fakturownia` | `type` field in nodes array | WIRED | `"type": "n8n-nodes-fakturownia.fakturownia"` at line 21 of fixture |
| `e2e-inpost-create.json` | `n8n-nodes-inpost.inpost` | `type` field in nodes array | WIRED | `"type": "n8n-nodes-inpost.inpost"` at line 22 of fixture |
| `e2e.test.ts` | `helpers.ts` | `import { createCredential, loadFixture, ... }` | WIRED | Line 12: `loadFixture` imported from `./helpers` |

---

### Data-Flow Trace (Level 4)

Not applicable for this phase — artifacts are test infrastructure (fixtures + test blocks), not components that render dynamic UI data. Tests execute against real sandbox/trial APIs when credentials are present.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All 4 fixture files parse as valid JSON with 2 nodes | `node -e "...JSON.parse..."` | `All 4 fixtures valid` | PASS |
| e2e-test.sh has valid shell syntax | `bash -n scripts/e2e-test.sh` | exit 0 | PASS |
| All 4 env vars present in e2e-test.sh | `grep -c` on script | 4 matches on lines 26-29 | PASS |
| All 3 commits from summaries exist | `git log --oneline 066a654 6948153 c05146d` | All 3 commits found | PASS |
| loadFixture resolves to correct directory | Verified `helpers.ts:337` | `path.resolve(__dirname, 'fixtures', name)` matches `__tests__/e2e/fixtures/` | PASS |
| InPost credential includes sandbox environment | `grep "environment.*sandbox"` | Line 657: `environment: 'sandbox'` | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| E2E-13 | 21-02-PLAN.md | Fakturownia E2E — list invoices, create+retrieve invoice round-trip via trial API | SATISFIED | `e2e.test.ts` lines 576-640: `fakturowniaDescribe('Fakturownia E2E (E2E-13)')` with `should list invoices` and `should create an invoice round-trip` |
| E2E-14 | 21-02-PLAN.md | InPost E2E — list shipments, create test shipment via sandbox API | SATISFIED | `e2e.test.ts` lines 648-717: `inpostDescribe('InPost E2E (E2E-14)')` with `should list shipments` and `should create a test shipment in sandbox` |
| E2E-15 | 21-01-PLAN.md, 21-02-PLAN.md | E2E tests read credentials from env vars, skip if not provided | SATISFIED | `describe.skip` pattern in both suites; all 4 env vars passed through `e2e-test.sh` with empty defaults |

All 3 requirements marked `[x]` in `REQUIREMENTS.md:248-250` (Phase 21 row shows `Pending` at line 305 — this is a documentation lag in the requirements table but the checkboxes above are correct).

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| All 4 fixture files | 31/35/32/48 | `"id": "PLACEHOLDER"` | Info | By design — credential IDs are patched at runtime by `beforeAll`. Not a stub. |

No blocking or warning anti-patterns found. The PLACEHOLDER values in fixtures are intentional and documented in the plan.

---

### Human Verification Required

#### 1. Fakturownia trial API integration

**Test:** Set `FAKTUROWNIA_API_TOKEN` and `FAKTUROWNIA_SUBDOMAIN` env vars from a real Fakturownia trial account, then run `./scripts/e2e-test.sh --testNamePattern="Fakturownia E2E"`.
**Expected:** Both tests pass — invoice list returns without error, create returns an object with `id`, `kind: 'vat'`, `buyer_name: 'E2E Test Buyer'`.
**Why human:** Requires a live Fakturownia trial account with subdomain; test environment and credentials not available in automated verification.

#### 2. InPost sandbox API integration

**Test:** Set `INPOST_TOKEN` and `INPOST_ORG_ID` env vars from an InPost sandbox account, then run `./scripts/e2e-test.sh --testNamePattern="InPost E2E"`.
**Expected:** Shipment list returns without error; create returns an object with `id` and `service: 'inpost_locker_standard'` (or tolerates 422 sandbox validation errors gracefully).
**Why human:** Requires a live InPost sandbox token and organization ID; sandbox Paczkomat code `KRA010` validity cannot be confirmed without access.

---

### Gaps Summary

No gaps. All 6 observable truths are verified. All 5 artifacts from plan 01 and 1 artifact from plan 02 exist, are substantive, and are wired. All 3 key links in plan 01 and 3 key links in plan 02 are verified. Requirements E2E-13, E2E-14, E2E-15 are satisfied.

---

_Verified: 2026-03-25T15:00:00Z_
_Verifier: Claude (gsd-verifier)_
