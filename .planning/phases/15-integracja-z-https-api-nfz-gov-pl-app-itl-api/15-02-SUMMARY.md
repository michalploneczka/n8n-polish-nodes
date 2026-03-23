---
phase: 15-integracja-z-https-api-nfz-gov-pl-app-itl-api
plan: 02
subsystem: n8n-nodes-nfz
tags: [tests, codex, readme, documentation, nock]
dependency_graph:
  requires: [15-01]
  provides: [complete-nfz-package]
  affects: [packages/n8n-nodes-nfz]
tech_stack:
  added: []
  patterns: [nock-http-contract-tests, codex-metadata, declarative-node-testing]
key_files:
  created:
    - packages/n8n-nodes-nfz/__tests__/Nfz.node.test.ts
    - packages/n8n-nodes-nfz/nodes/Nfz/Nfz.node.json
    - packages/n8n-nodes-nfz/README.md
  modified:
    - packages/n8n-nodes-nfz/nodes/Nfz/Nfz.node.ts
decisions:
  - "Miscellaneous > Other category for codex (n8n has no Healthcare category)"
  - "Province alphabetical reorder for lint compliance (Lodzkie before Lubelskie)"
metrics:
  duration: 3min
  completed: "2026-03-23T13:02:21Z"
---

# Phase 15 Plan 02: NFZ Tests, Codex, and README Summary

Comprehensive nock-based test suite (19 tests), codex metadata for n8n discoverability, and README with operations table and example workflow JSON for the NFZ node.

## What Was Done

### Task 1: Nock-based tests for node description and HTTP contracts (b9e0c8a)

Created test file with 19 test cases:
- 13 description validation tests covering displayName, name, baseURL, api-version, format, credentials, 4 resources, queue/benefit/locality/province operations, 17 province options, and case type values
- 6 HTTP contract tests using nock: queues search, queues get by ID, benefits search, localities search, provinces getAll, and 404 error handling
- Verifies NFZ-08 requirement: declarative nodes get automatic NodeApiError wrapping from n8n framework

### Task 2: Codex, README with example workflow, build + lint verification (5fa4f6f)

- Created Nfz.node.json codex with Miscellaneous > Other category and NFZ API documentation URL
- Created README.md with operations tables for all 4 resources, no-credentials note, usage notes (case type, provinces, rate limits), example workflow JSON, and installation instructions
- Fixed province option alphabetical ordering in Nfz.node.ts for lint compliance
- Build compiles cleanly, lint passes with zero errors, dist/ output verified

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Province alphabetical ordering for lint**
- **Found during:** Task 2 (lint verification)
- **Issue:** n8n eslint rule requires options alphabetized by name; Lubelskie/Lubuskie were before Lodzkie
- **Fix:** Reordered province options: Lodzkie (05) moved before Lubelskie (03) and Lubuskie (04)
- **Files modified:** packages/n8n-nodes-nfz/nodes/Nfz/Nfz.node.ts
- **Commit:** 5fa4f6f

**2. [Rule 1 - Bug] Limit field lint autofixes applied**
- **Found during:** Task 2 (lint verification)
- **Issue:** Multiple limit fields missing typeOptions, wrong default (25 instead of 50), wrong description text
- **Fix:** Applied via npm run lint:fix -- all autofixable changes
- **Files modified:** packages/n8n-nodes-nfz/nodes/Nfz/Nfz.node.ts
- **Commit:** 5fa4f6f

## Verification Results

- `npm test`: 19/19 tests passing
- `npm run build`: compiles without errors
- `npm run lint`: zero errors
- `dist/nodes/Nfz/Nfz.node.js`: exists
- `dist/nodes/Nfz/Nfz.node.json`: exists (codex copied to dist)

## Known Stubs

None -- all functionality is wired and operational.

## Self-Check: PASSED
