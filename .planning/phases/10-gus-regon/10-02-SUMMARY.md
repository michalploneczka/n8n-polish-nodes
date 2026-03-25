---
phase: 10-gus-regon
plan: 02
subsystem: node
tags: [gus, regon, bir, soap, programmatic-node, company-search, pkd]

requires:
  - phase: 10-gus-regon
    plan: 01
    provides: SOAP templates, XML parser, GenericFunctions, credentials
provides:
  - GusRegon programmatic node with execute() method
  - Company resource with 4 operations (searchByNip, searchByRegon, searchByKrs, getFullData)
  - Automatic entity type detection (legal/natural person) for report selection
  - Optional PKD code merging in full data response
affects: [10-gus-regon]

tech-stack:
  added: []
  patterns: [resource-split, session-per-call-soap, entity-type-detection]

key-files:
  created:
    - packages/n8n-nodes-gus-regon/nodes/GusRegon/resources/company.ts
    - packages/n8n-nodes-gus-regon/nodes/GusRegon/GusRegon.node.ts
  modified: []

decisions:
  - Session-per-call pattern accepted for getFullData (3 sessions = 9 HTTP calls per item) for code simplicity
  - Entity type detection via Typ field from search response (P=legal, F=natural person)
  - Operations sorted alphabetically in UI (n8n convention from Fakturownia pattern)

metrics:
  duration: 2min
  completed: "2026-03-22"
requirements_completed: [REGON-04, REGON-05, REGON-06, REGON-07]
---

# Phase 10 Plan 02: GusRegon Node Class and Company Resource Summary

Programmatic GusRegon node with 4 company operations and transparent SOAP session management, auto-detecting entity type for correct report selection.

## What Was Built

### Task 1: Company Resource Operations and Fields
Created `resources/company.ts` following the Fakturownia resource pattern with:
- 4 operations: searchByNip, searchByRegon, searchByKrs, getFullData
- 5 input fields with proper displayOptions filters per operation
- includePkd boolean toggle (default: true) for optional PKD code fetching

### Task 2: GusRegon Node Class with execute()
Created `GusRegon.node.ts` as a programmatic node implementing:
- Search operations: build SOAP envelope, call gusRegonApiRequest, parse with parseSearchResponse
- getFullData: 3-step process (search for type detection, main report, optional PKD report)
- Entity type auto-detection: Typ=P selects legalEntity reports, Typ=F selects naturalPerson reports
- PKD codes merged as `pkdCodes` array into the main report response
- continueOnFail error handling following Fakturownia pattern
- TypeScript compiles cleanly with no errors

## Decisions Made

1. **Session-per-call for getFullData**: Each gusRegonApiRequest manages its own session. getFullData makes 3 calls (search + report + PKD) = 9 HTTP round-trips. Accepted tradeoff for code simplicity.
2. **Entity type detection via search**: getFullData first searches by REGON to read the Typ field, then selects the appropriate report type automatically.
3. **Alphabetical operation sorting**: Operations listed alphabetically in the UI dropdown (Get Full Data, Search by KRS, Search by NIP, Search by REGON).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Force-add resources directory**
- **Found during:** Task 1
- **Issue:** Root .gitignore excludes `resources/` globally (known from Phase 02)
- **Fix:** Used `git add -f` to force-add the file
- **Files modified:** packages/n8n-nodes-gus-regon/nodes/GusRegon/resources/company.ts
- **Commit:** 4bd29eb

## Verification Results

- TypeScript compilation: `npx tsc --noEmit` exits 0
- All 4 operations present in node class
- All 5 fields present in company resource
- getFullData merges PKD codes with main report
- continueOnFail error handling implemented

## Known Stubs

None - all operations are fully wired to SOAP templates and XML parsers from Plan 01.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 4bd29eb | Company resource operations and fields |
| 2 | 0c5e88b | GusRegon node with execute() and 4 operations |
