# Roadmap: n8n Polish Nodes

## Overview

This roadmap delivers 11 n8n community nodes for Polish services as independently published npm packages from a shared monorepo. The journey starts with infrastructure and the two simplest nodes (CEIDG as pipeline guinea pig, SMSAPI as confirmed demand), then progressively adds complexity: pagination and binary data (Fakturownia), programmatic style with nested inputs (InPost), cryptographic signing (Przelewy24), RPC-style single-endpoint pattern (BaseLinker), OAuth2 and XML parsing (Shoper + wFirma), and finally the three hardest nodes requiring HMAC signing, OAuth2 Authorization Code, and SOAP/XML (iFirma, Allegro, GUS REGON). Each phase introduces exactly one new technical challenge to prevent compounding complexity.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Monorepo Bootstrap + SMSAPI + CEIDG** - Establish infrastructure, shared tooling, CI/CD pipeline, and deliver the first two nodes (completed 2026-03-21)
- [ ] **Phase 2: Fakturownia** - Pagination and binary PDF download patterns via invoice management node
- [ ] **Phase 3: InPost ShipX** - Programmatic node with complex nested input, environment toggle, and binary label download
- [ ] **Phase 4: Przelewy24** - Cryptographic CRC SHA384 signing pattern for payment transactions
- [ ] **Phase 5: BaseLinker** - Unique RPC single-endpoint POST pattern for e-commerce orders/products/shipping
- [ ] **Phase 6: Shoper** - OAuth2 client_credentials pattern with rate limiting for e-commerce
- [ ] **Phase 7: wFirma** - XML response parsing pattern for accounting/invoicing
- [ ] **Phase 8: iFirma** - HMAC-SHA1 request signing pattern for accounting
- [ ] **Phase 9: Allegro** - OAuth2 Authorization Code flow for marketplace integration
- [ ] **Phase 10: GUS REGON** - SOAP/XML session-based API for government business registry

## Phase Details

### Phase 1: Monorepo Bootstrap + SMSAPI + CEIDG
**Goal**: Working monorepo with shared tooling, validated publish pipeline with provenance, and two published declarative nodes
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07, SMSAPI-01, SMSAPI-02, SMSAPI-03, SMSAPI-04, SMSAPI-05, SMSAPI-06, SMSAPI-07, SMSAPI-08, SMSAPI-09, SMSAPI-10, SMSAPI-11, SMSAPI-12, SMSAPI-13, CEIDG-01, CEIDG-02, CEIDG-03, CEIDG-04, CEIDG-05, CEIDG-06, CEIDG-07, CEIDG-08
**Success Criteria** (what must be TRUE):
  1. Running `npm run build` from root compiles all packages; `npm run test` and `npm run lint` pass across the monorepo
  2. CEIDG node installed via `npm link` appears in n8n node picker, and a user can search a company by NIP and see structured JSON results
  3. SMSAPI node installed via `npm link` appears in n8n, and a user can send a test SMS (test mode), list contacts, check account balance -- all returning valid JSON (format=json enforced)
  4. Pushing a git tag `n8n-nodes-ceidg@0.1.0` triggers GitHub Actions publish with provenance attestation; package appears on npmjs.com with provenance badge
  5. Shared test utilities (mock IExecuteFunctions) work -- `npm run test` in any package directory runs nock-based tests for happy path and error handling
**Plans**: 11 plans

Plans:
- [x] 01-01: Monorepo root -- pnpm-workspace.yaml, package.json, tsconfig.base.json, jest.config.base.js, .gitignore, LICENSE, scripts/copy-codex.js
- [x] 01-02: Shared test utilities -- createMockExecuteFunctions (no n8n-core), nock helpers in shared/test-utils/
- [x] 01-03: CI/CD workflows and README -- ci.yml, publish.yml (provenance), verify-packages.js, root README.md
- [x] 01-04: CEIDG node -- credentials (API Key, IAuthenticateGeneric), declarative routing for Search by NIP, Search by Name, Get; codex, SVG icon
- [x] 01-05: SMSAPI node -- credentials (Bearer Token), declarative node with 4 resources (SMS, Contacts, Groups, Account); format=json in requestDefaults
- [x] 01-06: CEIDG tests -- nock-based tests for node description, routing validation, HTTP error handling
- [x] 01-07: SMSAPI tests -- nock-based tests for all 9 operations, format=json verification, error handling
- [x] 01-08: Package READMEs -- CEIDG and SMSAPI README.md with operations, credentials, example workflow
- [x] 01-09: Full pipeline build -- pnpm install, build:all, lint:all, test:all, verify-packages integration
- [x] 01-10: Pipeline validation -- link to n8n, verify node discovery in picker (human checkpoint)
- [x] 01-11: Gap closure -- fix CEIDG test assertions for v3 API (v2 -> v3 baseURL, /firmy -> /firma, credential auth string)

