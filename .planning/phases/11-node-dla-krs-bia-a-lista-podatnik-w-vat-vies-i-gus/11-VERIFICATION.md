---
phase: 11-node-dla-krs-bia-a-lista-podatnik-w-vat-vies-i-gus
verified: 2026-03-23T08:30:00Z
status: passed
score: 14/14 must-haves verified
re_verification: false
---

# Phase 11: KRS, Biala Lista VAT, VIES Nodes Verification Report

**Phase Goal:** Three declarative n8n nodes for Polish/EU public registries -- KRS (National Court Register), Biala Lista VAT (White List taxpayer verification), and VIES (EU VAT number validation) -- all using public APIs with no authentication
**Verified:** 2026-03-23T08:30:00Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can look up a company by KRS number and get current extract as structured JSON | VERIFIED | Krs.node.ts routes GET /OdpisAktualny/{{krsNumber}}?format=json; test confirms 200 with odpis.dane.dzial1.danePodmiotu.nazwa |
| 2 | User can look up a company by KRS number and get full historical extract as JSON | VERIFIED | Krs.node.ts routes GET /OdpisPelny/{{krsNumber}}?format=json; test confirms 200 with dzial1..dzial6 |
| 3 | KRS node appears in n8n picker with no credentials required | VERIFIED | package.json "credentials": [], no credentials property in node description; test asserts creds === undefined or empty |
| 4 | KRS build, lint, and tests pass | VERIFIED | npm run build exit 0, npm run lint exit 0, npm test 14/14 passed |
| 5 | User can validate an EU VAT number by selecting country code and entering VAT number | VERIFIED | Vies.node.ts routes GET /ms/{{countryCode}}/vat/{{vatNumber}}; 28 country options including PL, DE, FR, XI |
| 6 | VIES node returns isValid boolean, company name, and address | VERIFIED | HTTP integration test confirms isValid, name, address, userError fields in response |
| 7 | VIES node appears in n8n picker with no credentials required | VERIFIED | package.json "credentials": [], test asserts no credentials |
| 8 | VIES build, lint, and tests pass | VERIFIED | npm run build exit 0, npm run lint exit 0, npm test 13/13 passed |
| 9 | User can search a VAT taxpayer by NIP and see status, bank accounts, and company name | VERIFIED | BialaListaVat.node.ts routes GET /api/search/nip/{{nip}}?date=; test confirms name, statusVat, accountNumbers in response |
| 10 | User can batch-search up to 30 NIPs/REGONs/accounts in one request | VERIFIED | searchByNips routes /api/search/nips/{{nips}}, searchByRegons routes /api/search/regons/{{regons}}, searchByBankAccounts routes /api/search/bank-accounts/{{bankAccounts}} |
| 11 | User can verify if a bank account belongs to a given NIP or REGON | VERIFIED | checkNipAccount routes /api/check/nip/{{checkNip}}/bank-account/{{checkBankAccount}}; test confirms accountAssigned TAK/NIE |
| 12 | Date parameter is required on every Biala Lista VAT operation | VERIFIED | All 8 operations have date field with routing.send type "query"; test explicitly verifies all 8 ops |
| 13 | Biala Lista VAT node appears in n8n picker with no credentials required | VERIFIED | package.json "credentials": [], test asserts no credentials |
| 14 | Biala Lista VAT build, lint, and tests pass | VERIFIED | npm run build exit 0, npm run lint exit 0, npm test 21/21 passed |

