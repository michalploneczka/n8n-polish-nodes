---
phase: 19-e2e-testy-publiczne-api
plan: 01
subsystem: e2e-test-infrastructure
tags: [e2e, testing, jest, docker, webhook, fixtures]
dependency_graph:
  requires: [jest.config.integration.js, __tests__/integration/helpers.ts, scripts/integration-test.sh, docker-compose.test.yml]
  provides: [jest.config.e2e.js, __tests__/e2e/helpers.ts, scripts/e2e-test.sh, 6 webhook workflow fixtures]
  affects: [package.json]
tech_stack:
  added: []
  patterns: [webhook-triggered workflow fixtures, responseMode lastNode for HTTP response passthrough]
key_files:
  created:
    - jest.config.e2e.js
    - __tests__/e2e/helpers.ts
    - scripts/e2e-test.sh
    - __tests__/e2e/fixtures/e2e-nbp.json
    - __tests__/e2e/fixtures/e2e-nfz.json
    - __tests__/e2e/fixtures/e2e-krs.json
    - __tests__/e2e/fixtures/e2e-biala-lista-vat.json
    - __tests__/e2e/fixtures/e2e-vies.json
    - __tests__/e2e/fixtures/e2e-ceidg.json
  modified:
    - package.json
decisions:
  - "30s test timeout for E2E (vs 120s for integration) -- public API calls should complete within 30s"
  - "Webhook responseMode lastNode pattern -- allows HTTP caller to receive custom node output directly"
  - "CEIDG fixture uses credential PLACEHOLDER id -- replaced at runtime after API key creation"
  - "Biala Lista VAT date uses n8n expression $now.format for dynamic today's date"
metrics:
  duration: 3min
  completed: "2026-03-25T06:44:40Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 9
  files_modified: 1
---

# Phase 19 Plan 01: E2E Test Infrastructure Summary

E2E test foundation with Jest config (30s timeout), workflow lifecycle helpers (create/activate/callWebhook/cleanup), 6 webhook-triggered fixtures for public API nodes, and orchestration script with Docker lifecycle management.

## What Was Done

### Task 1: Jest config, helpers, and orchestration script

Created three core infrastructure files:

- **jest.config.e2e.js** -- Modeled on integration config but with 30s timeout (vs 120s) and targeting `__tests__/e2e/**/*.test.ts`
- **__tests__/e2e/helpers.ts** -- Full workflow lifecycle: setupN8nAuth (owner setup + login fallback), createWorkflow, activateWorkflow, deactivateWorkflow, deleteWorkflow, callWebhook, createCredential, isNetworkError, todayDateString, waitForN8n, loadFixture
- **scripts/e2e-test.sh** -- Build all packages, start Docker via docker-compose.test.yml, run Jest with E2E config, cleanup on exit via trap
- Added `test:e2e` script to root package.json

### Task 2: Webhook workflow fixtures

Created 6 fixture JSON files, each with Webhook (typeVersion 2, responseMode lastNode) connected to a custom node:

| Fixture | Node | Key Parameters |
|---------|------|----------------|
| e2e-nbp.json | NBP | exchangeRate/getCurrentRate, table A, EUR |
| e2e-nfz.json | NFZ | queue/search, case 1, benefit "ortop", limit 5 |
| e2e-krs.json | KRS | company/getCurrentExtract, KRS 0000019193 |
| e2e-biala-lista-vat.json | Biala Lista VAT | subject/searchByNip, NIP 5213017228, dynamic date |
| e2e-vies.json | VIES | vatNumber/validate, PL, 5213017228 |
| e2e-ceidg.json | CEIDG | company/searchByNip, NIP 6351723862, credential placeholder |

## Deviations from Plan

None -- plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | e327361 | E2E test infrastructure: jest config, helpers, orchestration script |
| 2 | b89ed80 | 6 webhook workflow fixtures for E2E tests |

## Self-Check: PASSED