**Technical Notes:**
- Resolve pnpm vs npm workspaces: test `npm link` compatibility first. Default: npm workspaces per ARCHITECTURE.md recommendation
- Verify `@n8n/node-cli` vs `n8n-node-dev` existence via `npm view`
- Check current `n8nNodesApiVersion` (1 or 2) against n8n-nodes-starter template
- n8n-workflow as peerDependency + devDependency (NOT regular dependency)
- CJS output only via tsc -- no bundlers
- SMSAPI: always inject `format=json` in requestDefaults at node level, not per-operation (Pitfall 1)
- CEIDG is the pipeline guinea pig -- validate full publish flow before SMSAPI
- Copy-assets build step required: tsc ignores .svg and .node.json files
- CEIDG API upgraded to v3 during plan 01-10 (v2 deprecated); `npm publish --dry-run` blocked by `n8n-node prerelease` by design (forces GitHub Actions path)

---

### Phase 2: Fakturownia
**Goal**: Users can manage invoices, clients, and products with automatic pagination and download invoice PDFs as binary data
**Depends on**: Phase 1
**Requirements**: FAKT-01, FAKT-02, FAKT-03, FAKT-04, FAKT-05, FAKT-06, FAKT-07, FAKT-08, FAKT-09, FAKT-10
**Success Criteria** (what must be TRUE):
  1. User can create an invoice with all required fields (kind, number, dates, buyer info, positions array, payment type) and retrieve it back
  2. User can list invoices with filters and toggle "Return All" to automatically paginate through all pages (25 items/page)
  3. User can download an invoice PDF that opens correctly as a valid PDF file in the next workflow node (binary data output)
  4. User can manage clients (List, Get, Create) and products (List, Create) as separate resources
  5. Dynamic base URL is constructed from subdomain credential (e.g., `mycompany.fakturownia.pl`)
**Plans**: 4 plans

Plans:
- [ ] 02-01-PLAN.md -- Package scaffold, credentials (apiToken + subdomain), GenericFunctions (API request helper + pagination helper)
- [ ] 02-02-PLAN.md -- Node class with execute() + Invoice resource (7 operations: list, get, create, update, delete, sendByEmail, downloadPdf)
- [ ] 02-03-PLAN.md -- Clients resource (list, get, create) + Products resource (list, create) wired into node
- [ ] 02-04-PLAN.md -- Nock tests for all operations, codex, SVG icon, README, build verification (human checkpoint)

**Technical Notes:**
- Fully programmatic node (execute() method) -- PDF download + pagination require it
- Use `encoding: 'arraybuffer'` + `this.helpers.prepareBinaryData()` for PDF
- Subdomain-based URL: constructed dynamically in GenericFunctions.ts from credentials
- Auth via `api_token` query parameter (not header) per Fakturownia API docs
- Pagination pattern: `page` + `per_page` params, end detection by `response.length < per_page`
- Set meaningful filename on binary: `invoice-{id}.pdf`
- Subdomain sanitization: strip `.fakturownia.pl` suffix if user accidentally includes it

---

### Phase 3: InPost ShipX
**Goal**: Users can create shipments with complex nested data, download shipping labels, track packages, and switch between sandbox and production
**Depends on**: Phase 2
**Requirements**: INPOST-01, INPOST-02, INPOST-03, INPOST-04, INPOST-05, INPOST-06, INPOST-07, INPOST-08, INPOST-09
**Success Criteria** (what must be TRUE):
  1. User can create a shipment with nested receiver data (name, phone, email), target parcel locker, parcel dimensions/weight, and optional COD/insurance
  2. User can download a shipping label as PDF in A4 or A6 format that opens correctly
  3. User can track a shipment by tracking number and see status history
  4. User can switch between sandbox and production environments via a toggle in credentials
  5. User can list and search Paczkomaty (parcel locker points)
**Plans**: 7 plans

