---
phase: 03-inpost-shipx
plan: 01
subsystem: n8n-nodes-inpost
tags: [inpost, shipx, paczkomaty, shipping, node-scaffold, credentials, programmatic]
dependency_graph:
  requires: []
  provides: [inpost-package-scaffold, inpost-credentials, inpost-generic-functions, inpost-shipment-create]
  affects: [03-02, 03-03]
tech_stack:
  added: []
  patterns: [programmatic-node, environment-toggle, fixedCollection-body-assembly, page-pagination]
key_files:
  created:
    - packages/n8n-nodes-inpost/package.json
    - packages/n8n-nodes-inpost/tsconfig.json
    - packages/n8n-nodes-inpost/jest.config.js
    - packages/n8n-nodes-inpost/eslint.config.mjs
    - packages/n8n-nodes-inpost/credentials/InpostApi.credentials.ts
    - packages/n8n-nodes-inpost/nodes/Inpost/GenericFunctions.ts
    - packages/n8n-nodes-inpost/nodes/Inpost/Inpost.node.ts
    - packages/n8n-nodes-inpost/nodes/Inpost/resources/shipments.ts
    - packages/n8n-nodes-inpost/icons/inpost.svg
  modified: []
decisions:
  - Static class properties to expose GenericFunctions imports (avoids unused-import tsc error)
  - eslint-disable for no-http-request-with-manual-auth justified by environment-based dynamic URL construction
  - Locker vs courier service-aware field visibility using displayOptions
metrics:
  duration: 8min
  completed: "2026-03-23T11:21:52Z"
---

# Phase 03 Plan 01: InPost ShipX Package Scaffold + Credentials + Shipment Create Summary

InPost ShipX programmatic node with sandbox/production environment toggle, page-based pagination, and complex nested body assembly for shipment creation (receiver, parcels, custom_attributes, cod, insurance).

## Tasks Completed

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Package scaffold + credentials + GenericFunctions | ced3f18 | package.json, tsconfig.json, jest.config.js, eslint.config.mjs, InpostApi.credentials.ts, GenericFunctions.ts, inpost.svg |
| 2 | Inpost.node.ts + shipments resource with Create operation | fbf05ac | Inpost.node.ts, resources/shipments.ts |

## Decisions Made

1. **Static class properties for GenericFunctions** -- Same pattern as Fakturownia/LinkerCloud: expose imports as static properties to avoid unused-import tsc error when functions are only called via `call(this, ...)`
2. **eslint-disable for no-http-request-with-manual-auth** -- InPost uses environment-based dynamic URLs (sandbox vs production) requiring manual URL construction
3. **Locker vs courier service-aware fields** -- displayOptions conditionally show targetPoint for locker services and receiverAddress for courier services, matching the real API requirements

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None -- all created files are fully functional. The get/getAll/cancel/getLabel operations have basic implementations (not just stubs) that will be enhanced in Plan 02.

## Verification

- TypeScript compiles cleanly (`npx tsc --noEmit` -- zero errors)
- package.json contains `n8n-community-node-package` keyword
- Credentials have 3 fields (apiToken, organizationId, environment) plus test request with expression URL
- GenericFunctions exports both `inpostApiRequest` and `inpostApiRequestAllItems`
- Node has `execute()` with complete shipment create body assembly

## Self-Check: PASSED

All 9 files verified present. Both commits (ced3f18, fbf05ac) verified in git log.
