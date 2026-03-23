---
phase: 03-inpost-shipx
verified: 2026-03-23T12:30:00Z
status: passed
score: 14/14 must-haves verified
re_verification: false
---

# Phase 03: InPost ShipX Verification Report

**Phase Goal:** Build InPost ShipX node with shipment management, Paczkomaty points lookup, and tracking via ShipX API
**Verified:** 2026-03-23T12:30:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                                          | Status     | Evidence                                                                                                |
|----|----------------------------------------------------------------------------------------------------------------|------------|---------------------------------------------------------------------------------------------------------|
| 1  | InPost package scaffolded with build/lint/test scripts that reference correct paths                            | VERIFIED   | package.json scripts match Fakturownia pattern; `npm run build` exits 0; dist/ populated                |
| 2  | Credentials accept apiToken, organizationId, and environment toggle (sandbox/production)                       | VERIFIED   | InpostApi.credentials.ts: 3 properties confirmed; expression-based test URL confirmed                  |
| 3  | GenericFunctions provides inpostApiRequest with environment-based URL switching and paginated helper            | VERIFIED   | GenericFunctions.ts exports both functions; BASE_URLS map for sandbox/production; page/per_page loop   |
| 4  | Shipment Create operation sends correct nested body (receiver, parcels, custom_attributes, cod, insurance)     | VERIFIED   | Inpost.node.ts lines 85-203 assemble all nested fields; test confirms POST body shape                  |
| 5  | User can get a shipment by ID and list shipments with pagination (returnAll toggle)                            | VERIFIED   | execute() handles get (GET /v1/shipments/{id}) and getAll with inpostApiRequestAllItems                |
| 6  | User can cancel a shipment by ID                                                                               | VERIFIED   | execute() handles cancel via org-scoped DELETE /v1/organizations/{orgId}/shipments/{id}                |
| 7  | User can download a shipping label as binary PDF in A4 or A6 format                                           | VERIFIED   | getLabel uses prepareBinaryData with arraybuffer encoding; test confirms binary output                  |
| 8  | User can list and get Paczkomaty (parcel locker points)                                                        | VERIFIED   | points.ts exports pointOperations/pointFields; execute() routes point.get and point.getAll             |
| 9  | User can track a shipment by tracking number                                                                   | VERIFIED   | tracking.ts exports trackingOperations/trackingFields; execute() routes tracking.get                   |
| 10 | Node is programmatic (execute method) with resource/operation routing                                          | VERIFIED   | Inpost class has execute(); test confirms typeof node.execute === 'function'                           |
| 11 | All operations have nock-based tests (happy path) that pass                                                    | VERIFIED   | 16/16 tests pass; covers all 8 operations + error handling + continueOnFail                           |
| 12 | Codex file has correct node reference and categories                                                           | VERIFIED   | Inpost.node.json: "n8n-nodes-inpost.inpost", categories: ["Miscellaneous"]                            |
| 13 | SVG icon exists at correct path                                                                                | VERIFIED   | icons/inpost.svg: viewBox="0 0 60 60", fill="#FFCD00" (InPost yellow)                                 |
| 14 | README documents all operations, credentials setup, and rate limits                                            | VERIFIED   | README.md: 8-row operations table, credentials section, Rate Limits section (100 req/min)             |

**Score:** 14/14 truths verified

### Required Artifacts

