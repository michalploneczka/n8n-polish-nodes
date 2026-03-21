---
phase: 01-monorepo-bootstrap-smsapi-ceidg
verified: 2026-03-21T14:00:00Z
status: human_needed
score: 27/27 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 22/27
  gaps_closed:
    - "CEIDG tests pass — all 14 nock-based tests now pass (was 9/14). API_PATH updated to v3, /firmy->>/firma for NIP lookup, credential auth and test URL assertions corrected. Commit ec89dc0."
    - "CEIDG npm publish --dry-run gap resolved as expected behavior — n8n-node prerelease intentionally blocks local publishes to enforce GitHub Actions publish path. Documented in SUMMARY 01-11. No code change required."
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Start n8n (Docker or npx n8n start) and search for CEIDG and SMSAPI nodes in the node picker"
    expected: "Both nodes appear. CEIDG shows 3 operations (Get, Search by Name, Search by NIP). SMSAPI shows 4 resources (SMS, Contact, Group, Account) with correct operations. Both credential types are available."
    why_human: "Node discovery in n8n UI requires a running n8n process. npm links exist in ~/.n8n/custom/ (previously verified). Node UI rendering and credential type registration cannot be verified programmatically."
---

# Phase 01: Monorepo Bootstrap + SMSAPI + CEIDG Verification Report

**Phase Goal:** Bootstrap the monorepo and deliver two publishable n8n community nodes (SMSAPI and CEIDG) with full CI/CD pipeline ready for npm publication.
**Verified:** 2026-03-21T14:00:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (plan 01-11)

## Re-verification Summary

This is a re-verification following plan 01-11 (gap closure). The previous verification found 2 gaps:

1. **CEIDG test drift (5/14 tests failing)** — CLOSED. All 14 CEIDG tests now pass. The test file was updated in commit `ec89dc0` to align assertions with the v3 API: API_PATH constant, baseURL, NIP routing url (/firma not /firmy), credential auth string ($credentials.apiKey without optional chain), credential test URL (/firma?nip=6351723862), and all 6 HTTP integration test nock/https.get URLs.

2. **npm publish --dry-run blocked** — RESOLVED as expected behavior. The `n8n-node prerelease` script intentionally exits 1 to force GitHub Actions publish path (with provenance). The acceptance criterion in plan 01-10 was aspirational; the actual publish.yml workflow is correctly configured. No code fix was warranted.

