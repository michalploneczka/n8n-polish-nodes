---
phase: 02-fakturownia
verified: 2026-03-21T16:15:00Z
status: human_needed
score: 13/13 must-haves verified
re_verification: true
  previous_status: gaps_found
  previous_score: 12/13
  gaps_closed:
    - "Package compiles and passes lint without errors (npm run lint exits 0)"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Verify node appears in n8n node picker and all 3 resources are selectable"
    expected: "Fakturownia node visible, Invoice/Client/Product resources available, PDF download returns binary output"
    why_human: "Cannot verify UI rendering, node picker appearance, or binary data flow end-to-end without running n8n"
  - test: "Live API connectivity with real Fakturownia trial account"
    expected: "Returns real invoices from API, pagination works, errors show readable message"
    why_human: "Requires live API credentials not available in automated testing"
---

# Phase 02: Fakturownia Verification Report

**Phase Goal:** Build a complete, publishable n8n community node for Fakturownia.pl — a Polish invoicing platform used by 100k+ businesses. The node must handle all core invoicing workflows (create/list/get/update/delete invoices, send by email, download PDF, manage clients and products), authenticate via API token + subdomain, pass lint, and include tests, documentation, and icon.
**Verified:** 2026-03-21T16:15:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (02-05 lint fix plan)

## Gap Closure Confirmation

The single gap from initial verification was lint failure (11 errors across 4 files, including 3 non-autofixable). The 02-05 plan was executed and produced two verified commits:

- `e0ad823` — fix(02-05): resolve 3 non-autofixable lint errors in GenericFunctions.ts
- `4359fec` — fix(02-05): auto-fix 8 lint errors in resource files and fix ArrayBuffer cast

Both commits are confirmed real in `git log`. `npm run lint` now exits 0.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | User can configure Fakturownia credentials with API token and subdomain | VERIFIED | `FakturowniaApi.credentials.ts` has `apiToken` (password type) and `subdomain` fields, test request to `account.json` |
| 2 | User entering full URL as subdomain still connects successfully | VERIFIED | `GenericFunctions.ts` line 19: `.replace(/\.fakturownia\.pl$/i, '')` strips suffix; test confirms no double domain |
| 3 | Pagination returns all results when returnAll is true, or up to limit when false | VERIFIED | `fakturowniaApiRequestAllItems` implements `while (true)` page loop with `per_page=100`, early-exit on limit, break on short page |
| 4 | User can list, get, create, update, delete invoices | VERIFIED | All 5 operations in execute() with correct HTTP methods and endpoints |
| 5 | User can send an invoice by email | VERIFIED | `sendByEmail` branch calls POST `/invoices/{id}/send_by_email.json` with `email_to` |
| 6 | User can download an invoice PDF as binary data | VERIFIED | `downloadPdf` branch uses `encoding: 'arraybuffer'`, calls `prepareBinaryData`, returns `binary.data` |
| 7 | User can list, get, create clients | VERIFIED | Client resource with 3 operations; `taxNo` -> `tax_no` mapping correct |
| 8 | User can list and create products | VERIFIED | Product resource with 2 operations |
| 9 | All 22 tests pass | VERIFIED | `npx jest --config jest.config.js` exits 0, 22 passing, 0 failing, 0.837s |
| 10 | Package builds without errors | VERIFIED | `npm run build` exits 0, TypeScript build successful, dist/ generated |
| 11 | Package lint passes without errors | VERIFIED | `npm run lint` exits 0 — gap CLOSED by commits e0ad823 + 4359fec |
| 12 | Codex categorizes node under Finance & Accounting | VERIFIED | `Fakturownia.node.json` has `"categories": ["Finance & Accounting"]`, subcategory `"Invoicing"` |
| 13 | README documents all 12 operations with credentials setup and example workflow | VERIFIED | README has Operations table (12 rows), Credentials section, Example Workflow JSON |