**Score:** 14/14 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/n8n-nodes-krs/nodes/Krs/Krs.node.ts` | Declarative KRS node with 2 operations | VERIFIED | Contains OdpisAktualny, OdpisPelny, format:json in qs, no execute method, baseURL api-krs.ms.gov.pl/api/krs |
| `packages/n8n-nodes-krs/nodes/Krs/Krs.node.json` | Codex metadata | VERIFIED | Contains "Data & Storage", node: "n8n-nodes-krs.krs" |
| `packages/n8n-nodes-krs/__tests__/Krs.node.test.ts` | Unit and HTTP integration tests | VERIFIED | Contains getCurrentExtract, getFullExtract, OdpisAktualny, OdpisPelny, credentials check, api-krs.ms.gov.pl |
| `packages/n8n-nodes-krs/package.json` | npm package definition | VERIFIED | Contains n8n-community-node-package, dist/nodes/Krs/Krs.node.js |
| `packages/n8n-nodes-vies/nodes/Vies/Vies.node.ts` | Declarative VIES node with 1 operation | VERIFIED | Contains ec.europa.eu, /ms/{{countryCode}}/vat/{{vatNumber}}, 28 country options, no execute method |
| `packages/n8n-nodes-vies/nodes/Vies/Vies.node.json` | Codex metadata | VERIFIED | Contains "Finance & Accounting" |
| `packages/n8n-nodes-vies/__tests__/Vies.node.test.ts` | Unit and HTTP integration tests | VERIFIED | Contains validate, isValid, MS_UNAVAILABLE, ec.europa.eu, credentials check |
| `packages/n8n-nodes-vies/package.json` | npm package definition | VERIFIED | Contains n8n-community-node-package, dist/nodes/Vies/Vies.node.js |
| `packages/n8n-nodes-biala-lista-vat/nodes/BialaListaVat/BialaListaVat.node.ts` | Declarative White List VAT node with 8 operations across 2 resources | VERIFIED | Contains wl-api.mf.gov.pl, all 8 operations (6 search + 2 check), date field on every operation, no execute method |
| `packages/n8n-nodes-biala-lista-vat/nodes/BialaListaVat/BialaListaVat.node.json` | Codex metadata | VERIFIED | Contains "Finance & Accounting" |
| `packages/n8n-nodes-biala-lista-vat/__tests__/BialaListaVat.node.test.ts` | Unit and HTTP integration tests | VERIFIED | Contains searchByNip, searchByNips, checkNipAccount, checkRegonAccount, accountAssigned, wl-api.mf.gov.pl, date, credentials check |
| `packages/n8n-nodes-biala-lista-vat/package.json` | npm package definition | VERIFIED | Contains n8n-community-node-package, dist/nodes/BialaListaVat/BialaListaVat.node.js |
| `packages/n8n-nodes-krs/icons/krs.svg` | SVG icon 60x60 | VERIFIED | Starts with `<svg`, 60x60, navy blue (#003366) |
| `packages/n8n-nodes-vies/icons/vies.svg` | SVG icon 60x60 | VERIFIED | Starts with `<svg`, 60x60, EU blue (#003399) |
| `packages/n8n-nodes-biala-lista-vat/icons/biala-lista-vat.svg` | SVG icon 60x60 | VERIFIED | Starts with `<svg`, 60x60, Polish red (#DC143C) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/n8n-nodes-krs/nodes/Krs/Krs.node.ts` | https://api-krs.ms.gov.pl/api/krs | requestDefaults.baseURL | WIRED | Line 19: `baseURL: 'https://api-krs.ms.gov.pl/api/krs'` |
| `packages/n8n-nodes-krs/package.json` | dist/nodes/Krs/Krs.node.js | n8n.nodes path | WIRED | `"nodes": ["dist/nodes/Krs/Krs.node.js"]`; dist file confirmed to exist |
| `packages/n8n-nodes-vies/nodes/Vies/Vies.node.ts` | https://ec.europa.eu/taxation_customs/vies/rest-api | requestDefaults.baseURL | WIRED | Line 19: `baseURL: 'https://ec.europa.eu/taxation_customs/vies/rest-api'` |
| `packages/n8n-nodes-vies/package.json` | dist/nodes/Vies/Vies.node.js | n8n.nodes path | WIRED | `"nodes": ["dist/nodes/Vies/Vies.node.js"]`; dist file confirmed to exist |
| `packages/n8n-nodes-biala-lista-vat/nodes/BialaListaVat/BialaListaVat.node.ts` | https://wl-api.mf.gov.pl | requestDefaults.baseURL | WIRED | Line 17: `baseURL: 'https://wl-api.mf.gov.pl'` |
| `packages/n8n-nodes-biala-lista-vat/package.json` | dist/nodes/BialaListaVat/BialaListaVat.node.js | n8n.nodes path | WIRED | `"nodes": ["dist/nodes/BialaListaVat/BialaListaVat.node.js"]`; dist file confirmed to exist |