| Artifact                                                              | Expected                           | Status      | Details                                                                             |
|-----------------------------------------------------------------------|------------------------------------|-------------|-------------------------------------------------------------------------------------|
| `packages/n8n-nodes-inpost/package.json`                              | Package scaffold with n8n config   | VERIFIED    | keyword "n8n-community-node-package"; n8n.credentials and n8n.nodes paths correct  |
| `packages/n8n-nodes-inpost/credentials/InpostApi.credentials.ts`      | Bearer + orgId + environment creds | VERIFIED    | exports class InpostApi; name='inpostApi'; 3 properties; expression-based test URL |
| `packages/n8n-nodes-inpost/nodes/Inpost/GenericFunctions.ts`          | API request helpers                | VERIFIED    | exports inpostApiRequest and inpostApiRequestAllItems; NodeApiError wrapping        |
| `packages/n8n-nodes-inpost/nodes/Inpost/Inpost.node.ts`               | Main node with execute()           | VERIFIED    | exports class Inpost; full execute() with 8 operations across 3 resources          |
| `packages/n8n-nodes-inpost/nodes/Inpost/resources/shipments.ts`       | Shipment field definitions         | VERIFIED    | exports shipmentOperations (5 ops) and shipmentFields; fixedCollections present     |
| `packages/n8n-nodes-inpost/nodes/Inpost/resources/points.ts`          | Points resource field definitions  | VERIFIED    | exports pointOperations (2 ops) and pointFields; filters collection present         |
| `packages/n8n-nodes-inpost/nodes/Inpost/resources/tracking.ts`        | Tracking resource field definitions| VERIFIED    | exports trackingOperations (1 op) and trackingFields; trackingNumber field present  |
| `packages/n8n-nodes-inpost/__tests__/Inpost.node.test.ts`             | Test suite for all operations      | VERIFIED    | 16 test cases; 277 lines; all pass                                                  |
| `packages/n8n-nodes-inpost/nodes/Inpost/Inpost.node.json`             | Codex metadata                     | VERIFIED    | "n8n-nodes-inpost.inpost" node reference; Miscellaneous category                   |
| `packages/n8n-nodes-inpost/icons/inpost.svg`                          | Node icon                          | VERIFIED    | viewBox="0 0 60 60"; yellow #FFCD00 background                                     |
| `packages/n8n-nodes-inpost/README.md`                                  | Package documentation              | VERIFIED    | Contains "InPost ShipX"; 8-operation table; credentials; rate limits section       |

### Key Link Verification

| From                          | To                                   | Via                                          | Status   | Details                                                                             |
|-------------------------------|--------------------------------------|----------------------------------------------|----------|-------------------------------------------------------------------------------------|
| Inpost.node.ts                | GenericFunctions.ts                  | import inpostApiRequest                      | WIRED    | Line 10: `import { inpostApiRequest, inpostApiRequestAllItems } from './GenericFunctions'` |
| Inpost.node.ts                | resources/shipments.ts               | import shipmentOperations, shipmentFields    | WIRED    | Line 12: `import { shipmentOperations, shipmentFields } from './resources/shipments'`      |
| Inpost.node.ts                | resources/points.ts                  | import pointOperations, pointFields          | WIRED    | Line 11: `import { pointOperations, pointFields } from './resources/points'`               |
| Inpost.node.ts                | resources/tracking.ts                | import trackingOperations, trackingFields    | WIRED    | Line 13: `import { trackingOperations, trackingFields } from './resources/tracking'`       |
| GenericFunctions.ts           | InpostApi credentials                | getCredentials('inpostApi')                  | WIRED    | Line 23: `await this.getCredentials('inpostApi')`                                          |
| Inpost.node.ts (getLabel)     | this.helpers.prepareBinaryData       | binary PDF download                          | WIRED    | Lines 246-253: prepareBinaryData called with Buffer, filename, 'application/pdf'           |
| __tests__/Inpost.node.test.ts | nodes/Inpost/Inpost.node.ts          | import and instantiate Inpost class          | WIRED    | Line 4: `import { Inpost } from '../nodes/Inpost/Inpost.node'`                            |
| Inpost.node.json              | Inpost.node.ts                       | node reference in codex                      | WIRED    | "node": "n8n-nodes-inpost.inpost"                                                          |

### Data-Flow Trace (Level 4)

Not applicable — this node is an integration adapter that makes HTTP calls (via GenericFunctions) rather than rendering from an internal data store. All operations call `inpostApiRequest.call(this, ...)` and push responses directly to `returnData`. No static/disconnected data paths found.

### Behavioral Spot-Checks