**Score:** 13/13 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/n8n-nodes-fakturownia/package.json` | npm package metadata with n8n config | VERIFIED | `n8n-community-node-package` keyword, correct dist paths |
| `packages/n8n-nodes-fakturownia/credentials/FakturowniaApi.credentials.ts` | apiToken + subdomain credential | VERIFIED | Both required fields present |
| `packages/n8n-nodes-fakturownia/nodes/Fakturownia/GenericFunctions.ts` | API helper, lint-clean | VERIFIED | 83 lines, `Promise<IDataObject | IDataObject[] | Buffer | undefined>`, `while (true)`, eslint-disable with justification |
| `packages/n8n-nodes-fakturownia/nodes/Fakturownia/Fakturownia.node.ts` | Programmatic node with execute() | VERIFIED | Full execute() with 12 operation branches, ArrayBuffer cast via `unknown` |
| `packages/n8n-nodes-fakturownia/nodes/Fakturownia/resources/invoices.ts` | Invoice field descriptions | VERIFIED | 7 operations, no duplicate descriptions, periods present |
| `packages/n8n-nodes-fakturownia/nodes/Fakturownia/resources/clients.ts` | Client field descriptions | VERIFIED | 3 operations, email placeholder present, no duplicate descriptions |
| `packages/n8n-nodes-fakturownia/nodes/Fakturownia/resources/products.ts` | Product field descriptions | VERIFIED | 2 operations, no duplicate descriptions |
| `packages/n8n-nodes-fakturownia/__tests__/Fakturownia.node.test.ts` | Comprehensive tests | VERIFIED | 22 tests passing |
| `packages/n8n-nodes-fakturownia/nodes/Fakturownia/Fakturownia.node.json` | Codex metadata | VERIFIED | Finance & Accounting > Invoicing |
| `packages/n8n-nodes-fakturownia/icons/fakturownia.svg` | Node icon | VERIFIED | SVG file exists |
| `packages/n8n-nodes-fakturownia/README.md` | Package documentation | VERIFIED | All required sections present |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `Fakturownia.node.ts` | `GenericFunctions.ts` | `import { fakturowniaApiRequest, fakturowniaApiRequestAllItems }` | WIRED | Both functions imported and called in execute() |
| `Fakturownia.node.ts` | `resources/invoices.ts` | `import { invoiceOperations, invoiceFields }` | WIRED | Spread into `properties` array |
| `Fakturownia.node.ts` | `resources/clients.ts` | `import { clientOperations, clientFields }` | WIRED | Spread into `properties` array |
| `Fakturownia.node.ts` | `resources/products.ts` | `import { productOperations, productFields }` | WIRED | Spread into `properties` array |
| `GenericFunctions.ts` | `credentials.fakturowniaApi` | `this.getCredentials('fakturowniaApi')` | WIRED | Called at line 18 |
| `execute() downloadPdf` | `/invoices/{id}.pdf` | `encoding: 'arraybuffer'` | WIRED | Passes `{ encoding: 'arraybuffer', json: false }` then casts `response as unknown as ArrayBuffer` |
| `__tests__/Fakturownia.node.test.ts` | `Fakturownia.node.ts` | `import { Fakturownia }` | WIRED | All 22 tests exercise real execute() paths |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| FAKT-01 | 02-01 | Credentials — apiToken + subdomain | SATISFIED | Credential type with both fields; subdomain sanitization in GenericFunctions.ts |
| FAKT-02 | 02-02 | Invoices — List, Get, Create, Update, Delete | SATISFIED | All 5 operations with correct endpoints |
| FAKT-03 | 02-02 | Invoices — Send by Email | SATISFIED | `sendByEmail` branch, tested |
| FAKT-04 | 02-02 | Invoices — Download PDF (binary) | SATISFIED | arraybuffer encoding + prepareBinaryData |
| FAKT-05 | 02-03 | Clients — List, Get, Create | SATISFIED | All 3 operations |
| FAKT-06 | 02-03 | Products — List, Create | SATISFIED | Both operations |
| FAKT-07 | 02-01 | Pagination — per_page=100, page parameter | SATISFIED | `fakturowniaApiRequestAllItems` with `per_page: 100` and page increment |
| FAKT-08 | 02-01 | Binary data handling — PDF as n8n binary item | SATISFIED | `prepareBinaryData`, filename `invoice-{id}.pdf`, mimeType `application/pdf` |
| FAKT-09 | 02-02 | Create Invoice — kind, dates, buyer, positions, payment_type | SATISFIED | All fields in invoices.ts; JSON.parse with error handling |
| FAKT-10 | 02-04/05 | Error handling, tests, package.json, codex, icon, README, lint | SATISFIED | 22 tests pass, lint exits 0, build succeeds, all artifacts present |

**Orphaned requirements:** None. FAKT-01 through FAKT-10 all appear in at least one plan's `requirements` field.

### Anti-Patterns Found

No new anti-patterns found in this re-verification pass. Previously identified lint errors are resolved. The `eslint-disable-next-line` for `no-http-request-with-manual-auth` in GenericFunctions.ts is intentional and documented with a 2-line architectural justification (dynamic per-subdomain URLs requiring manual URL construction; auth via query param not headers).

### Human Verification Required

**1. Node picker appearance**

**Test:** `npm run build && npm link` in package dir, configure `~/.n8n/custom` symlink, run `npx n8n start`, search "Fakturownia" in nodes panel
**Expected:** Node visible, 3 resource options (Invoice, Client, Product) selectable, operations match documented list, PDF download shows binary output indicator in output panel
**Why human:** Cannot verify n8n UI rendering or node picker appearance programmatically

**2. Live API connectivity**

**Test:** Configure credentials with a real Fakturownia trial account (trial.fakturownia.pl or similar subdomain), execute List Invoices
**Expected:** Returns real invoice data from API, returnAll pagination cycles through all pages, errors produce readable `NodeApiError` message
**Why human:** Requires live API credentials not available in automated testing

### Re-verification Summary

The gap from the initial verification is fully closed. The single failing truth — "Package compiles and passes lint without errors" — is now verified:

- `npm run lint` exits 0 (confirmed by running the command)
- 3 non-autofixable errors in GenericFunctions.ts fixed: return type is now `Promise<IDataObject | IDataObject[] | Buffer | undefined>`, `do {} while (true)` converted to `while (true) {}`, and `no-http-request-with-manual-auth` suppressed with a documented justification comment
- 8 autofixable errors in resource files fixed: duplicate descriptions removed, email placeholder added, final periods added
- A deviation fix was required: changing `Promise<any>` to the explicit union type in Task 1 caused a TypeScript error on the `response as ArrayBuffer` cast in Fakturownia.node.ts, resolved by casting through `unknown`
- No regressions: all 22 tests still pass, build still succeeds

All 10 requirements (FAKT-01 through FAKT-10) are fully satisfied. The package is publication-ready per CLAUDE.md rule 7. Remaining items are UI/live-API checks that require human execution.

---

_Verified: 2026-03-21T16:15:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification: Yes — gap closure for 02-05 lint fixes_