Both previously-passed items were regression-checked and confirmed stable.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Monorepo root config is valid (package.json private, pnpm workspaces, tsconfig.base) | VERIFIED | package.json "private":true, build:all/test:all/lint:all scripts; pnpm-workspace.yaml packages/* and shared/*; tsconfig.base.json strict:true |
| 2 | Shared test-utils exist without n8n-core dependency | VERIFIED | shared/test-utils/index.ts exports createMockExecuteFunctions, setupNock, teardownNock, createNockScope; type-only imports from n8n-workflow only |
| 3 | CI workflow runs lint, build, test on PR/push to main | VERIFIED | .github/workflows/ci.yml: push:main + pull_request:main, matrix node 18/20, runs pnpm lint:all, build:all, test:all, verify-packages.js |
| 4 | Publish workflow uses --provenance and id-token:write | VERIFIED | .github/workflows/publish.yml: permissions.id-token:write, npm publish --provenance --access public, tag pattern n8n-nodes-*@* |
| 5 | scripts/verify-packages.js passes for both packages | VERIFIED | "All 2 package(s) verified successfully" — keywords, n8n field, dist/ paths, repository.directory, license all pass |
| 6 | copy-codex.js copies .node.json to dist/ | VERIFIED | dist/nodes/Ceidg/Ceidg.node.json and dist/nodes/Smsapi/Smsapi.node.json both exist after build |
| 7 | CEIDG credential uses API Key in Authorization header with IAuthenticateGeneric | VERIFIED | CeidgApi.credentials.ts: IAuthenticateGeneric with Bearer Authorization header |
| 8 | CEIDG credential has a test request to validate API key | VERIFIED | ICredentialTestRequest hits /firma?nip=6351723862 on v3 baseURL |
| 9 | CEIDG node has Search by NIP operation sending GET /firma?nip={nip} | VERIFIED | Ceidg.node.ts: routing url '/firma', send.type 'query', send.property 'nip' |
| 10 | CEIDG node has Search by Name operation sending GET /firmy?nazwa={name} | VERIFIED | Ceidg.node.ts: routing url '/firmy', send.type 'query', send.property 'nazwa' |
| 11 | CEIDG node has Get operation sending GET /firma/{id} | VERIFIED | Ceidg.node.ts: routing url '=/firma/{{$value}}' |
| 12 | All CEIDG operations use declarative routing — no execute() method | VERIFIED | No execute() in Ceidg.node.ts |
| 13 | CEIDG package.json has n8n-community-node-package keyword and dist paths | VERIFIED | verify-packages.js passes; n8n.nodes and n8n.credentials point to dist/ |
| 14 | CEIDG tests pass — 14/14 | VERIFIED | pnpm --filter n8n-nodes-ceidg test: 14 passed, 0 failed. v3 API path, /firma endpoint, credential assertions all correct. |
| 15 | SMSAPI credential uses Bearer token in Authorization header | VERIFIED | SmsapiApi.credentials.ts: authenticate header '=Bearer {{$credentials?.apiToken}}' |
| 16 | SMSAPI credential has test request to /profile | VERIFIED | test.request: url '/profile', method GET, qs { format: 'json' }, baseURL 'https://api.smsapi.pl' |
| 17 | format=json is injected in requestDefaults.qs at node level | VERIFIED | Smsapi.node.ts: requestDefaults.qs = { format: 'json' }; SMSAPI test explicitly validates this |
| 18 | SMS Send operation sends POST to /sms.do | VERIFIED | resources/sms.ts: routing method POST, url '/sms.do' |
| 19 | SMS resource has Send, Send Group, Get Report operations | VERIFIED | sms.ts exports smsDescription with operations: send, sendGroup, getReport |
| 20 | Contacts resource has List, Create, Update, Delete operations | VERIFIED | contacts.ts routes to /contacts (GET/POST), /contacts/{id} (PUT/DELETE) |
| 21 | Groups resource has List operation (GET /contacts/groups) | VERIFIED | groups.ts: routing url '/contacts/groups', method GET |
| 22 | Account resource has Balance operation (GET /profile) | VERIFIED | account.ts: routing url '/profile', method GET |
| 23 | All SMSAPI operations are declarative — no execute() method | VERIFIED | No execute() in Smsapi.node.ts |
| 24 | SMSAPI tests pass — 24/24 | VERIFIED | 24 tests pass: format=json verified, 4 resources, error handling with NodeApiError — no regression |
| 25 | Both packages have README with operations, installation, API docs link | VERIFIED | CEIDG README: 3 operations, dane.biznes.gov.pl link, MIT. SMSAPI README: 9 operations across 4 resources, format=json note, test mode, smsapi.pl/docs |
| 26 | Root README lists nodes with project overview | VERIFIED | README.md: "n8n Polish Nodes", SMSAPI+CEIDG table, npm install instructions, pnpm development section |
| 27 | Full test suite (test:all) passes — 38/38 | VERIFIED | pnpm run test:all: 24 SMSAPI + 14 CEIDG = 38 tests, 0 failures |

**Score:** 27/27 truths verified (automated checks)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | Root workspace config | VERIFIED | "private": true, all workspace scripts, devDependencies |
| `pnpm-workspace.yaml` | Workspace glob | VERIFIED | packages/* and shared/* |
| `tsconfig.base.json` | Shared TS config | VERIFIED | strict:true, target:es2019, module:commonjs, declaration:true |
| `jest.config.base.js` | Shared Jest config | VERIFIED | preset: ts-jest, testEnvironment: node, testMatch pattern |
| `scripts/copy-codex.js` | Post-build codex copier | VERIFIED | copies *.node.json to dist/ |
| `scripts/verify-packages.js` | Package validation | VERIFIED | "All 2 package(s) verified successfully" |
| `LICENSE` | MIT license | VERIFIED | MIT License, copyright 2026 Michal Ploneczka |
| `.github/workflows/ci.yml` | CI workflow | VERIFIED | push:main + PR:main, matrix 18/20, lint+build+test+verify |
| `.github/workflows/publish.yml` | Publish with provenance | VERIFIED | id-token:write, --provenance, tag n8n-nodes-*@*, NPM_TOKEN |
| `README.md` | Root project README | VERIFIED | "n8n Polish Nodes", SMSAPI+CEIDG table, development instructions |
| `shared/test-utils/index.ts` | Test utils public API | VERIFIED | exports createMockExecuteFunctions, setupNock, teardownNock, createNockScope |
| `packages/n8n-nodes-ceidg/credentials/CeidgApi.credentials.ts` | CEIDG credential | VERIFIED | IAuthenticateGeneric, Bearer auth, ICredentialTestRequest |
| `packages/n8n-nodes-ceidg/nodes/Ceidg/Ceidg.node.ts` | CEIDG declarative node | VERIFIED | requestDefaults, 3 operations, no execute(), v3 API, /firma endpoint |
| `packages/n8n-nodes-ceidg/nodes/Ceidg/Ceidg.node.json` | CEIDG codex | VERIFIED | "n8n-nodes-ceidg.ceidg", Data & Storage category |
| `packages/n8n-nodes-ceidg/icons/ceidg.svg` | CEIDG icon | VERIFIED | SVG file exists |
| `packages/n8n-nodes-ceidg/package.json` | CEIDG package config | VERIFIED | n8n-community-node-package keyword, dist paths, repository.directory |
| `packages/n8n-nodes-ceidg/__tests__/Ceidg.node.test.ts` | CEIDG tests | VERIFIED | 241 lines, 14/14 tests pass, v3 API assertions, /firma endpoint, no v2 references |
| `packages/n8n-nodes-smsapi/credentials/SmsapiApi.credentials.ts` | SMSAPI credential | VERIFIED | Bearer auth, /profile test, format:json in qs |
| `packages/n8n-nodes-smsapi/nodes/Smsapi/Smsapi.node.ts` | SMSAPI main node | VERIFIED | format:json in requestDefaults.qs, 4 resources, imports all resource files |
| `packages/n8n-nodes-smsapi/nodes/Smsapi/resources/sms.ts` | SMS operations | VERIFIED | POST /sms.do for send/sendGroup, GET /sms.do for getReport |
| `packages/n8n-nodes-smsapi/nodes/Smsapi/resources/contacts.ts` | Contacts CRUD | VERIFIED | /contacts (GET/POST), /contacts/{id} (PUT/DELETE) |
| `packages/n8n-nodes-smsapi/nodes/Smsapi/resources/groups.ts` | Groups List | VERIFIED | GET /contacts/groups |
| `packages/n8n-nodes-smsapi/nodes/Smsapi/resources/account.ts` | Account Balance | VERIFIED | GET /profile |
| `packages/n8n-nodes-smsapi/__tests__/Smsapi.node.test.ts` | SMSAPI tests | VERIFIED | 366 lines, 24/24 tests pass — no regression |
| `packages/n8n-nodes-ceidg/dist/nodes/Ceidg/Ceidg.node.json` | CEIDG codex in dist | VERIFIED | File exists after build |
| `packages/n8n-nodes-smsapi/dist/nodes/Smsapi/Smsapi.node.json` | SMSAPI codex in dist | VERIFIED | File exists after build |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `pnpm-workspace.yaml` | `packages/*` | workspace glob | VERIFIED | Contains 'packages/*' and 'shared/*' |
| `.github/workflows/publish.yml` | npm registry | --provenance | VERIFIED | npm publish --provenance --access public with id-token:write |
| `.github/workflows/ci.yml` | `package.json` scripts | pnpm run build:all | VERIFIED | CI calls pnpm run lint:all, build:all, test:all |
| `packages/n8n-nodes-ceidg/nodes/Ceidg/Ceidg.node.ts` | CEIDG API v3 | requestDefaults.baseURL | VERIFIED | baseURL: 'https://dane.biznes.gov.pl/api/ceidg/v3' |
| `packages/n8n-nodes-ceidg/__tests__/Ceidg.node.test.ts` | `Ceidg.node.ts` + `CeidgApi.credentials.ts` | test assertions | VERIFIED | API_PATH='/api/ceidg/v3', NIP url='/firma', credential auth='$credentials.apiKey', test url='/firma?nip=6351723862' — all match actual implementation |
| `packages/n8n-nodes-smsapi/nodes/Smsapi/Smsapi.node.ts` | resources/sms.ts | import + spread | VERIFIED | import smsDescription, spread in properties |
| `shared/test-utils` | CEIDG + SMSAPI tests | @n8n-polish-nodes/test-utils | VERIFIED | Both test files import from @n8n-polish-nodes/test-utils |
| `~/.n8n/custom/` | CEIDG+SMSAPI packages | npm link | VERIFIED (automated) | Symlinks exist in ~/.n8n/custom/node_modules/ |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| INFRA-01 | 01-01 | Monorepo with pnpm workspaces, shared root package.json | SATISFIED | package.json + pnpm-workspace.yaml verified |
| INFRA-02 | 01-01 | Shared tsconfig.json base | SATISFIED | tsconfig.base.json with strict:true, es2019 |
| INFRA-03 | 01-01, 01-03, 01-09 | Root scripts: build:all, lint:all, test:all | SATISFIED | All 3 scripts in root package.json; pipeline runs |
| INFRA-04 | 01-03, 01-10 | GitHub Actions publish.yml with --provenance + id-token:write | SATISFIED | publish.yml verified; node links exist |
| INFRA-05 | 01-02 | Shared test utilities, mock IExecuteFunctions | SATISFIED | shared/test-utils with factory + nock helpers, no n8n-core |
| INFRA-06 | 01-03 | Root README with nodes list and npm badges | SATISFIED | README.md has "n8n Polish Nodes", node table |
| INFRA-07 | 01-01 | LICENSE (MIT) and .gitignore | SATISFIED | Both files present |
| SMSAPI-01 | 01-05 | Credentials — Bearer Token with documentationUrl | SATISFIED | SmsapiApi.credentials.ts with Bearer + smsapi.pl/docs |
| SMSAPI-02 | 01-05 | SMS Send with format=json | SATISFIED | POST /sms.do; format=json in requestDefaults.qs |
| SMSAPI-03 | 01-05 | SMS Send Group | SATISFIED | resources/sms.ts sendGroup routes to POST /sms.do |
| SMSAPI-04 | 01-05 | SMS Get Report | SATISFIED | resources/sms.ts getReport routes to GET /sms.do |
| SMSAPI-05 | 01-05 | Contacts List, Create, Update, Delete | SATISFIED | contacts.ts has all 4 operations |
| SMSAPI-06 | 01-05 | Groups List | SATISFIED | groups.ts routes to GET /contacts/groups |
| SMSAPI-07 | 01-05 | Account Balance | SATISFIED | account.ts routes to GET /profile |
| SMSAPI-08 | 01-07 | HTTP errors as NodeApiError with English message | SATISFIED | 24 SMSAPI tests pass including NodeApiError error handling |
| SMSAPI-09 | 01-07 | Tests with nock, happy path + error handling | SATISFIED | 24 tests pass; format=json, routing, errors all validated |
| SMSAPI-10 | 01-05 | package.json with n8n-community-node-package keyword and dist paths | SATISFIED | verify-packages.js passes for n8n-nodes-smsapi |
| SMSAPI-11 | 01-05 | Codex file — categories: Communication, subcategory: SMS | SATISFIED | Smsapi.node.json: Communication/SMS |
| SMSAPI-12 | 01-05 | SVG icon 60x60 | SATISFIED | icons/smsapi.svg exists |
| SMSAPI-13 | 01-08 | README with description, workflow JSON, API docs link | SATISFIED | README: 9 operations table, smsapi.pl/docs |
| CEIDG-01 | 01-04 | Credentials — API Key in Authorization header | SATISFIED | CeidgApi.credentials.ts: Bearer Authorization, IAuthenticateGeneric |
| CEIDG-02 | 01-04 | Search by NIP (nip query param) | SATISFIED | Ceidg.node.ts: GET /firma?nip via send.type 'query' |
| CEIDG-03 | 01-04 | Search by Name (nazwa query param) | SATISFIED | Ceidg.node.ts: GET /firmy?nazwa via send.type 'query' |
| CEIDG-04 | 01-04 | Get by ID (path param) | SATISFIED | Ceidg.node.ts: GET =/firma/{{$value}} |
| CEIDG-05 | 01-04 | Declarative style — no execute() | SATISFIED | No execute() in Ceidg.node.ts |
| CEIDG-06 | 01-06 | HTTP errors as NodeApiError | SATISFIED | NodeApiError instantiation tested; 14/14 CEIDG tests pass |
| CEIDG-07 | 01-06 | Tests with nock, happy path + error handling | SATISFIED | 14 CEIDG tests pass: 200, 401, 404 scenarios all covered |
| CEIDG-08 | 01-04, 01-08 | package.json, codex, SVG icon, README | SATISFIED | All 4 components verified; verify-packages.js passes |

### Anti-Patterns Found

None. The previously identified blocker anti-patterns (stale v2 assertions in Ceidg.node.test.ts) have been resolved. No new anti-patterns detected.

### Human Verification Required

#### 1. Node Discovery in n8n

**Test:** Start n8n (Docker with N8N_CUSTOM_EXTENSIONS env var pointing to ~/.n8n/custom, or `npx n8n start`), open http://localhost:5678, create a workflow, search for "CEIDG" and "SMSAPI" in the node picker.
**Expected:** Both nodes appear. CEIDG shows 3 operations (Get, Search by Name, Search by NIP). SMSAPI shows 4 resources (SMS, Contact, Group, Account) with 9 total operations. Both CEIDG API and SMSAPI API credential types are available when configuring credentials.
**Why human:** Node discovery requires a running n8n process. npm links exist in ~/.n8n/custom/ (verified programmatically). Node UI rendering, operation display, and credential type registration cannot be verified without a live n8n instance.

### Gaps Summary

No gaps remain. All 27 observable truths verified. All 28 requirements satisfied. The previous gaps are closed:

- CEIDG test drift: 14/14 tests now pass after aligning assertions with v3 API in commit ec89dc0.
- Publish dry-run: resolved as a design constraint, not a gap. The publish.yml workflow with provenance attestation is correctly configured for GitHub Actions.

The only outstanding item is human verification of node UI discovery in a running n8n instance, which was already documented in the initial verification and is unchanged.

---

_Verified: 2026-03-21T14:00:00Z_
_Verifier: Claude (gsd-verifier)_