Plans:
- [ ] 03-01: InPost credentials -- Bearer Token + organization_id + environment toggle (sandbox: sandbox-api-shipx.inpost.pl / production: api-shipx.inpost.pl)
- [ ] 03-02: Shipments Create operation -- complex nested input builder for receiver, parcels (dimensions, weight), service type, target_point, cod, insurance
- [ ] 03-03: Shipments Get, List, Cancel operations -- standard CRUD with pagination
- [ ] 03-04: Shipments Get Label operation -- binary PDF download with A4/A6 format selection
- [ ] 03-05: Points and Tracking resources -- Points List/Get (Paczkomaty), Tracking Get by tracking number
- [ ] 03-06: Error handling and continueOnFail -- NodeApiError wrapping, rate limit documentation (100 req/min), continueOnFail support
- [ ] 03-07: Tests and package finalization -- nock tests for all operations, package.json, codex, SVG icon, README

**Technical Notes:**
- Fully programmatic node -- complex shipment creation logic requires execute()
- Nested input: use fixedCollection for receiver data, parcels array
- Binary label: reuse pattern from Phase 2 (Fakturownia PDF download)
- Rate limit 100 req/min: document in README, do not implement automatic retry
- Organization ID routing in request headers

---

### Phase 4: Przelewy24
**Goal**: Users can register, verify, and refund payment transactions with automatic CRC SHA384 checksum signing
**Depends on**: Phase 3
**Requirements**: P24-01, P24-02, P24-03, P24-04, P24-05, P24-06, P24-07, P24-08, P24-09, P24-10
**Success Criteria** (what must be TRUE):
  1. User can register a transaction with amount in PLN (automatically converted to grosze) and receive a payment URL
  2. User can verify a completed transaction (PUT) with correct CRC checksum
  3. User can create a refund and check payment method availability
  4. CRC SHA384 checksum is calculated correctly -- unit tests pass with known test vectors from P24 sandbox
  5. User can switch between sandbox and production environments; Test Access operation confirms valid credentials
**Plans**: 7 plans

Plans:
- [ ] 04-01: Przelewy24 credentials -- merchantId + CRC key + environment toggle (sandbox: sandbox.przelewy24.pl / production: secure.przelewy24.pl)
- [ ] 04-02: CRC SHA384 checksum function -- isolated, unit-testable; handles different field orders for registration vs verification
- [ ] 04-03: Transactions Register operation -- PLN to grosze conversion (Math.round), CRC signing, returns payment URL
- [ ] 04-04: Transactions Verify (PUT) and Get by Session ID operations
- [ ] 04-05: Refunds Create and Payment Methods List operations
- [ ] 04-06: Account Test Access operation -- lightweight credential validation
- [ ] 04-07: Tests and package finalization -- unit tests for CRC function with known vectors, nock integration tests, package.json, codex, SVG icon, README

**Technical Notes:**
- Amounts in grosze: `Math.round(parseFloat(amountPLN) * 100)` -- test with 19.99, 0.10, 100.01 (Pitfall 11)
- CRC field order differs between register and verify endpoints (Pitfall 12)
- Build and unit-test CRC function BEFORE integration testing
- Use Node.js built-in `crypto.createHash('sha384')` -- no external deps
- Programmatic style required due to CRC signing

---

### Phase 5: BaseLinker
**Goal**: Users can manage e-commerce orders, products, and shipping through BaseLinker's unique single-endpoint RPC API
**Depends on**: Phase 4
**Requirements**: BLNKR-01, BLNKR-02, BLNKR-03, BLNKR-04, BLNKR-05, BLNKR-06, BLNKR-07, BLNKR-08, BLNKR-09, BLNKR-10, BLNKR-11
**Success Criteria** (what must be TRUE):
  1. User can list orders with date filters (Unix timestamp) and toggle "Return All" for automatic pagination
  2. User can get order details, update order status, and add new orders
  3. User can list products, get product data, update stock quantities, and update prices
  4. User can create shipping packages and get shipping labels
  5. API errors in BaseLinker format (HTTP 200 with `status: "ERROR"`) are caught and shown as clear NodeApiError messages
**Plans**: 8 plans

Plans:
- [ ] 05-01: BaseLinker credentials -- API Token in X-BLToken header, test connection via getJournalList or similar lightweight method
- [ ] 05-02: RPC helper function -- single-endpoint POST to connector.php with `method` + `parameters` in body; resource/operation to method name lookup table
- [ ] 05-03: Orders resource -- getOrders (List with pagination), getOrders by id (Get), setOrderStatus (Update Status), addOrder (Add)
- [ ] 05-04: Products resource -- getInventoryProductsList (List), getInventoryProductsData (Get), updateInventoryProductsStock, updateInventoryProductsPrices
- [ ] 05-05: Shipping resource -- createPackage (Create Package), getOrderPackages (Get Label)
- [ ] 05-06: Pagination and date handling -- page parameter, max 100 items, Unix timestamp conversion for date filters
- [ ] 05-07: Error handling -- custom response checking (status field in JSON body), BaseLinker error codes to NodeApiError mapping
- [ ] 05-08: Tests and package finalization -- nock tests with form-encoded body matching, package.json, codex (Sales), SVG icon, README

