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
- [x] **Phase 10: GUS REGON** - SOAP/XML session-based API for government business registry (completed 2026-03-22)
- [x] **Phase 19: E2E testy - publiczne API** - NBP, NFZ, KRS, Biała Lista VAT, VIES + CEIDG (z kluczem) (completed 2026-03-25)
- [x] **Phase 20: E2E testy - API z kluczem** - SMSAPI (test mode), Ceneo, GUS REGON, Linkercloud (completed 2026-03-25)
- [ ] **Phase 21: E2E testy - Fakturownia + InPost** - Sandbox/token auth

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
**Plans**: 5 plans

Plans:
- [x] 02-01-PLAN.md -- Package scaffold, credentials (apiToken + subdomain), GenericFunctions (API request helper + pagination helper)
- [x] 02-02-PLAN.md -- Node class with execute() + Invoice resource (7 operations: list, get, create, update, delete, sendByEmail, downloadPdf)
- [x] 02-03-PLAN.md -- Clients resource (list, get, create) + Products resource (list, create) wired into node
- [x] 02-04-PLAN.md -- Nock tests for all operations, codex, SVG icon, README, build verification (human checkpoint)
- [x] 02-05-PLAN.md -- Gap closure: fix 11 lint errors (3 manual in GenericFunctions.ts + 8 autofix in resource files)

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
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md -- Package scaffold, credentials (Bearer + orgId + env toggle), GenericFunctions (API helper + pagination), node skeleton with Shipment Create
- [x] 03-02-PLAN.md -- Remaining operations (Shipments Get/List/Cancel/Label + Points List/Get + Tracking Get) wired into execute()
- [ ] 03-03-PLAN.md -- Nock tests for all operations, codex, SVG icon, README, build + lint verification

**Technical Notes:**
- Fully programmatic node -- complex shipment creation logic requires execute()
- Nested input: use fixedCollection for receiver data, parcels array
- Binary label: reuse pattern from Phase 2 (Fakturownia PDF download)
- Rate limit 100 req/min: document in README, do not implement automatic retry
- Organization ID from credentials, interpolated into URL paths
- Environment toggle: sandbox=sandbox-api-shipx-pl.easypack24.net, production=api-shipx-pl.easypack24.net
- Locker vs courier: displayOptions control target_point vs address fields
- Pagination: page/per_page with {items, total_pages} envelope (different from Fakturownia array response)

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
**Plans**: 3 plans

Plans:
- [x] 10-01-PLAN.md -- Package scaffold, credentials (apiKey + environment toggle), SoapTemplates (5 envelope functions), XmlParser (double-decode pipeline), GenericFunctions (session-managed SOAP request)
- [x] 10-02-PLAN.md -- Company resource (4 operations: searchByNip, searchByRegon, searchByKrs, getFullData) + GusRegon.node.ts with execute()
- [x] 10-03-PLAN.md -- SOAP XML fixtures, XmlParser unit tests, node integration tests, codex, SVG icon, README, build + lint verification

