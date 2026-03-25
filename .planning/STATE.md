---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Ready to plan
stopped_at: Completed 24-01-PLAN.md
last_updated: "2026-03-25T20:03:17.974Z"
progress:
  total_phases: 24
  completed_phases: 16
  total_plans: 50
  completed_plans: 50
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-20)

**Core value:** Kompletny ekosystem polskich integracji n8n -- gotowe do instalacji community node'y dla 11 serwisow
**Current focus:** Phase 24 — documentation-tracking-cleanup

## Current Position

Phase: 24
Plan: 2 of 2

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: n/a
- Trend: n/a

*Updated after each plan completion*
| Phase 01 P01 | 2min | 2 tasks | 8 files |
| Phase 01 P02 | 1min | 2 tasks | 5 files |
| Phase 01 P03 | 2min | 2 tasks | 4 files |
| Phase 01 P04 | 2min | 2 tasks | 7 files |
| Phase 01 P05 | 2min | 2 tasks | 11 files |
| Phase 01 P06 | 5min | 1 tasks | 4 files |
| Phase 01 P07 | 3min | 1 tasks | 2 files |
| Phase 01 P08 | 2min | 1 tasks | 2 files |
| Phase 01 P09 | 9min | 2 tasks | 10 files |
| Phase 01 P10 | 15min | 3 tasks | 6 files |
| Phase 01 P11 | 2min | 1 tasks | 1 files |
| Phase 02 P01 | 3min | 3 tasks | 7 files |
| Phase 02 P02 | 2min | 2 tasks | 2 files |
| Phase 02 P03 | 2min | 2 tasks | 3 files |
| Phase 02 P04 | 2min | 3 tasks | 4 files |
| Phase 02 P05 | 2min | 2 tasks | 5 files |
| Phase 12 P01 | 3min | 3 tasks | 8 files |
| Phase 12 P03 | 2min | 2 tasks | 3 files |
| Phase 12 P04 | 3min | 2 tasks | 2 files |
| Phase 12 P02 | 4min | 2 tasks | 2 files |
| Phase 12 P05 | 4min | 3 tasks | 4 files |
| Phase 12 P06 | 4min | 2 tasks | 9 files |
| Phase 14 P01 | 2min | 2 tasks | 5 files |
| Phase 14 P02 | 2min | 2 tasks | 4 files |
| Phase 10 P01 | 2min | 2 tasks | 8 files |
| Phase 10 P02 | 2min | 2 tasks | 2 files |
| Phase 10 P03 | 5min | 2 tasks | 16 files |
| Phase 11 P02 | 2min | 2 tasks | 9 files |
| Phase 11 P01 | 3min | 2 tasks | 9 files |
| Phase 11 P03 | 4min | 2 tasks | 9 files |
| Phase 13 P01 | 12min | 2 tasks | 9 files |
| Phase 13 P02 | 5min | 1 tasks | 1 files |
| Phase 13 P03 | 20min | 2 tasks | 4 files |
| Phase 03 P01 | 8min | 2 tasks | 9 files |
| Phase 03 P02 | 4min | 2 tasks | 3 files |
| Phase 03 P03 | 10min | 2 tasks | 4 files |
| Phase 15 P01 | 3min | 2 tasks | 6 files |
| Phase 15 P02 | 3min | 2 tasks | 4 files |
| Phase 16 P01 | 2min | 2 tasks | 5 files |
| Phase 16 P02 | 3min | 2 tasks | 3 files |
| Phase 17 P01 | 2min | 3 tasks | 3 files |
| Phase 18 P01 | 2min | 2 tasks | 5 files |
| Phase 18 P02 | 2min | 2 tasks | 15 files |
| Phase 19 P01 | 3min | 2 tasks | 10 files |
| Phase 19 P02 | 4min | 1 tasks | 1 files |
| Phase 20 P01 | 1min | 2 tasks | 8 files |
| Phase 20 P02 | 1min | 1 tasks | 1 files |
| Phase 21 P01 | 1min | 2 tasks | 5 files |
| Phase 21 P02 | 1min | 1 tasks | 1 files |
| Phase 23 P01 | 3min | 2 tasks | 4 files |
| Phase 24 P01 | 3min | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: npm workspaces (not pnpm) -- test npm link compatibility in Phase 1 first
- [Roadmap]: Tag-based publishing (not changesets) -- simpler for solo developer
- [Roadmap]: n8n-workflow as peerDep + devDep (not regular dependency)
- [Roadmap]: ES2021 target + CJS output -- matches n8n runtime requirements
- [Roadmap]: Shoper and wFirma split into separate phases (6 and 7) for fine granularity
- [Phase 01]: tsconfig targets es2019 matching @n8n/node-cli official template
- [Phase 01]: shamefully-hoist=true in .npmrc for @n8n/node-cli compatibility
- [Phase 01]: Manual dot-path resolution instead of lodash/get to avoid adding lodash dependency
- [Phase 01]: Test-utils package marked private (v0.0.0) - workspace-internal only, consumed as TS source
- [Phase 01]: npm publish (not pnpm publish) for provenance attestation compatibility
- [Phase 01]: Tag pattern n8n-nodes-*@* for per-package selective publishing
- [Phase 01]: CEIDG node uses single resource (Company) with 3 operations - simplest declarative pattern
- [Phase 01]: Resource-split pattern: multi-resource nodes split into resources/{name}.ts files
- [Phase 01]: format=json in requestDefaults.qs at node level for SMSAPI legacy endpoint compatibility
- [Phase 01]: Declarative node testing via description structure validation + nock HTTP contract tests
- [Phase 01]: ts-jest diagnostics:false in SMSAPI jest.config.js to bypass n8n-workflow Icon type incompatibility
- [Phase 01]: README structure follows n8n community node conventions with operations table, dual install methods, and example workflow JSON
- [Phase 01]: String-form icon paths instead of object form for n8n-workflow 2.13+ compatibility
- [Phase 01]: configWithoutCloudSupport with strict:false to allow custom eslint config excluding test files
- [Phase 01]: Replaced fast-glob with recursive fs.readdirSync in copy-codex.js
- [Phase 01]: npm link (not pnpm link) for n8n custom node development
- [Phase 01]: CEIDG API v3 (not v2) -- v2 deprecated, v3 uses Bearer auth and /firma endpoint
- [Phase 01]: No code changes to node/credential files -- only test assertions were stale after v2->v3 migration
- [Phase 02]: No authenticate block on credentials -- auth handled via api_token query param in GenericFunctions due to dynamic subdomain URL
- [Phase 02]: Resource selector only lists invoice -- client/product added in Plan 03
- [Phase 02]: PDF download uses json:false + encoding:arraybuffer via GenericFunctions options
- [Phase 02]: Resource files force-added due to root .gitignore excluding resources/ globally
- [Phase 02]: Programmatic node tests mock helpers.httpRequest directly (not httpRequestWithAuthentication)
- [Phase 02]: Binary PDF download test mocks both httpRequest and prepareBinaryData
- [Phase 02]: eslint-disable for no-http-request-with-manual-auth justified by dynamic subdomain URL construction
- [Phase 12]: Static class properties to expose GenericFunctions imports -- avoids unused-import tsc error
- [Phase 12]: eslint-disable for no-http-request-with-manual-auth justified by dynamic per-customer domain URL
- [Phase 12]: Product create always sends 13 required fields (9 booleans false + 4 arrays empty) for API validation
- [Phase 12]: Cancel uses PATCH /deliveries/{orderId} with { ids } body -- no DELETE on deliveries endpoint
- [Phase 12]: Label download handles base64-in-JSON and direct base64 responses for robustness
- [Phase 12]: Items field as JSON string with automatic empty array defaults for required item sub-fields
- [Phase 12]: Confirm operation uses full SupplierOrderType body per Swagger spec (not batch confirm by IDs)
- [Phase 12]: Payment status uses flexible identifier type (id/externalId/clientOrderNumber) for order matching
- [Phase 12]: paymentTransactionIdForPayment field name avoids collision with existing create field
- [Phase 12]: Credential icon property added for lint compliance -- new eslint rule
- [Phase 14]: No credentials property for public API nodes (NBP pattern)
- [Phase 14]: Test credentials assertion checks undefined OR empty array for public API nodes
- [Phase 10]: fast-xml-parser + entities as runtime deps for SOAP response parsing
- [Phase 10]: Template-literal SOAP envelopes instead of soap npm package for 5 fixed endpoints
- [Phase 10]: Session ID sent as HTTP header (not cookie/body) per GUS BIR API spec
- [Phase 10]: No ICredentialTestRequest on GUS credentials -- SOAP login requires programmatic execution
- [Phase 10]: Session-per-call pattern for getFullData (3 sessions = 9 HTTP calls) accepted for code simplicity
- [Phase 10]: ESM transform in jest.config.js for entities and fast-xml-parser via transformIgnorePatterns + ts-jest allowJs
- [Phase 10]: Disabled credential-test-required eslint rule for SOAP-based auth (cannot use ICredentialTestRequest)
- [Phase 11]: No credentials for VIES -- public EC API, follows NBP pattern
- [Phase 11]: No credentials property for public API (KRS follows NBP pattern)
- [Phase 11]: Declarative node with no credentials following NBP pattern for public API
- [Phase 13]: Dual auth: v3 Bearer from AuthorizationService.svc/GetToken, v2 apiKey as query param
- [Phase 13]: Token caching at module level with resetTokenCache for test isolation
- [Phase 13]: eslint-disable for no-http-request-with-manual-auth (3 instances) due to programmatic token flow
- [Phase 13]: Static class properties to expose GenericFunctions imports (avoids unused-import tsc error)
- [Phase 13]: v3 tests mock two httpRequest calls (GetToken + endpoint), v2 tests mock one call
- [Phase 03]: Static class properties to expose GenericFunctions imports (avoids unused-import tsc error)
- [Phase 03]: eslint-disable for no-http-request-with-manual-auth justified by environment-based dynamic URL construction
- [Phase 03]: Locker vs courier service-aware field visibility using displayOptions
- [Phase 03]: Cancel and getLabel use org-scoped endpoints per InPost ShipX API spec
- [Phase 03]: Resource files force-added due to root .gitignore excluding resources/ globally
- [Phase 03]: Kept existing SVG icon (parcel-style design) rather than replacing with text-based IP icon
- [Phase 15]: No credentials property for public API nodes (NFZ follows NBP pattern)
- [Phase 15]: Miscellaneous > Other category for codex (n8n has no Healthcare category)
- [Phase 16]: Author email uses mp@codersgroup.pl (actual repo value) for test assertions
- [Phase 16]: Icons validated in icons/ directory (actual project structure) not nodes/NodeName/
- [Phase 16]: ts-jest diagnostics disabled in structural config to avoid n8n-workflow type issues
- [Phase 16]: Added Sales to allowed codex categories (used by LinkerCloud)
- [Phase 17]: Removed unused NodeApiError/INode imports from SMSAPI test after converting to HTTP integration pattern
- [Phase 18]: Port 5679 for test container to avoid conflict with dev compose on 5678
- [Phase 18]: Pinned n8n image to 2.12.3 for reproducible integration tests
- [Phase 18]: Dynamic node list generation from packages/*/package.json instead of hardcoded list
- [Phase 18]: Owner setup + login fallback for n8n API auth in workflow import tests
- [Phase 19]: 30s test timeout for E2E (vs 120s integration) -- public API calls should complete fast
- [Phase 19]: unwrapResult helper handles both array-of-items and direct API response from n8n webhook
- [Phase 20]: GUS_REGON_KEY defaults to public test key abcde12345abcde12345 so tests run without env var
- [Phase 20]: GUS REGON uses unconditional describe (always runs) with public test key
- [Phase 21]: Positions field as JSON string in fakturownia-create fixture (node calls JSON.parse)
- [Phase 21]: InPost credential includes environment: sandbox to use sandbox base URL
- [Phase 23]: No code change for activateWorkflow -- POST+PATCH fallback confirmed already correct
- [Phase 23]: Pre-existing structural test failures (author.email mismatch) noted but out of scope

### Roadmap Evolution

- Phase 11 added: node dla KRS, biała lista podatników VAT, VIES i GUS
- Phase 12 added: mmode dla Linker Cloud - dokumentacje do api znajduyje sie w folderze resources/linker_cloud_api.json
- Phase 13 added: node dla integracji z api Ceneo - mozliwosc weryfikowania cen rynkowych
- Phase 14 added: node do pobierania kursu walut z nbp
- Phase 15 added: integracja z https://api.nfz.gov.pl/app-itl-api/
- Phase 16 added: Testy strukturalne - walidacja konfiguracji wszystkich packages (package.json, codex, ikony, build)
- Phase 17 added: Unit testy z mockami HTTP (nock) dla wszystkich nodow
- Phase 18 added: Testy integracyjne z n8n w Dockerze - workflow runner z prawdziwym n8n

### Pending Todos

None yet.

### Blockers/Concerns

- Verify `@n8n/node-cli` vs `n8n-node-dev` existence before Phase 1 starts
- Verify current `n8nNodesApiVersion` (1 or 2)
- iFirma HMAC signing format has sparse documentation -- plan exploratory sandbox testing (Phase 8)
- Przelewy24 CRC field order needs verification against current P24 API docs (Phase 4)
- GUS REGON SOAP envelope format needs live sandbox verification (Phase 10)

## Session Continuity

Last session: 2026-03-25T19:55:44.463Z
Stopped at: Completed 23-01-PLAN.md
Resume file: None
