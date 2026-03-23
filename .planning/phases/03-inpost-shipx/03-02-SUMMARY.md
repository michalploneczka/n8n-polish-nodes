---
phase: 03-inpost-shipx
plan: 02
subsystem: inpost-node
tags: [inpost, shipx, points, tracking, binary-pdf, pagination]
dependency_graph:
  requires: [03-01]
  provides: [complete-inpost-operations]
  affects: [packages/n8n-nodes-inpost]
tech_stack:
  added: []
  patterns: [resource-split, org-scoped-endpoints, binary-pdf-download, pagination-with-filters]
key_files:
  created:
    - packages/n8n-nodes-inpost/nodes/Inpost/resources/points.ts
    - packages/n8n-nodes-inpost/nodes/Inpost/resources/tracking.ts
  modified:
    - packages/n8n-nodes-inpost/nodes/Inpost/Inpost.node.ts
decisions:
  - "Cancel uses org-scoped DELETE endpoint /v1/organizations/{orgId}/shipments/{id}"
  - "GetLabel uses org-scoped endpoint with format=pdf and type parameter for A4/A6"
  - "Points getAll passes filters as query string parameters to /v1/points"
  - "Resource files force-added due to root .gitignore excluding resources/ globally"
metrics:
  duration: 4min
  completed: "2026-03-23T11:38:39Z"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 3
---

# Phase 03 Plan 02: Remaining InPost Operations Summary

All InPost operations wired into execute() -- Points resource with filtered search, Tracking resource, plus org-scoped cancel/label endpoints with binary PDF download.

## What Was Done

### Task 1: Points and Tracking resource files
Created two new resource definition files following the shipments.ts pattern:
- **points.ts**: pointOperations (get, getAll) and pointFields (pointName, returnAll, limit, filters with name/city/type/functions)
- **tracking.ts**: trackingOperations (get) and trackingFields (trackingNumber)

### Task 2: Wire all operations into execute() method
Updated Inpost.node.ts with:
- Imports for pointOperations, pointFields, trackingOperations, trackingFields
- Resource selector expanded to 3 resources: Point, Shipment, Tracking
- All properties spread into the properties array
- Point.get: GET /v1/points/{name}
- Point.getAll: GET /v1/points with pagination and filters (name, city, type, functions)
- Tracking.get: GET /v1/tracking/{trackingNumber}
- Fixed cancel to use org-scoped DELETE /v1/organizations/{orgId}/shipments/{id}
- Fixed getLabel to use org-scoped endpoint with format=pdf and type=labelFormat query params
- continueOnFail error handling throughout

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Cancel endpoint corrected to org-scoped path**
- **Found during:** Task 2
- **Issue:** Plan 01 stub used `/v1/shipments/${shipmentId}` for cancel, but InPost API requires org-scoped path
- **Fix:** Changed to `/v1/organizations/${orgId}/shipments/${shipmentId}` per RESEARCH.md
- **Files modified:** Inpost.node.ts

**2. [Rule 1 - Bug] GetLabel endpoint corrected to org-scoped path**
- **Found during:** Task 2
- **Issue:** Plan 01 stub used `/v1/shipments/${shipmentId}/label`, but API requires org-scoped path
- **Fix:** Changed to `/v1/organizations/${orgId}/shipments/${shipmentId}/label` with proper format/type query params
- **Files modified:** Inpost.node.ts

**3. [Rule 3 - Blocking] Resource files force-added due to .gitignore**
- **Found during:** Task 1 commit
- **Issue:** Root .gitignore excludes `resources/` directory
- **Fix:** Used `git add -f` to force-add resource files (consistent with Phase 02 decision)

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 0dc3e91 | feat(03-02): add Points and Tracking resource field definitions |
| 2 | 3b7f4f3 | feat(03-02): wire all operations into execute() with Points and Tracking resources |

## Known Stubs

None -- all operations fully implemented with correct API endpoints.

## Self-Check: PASSED