**Technical Notes:**
- ALL requests are POST to single URL `https://api.baselinker.com/connector.php` (Pitfall 7)
- Body is form-encoded: `method=getOrders&parameters={"date_from":1234567890}`
- Must use programmatic style from day 1 -- declarative routing cannot handle this
- Error responses have HTTP 200 + `{"status": "ERROR", "error_code": "...", "error_message": "..."}` -- manual error checking required
- Dates are Unix timestamps, not ISO 8601
- Rate limit 100 req/min: document in README
- Largest scope node -- 8 plans reflects the breadth of operations

---

### Phase 6: Shoper
**Goal**: Users can manage products, orders, customers, categories, and stock in their Shoper store via OAuth2 client_credentials with automatic token refresh
**Depends on**: Phase 5
**Requirements**: SHOPER-01, SHOPER-02, SHOPER-03, SHOPER-04, SHOPER-05, SHOPER-06, SHOPER-07, SHOPER-08, SHOPER-09, SHOPER-10
**Success Criteria** (what must be TRUE):
  1. User can authenticate via OAuth2 client_credentials by providing client_id, client_secret, and shop_domain; token refreshes automatically
  2. User can perform full CRUD on products and list/get/update orders with pagination (limit + offset)
  3. User can manage customers (List, Get, Create) and browse categories (List, Get)
  4. User can update stock quantities for products
  5. Rate limiting (2 req/sec) is handled with exponential backoff retry -- requests succeed even under load
**Plans**: 7 plans

Plans:
- [ ] 06-01: Shoper credentials -- OAuth2 client_credentials (client_id, client_secret, shop_domain), extends oAuth2Api with clientCredentials grant type
- [ ] 06-02: Products resource -- List, Get, Create, Update, Delete with Additional Fields pattern
- [ ] 06-03: Orders resource -- List, Get, Update Status with date/status filters
- [ ] 06-04: Customers and Categories resources -- Customers List/Get/Create, Categories List/Get
- [ ] 06-05: Stock Update operation and pagination -- limit + offset pagination pattern, Stock Update for inventory
- [ ] 06-06: Rate limiting and retry -- exponential backoff on 429 responses (2 req/sec limit)
- [ ] 06-07: Tests and package finalization -- nock tests with OAuth2 token mocking, package.json, codex (Sales), SVG icon, README

**Technical Notes:**
- Use n8n built-in OAuth2 credential type -- handles token caching and refresh automatically (Pitfall 17)
- Do NOT implement manual token management
- Dynamic base URL from shop_domain credential: `https://{shop_domain}/webapi/rest/`
- Pagination: limit + offset pattern (different from page-based in Fakturownia/BaseLinker)
- Rate limit 2 req/sec is aggressive -- retry with exponential backoff is essential

---

### Phase 7: wFirma
**Goal**: Users can manage invoices, contractors, expenses, and VAT declarations with automatic XML-to-JSON response conversion
**Depends on**: Phase 6
**Requirements**: WFIRMA-01, WFIRMA-02, WFIRMA-03, WFIRMA-04, WFIRMA-05, WFIRMA-06, WFIRMA-07, WFIRMA-08
**Success Criteria** (what must be TRUE):
  1. User can authenticate via Basic Auth (or API Key) and access their wFirma account
  2. User can create and list invoices, download invoice PDFs as binary data
  3. User can manage contractors (List, Get, Create) and expenses (List, Create)
  4. All XML responses are transparently converted to clean JSON -- users see JSON in n8n, not raw XML
  5. Single-item vs array responses from XML are normalized (always array for list operations)
**Plans**: 6 plans

