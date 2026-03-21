---
phase: 01-monorepo-bootstrap-smsapi-ceidg
verified: 2026-03-21T13:00:00Z
status: gaps_found
score: 22/27 must-haves verified
gaps:
  - truth: "CEIDG tests pass — all nock-based tests for 3 operations and error handling"
    status: failed
    reason: "5 tests fail because tests hardcode v2 API URL and /firmy endpoint, but node was updated to v3 + /firma during plan 10 integration testing. Tests were not updated after real-API validation changed the API version."
    artifacts:
      - path: "packages/n8n-nodes-ceidg/__tests__/Ceidg.node.test.ts"
        issue: "Tests assert baseURL='https://dane.biznes.gov.pl/api/ceidg/v2' but node uses v3. Tests assert NIP routing url='/firmy' but node uses '/firma'. Tests assert credential auth contains '$credentials?.apiKey' (with optional chain) but credential uses '$credentials.apiKey'. Tests assert credential test URL is '/firmy' but credential uses '/firma?nip=6351723862'."
    missing:
      - "Update test assertions to match actual v3 API: baseURL, /firma endpoint, credential auth string, credential test URL"

  - truth: "CEIDG npm publish --dry-run exits 0 (guinea pig pipeline validation per D-18)"
    status: failed
    reason: "npm publish --dry-run fails because the prepublishOnly script runs 'n8n-node prerelease' which deliberately exits 1 to prevent local publishes (forces use of GitHub Actions). This is expected behavior by design, but the acceptance criterion in plan 01-10 is not achievable as written."
    artifacts:
      - path: "packages/n8n-nodes-ceidg/package.json"
        issue: "prepublishOnly script: 'n8n-node prerelease' blocks local npm publish including dry-run. Exit code 1 with 'Run npm run release to publish the package'."
    missing:
      - "Either update plan 01-10 acceptance criteria to reflect that dry-run is blocked by design, OR test publish dry-run with --ignore-scripts flag, OR document this as expected behavior in SUMMARY"

human_verification:
  - test: "Start n8n (Docker or npx n8n start) and search for CEIDG and SMSAPI nodes in the node picker"
    expected: "Both nodes appear. CEIDG shows 3 operations (Get, Search by Name, Search by NIP). SMSAPI shows 4 resources (SMS, Contact, Group, Account) with correct operations."
    why_human: "Node discovery in n8n UI requires running n8n process. Links exist in ~/.n8n/custom/. Cannot verify programmatically."
---

# Phase 01: Monorepo Bootstrap + SMSAPI + CEIDG Verification Report