| Behavior               | Command                                        | Result                                    | Status  |
|------------------------|------------------------------------------------|-------------------------------------------|---------|
| Build compiles cleanly | `npm run build`                                | TypeScript build successful; dist/ output | PASS    |
| Lint passes zero errors| `npm run lint`                                 | Exit 0, no errors reported                | PASS    |
| All 16 tests pass      | `npm test`                                     | 16/16 tests pass in 0.655s                | PASS    |
| dist/ contains output  | `ls dist/credentials dist/nodes/Inpost/`       | .js and .d.ts files present               | PASS    |
| Commits exist          | `git log --oneline ced3f18 fbf05ac 0dc3e91...` | All 6 documented commits verified         | PASS    |

### Requirements Coverage

| Requirement | Source Plan | Description                                                                                     | Status      | Evidence                                                              |
|-------------|-------------|-------------------------------------------------------------------------------------------------|-------------|-----------------------------------------------------------------------|
| INPOST-01   | 03-01       | Credentials — Bearer Token + organization_id + environment toggle (sandbox/production)          | SATISFIED   | InpostApi.credentials.ts: apiToken, organizationId, environment; test request with expression URL |
| INPOST-02   | 03-01       | Resource: Shipments — operacja Create z polami: service, receiver, target_point, parcels, cod, insurance | SATISFIED | Full body assembly in execute(); receiver/parcels fixedCollections; cod/insurance in additionalFields |
| INPOST-03   | 03-02       | Resource: Shipments — operacje Get, List, Cancel                                                | SATISFIED   | execute() routes shipment.get, shipment.getAll, shipment.cancel with correct org-scoped endpoints |
| INPOST-04   | 03-02       | Resource: Shipments — operacja Get Label (PDF binary, format A4/A6)                            | SATISFIED   | getLabel uses arraybuffer encoding + prepareBinaryData; labelFormat options: normal/A6           |
| INPOST-05   | 03-02       | Resource: Points — operacje List, Get (Paczkomaty)                                              | SATISFIED   | points.ts: get (GET /v1/points/{name}) and getAll (GET /v1/points with filters and pagination)  |
| INPOST-06   | 03-02       | Resource: Tracking — operacja Get by tracking number                                            | SATISFIED   | tracking.ts: get operation; execute() routes GET /v1/tracking/{trackingNumber}                  |
| INPOST-07   | 03-01       | Styl programmatic (execute() method) — złożona logika tworzenia przesyłek                      | SATISFIED   | Inpost class has execute(); no declarative routing used                                          |
| INPOST-08   | 03-03       | Rate limit awareness — 100 req/min (nie wymuszaj retry, dokumentuj w README)                   | SATISFIED   | README.md Rate Limits section: "100 requests per minute"; no automatic retry implemented        |
| INPOST-09   | 03-03       | Obsługa błędów, testy nock, package.json, codex, ikona, README                                 | SATISFIED   | NodeApiError wrapping in GenericFunctions.ts; 16 nock tests; all files present and valid        |

**Coverage:** 9/9 requirements SATISFIED. No orphaned requirements.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| No anti-patterns found | — | — | — | — |

Scan results:
- No TODO/FIXME/placeholder comments in implementation files
- No `return null` / `return []` / `return {}` stubs (GenericFunctions returns real API response)
- No hardcoded empty data passed to rendering paths
- `continueOnFail()` properly branches instead of silently failing
- eslint-disable comment for `no-http-request-with-manual-auth` is justified by environment-based dynamic URL (documented in code)

### Human Verification Required

None. All behavioral assertions are verified programmatically via the test suite (16/16 passing) and CLI spot-checks. The following items would be UAT candidates but are not blockers:

1. **Live sandbox API connection** — Verify credentials flow to real InPost sandbox and return non-error response. Not testable without live credentials.
2. **Binary label in n8n workflow** — Verify Get Label binary output connects correctly to Write Binary File node in actual n8n instance.
3. **Rate limit behavior** — Confirm README warning is sufficient for users hitting 100 req/min limit.

### Gaps Summary

No gaps found. All 14 must-have truths are verified, all 9 requirements are satisfied, all key links are wired, and build/lint/test all pass with zero errors.

---

_Verified: 2026-03-23T12:30:00Z_
_Verifier: Claude (gsd-verifier)_