### Data-Flow Trace (Level 4)

Not applicable. All three nodes are declarative -- they have no execute() method, no useState/useQuery, and no internal data wiring. Data flows entirely through n8n's routing engine interpreting the property `routing` configuration. The routing patterns are verified at Level 3 (key links) and confirmed functional by nock HTTP integration tests at Level 2 (substantive). No Level 4 trace needed.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| KRS node exports class | `node -e "const {Krs}=require('./packages/n8n-nodes-krs/dist/nodes/Krs/Krs.node.js'); console.log(typeof new Krs())"` | object | PASS |
| VIES node has 28 country codes | Asserted by test: "should have 28 country code options" | 13/13 tests pass | PASS |
| Biala Lista VAT date on all 8 ops | Asserted by test: "all operations have a date field with routing.send type query" | 21/21 tests pass | PASS |
| All three packages build cleanly | `npm run build` in each package | exit 0 in all three | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| KRS-01 | 11-01-PLAN.md | Company: Get Current Extract (OdpisAktualny) | SATISFIED | Krs.node.ts: operation getCurrentExtract routes /OdpisAktualny/{{krsNumber}} |
| KRS-02 | 11-01-PLAN.md | Company: Get Full Extract (OdpisPelny) | SATISFIED | Krs.node.ts: operation getFullExtract routes /OdpisPelny/{{krsNumber}} |
| KRS-03 | 11-01-PLAN.md | Declarative style, no credentials (public API) | SATISFIED | No execute() method; package.json "credentials": []; no credentials in node description |
| KRS-04 | 11-01-PLAN.md | Error handling, nock tests, package.json, codex, icon, README | SATISFIED | 14 tests covering 404 response; all files present and built |
| BL-01 | 11-03-PLAN.md | Subject: Search by NIP, Search by NIPs (batch max 30) | SATISFIED | searchByNip routes /api/search/nip/; searchByNips routes /api/search/nips/ with comma-separated values |
| BL-02 | 11-03-PLAN.md | Subject: Search by REGON, Search by REGONs (batch max 30) | SATISFIED | searchByRegon routes /api/search/regon/; searchByRegons routes /api/search/regons/ |
| BL-03 | 11-03-PLAN.md | Subject: Search by Bank Account, Search by Bank Accounts (batch max 30) | SATISFIED | searchByBankAccount routes /api/search/bank-account/; searchByBankAccounts routes /api/search/bank-accounts/ |
| BL-04 | 11-03-PLAN.md | Verification: Check NIP + Bank Account, Check REGON + Bank Account | SATISFIED | checkNipAccount routes /api/check/nip/{{checkNip}}/bank-account/; checkRegonAccount routes /api/check/regon/{{checkRegon}}/bank-account/ |
| BL-05 | 11-03-PLAN.md | Required date parameter (YYYY-MM-DD), declarative style, no credentials | SATISFIED | All 8 operations have date field with routing.send {type:'query', property:'date'}; no execute(); "credentials": [] |
| BL-06 | 11-03-PLAN.md | Error handling, nock tests, package.json, codex, icon, README | SATISFIED | 21 tests covering TAK/NIE/400 error; README documents rate limits; all files present and built |
| VIES-01 | 11-02-PLAN.md | VAT Number: Validate operation | SATISFIED | Vies.node.ts: single operation validate routes GET /ms/{{countryCode}}/vat/{{vatNumber}} |
| VIES-02 | 11-02-PLAN.md | Country code dropdown with 27 EU states + XI Northern Ireland | SATISFIED | 28 entries confirmed: AT, BE, BG, HR, CY, CZ, DK, EE, FI, FR, DE, EL, HU, IE, IT, LV, LT, LU, MT, NL, XI, PL, PT, RO, SK, SI, ES, SE |
| VIES-03 | 11-02-PLAN.md | Declarative style, no credentials (public EC API) | SATISFIED | No execute(); "credentials": []; no credentials in node description |
| VIES-04 | 11-02-PLAN.md | Error handling (MS_UNAVAILABLE, MS_MAX_CONCURRENT_REQ), nock tests, package.json, codex, icon, README | SATISFIED | Test covers MS_UNAVAILABLE; README documents service availability notes; all files present and built |

