---
phase: 02-fakturownia
plan: 02
subsystem: api
tags: [fakturownia, invoices, pdf-download, n8n-node, programmatic]

requires:
  - phase: 02-fakturownia-01
    provides: "GenericFunctions with fakturowniaApiRequest/fakturowniaApiRequestAllItems, credentials, package scaffold"
provides:
  - "Fakturownia node class with execute() dispatch for invoice operations"
  - "Invoice resource descriptions (7 operations) with all field definitions"
  - "Binary PDF download capability via arraybuffer encoding"
affects: [02-fakturownia-03, 02-fakturownia-04]

tech-stack:
  added: []
  patterns: [programmatic-node-execute-dispatch, binary-pdf-download, json-field-parse-with-error-handling]

key-files:
  created:
    - packages/n8n-nodes-fakturownia/nodes/Fakturownia/Fakturownia.node.ts
    - packages/n8n-nodes-fakturownia/nodes/Fakturownia/resources/invoices.ts
  modified: []

key-decisions:
  - "Resource selector only lists invoice -- client/product added in Plan 03 when their descriptions exist"
  - "Positions field uses JSON type with manual parse + NodeApiError on invalid JSON"
  - "PDF download uses json:false + encoding:arraybuffer options passed to GenericFunctions"

patterns-established:
  - "Programmatic execute() dispatch: resource -> operation if/else chain with per-item try/catch"
  - "Collection fields (additionalFields/updateFields) spread into API body"
  - "Binary output pattern: prepareBinaryData with invoice-{id}.pdf filename"

requirements_completed: [FAKT-02, FAKT-03, FAKT-04, FAKT-07, FAKT-08, FAKT-09]

duration: 2min
completed: 2026-03-21
---

# Phase 02 Plan 02: Invoice Resource & Node Class Summary

**Programmatic Fakturownia node with 7 invoice operations: CRUD, paginated list, email send, and binary PDF download**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-21T14:37:06Z
- **Completed:** 2026-03-21T14:39:16Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Invoice resource descriptions with 7 operations (list, get, create, update, delete, sendByEmail, downloadPdf) and all field definitions
- Fakturownia node class with programmatic execute() dispatch, binary PDF support, and continueOnFail error handling
- JSON parse validation on positions field with user-friendly error messages

## Task Commits

Each task was committed atomically:

1. **Task 1: Invoice resource descriptions** - `d9542ce` (feat)
2. **Task 2: Fakturownia node class with invoice execute() logic** - `7bd11be` (feat)

## Files Created/Modified
- `packages/n8n-nodes-fakturownia/nodes/Fakturownia/resources/invoices.ts` - Invoice operations and field descriptions for all 7 operations
- `packages/n8n-nodes-fakturownia/nodes/Fakturownia/Fakturownia.node.ts` - Programmatic node class with execute() dispatch

## Decisions Made
- Resource selector only lists 'invoice' -- client and product options deferred to Plan 03 to avoid UI options with no backing field descriptions
- Positions field uses `type: 'json'` with manual JSON.parse and NodeApiError on parse failure for clear user feedback
- PDF download passes `{ encoding: 'arraybuffer', json: false }` through options to GenericFunctions, producing binary output with `invoice-{id}.pdf` filename

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Node class ready for Plan 03 to add client and product resource descriptions and expand the resource selector
- All 7 invoice operations functional pending live API testing
- Wave 0 tests still pass (3 passed, 14 todo)

---
*Phase: 02-fakturownia*
*Completed: 2026-03-21*

## Self-Check: PASSED
