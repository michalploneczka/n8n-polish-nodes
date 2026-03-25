---
phase: 11-node-dla-krs-bia-a-lista-podatnik-w-vat-vies-i-gus
plan: 01
subsystem: krs-node
tags: [krs, declarative-node, public-api, government, registry]
dependency_graph:
  requires: []
  provides: [krs-node, krs-package]
  affects: [monorepo-packages]
tech_stack:
  added: []
  patterns: [declarative-no-credentials, format-json-qs]
key_files:
  created:
    - packages/n8n-nodes-krs/package.json
    - packages/n8n-nodes-krs/tsconfig.json
    - packages/n8n-nodes-krs/eslint.config.mjs
    - packages/n8n-nodes-krs/jest.config.js
    - packages/n8n-nodes-krs/nodes/Krs/Krs.node.ts
    - packages/n8n-nodes-krs/nodes/Krs/Krs.node.json
    - packages/n8n-nodes-krs/icons/krs.svg
    - packages/n8n-nodes-krs/__tests__/Krs.node.test.ts
    - packages/n8n-nodes-krs/README.md
  modified: []
decisions:
  - No credentials property for public API (KRS follows NBP pattern)
metrics:
  duration: 3min
  completed: "2026-03-23T07:47:08Z"
requirements_completed: [KRS-01, KRS-02, KRS-03, KRS-04]
---

# Phase 11 Plan 01: KRS Node Summary

Declarative KRS node for Polish National Court Register lookup with 2 operations (getCurrentExtract via OdpisAktualny, getFullExtract via OdpisPelny), no credentials, format=json enforced via requestDefaults.qs -- 14 tests passing.

## What Was Done

### Task 1: Create KRS package scaffold and declarative node
- **Commit:** 1cd20df
- Created complete package scaffold following NBP no-credentials pattern
- Declarative node with requestDefaults baseURL `https://api-krs.ms.gov.pl/api/krs`
- 2 operations: getCurrentExtract (OdpisAktualny), getFullExtract (OdpisPelny)
- Optional register type filter (P=entrepreneurs, S=associations)
- format=json in requestDefaults.qs
- SVG icon with scales-of-justice motif in navy blue
- Build and lint pass cleanly

### Task 2: Create KRS tests and README
- **Commit:** c6df3df
- 14 tests: 8 description validation, 2 routing checks, 4 nock HTTP integration
- Tests verify no credentials, correct baseURL, format=json qs, OdpisAktualny/OdpisPelny routing
- HTTP integration tests cover 200 responses for both operations, 404 for invalid KRS, rejestr=P query param
- README with operations table, installation instructions, KRS number format notes, example workflow

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| No credentials property for public API | KRS API is free government API, follows NBP pattern with empty credentials array |

## Verification Results

- `npm run build` -- PASSED
- `npm run lint` -- PASSED
- `npm test` -- PASSED (14/14 tests)
- Node has no credentials requirement -- VERIFIED
- Node has 2 operations (getCurrentExtract, getFullExtract) -- VERIFIED
- requestDefaults includes format=json in qs -- VERIFIED

## Known Stubs

None.

## Self-Check: PASSED

- All 9 created files exist on disk
- Both commits verified: 1cd20df, c6df3df