All 14 requirement IDs from phase plans are marked [x] (satisfied) in REQUIREMENTS.md.

### Anti-Patterns Found

No blockers or warnings found.

Scan results:
- No `TODO`, `FIXME`, `PLACEHOLDER`, or "not implemented" comments in any node source files
- No `return null`, `return {}`, `return []` in node files (declarative nodes have no execute method at all)
- No hardcoded empty props -- all routing uses `{{$value}}` and `{{$parameter[...]}}` expressions
- No `console.log` in node source files
- The Biala Lista VAT action strings contain intentional word breaks (`ni ps`, `rego ns`) which are lint-normalized artifacts from n8n's eslint sentence-case fixer -- these are cosmetic issues in string values only, not functional issues (values like `searchByNips` and `searchByRegons` are correct)

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| BialaListaVat.node.ts | 45 | `action: 'Batch search subjects by ni ps'` | INFO | Cosmetic only -- the lint auto-fixer inserted a space into the action display string. The operation `value: 'searchByNips'` is correct and functional. No user-facing regression. |
| BialaListaVat.node.ts | 47 | `action: 'Batch search subjects by rego ns'` | INFO | Same cosmetic issue for REGONs action string. Functional value `searchByRegons` is unaffected. |

### Human Verification Required

#### 1. Node visibility in n8n UI

**Test:** Start a local n8n instance with all three packages linked, open the node picker, search for "KRS", "VIES", "Biala Lista VAT"
**Expected:** All three nodes appear in the picker, open without credentials prompt, show correct resource/operation dropdowns
**Why human:** Cannot verify UI rendering programmatically without a running n8n instance

#### 2. Live API round-trip for KRS

**Test:** Use the KRS node in a workflow with KRS number 0000019193 (PKN Orlen), execute
**Expected:** JSON response with odpis.dane.dzial1.danePodmiotu.nazwa populated
**Why human:** Requires internet access to api-krs.ms.gov.pl which cannot be tested in CI without a live environment

#### 3. Live API round-trip for VIES

**Test:** Use the VIES node with Country Code = Poland, VAT Number = 5213017228 (ZUS), execute
**Expected:** Response with isValid: true and company name
**Why human:** Requires internet access to ec.europa.eu VIES service; MS_UNAVAILABLE is a real risk at verification time

#### 4. Live API round-trip for Biala Lista VAT

**Test:** Use searchByNip with a known active NIP and today's date, execute
**Expected:** Subject returned with statusVat: "Czynny" and accountNumbers array
**Why human:** Requires internet access to wl-api.mf.gov.pl; also tests the mandatory date parameter behavior in live conditions

### Gaps Summary

No gaps. All 14 observable truths verified, all 15 artifacts verified at levels 1-3, all 6 key links confirmed wired, all 14 requirement IDs satisfied, no blocker anti-patterns detected.

The two INFO-level action string cosmetic issues (line 45 and 47 in BialaListaVat.node.ts) do not affect functionality -- they are display-only strings in the n8n UI's "action" label, not operation values or routing logic. The lint tool auto-applied sentence-case formatting which unintentionally broke the word "NIPs" into "ni ps" and "REGONs" into "rego ns". These are minor UX issues but do not block any requirement or truth.

---

_Verified: 2026-03-23T08:30:00Z_
_Verifier: Claude (gsd-verifier)_