**Technical Notes:**
- Most technically complex node -- SOAP/XML with session lifecycle
- Double XML parsing required: SOAP response contains HTML-encoded XML in CDATA sections
- Runtime dependencies: fast-xml-parser + entities (for HTML decoding of CDATA content)
- Template-literal SOAP envelopes (proven pattern from bir1 npm package)
- Session pattern: Zaloguj -> sid HTTP header -> DaneSzukajPodmioty/DanePobierzPelnyRaport -> Wyloguj
- GetValue action uses different namespace (http://CIS/BIR/2014/07 vs http://CIS/BIR/PUBL/2014/07)
- getFullData auto-detects entity type (P/F) to select correct report type
- Test key: abcde12345abcde12345

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Monorepo Bootstrap + SMSAPI + CEIDG | 11/11 | Complete | 2026-03-21 |
| 2. Fakturownia | 1/4 | In Progress|  |
| 3. InPost ShipX | 0/3 | Planned    |  |
| 4. Przelewy24 | 0/7 | Not started | - |
| 5. BaseLinker | 0/8 | Not started | - |
| 6. Shoper | 0/7 | Not started | - |
| 7. wFirma | 0/6 | Not started | - |
| 8. iFirma | 0/6 | Not started | - |
| 9. Allegro | 0/7 | Not started | - |
| 10. GUS REGON | 3/3 | Complete    | 2026-03-22 |
| 19. E2E: publiczne API | 1/2 | Complete    | 2026-03-25 |
| 20. E2E: API z kluczem | 1/2 | Complete    | 2026-03-25 |
| 21. E2E: Fakturownia + InPost | 0/0 | Not started | - |

### Phase 11: KRS, Biala Lista VAT, VIES
**Goal:** Three declarative n8n nodes for Polish/EU public registries -- KRS (National Court Register), Biala Lista VAT (White List taxpayer verification), and VIES (EU VAT number validation) -- all using public APIs with no authentication
**Requirements**: KRS-01, KRS-02, KRS-03, KRS-04, BL-01, BL-02, BL-03, BL-04, BL-05, BL-06, VIES-01, VIES-02, VIES-03, VIES-04
**Depends on:** Phase 10
**Plans:** 0/3 plans executed
**Success Criteria** (what must be TRUE):
  1. User can look up a company by KRS number and get current or full historical extract as structured JSON
  2. User can search VAT taxpayers by NIP/REGON/bank account (single and batch up to 30) with required date parameter
  3. User can verify if a bank account belongs to a NIP/REGON holder (TAK/NIE response)
  4. User can validate any EU VAT number by selecting country code from dropdown
  5. All three nodes are declarative (no execute method), require no credentials, and build/lint/test cleanly

Plans:
- [ ] 11-01-PLAN.md -- KRS node: package scaffold, declarative node (Get Current Extract, Get Full Extract), format=json in qs, tests, codex, icon, README
- [ ] 11-02-PLAN.md -- VIES node: package scaffold, declarative node (Validate VAT Number), EU country code dropdown (28 options), tests, codex, icon, README
- [ ] 11-03-PLAN.md -- Biala Lista VAT node: package scaffold, declarative node (6 search + 2 verification ops), required date param, tests, codex, icon, README

**Technical Notes:**
- All three follow NBP (Phase 14) no-credentials declarative pattern
- Zero runtime dependencies for all three packages
- KRS: format=json in requestDefaults.qs (default response is PDF)
- KRS: rejestr optional param (P=entrepreneurs, S=associations, auto-detect if omitted)
- Biala Lista VAT: date param required on every operation (YYYY-MM-DD)
- Biala Lista VAT: rate limits 10 search/day, 5000 check/day
- VIES: handle MS_UNAVAILABLE and MS_MAX_CONCURRENT_REQ in error messages
- All three plans are Wave 1 (no dependencies between them, can run in parallel)

---

### Phase 12: Linker Cloud
**Goal:** Users can manage fulfillment orders, products, stock, shipments, inbound orders, and order returns via the Linker Cloud WMS/OMS API
**Requirements**: LC-01, LC-02, LC-03, LC-04, LC-05, LC-06, LC-07, LC-08, LC-09, LC-10
**Depends on:** Phase 11
**Plans:** 6/6 plans complete
**Success Criteria** (what must be TRUE):
  1. User can create, list, get, update, and cancel fulfillment orders with complex nested items
  2. User can manage products with correct boolean/array defaults and batch-update stock levels by SKU
  3. User can create shipments and download shipping labels as binary (PDF/PNG)
  4. User can manage inbound (supplier) orders and order returns through the full lifecycle
  5. Dynamic base URL constructed from configurable domain credential with apikey query param auth

Plans:
- [x] 12-01-PLAN.md -- Package scaffold, credentials (domain + apiKey), GenericFunctions (API helper + offset/limit pagination), node skeleton
- [x] 12-02-PLAN.md -- Order resource (List, Get, Create, Update, Cancel) with 58-property model and smart field grouping
- [x] 12-03-PLAN.md -- Product resource (List, Create, Update) + Stock resource (List, batch Update)
- [x] 12-04-PLAN.md -- Shipment resource (Create, Create by Order#, Get Label binary, Get Status, Cancel)
- [x] 12-05-PLAN.md -- Inbound Order (List, Get, Create, Update, Confirm) + Order Return (List, Get, Create, Accept)
- [x] 12-06-PLAN.md -- Nock tests, codex, SVG icon, README, build + lint verification

**Technical Notes:**
- Programmatic node following Fakturownia pattern (GenericFunctions + resource file splits)
- Auth via apikey query parameter, domain configurable per customer
- Pagination: offset+limit (strings, default 100), filter bracket notation
- Order items require empty array defaults for serial_numbers, custom_properties, source_data, batch_numbers
- Product creation requires 9 boolean defaults (false) and 4 array defaults ([])
- Label download: base64 in JSON response, decoded to binary via prepareBinaryData

---

### Phase 13: Ceneo Price Comparison
**Goal:** Users can verify market prices on Ceneo (Poland's largest price comparison platform) by querying product offers, top category products, and categories via dual-auth API (v2 apiKey + v3 Bearer token)
**Requirements**: CENEO-01, CENEO-02, CENEO-03, CENEO-04, CENEO-05, CENEO-06, CENEO-07, CENEO-08, CENEO-09, CENEO-10
**Depends on:** Phase 12
**Plans:** 3/3 plans complete
**Success Criteria** (what must be TRUE):
  1. User can get top products in any Ceneo category by name with configurable limit (1-100)
  2. User can get all offers and top 10 cheapest offers for up to 300 product IDs
  3. User can list all Ceneo categories for discovering category names
  4. User can check API execution limits and remaining quota
  5. Dual auth is transparent -- v3 endpoints use Bearer token (auto-acquired from GetToken), v2 endpoints use raw API key

Plans:
- [x] 13-01-PLAN.md -- Package scaffold, credentials (API Key), GenericFunctions (dual auth: v3 Bearer + v2 apiKey), resource definitions (product, category, account)
- [x] 13-02-PLAN.md -- Ceneo.node.ts with execute() routing all 5 operations to correct v2/v3 API helpers
- [ ] 13-03-PLAN.md -- Nock tests (8 cases), codex (Data & Storage > Pricing), SVG icon, README, build + lint verification

**Technical Notes:**
- Programmatic node -- two-step auth (GetToken -> Bearer) and mixed v2/v3 endpoints require execute()
- v3 endpoints: GET with Bearer token in Authorization header (GetTopCategoryProducts, GetCategories)
- v2 endpoints: POST with apiKey as query param + resultFormatter=json (GetAllOffers, GetTop10CheapestOffers, GetExecutionLimits)
- Token caching: per-execution reset via resetTokenCache() at start of execute()
- Base URL: https://developers.ceneo.pl (fixed, not dynamic per customer)
- eslint-disable for no-http-request-with-manual-auth (3 places in GenericFunctions)
- shop_product_ids max 300 IDs, comma-separated
- GetExecutionLimits included as Account > Get Limits (trivial, useful for debugging)
- Follows LinkerCloud resource-split pattern with 3 resource files

---

### Phase 14: NBP Exchange Rates
**Goal:** Users can get official PLN exchange rates (Tables A, B, C) and gold prices from NBP (National Bank of Poland) public API with no authentication required
**Requirements**: NBP-01, NBP-02, NBP-03, NBP-04, NBP-05, NBP-06
**Depends on:** Phase 13
**Plans:** 2/2 plans complete
**Success Criteria** (what must be TRUE):
  1. Node exists as a declarative node with NO credentials -- public API, no registration needed
  2. User can get current, historical, and date-range exchange rates for any currency by ISO 4217 code across Tables A, B, and C
  3. User can get current, historical, and date-range gold prices
  4. All requests use JSON format (Accept header + query param)
  5. Build, lint, and tests pass; package is ready for npm publish

Plans:
- [x] 14-01-PLAN.md -- Package scaffold (package.json, tsconfig, eslint, jest) + declarative node with Exchange Rate (6 ops) and Gold Price (4 ops) resources
- [x] 14-02-PLAN.md -- Nock tests, codex (Data & Storage), SVG icon, README, build + lint verification

**Technical Notes:**
- Simplest possible node -- no credentials, all GET, JSON responses, no pagination, no rate limits
- Follows CEIDG declarative pattern but without credentials
- Date fields use `string` type (not `dateTime`) because NBP expects YYYY-MM-DD format
- Table A = common currencies (mid), Table B = all currencies (mid), Table C = buy/sell (bid/ask)
- Gold price response uses Polish field names: `data` (date), `cena` (price)
- 404 on weekends/holidays for date queries -- "Get Current" always returns latest published
- Maximum 93-day date range
- Exchange rates from 2002, gold prices from 2013

---

### Phase 15: NFZ Treatment Waiting Times
**Goal:** Users can search healthcare treatment waiting times, providers, and service dictionaries from NFZ (National Health Fund of Poland) public API with no authentication required
**Requirements**: NFZ-01, NFZ-02, NFZ-03, NFZ-04, NFZ-05, NFZ-06, NFZ-07, NFZ-08, NFZ-09, NFZ-10
**Depends on:** Phase 14
**Plans:** 2/2 plans complete

**Success Criteria** (what must be TRUE):
  1. Node exists as a declarative node with NO credentials -- public open data API
  2. User can search treatment waiting times by case type, province, benefit name, and locality
  3. User can get details of a specific queue entry and alternative appointment locations
  4. User can search benefit and locality dictionaries
  5. Province dropdown includes all 16 Polish voivodeships for easy filtering
  6. Build, lint, and tests pass; package is ready for npm publish

Plans:
- [x] 15-01-PLAN.md -- Package scaffold (package.json, tsconfig, eslint, jest, icon) + declarative node with Queue (3 ops), Benefit (1 op), Locality (1 op), Province (1 op) resources
- [ ] 15-02-PLAN.md -- Nock tests (description + HTTP contracts), codex, README, build + lint verification

**Technical Notes:**
- Follows NBP no-credentials declarative pattern exactly
- Zero runtime dependencies
- api-version=1.3 and format=json in requestDefaults.qs
- Case type (Stable/Urgent) required for queue search
- Province dropdown with all 16 voivodeships (01-16)
- JSON API response format (data[].attributes) -- document in README
- Rate limit 10 req/sec -- document in README
- Incapsula WAF may block requests -- needs live testing; Accept: application/json header in requestDefaults should help

### Phase 16: Testy strukturalne - walidacja konfiguracji wszystkich packages (package.json, codex, ikony, build)

**Goal:** Root-level structural test suite that auto-discovers all 12 packages and validates package.json fields, codex metadata, SVG icons, build output alignment, and cross-package consistency
**Requirements**: STRUCT-01, STRUCT-02, STRUCT-03, STRUCT-04, STRUCT-05
**Depends on:** Phase 15
**Plans:** 2/2 plans complete

Plans:
- [x] 16-01-PLAN.md -- Jest structural config, helpers, package-json validation, icons validation
- [x] 16-02-PLAN.md -- Codex validation, build-output alignment, cross-package consistency

### Phase 17: Unit testy z mockami HTTP (nock) dla wszystkich nodow

**Goal:** Close unit test quality gaps across all packages -- fix SMSAPI vacuous nock tests, add VIES HTTP error tests, add Ceneo continueOnFail test
**Requirements**: UTEST-01, UTEST-02, UTEST-03
**Depends on:** Phase 16
**Plans:** 1/1 plans complete

Plans:
- [ ] 17-01-PLAN.md -- Fix SMSAPI nock verification, add VIES error tests, add Ceneo continueOnFail test

### Phase 18: Testy integracyjne z n8n w Dockerze - workflow runner z prawdziwym n8n

**Goal:** Integration tests that spin up a real n8n instance in Docker, verify all 12 custom nodes and credentials load correctly, validate smoke workflow imports, and gate CI/CD publishing on these tests passing
**Requirements**: INT-01, INT-02, INT-03, INT-04, INT-05
**Depends on:** Phase 17
**Plans:** 1/2 plans executed

Plans:
- [x] 18-01-PLAN.md -- Docker test infrastructure: docker-compose.test.yml, integration-test.sh, Jest config, helpers with dynamic node list generator
- [ ] 18-02-PLAN.md -- Integration tests (node/credential registration + workflow import), 12 smoke workflow fixtures, CI/CD gating (ci.yml + publish.yml)

---

### Phase 19: E2E testy - publiczne API (NBP, NFZ, KRS, Biała Lista VAT, VIES, CEIDG)

**Goal:** End-to-end tests hitting real APIs locally — 5 public no-auth APIs (NBP, NFZ, KRS, Biała Lista VAT, VIES) and CEIDG (API key auth). Tests run against live endpoints, verifying actual HTTP responses match node output schemas. Local-only execution (no CI).
**Requirements**: E2E-01, E2E-02, E2E-03, E2E-04, E2E-05, E2E-06, E2E-07
**Depends on:** Phase 18
**Plans:** 2/2 plans complete

Plans:
- [x] 19-01-PLAN.md -- E2E infrastructure: jest.config.e2e.js, helpers.ts (workflow lifecycle functions), 6 webhook workflow fixtures, e2e-test.sh script, test:e2e root script
- [ ] 21-02-PLAN.md -- E2E test blocks: Fakturownia + InPost describe blocks with credential skip logic and sandbox assertions
**Success Criteria** (what must be TRUE):
  1. Each of the 6 nodes can execute at least one operation against the real API and return valid structured data
  2. NBP: get current exchange rate for EUR returns numeric mid value
  3. NFZ: search queues returns non-empty results for a known benefit
  4. KRS: get extract for a known KRS number returns company data
  5. Biała Lista VAT: search by a known NIP returns subject data with valid date
  6. VIES: validate a known valid EU VAT number returns valid=true
  7. CEIDG: search by known NIP returns company data (requires API key from env)
  8. Tests are runnable locally via `pnpm run test:e2e` with optional CEIDG_API_KEY env var
  9. Tests gracefully skip if external API is unavailable (no hard failures on network issues)

**Technical Notes:**
- Jest config: jest.config.e2e.js with long timeout (30s per test)
- Tests use real n8n Docker container (reuse docker-compose.test.yml from Phase 18)
- CEIDG requires API key — read from CEIDG_API_KEY env var, skip if not set
- Public APIs may have rate limits (Biała Lista VAT: 10 search/day) — use known-good test data
- All tests read-only operations — no side effects on external systems

---

### Phase 20: E2E testy - API z kluczem (SMSAPI, Ceneo, GUS REGON, Linkercloud)

**Goal:** End-to-end tests for 4 nodes requiring API key authentication — SMSAPI (test mode), Ceneo, GUS REGON, Linkercloud. Tests run locally against real/sandbox APIs verifying actual responses.
**Requirements**: E2E-08, E2E-09, E2E-10, E2E-11, E2E-12
**Depends on:** Phase 19
**Plans:** 2/2 plans complete

Plans:
- [x] 20-01-PLAN.md -- E2E fixtures (7 workflow JSONs) + e2e-test.sh env var passthrough for SMSAPI, Ceneo, GUS REGON, LinkerCloud
- [ ] 20-02-PLAN.md -- E2E test suites: 4 describe blocks (SMSAPI, Ceneo, GUS REGON, LinkerCloud) with credential creation, real API assertions, graceful skip
**Success Criteria** (what must be TRUE):
  1. SMSAPI: send SMS in test mode (test=1) returns success without consuming credits
  2. SMSAPI: list contacts and check balance return valid JSON
  3. Ceneo: get categories returns non-empty list, get execution limits returns quota info
  4. GUS REGON: search by known NIP returns company data via SOAP session
  5. Linkercloud: list orders returns valid response (empty or with data)
  6. All tests read from env vars for API keys (SMSAPI_TOKEN, CENEO_API_KEY, GUS_REGON_KEY, LINKERCLOUD_API_KEY, LINKERCLOUD_DOMAIN)
  7. Tests skip gracefully if credentials not provided

**Technical Notes:**
- SMSAPI test mode (test=1) is safe — no SMS sent, no credits used
- GUS REGON has a free test key: abcde12345abcde12345 (test environment)
- Ceneo and Linkercloud require real API keys — skip if not available
- Reuse E2E infrastructure from Phase 19

---

### Phase 21: E2E testy - Fakturownia + InPost (sandbox/token auth)

**Goal:** End-to-end tests for Fakturownia (subdomain + API token) and InPost (Bearer token + sandbox environment). Tests run locally against sandbox/trial APIs.
**Requirements**: E2E-13, E2E-14, E2E-15
**Depends on:** Phase 20
**Plans:** 2 plans

Plans:
- [ ] 21-01-PLAN.md -- E2E fixtures: 4 workflow fixtures (Fakturownia list/create, InPost list/create) + e2e-test.sh env var passthrough
- [ ] 21-02-PLAN.md -- E2E test blocks: Fakturownia + InPost describe blocks with credential skip logic and sandbox assertions
**Success Criteria** (what must be TRUE):
  1. Fakturownia: list invoices returns valid response from trial account
  2. Fakturownia: create and retrieve an invoice round-trips correctly
  3. InPost: list shipments returns valid response from sandbox
  4. InPost: create a test shipment in sandbox returns shipment ID
  5. All tests read credentials from env vars (FAKTUROWNIA_API_TOKEN, FAKTUROWNIA_SUBDOMAIN, INPOST_TOKEN, INPOST_ORG_ID)
  6. Tests skip gracefully if credentials not provided

**Technical Notes:**
- Fakturownia trial: 30-day free account, full API access
- InPost sandbox: api-shipx-pl.easypack24.net (different base URL)
- InPost create shipment requires valid address data — use sandbox-safe test data
- Both nodes use programmatic style — tests verify execute() with real HTTP

---
*Roadmap created: 2026-03-20*
*Granularity: Fine (10 phases, 70 plans)*
*Coverage: 122/122 v1 requirements mapped + 15 E2E requirements*