Plans:
- [ ] 07-01: wFirma credentials -- Basic Auth (login + password) or API Key, test connection endpoint
- [ ] 07-02: XML parser setup -- fast-xml-parser configuration with ignoreAttributes: false, response flattening to clean JSON structure
- [ ] 07-03: Invoices resource -- List, Get, Create, Download PDF (binary); XML response parsing on every operation
- [ ] 07-04: Contractors and Expenses resources -- Contractors List/Get/Create, Expenses List/Create
- [ ] 07-05: VAT Declarations List and response normalization -- single-item vs array handling (always normalize to array)
- [ ] 07-06: Tests and package finalization -- nock tests with XML response fixtures, package.json, codex (Finance & Accounting), SVG icon, README

**Technical Notes:**
- wFirma returns XML, not JSON -- fast-xml-parser 4.x required as runtime dependency
- Flatten nested XML structure before returning to n8n (Pitfall 16): `<api><invoices><invoice>` -> flat invoice object
- Handle single-item vs array inconsistency: `Array.isArray()` check on parsed result
- Configure fast-xml-parser with `ignoreAttributes: false` (wFirma uses XML attributes)
- PDF download: reuse binary pattern from Phase 2
- Programmatic style required due to XML parsing

---

### Phase 8: iFirma
**Goal**: Users can manage invoices, expenses, and contractors with transparent HMAC-SHA1 request signing on every API call
**Depends on**: Phase 7
**Requirements**: IFIRMA-01, IFIRMA-02, IFIRMA-03, IFIRMA-04, IFIRMA-05, IFIRMA-06, IFIRMA-07
**Success Criteria** (what must be TRUE):
  1. User can authenticate with API Key + HMAC signing key; every request is transparently signed
  2. User can create invoices and download them as PDF (binary data)
  3. User can manage expenses (List, Create) and list contractors
  4. HMAC-SHA1 signature function passes unit tests with known input/output pairs
  5. Different API keys for different resource types (invoices vs expenses) are handled correctly in credentials
**Plans**: 6 plans

Plans:
- [ ] 08-01: iFirma credentials -- API Key + HMAC-SHA1 signing key (multiple keys for different resource types), clear field labels
- [ ] 08-02: HMAC-SHA1 signing function -- isolated, unit-testable; uses Node.js crypto.createHmac('sha1', key)
- [ ] 08-03: Invoices resource -- List, Create, Get PDF (binary); HMAC signing applied to every request
- [ ] 08-04: Expenses and Contractors resources -- Expenses List/Create, Contractors List
- [ ] 08-05: Unit tests for HMAC function -- known input/output pairs, edge cases; verify signing against iFirma sandbox
- [ ] 08-06: Integration tests and package finalization -- nock tests, package.json, codex (Finance & Accounting), SVG icon, README

**Technical Notes:**
- HMAC-SHA1 signing format: verify exact string-to-sign against iFirma docs (Pitfall 10, LOW confidence)
- Plan 1-2 days exploratory sandbox testing for signing algorithm
- Different API keys for invoices vs expenses -- credential must store multiple keys
- Use Node.js built-in `crypto.createHmac` -- no external crypto deps
- Log string-to-sign during development, never in published code
- Build and test signing function BEFORE any integration work

---

### Phase 9: Allegro
**Goal**: Users can manage marketplace offers, orders, and shipping via OAuth2 Authorization Code flow with sandbox/production support
**Depends on**: Phase 8
**Requirements**: ALLEGRO-01, ALLEGRO-02, ALLEGRO-03, ALLEGRO-04, ALLEGRO-05, ALLEGRO-06, ALLEGRO-07, ALLEGRO-08
**Success Criteria** (what must be TRUE):
  1. User can authenticate via OAuth2 Authorization Code flow with consent redirect; token refreshes automatically
  2. User can list their offers, get offer details, and update offers
  3. User can list and get orders, and mark shipments
  4. User can get available shipping carriers and their own user profile (Get Me)
  5. User can switch between sandbox (allegrosandbox.pl) and production (allegro.pl) via credential toggle
**Plans**: 7 plans

Plans:
- [ ] 09-01: Allegro credentials -- OAuth2 Authorization Code (clientId, clientSecret, redirectUri), extends oAuth2Api, sandbox/production toggle with different OAuth URLs
- [ ] 09-02: Automatic token refresh -- verify n8n built-in OAuth2 handles refresh token flow for Allegro
- [ ] 09-03: Offers resource -- List My Offers, Get, Update with pagination (cursor-based)
- [ ] 09-04: Orders resource -- List, Get, Shipment (mark as shipped)
- [ ] 09-05: Shipping and Users resources -- Get Carriers, Get Me (user profile)
- [ ] 09-06: Error handling and rate limiting -- per-endpoint backoff, NodeApiError wrapping
- [ ] 09-07: Tests and package finalization -- nock tests with OAuth2 token mocking, package.json, codex (Sales), SVG icon, README