**Phase Goal:** Bootstrap the monorepo and deliver working CEIDG and SMSAPI n8n community nodes with tests, CI/CD, and a validated publish pipeline.
**Verified:** 2026-03-21T13:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Monorepo root config is valid (package.json private, pnpm workspaces, tsconfig.base) | VERIFIED | package.json has "private": true, build:all/test:all/lint:all scripts; pnpm-workspace.yaml has packages/* and shared/*; tsconfig.base.json has strict:true, target:es2019 |
| 2 | Shared test-utils exist without n8n-core dependency | VERIFIED | shared/test-utils/index.ts exports createMockExecuteFunctions, setupNock, teardownNock, createNockScope; only imports from n8n-workflow (type-only) |
| 3 | CI workflow runs lint, build, test on PR/push to main | VERIFIED | .github/workflows/ci.yml: triggers on push:main and pull_request:main, matrix node 18/20, runs pnpm lint:all, build:all, test:all, verify-packages.js |
| 4 | Publish workflow uses --provenance and id-token:write | VERIFIED | .github/workflows/publish.yml: has permissions.id-token: write, runs npm publish --provenance --access public, tag pattern n8n-nodes-*@* |
| 5 | scripts/verify-packages.js passes for both packages | VERIFIED | node scripts/verify-packages.js: "All 2 package(s) verified successfully" — checks keyword, n8n field, dist/ paths, repository.directory, license |
| 6 | copy-codex.js copies .node.json to dist/ | VERIFIED | dist/nodes/Ceidg/Ceidg.node.json and dist/nodes/Smsapi/Smsapi.node.json both exist after build |
| 7 | CEIDG credential uses API Key in Authorization header with IAuthenticateGeneric | VERIFIED | CeidgApi.credentials.ts: authenticate: IAuthenticateGeneric with Authorization header using Bearer prefix |
| 8 | CEIDG credential has a test request to validate API key | VERIFIED | test: ICredentialTestRequest exists, hits /firma?nip=6351723862 on v3 baseURL |
| 9 | CEIDG node has Search by NIP operation sending GET /firma?nip={nip} | VERIFIED | Ceidg.node.ts: routing on nip property — method GET, url '/firma', send.type 'query', send.property 'nip' |
| 10 | CEIDG node has Search by Name operation sending GET /firmy?nazwa={name} | VERIFIED | Ceidg.node.ts: routing on nazwa property — method GET, url '/firmy', send.type 'query', send.property 'nazwa' |
| 11 | CEIDG node has Get operation sending GET /firma/{id} | VERIFIED | Ceidg.node.ts: routing on companyId — method GET, url '=/firma/{{$value}}' |
| 12 | All CEIDG operations use declarative routing — no execute() method | VERIFIED | grep for "execute(" in Ceidg.node.ts returns no matches |
| 13 | CEIDG package.json has n8n-community-node-package keyword and dist paths | VERIFIED | keywords includes "n8n-community-node-package"; n8n.nodes: ["dist/nodes/Ceidg/Ceidg.node.js"]; n8n.credentials: ["dist/credentials/CeidgApi.credentials.js"] |
| 14 | CEIDG tests pass (nock-based, happy path + errors) | FAILED | 5/14 tests fail: baseURL expected v2 got v3; NIP routing url expected '/firmy' got '/firma'; Get routing url expected to contain '/firmy/' got '=/firma/{{$value}}'; credential auth expected '$credentials?.apiKey' got '$credentials.apiKey'; credential test URL expected '/firmy' got '/firma?nip=6351723862' |
| 15 | SMSAPI credential uses Bearer token in Authorization header | VERIFIED | SmsapiApi.credentials.ts: authenticate header '=Bearer {{$credentials?.apiToken}}' |
| 16 | SMSAPI credential has test request to /profile | VERIFIED | test.request: url '/profile', method GET, qs { format: 'json' }, baseURL 'https://api.smsapi.pl' |
| 17 | format=json is injected in requestDefaults.qs at node level | VERIFIED | Smsapi.node.ts: requestDefaults.qs = { format: 'json' }; SMSAPI test explicitly validates this (D-15 critical test) |
| 18 | SMS Send operation sends POST to /sms.do | VERIFIED | resources/sms.ts: 'to' property routing — method POST, url '/sms.do' |
| 19 | SMS resource has Send, Send Group, Get Report operations | VERIFIED | sms.ts exports smsDescription with operations: send, sendGroup, getReport |
| 20 | Contacts resource has List, Create, Update, Delete operations | VERIFIED | contacts.ts routes to /contacts (GET/POST), /contacts/{id} (PUT/DELETE) |
| 21 | Groups resource has List operation (GET /contacts/groups) | VERIFIED | groups.ts: routing url '/contacts/groups', method GET |
| 22 | Account resource has Balance operation (GET /profile) | VERIFIED | account.ts: routing url '/profile', method GET |
| 23 | All SMSAPI operations are declarative — no execute() method | VERIFIED | grep for "execute(" in Smsapi.node.ts returns no matches |
| 24 | SMSAPI tests pass — 24/24 | VERIFIED | All 24 tests pass: format=json verified, 4 resources validated, SMS routing to /sms.do, contacts/groups/account routing, error handling with NodeApiError |
| 25 | Both packages have README with operations, installation, API docs link | VERIFIED | CEIDG README: 3 operations table, npm install, dane.biznes.gov.pl link, MIT. SMSAPI README: 9 operations across 4 resources, format=json note, test mode, smsapi.pl/docs, MIT |
| 26 | Root README lists nodes with project overview | VERIFIED | README.md: "n8n Polish Nodes" title, SMSAPI+CEIDG table, npm install instructions, pnpm development section |
| 27 | CEIDG npm publish --dry-run exits 0 (D-18 guinea pig) | FAILED | dry-run blocked by prepublishOnly script running 'n8n-node prerelease' which exits 1 by design (forces GitHub Actions publish) |

**Score:** 25/27 truths verified (automated checks); 22/27 including sub-test failures

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | Root workspace config | VERIFIED | "private": true, all workspace scripts, devDependencies |
| `pnpm-workspace.yaml` | Workspace glob | VERIFIED | packages/* and shared/* |
| `tsconfig.base.json` | Shared TS config | VERIFIED | strict:true, target:es2019, module:commonjs, declaration:true |
| `jest.config.base.js` | Shared Jest config | VERIFIED | preset: ts-jest, testEnvironment: node, testMatch pattern |
| `scripts/copy-codex.js` | Post-build codex copier | VERIFIED | copies *.node.json to dist/ — note: differs from plan (uses custom find instead of fast-glob) |
| `scripts/verify-packages.js` | Package validation | VERIFIED | checks keyword, n8n field, dist/ paths, repository.directory, license |
| `LICENSE` | MIT license | VERIFIED | MIT License, copyright 2026 Michal Ploneczka |
| `.gitignore` | Git ignore rules | VERIFIED | node_modules/, dist/, .idea/, .DS_Store |
| `.github/workflows/ci.yml` | CI workflow | VERIFIED | push:main + PR:main, matrix 18/20, lint+build+test+verify |
| `.github/workflows/publish.yml` | Publish with provenance | VERIFIED | id-token:write, --provenance, tag n8n-nodes-*@*, NPM_TOKEN |
| `README.md` | Root project README | VERIFIED | "n8n Polish Nodes", SMSAPI+CEIDG table, development instructions |
| `shared/test-utils/index.ts` | Test utils public API | VERIFIED | exports createMockExecuteFunctions, setupNock, teardownNock, createNockScope |
| `shared/test-utils/mock-execute-functions.ts` | Mock IExecuteFunctions | VERIFIED | createMockExecuteFunctions factory, type-only imports from n8n-workflow, no n8n-core |
| `shared/test-utils/nock-helpers.ts` | Nock helpers | VERIFIED | nock.disableNetConnect, nock.cleanAll, nock.enableNetConnect |
| `packages/n8n-nodes-ceidg/credentials/CeidgApi.credentials.ts` | CEIDG credential | VERIFIED | IAuthenticateGeneric, Bearer auth, ICredentialTestRequest |
| `packages/n8n-nodes-ceidg/nodes/Ceidg/Ceidg.node.ts` | CEIDG declarative node | VERIFIED | requestDefaults, 3 operations, no execute() — note: v3 API, /firma endpoint |
| `packages/n8n-nodes-ceidg/nodes/Ceidg/Ceidg.node.json` | CEIDG codex | VERIFIED | "n8n-nodes-ceidg.ceidg", Data & Storage category |
| `packages/n8n-nodes-ceidg/icons/ceidg.svg` | CEIDG icon | VERIFIED | SVG file exists |
| `packages/n8n-nodes-ceidg/package.json` | CEIDG package config | VERIFIED | n8n-community-node-package keyword, dist paths, repository.directory |
| `packages/n8n-nodes-ceidg/__tests__/Ceidg.node.test.ts` | CEIDG tests | STUB/PARTIAL | File exists (241 lines), imports from @n8n-polish-nodes/test-utils, but 5/14 tests fail due to v2/v3 API drift |
| `packages/n8n-nodes-smsapi/credentials/SmsapiApi.credentials.ts` | SMSAPI credential | VERIFIED | Bearer auth, /profile test, format:json in qs |
| `packages/n8n-nodes-smsapi/nodes/Smsapi/Smsapi.node.ts` | SMSAPI main node | VERIFIED | format:json in requestDefaults.qs, 4 resources, imports all resource files |
| `packages/n8n-nodes-smsapi/nodes/Smsapi/resources/sms.ts` | SMS operations | VERIFIED | POST /sms.do for send/sendGroup, GET /sms.do for getReport |
| `packages/n8n-nodes-smsapi/nodes/Smsapi/resources/contacts.ts` | Contacts CRUD | VERIFIED | /contacts (GET/POST), /contacts/{id} (PUT/DELETE) |
| `packages/n8n-nodes-smsapi/nodes/Smsapi/resources/groups.ts` | Groups List | VERIFIED | GET /contacts/groups |
| `packages/n8n-nodes-smsapi/nodes/Smsapi/resources/account.ts` | Account Balance | VERIFIED | GET /profile |
| `packages/n8n-nodes-smsapi/nodes/Smsapi/Smsapi.node.json` | SMSAPI codex | VERIFIED | "n8n-nodes-smsapi.smsapi", Communication/SMS |
| `packages/n8n-nodes-smsapi/icons/smsapi.svg` | SMSAPI icon | VERIFIED | SVG file exists |
| `packages/n8n-nodes-smsapi/__tests__/Smsapi.node.test.ts` | SMSAPI tests | VERIFIED | 366 lines, 24 tests, all pass — format=json critical test included |
| `packages/n8n-nodes-ceidg/dist/nodes/Ceidg/Ceidg.node.json` | CEIDG codex in dist | VERIFIED | File exists after build |
| `packages/n8n-nodes-smsapi/dist/nodes/Smsapi/Smsapi.node.json` | SMSAPI codex in dist | VERIFIED | File exists after build |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `pnpm-workspace.yaml` | `packages/*` | workspace glob | VERIFIED | Contains 'packages/*' and 'shared/*' |
| `package.json` | `pnpm-workspace.yaml` | pnpm workspaces | VERIFIED | private:true, pnpm workspaces active |
| `.github/workflows/publish.yml` | npm registry | --provenance | VERIFIED | npm publish --provenance --access public with id-token:write |
| `.github/workflows/ci.yml` | `package.json` scripts | pnpm run build:all | VERIFIED | CI calls pnpm run lint:all, build:all, test:all |
| `packages/n8n-nodes-ceidg/nodes/Ceidg/Ceidg.node.ts` | CEIDG API v3 | requestDefaults.baseURL | VERIFIED | baseURL: 'https://dane.biznes.gov.pl/api/ceidg/v3' |
| `packages/n8n-nodes-ceidg/package.json` | dist/nodes/Ceidg/Ceidg.node.js | n8n.nodes field | VERIFIED | n8n.nodes: ["dist/nodes/Ceidg/Ceidg.node.js"] |
| `packages/n8n-nodes-smsapi/nodes/Smsapi/Smsapi.node.ts` | resources/sms.ts | import + spread | VERIFIED | import smsDescription, spread as ...smsDescription in properties |
| `packages/n8n-nodes-smsapi/nodes/Smsapi/Smsapi.node.ts` | SMSAPI API | requestDefaults.baseURL | VERIFIED | baseURL: 'https://api.smsapi.pl' |
| `shared/test-utils` | CEIDG tests | @n8n-polish-nodes/test-utils | VERIFIED | import { setupNock, teardownNock, createNockScope } from '@n8n-polish-nodes/test-utils' |
| `shared/test-utils` | SMSAPI tests | @n8n-polish-nodes/test-utils | VERIFIED | import { setupNock, teardownNock, createNockScope } from '@n8n-polish-nodes/test-utils' |
| `~/.n8n/custom/` | CEIDG+SMSAPI packages | npm link | VERIFIED (automated) | Symlinks exist: ~/.n8n/custom/node_modules/n8n-nodes-ceidg -> packages/n8n-nodes-ceidg |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| INFRA-01 | 01-01 | Monorepo with npm workspaces, shared root package.json | SATISFIED | package.json + pnpm-workspace.yaml verified |
| INFRA-02 | 01-01 | Shared tsconfig.json base | SATISFIED | tsconfig.base.json with strict:true, es2019 |
| INFRA-03 | 01-01, 01-03, 01-09 | Root scripts: build:all, lint:all, test:all | SATISFIED | All 3 scripts in root package.json; pipeline runs |
| INFRA-04 | 01-03, 01-10 | GitHub Actions publish.yml with --provenance + id-token:write | SATISFIED | publish.yml verified; node links exist |
| INFRA-05 | 01-02 | Shared test utilities, mock IExecuteFunctions | SATISFIED | shared/test-utils with factory + nock helpers, no n8n-core |
| INFRA-06 | 01-03 | Root README with nodes list and npm badges | SATISFIED | README.md has "n8n Polish Nodes", node table, development instructions |
| INFRA-07 | 01-01 | LICENSE (MIT) and .gitignore | SATISFIED | Both files verified |
| SMSAPI-01 | 01-05 | Credentials — Bearer Token with documentationUrl | SATISFIED | SmsapiApi.credentials.ts with Bearer + smsapi.pl/docs |
| SMSAPI-02 | 01-05 | SMS Send with format=json | SATISFIED | SMS Send routes to POST /sms.do; format=json in requestDefaults.qs at node level |
| SMSAPI-03 | 01-05 | SMS Send Group | SATISFIED | resources/sms.ts sendGroup routes to POST /sms.do with group param |
| SMSAPI-04 | 01-05 | SMS Get Report | SATISFIED | resources/sms.ts getReport routes to GET /sms.do |
| SMSAPI-05 | 01-05 | Contacts List, Create, Update, Delete | SATISFIED | contacts.ts has all 4 operations with correct endpoints |
| SMSAPI-06 | 01-05 | Groups List | SATISFIED | groups.ts routes to GET /contacts/groups |
| SMSAPI-07 | 01-05 | Account Balance | SATISFIED | account.ts routes to GET /profile |
| SMSAPI-08 | 01-07 | HTTP errors as NodeApiError with English message | SATISFIED | SMSAPI tests verify NodeApiError instantiation with 401/400 payloads; all 24 tests pass |
| SMSAPI-09 | 01-07 | Tests with nock, happy path + error handling | SATISFIED | 24 tests pass; nock mocks /profile, /sms.do; setupNock/teardownNock used |
| SMSAPI-10 | 01-05 | package.json with n8n-community-node-package keyword and dist paths | SATISFIED | verify-packages.js passes for n8n-nodes-smsapi |
| SMSAPI-11 | 01-05 | Codex file — categories: Communication, subcategory: SMS | SATISFIED | Smsapi.node.json: Communication/SMS |
| SMSAPI-12 | 01-05 | SVG icon 60x60 | SATISFIED | icons/smsapi.svg exists (placeholder per plan — official logo deferred) |
| SMSAPI-13 | 01-08 | README with description, workflow JSON, API docs link | SATISFIED | README: 9 operations table, format=json note, test mode, smsapi.pl/docs |
| CEIDG-01 | 01-04 | Credentials — API Key in Authorization header | SATISFIED | CeidgApi.credentials.ts: Bearer Authorization, IAuthenticateGeneric |
| CEIDG-02 | 01-04 | Search by NIP (nip query param) | SATISFIED | Ceidg.node.ts: routing to GET /firma?nip via send.type 'query' |
| CEIDG-03 | 01-04 | Search by Name (nazwa query param) | SATISFIED | Ceidg.node.ts: routing to GET /firmy?nazwa via send.type 'query' |
| CEIDG-04 | 01-04 | Get by ID (path param) | SATISFIED | Ceidg.node.ts: routing to GET =/firma/{{$value}} |
| CEIDG-05 | 01-04 | Declarative style — no execute() | SATISFIED | No execute() in Ceidg.node.ts |
| CEIDG-06 | 01-06 | HTTP errors as NodeApiError | PARTIALLY_SATISFIED | NodeApiError import and instantiation tested; but test file has 5 failures due to v2/v3 drift |
| CEIDG-07 | 01-06 | Tests with nock, happy path + error handling | BLOCKED | 5 of 14 tests fail: v2 vs v3 API drift, /firmy vs /firma endpoint mismatch |
| CEIDG-08 | 01-04, 01-08 | package.json, codex, SVG icon, README | SATISFIED | All 4 components verified; verify-packages.js passes |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `packages/n8n-nodes-ceidg/__tests__/Ceidg.node.test.ts` | 24 | Test asserts stale v2 baseURL ('https://dane.biznes.gov.pl/api/ceidg/v2') | Blocker | 5 tests fail — CI pipeline would fail |
| `packages/n8n-nodes-ceidg/__tests__/Ceidg.node.test.ts` | 74 | Test asserts routing url='/firmy' for NIP operation but node uses '/firma' | Blocker | Test fails |
| `packages/n8n-nodes-ceidg/__tests__/Ceidg.node.test.ts` | 91 | Test asserts routing url contains '/firmy/' for Get but node uses '=/firma/...' | Blocker | Test fails |
| `packages/n8n-nodes-ceidg/__tests__/Ceidg.node.test.ts` | 118 | Test asserts credential auth contains '$credentials?.apiKey' but credential uses '$credentials.apiKey' | Blocker | Test fails |
| `packages/n8n-nodes-ceidg/__tests__/Ceidg.node.test.ts` | 125 | Test asserts credential test URL is '/firmy' but actual is '/firma?nip=6351723862' | Blocker | Test fails |

**Root cause:** CEIDG node was correctly updated to API v3 (real API testing in plan 01-10 confirmed v2 deprecated), but the tests in plan 01-06 were not updated to reflect these changes. The node is correct; the tests are stale.

### Human Verification Required

#### 1. Node Discovery in n8n

**Test:** Start n8n (`npx n8n start` or Docker with N8N_CUSTOM_EXTENSIONS env var pointing to ~/.n8n/custom), open http://localhost:5678, create a workflow, search for "CEIDG" and "SMSAPI" in the node picker.
**Expected:** Both nodes appear. CEIDG shows 3 operations (Get, Search by Name, Search by NIP). SMSAPI shows 4 resources (SMS, Contact, Group, Account) with 9 total operations. Both CEIDG API and SMSAPI API credential types are available.
**Why human:** Node discovery requires a running n8n process. npm links exist in ~/.n8n/custom/ (verified). Node UI rendering and credential type registration cannot be verified programmatically.

### Gaps Summary

**Root Cause of All Gaps: CEIDG test drift after API version upgrade.**

During plan 01-10 (integration testing with real n8n + real API), the CEIDG API was discovered to have moved to v3 (v2 deprecated). The node implementation was correctly updated: baseURL changed to v3, endpoint `/firmy` (NIP lookup) changed to `/firma`, and Authorization changed to use Bearer prefix. However, the tests in `packages/n8n-nodes-ceidg/__tests__/Ceidg.node.test.ts` still assert the old v2 values. This creates 5 test failures.

The fix is straightforward: update 5 test assertions in Ceidg.node.test.ts to match the actual v3 implementation. The node logic itself is correct and was validated against the live API.

The publish dry-run gap is a non-issue in practice: `n8n-node prerelease` intentionally blocks local publishes to enforce the GitHub Actions publish path. The publish.yml workflow is correctly configured with provenance. This acceptance criterion cannot be met locally by design.

---

_Verified: 2026-03-21T13:00:00Z_
_Verifier: Claude (gsd-verifier)_
