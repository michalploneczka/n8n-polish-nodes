---
phase: 19-e2e-testy-publiczne-api
plan: 02
subsystem: e2e-tests
tags: [e2e, testing, jest, webhook, public-api, nbp, nfz, krs, vies, ceidg, biala-lista-vat]
dependency_graph:
  requires: [__tests__/e2e/helpers.ts, __tests__/e2e/fixtures/e2e-*.json, jest.config.e2e.js]
  provides: [__tests__/e2e/e2e.test.ts]
  affects: []
tech_stack:
  added: []
  patterns: [unwrapResult helper for n8n response unwrapping, describe.skip conditional for credential-gated tests, isNetworkError graceful skip pattern]
key_files:
  created:
    - __tests__/e2e/e2e.test.ts
  modified: []
decisions:
  - "unwrapResult helper handles both array-of-items and direct API response from n8n webhook"
  - "CEIDG uses describe.skip pattern gated on CEIDG_API_KEY environment variable"
  - "Biala Lista VAT date patched via todayDateString() to avoid expression evaluation dependency"
  - "VIES test handles MS_UNAVAILABLE gracefully without failing"
  - "NFZ test uses 30s timeout for slow API responses"
metrics:
  duration: 4min
  completed: "2026-03-25T06:51:00Z"
  tasks_completed: 1
  tasks_total: 1
  files_created: 1
  files_modified: 0
---

# Phase 19 Plan 02: E2E Test Suites for Public API Nodes Summary

6 E2E test suites (NBP, NFZ, KRS, Biala Lista VAT, VIES, CEIDG) testing real public APIs through n8n webhook-triggered workflows with graceful network error handling and conditional CEIDG skip.

## What Was Done

### Task 1: E2E test file with 6 public API test suites

Created `__tests__/e2e/e2e.test.ts` with complete E2E test coverage:

| Test Suite | API Tested | Key Assertions |
|-----------|-----------|----------------|
| NBP E2E (E2E-02) | api.nbp.pl | EUR rate table A, rates[0].mid is number > 0 |
| NFZ E2E (E2E-03) | api.nfz.gov.pl | Queue search returns data array with results |
| KRS E2E (E2E-04) | api-krs.ms.gov.pl | PKN Orlen numerKRS = 0000019193, rodzaj = Aktualny |
| Biala Lista VAT E2E (E2E-05) | wl-api.mf.gov.pl | ZUS NIP 5213017228, statusVat = Czynny |
| VIES E2E (E2E-06) | ec.europa.eu/taxation_customs | PL5213017228 isValid = true, name non-empty |
| CEIDG E2E (E2E-07) | dane.biznes.gov.pl | Company data returned (conditional on API key) |

Each test follows the lifecycle pattern: load fixture -> create workflow -> activate -> callWebhook -> assert -> cleanup.

Cross-cutting patterns:
- `unwrapResult()` helper handles n8n response wrapping (array-of-items vs direct)
- `isNetworkError()` catch blocks in all 6 tests for graceful skip on network failures
- `todayDateString()` patches Biala Lista VAT date field
- VIES handles `MS_UNAVAILABLE` member state service errors
- CEIDG conditionally skips via `describe.skip` when `CEIDG_API_KEY` env var is absent

## Deviations from Plan

None -- plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 08e88eb | E2E test suites for 6 public API nodes |

## Self-Check: PASSED