**Technical Notes:**
- OAuth2 Authorization Code is the most complex auth flow in n8n community nodes
- Redirect URI format depends on n8n deployment -- document clearly (Pitfall 6)
- Sandbox domain `allegrosandbox.pl` has DIFFERENT OAuth endpoints than production `allegro.pl`
- V1 scope: only Offers, Orders, Shipping, Users (not the full 100+ endpoint API)
- Cursor-based pagination (different from page/offset patterns)
- Test OAuth flow manually in actual n8n instance -- cannot fully test with nock alone

---

### Phase 10: GUS REGON
**Goal**: Users can search the Polish government business registry by NIP/REGON/KRS with transparent SOAP session management and XML parsing
**Depends on**: Phase 9
**Requirements**: REGON-01, REGON-02, REGON-03, REGON-04, REGON-05, REGON-06, REGON-07, REGON-08, REGON-09
**Success Criteria** (what must be TRUE):
  1. User can search companies by NIP, REGON, or KRS number and see structured JSON results (not raw XML)
  2. User can get full company data including PKD codes
  3. SOAP session management is transparent -- user does not interact with login/logout flow
  4. Polish characters in company names and search terms are handled correctly (XML encoding)
  5. Double-encoded CDATA responses (HTML-encoded XML inside SOAP) are parsed correctly
**Plans**: 7 plans

Plans:
- [ ] 10-01: GUS REGON credentials -- API Key (free from dane.biznes.gov.pl), environment info in description
- [ ] 10-02: SOAP envelope builder -- XML construction with fast-xml-parser or template literals, proper namespace declarations
- [ ] 10-03: Session management -- DaneZaloguj (login, get session ID) -> operation -> DaneWyloguj (logout); session ID as SOAP header
- [ ] 10-04: Search operations -- Search by NIP, Search by REGON, Search by KRS (DaneSzukajPodmioty with different params)
- [ ] 10-05: Get full data operation -- DanePobierzPelnyRaport for full company data + PKD codes
- [ ] 10-06: Response parsing -- double decode: parse SOAP envelope -> extract CDATA -> HTML-decode -> parse inner XML -> flatten to JSON
- [ ] 10-07: Tests and package finalization -- nock tests with SOAP/XML fixtures, Polish character tests, package.json, codex (Data & Storage), SVG icon, README

**Technical Notes:**
- Most technically complex node -- SOAP/XML with session lifecycle (Pitfall 8)
- Double XML parsing required: SOAP response contains HTML-encoded XML in CDATA sections
- Use fast-xml-parser (already a dependency from Phase 7 wFirma) -- consider shared XML utility if interface matches
- Test with company names containing Polish chars and special XML chars (&, <, ")
- Session pattern: Zaloguj -> sid header -> DaneSzukajPodmioty/DanePobierzPelnyRaport -> Wyloguj
- Consider `soap` npm library only if handcrafted XML proves too fragile
- Test vs production: same API key, different login method -- document clearly

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Monorepo Bootstrap + SMSAPI + CEIDG | 11/11 | Complete | 2026-03-21 |
| 2. Fakturownia | 0/4 | Planning complete | - |
| 3. InPost ShipX | 0/7 | Not started | - |
| 4. Przelewy24 | 0/7 | Not started | - |
| 5. BaseLinker | 0/8 | Not started | - |
| 6. Shoper | 0/7 | Not started | - |
| 7. wFirma | 0/6 | Not started | - |
| 8. iFirma | 0/6 | Not started | - |
| 9. Allegro | 0/7 | Not started | - |
| 10. GUS REGON | 0/7 | Not started | - |

### Phase 11: node dla KRS, biala lista podatnikow VAT, VIES i GUS

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 10
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 11 to break down)

### Phase 12: mmode dla Linker Cloud przez realizacja base linker - dokumentacje do api linker clud dostarcze

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 11
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 12 to break down)

### Phase 13: node dla integracji z api Ceneo - mozliwosc weryfikowania cen rynkowych

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 12
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 13 to break down)

### Phase 14: node do pobierania kursu walut z nbp

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 13
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 14 to break down)

### Phase 15: integracja z https://api.nfz.gov.pl/app-itl-api/

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 14
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 15 to break down)

---
*Roadmap created: 2026-03-20*
*Granularity: Fine (10 phases, 70 plans)*
*Coverage: 88/88 v1 requirements mapped*
