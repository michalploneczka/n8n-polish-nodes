---
phase: 21-e2e-testy-fakturownia-inpost
plan: 01
subsystem: e2e-testing
tags: [e2e, fixtures, fakturownia, inpost, workflow]
dependency_graph:
  requires: [19-01, 20-01]
  provides: [e2e-fakturownia-fixtures, e2e-inpost-fixtures, e2e-env-passthrough]
  affects: [scripts/e2e-test.sh, __tests__/e2e/fixtures/]
tech_stack:
  added: []
  patterns: [webhook-node-fixture, fixedCollection-params, json-string-field]
key_files:
  created:
    - __tests__/e2e/fixtures/e2e-fakturownia-list.json
    - __tests__/e2e/fixtures/e2e-fakturownia-create.json
    - __tests__/e2e/fixtures/e2e-inpost-list.json
    - __tests__/e2e/fixtures/e2e-inpost-create.json
  modified:
    - scripts/e2e-test.sh
decisions:
  - "Positions field as JSON string in fakturownia-create fixture (node calls JSON.parse)"
  - "InPost locker service for create fixture (simpler than courier -- no address required)"
  - "KRA010 as test Paczkomat code (well-known Krakow location)"
metrics:
  duration: 1min
  completed: "2026-03-25"
  tasks: 2
  files: 5
---

# Phase 21 Plan 01: E2E Fixtures for Fakturownia and InPost Summary

4 workflow fixture JSON files for Fakturownia (list/create invoices) and InPost (list/create shipments) plus env var passthrough in e2e-test.sh for FAKTUROWNIA_API_TOKEN, FAKTUROWNIA_SUBDOMAIN, INPOST_TOKEN, INPOST_ORG_ID.

## What Was Done

### Task 1: Create 4 E2E Workflow Fixtures
Created 4 fixture files following the established Webhook -> Node pattern from Phase 19/20:

- **e2e-fakturownia-list.json** -- Webhook triggers Fakturownia invoice list with empty filters
- **e2e-fakturownia-create.json** -- Webhook triggers Fakturownia invoice create with VAT kind, buyer data, and positions as JSON string
- **e2e-inpost-list.json** -- Webhook triggers InPost shipment getAll with limit=5
- **e2e-inpost-create.json** -- Webhook triggers InPost shipment create using locker service with fixedCollection receiver/parcels structure

All fixtures use PLACEHOLDER credential IDs (patched at runtime by test code).

**Commit:** 066a654

### Task 2: Update e2e-test.sh Env Var Passthrough
Added 4 new environment variables to the jest invocation in e2e-test.sh:
- FAKTUROWNIA_API_TOKEN (defaults to empty)
- FAKTUROWNIA_SUBDOMAIN (defaults to empty)
- INPOST_TOKEN (defaults to empty)
- INPOST_ORG_ID (defaults to empty)

Total env vars in script: 10 (6 existing + 4 new). All default to empty string so tests skip gracefully when credentials are absent.

**Commit:** 6948153

## Decisions Made

1. **Positions as JSON string:** Fakturownia create fixture stores positions as an escaped JSON string because the node calls JSON.parse() on it at runtime.
2. **Locker service for InPost create:** Used inpost_locker_standard (not courier) because it only requires a target point code, not a full delivery address.
3. **KRA010 as test Paczkomat:** Well-known Krakow Paczkomat code used for sandbox testing.

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None -- all fixtures contain complete parameter data ready for E2E execution.

## Verification

- All 4 fixture files parse as valid JSON with exactly 2 nodes each
- All fixtures contain correct node types (n8n-nodes-fakturownia.fakturownia, n8n-nodes-inpost.inpost)
- All credential IDs set to PLACEHOLDER
- e2e-test.sh has valid shell syntax (bash -n passes)
- 10 env vars present in e2e-test.sh (6 existing + 4 new)
