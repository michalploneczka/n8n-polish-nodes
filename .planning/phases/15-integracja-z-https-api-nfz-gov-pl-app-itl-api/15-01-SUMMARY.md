---
phase: 15-integracja-z-https-api-nfz-gov-pl-app-itl-api
plan: 01
subsystem: n8n-nodes-nfz
tags: [nfz, healthcare, waiting-times, declarative, public-api]
dependency_graph:
  requires: []
  provides: [nfz-node-scaffold, nfz-declarative-node]
  affects: [packages/n8n-nodes-nfz]
tech_stack:
  added: []
  patterns: [declarative-public-api-node, nbp-pattern]
key_files:
  created:
    - packages/n8n-nodes-nfz/package.json
    - packages/n8n-nodes-nfz/tsconfig.json
    - packages/n8n-nodes-nfz/jest.config.js
    - packages/n8n-nodes-nfz/eslint.config.mjs
    - packages/n8n-nodes-nfz/icons/nfz.svg
    - packages/n8n-nodes-nfz/nodes/Nfz/Nfz.node.ts
  modified: []
decisions:
  - No credentials property for public API nodes (NFZ follows NBP pattern)
metrics:
  duration: 3min
  completed: 2026-03-23T12:57:19Z
requirements_completed: [NFZ-01, NFZ-02, NFZ-03, NFZ-04, NFZ-05, NFZ-06, NFZ-07, NFZ-08]
---

# Phase 15 Plan 01: NFZ Node Scaffold and Declarative Node Summary

Declarative NFZ treatment waiting times node with 4 resources (Queue, Benefit, Locality, Province), 6 operations, 16-province dropdown, and api-version=1.3 in requestDefaults -- no credentials required (public API).

## What Was Done

### Task 1: Package scaffold (package.json, tsconfig, jest, eslint)
- **Commit:** ca16d19
- Created package.json with `n8n-community-node-package` keyword, empty credentials array
- Created tsconfig.json extending base config
- Created jest.config.js with test-utils module mapper
- Created eslint.config.mjs with configWithoutCloudSupport
- Created NFZ green (#00A651) SVG icon 60x60

### Task 2: Declarative Nfz.node.ts with all resources and operations
- **Commit:** c25c46f
- Queue resource: Search (with case type, province dropdown, benefit, locality, benefitForChildren, page, limit), Get (by GUID), Get Many Places (with pagination)
- Benefit resource: Search (by name with pagination)
- Locality resource: Search (by name with pagination)
- Province resource: Get All
- requestDefaults with baseURL, api-version=1.3, format=json
- All 16 Polish voivodeships as dropdown options (codes 01-16)
- TypeScript compiles with zero errors

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| No credentials property for public API | NFZ API requires no authentication, follows NBP pattern |

## Known Stubs

None -- all operations are fully wired to API endpoints with proper routing.

## Self-Check: PASSED

- [x] packages/n8n-nodes-nfz/package.json exists
- [x] packages/n8n-nodes-nfz/nodes/Nfz/Nfz.node.ts exists
- [x] packages/n8n-nodes-nfz/icons/nfz.svg exists
- [x] Commit ca16d19 exists
- [x] Commit c25c46f exists
