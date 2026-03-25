# Requirements: n8n Polish Nodes

**Defined:** 2026-03-20
**Core Value:** Kompletny ekosystem polskich integracji n8n — gotowe do instalacji community node'y dla 11 serwisów

## v1 Requirements

### Infrastructure

- [x] **INFRA-01**: Monorepo z npm workspaces — wspólny root package.json, packages/ directory, wspólny tooling
- [x] **INFRA-02**: Wspólny tsconfig.json (base) dziedziczony przez każdy package
- [x] **INFRA-03**: Root-level skrypty: `build:all`, `lint:all`, `test:all`
- [x] **INFRA-04**: GitHub Actions workflow publish.yml z `--provenance` flag i `id-token: write` permission
- [x] **INFRA-05**: Shared test utilities — mock `IExecuteFunctions` i `this.helpers.httpRequest()` dla nock
- [x] **INFRA-06**: README.md root z listą node'ów, badges npm, link do każdego package
- [x] **INFRA-07**: LICENSE (MIT) i .gitignore (node_modules, dist)

### SMSAPI Node

- [x] **SMSAPI-01**: Credentials — Bearer Token (apiToken) z `documentationUrl` do docs SMSAPI
- [x] **SMSAPI-02**: Resource: SMS — operacja Send (to, message, from, encoding, date, test) ze `format=json` w query params
- [x] **SMSAPI-03**: Resource: SMS — operacja Send Group (group, message, from)
- [x] **SMSAPI-04**: Resource: SMS — operacja Get Report (messageId)
- [x] **SMSAPI-05**: Resource: Contacts — operacje List, Create, Update, Delete
- [x] **SMSAPI-06**: Resource: Groups — operacja List
- [x] **SMSAPI-07**: Resource: Account — operacja Balance
- [x] **SMSAPI-08**: Obsługa błędów HTTP jako `NodeApiError` z czytelnym komunikatem po angielsku
- [x] **SMSAPI-09**: Testy z nock — happy path + error handling dla każdej operacji
- [x] **SMSAPI-10**: package.json z keyword `n8n-community-node-package`, pole `n8n` z paths do dist
- [x] **SMSAPI-11**: Plik codex (.node.json) — categories: Communication, subcategory: SMS
- [x] **SMSAPI-12**: Ikona SVG 60x60 — oficjalne logo SMSAPI
- [x] **SMSAPI-13**: README z opisem, example workflow JSON, link do API docs

### CEIDG Node

- [x] **CEIDG-01**: Credentials — API Key w header Authorization
- [x] **CEIDG-02**: Resource: Companies — operacja Search by NIP (nip query param)
- [x] **CEIDG-03**: Resource: Companies — operacja Search by Name (nazwa query param)
- [x] **CEIDG-04**: Resource: Companies — operacja Get (id path param)
- [x] **CEIDG-05**: Styl deklaratywny (routing) — żadnego execute() method
- [x] **CEIDG-06**: Obsługa błędów HTTP jako `NodeApiError`
- [x] **CEIDG-07**: Testy z nock — happy path + error handling
- [x] **CEIDG-08**: package.json, codex, SVG ikona, README (jak SMSAPI-10..13)

### Fakturownia Node

- [x] **FAKT-01**: Credentials — apiToken + subdomain (każdy klient ma swoją subdomenę)
- [x] **FAKT-02**: Resource: Invoices — operacje List (z filtrami: data, status, paginacja `page`), Get, Create, Update, Delete
- [x] **FAKT-03**: Resource: Invoices — operacja Send by Email
- [x] **FAKT-04**: Resource: Invoices — operacja Download PDF (binary data output)
- [x] **FAKT-05**: Resource: Clients — operacje List, Get, Create
- [x] **FAKT-06**: Resource: Products — operacje List, Create
- [x] **FAKT-07**: Paginacja — obsługa `page` parameter (25 elementów per strona domyślnie)
- [x] **FAKT-08**: Binary data handling — PDF download jako n8n binary item
- [x] **FAKT-09**: Create Invoice — pola: kind, number, sell_date, issue_date, payment_to, buyer_name, buyer_tax_no, positions (JSON array), payment_type
- [x] **FAKT-10**: Obsługa błędów, testy nock, package.json, codex, ikona, README

### InPost Node

- [x] **INPOST-01**: Credentials — Bearer Token + organization_id + environment toggle (sandbox/production)
- [x] **INPOST-02**: Resource: Shipments — operacja Create z polami: service, receiver (name/phone/email), target_point, parcels (dimensions+weight), cod, insurance
- [x] **INPOST-03**: Resource: Shipments — operacje Get, List, Cancel
- [x] **INPOST-04**: Resource: Shipments — operacja Get Label (PDF binary, format A4/A6)
- [x] **INPOST-05**: Resource: Points — operacje List, Get (Paczkomaty)
- [x] **INPOST-06**: Resource: Tracking — operacja Get by tracking number
- [x] **INPOST-07**: Styl programmatic (`execute()` method) — złożona logika tworzenia przesyłek
- [x] **INPOST-08**: Rate limit awareness — 100 req/min (nie wymuszaj retry automatycznie, dokumentuj w README)
- [x] **INPOST-09**: Obsługa błędów, testy nock, package.json, codex, ikona, README

### ~~Przelewy24 Node~~ (deferred to v2)

- [ ] **P24-01**: Credentials — merchantId + CRC key + environment toggle (sandbox/production)
- [ ] **P24-02**: CRC SHA384 checksum calculation — izolowana, unit-testowalna funkcja
- [ ] **P24-03**: Resource: Transactions — operacja Register (kwoty w groszach — integer)
- [ ] **P24-04**: Resource: Transactions — operacja Verify (PUT)
- [ ] **P24-05**: Resource: Transactions — operacja Get by Session ID
- [ ] **P24-06**: Resource: Refunds — operacja Create
- [ ] **P24-07**: Resource: Payment Methods — operacja List
- [ ] **P24-08**: Resource: Account — operacja Test Access
- [ ] **P24-09**: Styl programmatic — wymagany dla podpisu CRC
- [ ] **P24-10**: Obsługa błędów, testy nock (+ testy jednostkowe CRC), package.json, codex, ikona, README

### ~~BaseLinker Node~~ (deferred to v2)

- [ ] **BLNKR-01**: Credentials — API Token w header `X-BLToken`
- [ ] **BLNKR-02**: Helper function dla single-endpoint RPC pattern: `POST /connector.php` z `method` + `parameters` w body
- [ ] **BLNKR-03**: Resource: Orders — operacje List (getOrders), Get (getOrders by id), Update Status (setOrderStatus), Add (addOrder)
- [ ] **BLNKR-04**: Resource: Products — operacje List (getInventoryProductsList), Get (getInventoryProductsData)
- [ ] **BLNKR-05**: Resource: Products — operacje Update Stock, Update Price
- [ ] **BLNKR-06**: Resource: Shipping — operacje Create Package, Get Label (getOrderPackages)
- [ ] **BLNKR-07**: Paginacja — `page` parameter, max 100 elementów, daty jako Unix timestamp
- [ ] **BLNKR-08**: Error handling dla BaseLinker format: `{"status": "ERROR", "error_code": "..."}`
- [ ] **BLNKR-09**: Rate limit 100 req/min — dokumentacja w README
- [ ] **BLNKR-10**: Styl programmatic — single-endpoint wymusza execute()
- [ ] **BLNKR-11**: Obsługa błędów, testy nock, package.json, codex, ikona, README

### ~~Shoper Node~~ (deferred to v2)

- [ ] **SHOPER-01**: Credentials — OAuth2 client_credentials (client_id, client_secret, shop_domain)
- [ ] **SHOPER-02**: Automatyczny token refresh (OAuth2 client_credentials grant)
- [ ] **SHOPER-03**: Resource: Products — operacje List, Get, Create, Update, Delete
- [ ] **SHOPER-04**: Resource: Orders — operacje List, Get, Update Status
- [ ] **SHOPER-05**: Resource: Customers — operacje List, Get, Create
- [ ] **SHOPER-06**: Resource: Categories — operacje List, Get
- [ ] **SHOPER-07**: Resource: Stock — operacja Update
- [ ] **SHOPER-08**: Paginacja z `limit` + `offset`
- [ ] **SHOPER-09**: Rate limit 2 req/sec — retry z exponential backoff
- [ ] **SHOPER-10**: Obsługa błędów, testy nock, package.json, codex, ikona, README

### ~~wFirma Node~~ (deferred to v2)

- [ ] **WFIRMA-01**: Credentials — Basic Auth (login + hasło) lub API Key
- [ ] **WFIRMA-02**: XML parser — fast-xml-parser do konwersji XML responses → JSON
- [ ] **WFIRMA-03**: Resource: Invoices — operacje List, Get, Create, Download PDF
- [ ] **WFIRMA-04**: Resource: Contractors — operacje List, Get, Create
- [ ] **WFIRMA-05**: Resource: Expenses — operacje List, Create
- [ ] **WFIRMA-06**: Resource: VAT Declarations — operacja List
- [ ] **WFIRMA-07**: Styl programmatic — wymagany ze względu na XML responses
- [ ] **WFIRMA-08**: Obsługa błędów, testy nock (XML responses), package.json, codex, ikona, README

### ~~iFirma Node~~ (deferred to v2)

- [ ] **IFIRMA-01**: Credentials — API Key + HMAC-SHA1 signing key
- [ ] **IFIRMA-02**: HMAC-SHA1 signature generation — izolowana, unit-testowalna funkcja per request
- [ ] **IFIRMA-03**: Resource: Invoices — operacje List, Create, Get PDF (binary)
- [ ] **IFIRMA-04**: Resource: Expenses — operacje List, Create
- [ ] **IFIRMA-05**: Resource: Contractors — operacja List
- [ ] **IFIRMA-06**: Styl programmatic — wymagany dla HMAC signature
- [ ] **IFIRMA-07**: Obsługa błędów, testy (+ jednostkowe HMAC), package.json, codex, ikona, README

### ~~Allegro Node~~ (deferred to v2)

- [ ] **ALLEGRO-01**: Credentials — OAuth2 Authorization Code (clientId, clientSecret, redirectUri) + sandbox toggle
- [ ] **ALLEGRO-02**: Automatic token refresh (OAuth2 access/refresh token flow)
- [ ] **ALLEGRO-03**: Resource: Offers — operacje List My Offers, Get, Update
- [ ] **ALLEGRO-04**: Resource: Orders — operacje List, Get, Shipment
- [ ] **ALLEGRO-05**: Resource: Shipping — operacja Get Carriers
- [ ] **ALLEGRO-06**: Resource: Users — operacja Get Me
- [ ] **ALLEGRO-07**: Styl programmatic — OAuth2 Authorization Code wymaga execute()
- [ ] **ALLEGRO-08**: Obsługa błędów, testy nock, package.json, codex, ikona, README

### GUS REGON Node

- [x] **REGON-01**: Credentials — API Key (bezpłatny, dane.biznes.gov.pl)
- [x] **REGON-02**: SOAP session management — DaneZaloguj → operacja → DaneWyloguj
- [x] **REGON-03**: XML envelope construction i XML response parsing
- [x] **REGON-04**: Resource: Companies — operacja Search by NIP
- [x] **REGON-05**: Resource: Companies — operacja Search by REGON
- [x] **REGON-06**: Resource: Companies — operacja Search by KRS
- [x] **REGON-07**: Resource: Companies — operacja Get full data + PKD codes
- [x] **REGON-08**: Styl programmatic — SOAP wymusza execute()
- [x] **REGON-09**: Obsługa błędów, testy nock (SOAP/XML), package.json, codex, ikona, README

### KRS Node

- [x] **KRS-01**: Resource: Company — operacja Get Current Extract (OdpisAktualny) po numerze KRS
- [x] **KRS-02**: Resource: Company — operacja Get Full Extract (OdpisPelny) po numerze KRS
- [x] **KRS-03**: Styl deklaratywny, brak credentials (publiczne API, brak autoryzacji)
- [x] **KRS-04**: Obsługa błędów, testy nock, package.json, codex, ikona, README

### Biala Lista VAT Node

- [x] **BL-01**: Resource: Subject — operacje Search by NIP, Search by NIPs (batch max 30)
- [x] **BL-02**: Resource: Subject — operacje Search by REGON, Search by REGONs (batch max 30)
- [x] **BL-03**: Resource: Subject — operacje Search by Bank Account, Search by Bank Accounts (batch max 30)
- [x] **BL-04**: Resource: Verification — operacje Check NIP + Bank Account, Check REGON + Bank Account
- [x] **BL-05**: Wymagany parametr date (YYYY-MM-DD) na kazdej operacji, styl deklaratywny, brak credentials
- [x] **BL-06**: Obsługa błędów, testy nock, package.json, codex, ikona, README

### VIES Node

- [x] **VIES-01**: Resource: VAT Number — operacja Validate (sprawdzenie numeru VAT UE)
- [x] **VIES-02**: Dropdown z kodami krajów UE (27 + XI Northern Ireland)
- [x] **VIES-03**: Styl deklaratywny, brak credentials (publiczne API EC)
- [x] **VIES-04**: Obsługa błędów (MS_UNAVAILABLE, MS_MAX_CONCURRENT_REQ), testy nock, package.json, codex, ikona, README

### Ceneo Node

- [x] **CENEO-01**: Credentials — API Key only, stored in ceneoApi credential class with `icon = 'file:ceneo.svg' as const`
- [x] **CENEO-02**: Dual auth GenericFunctions — v3 endpoints use Bearer token from GetToken, v2 endpoints use raw apiKey as query param
- [x] **CENEO-03**: Token caching — per-execution reset via `resetTokenCache()` called at start of `execute()`
- [x] **CENEO-04**: Resource: Products — operacja Get Top Category Products (v3 GET `/api/v3/GetTopCategoryProducts`, params: categoryName, top)
- [x] **CENEO-05**: Resource: Products — operacja Get All Offers (v2 POST `webapi_data_critical.shop_getProductOffersBy_IDs`, param: shop_product_ids max 300)
- [x] **CENEO-06**: Resource: Products — operacja Get Top 10 Cheapest Offers (v2 POST `webapi_data_critical.shop_getProductTop10OffersByIDs`, param: shop_product_ids max 300)
- [x] **CENEO-07**: Resource: Categories — operacja List (v3 GET `/api/v3/GetCategories`, no required params)
- [x] **CENEO-08**: Resource: Account — operacja Get Limits (v2 `webapi_data_critical.GetExecutionLimits`)
- [x] **CENEO-09**: Styl programmatic — wymagany dla dual auth (v2/v3) i token management
- [x] **CENEO-10**: Obsługa błędów, testy nock (mock GetToken + all operations), package.json, codex (Data & Storage > Pricing), ikona, README

### NFZ Node

- [x] **NFZ-01**: Brak credentials — publiczne API, brak autoryzacji (wzorzec NBP)
- [x] **NFZ-02**: Resource: Queue — operacja Search (`/queues` z params: case, province, benefit, locality, benefitForChildren, page, limit)
- [x] **NFZ-03**: Resource: Queue — operacja Get (`/queues/{id}`)
- [x] **NFZ-04**: Resource: Queue — operacja Get Many Places (`/queues/{id}/many-places`)
- [x] **NFZ-05**: Resource: Benefit — operacja Search (`/benefits?name=...`)
- [x] **NFZ-06**: Resource: Locality — operacja Search (`/localities?name=...`)
- [x] **NFZ-07**: Styl deklaratywny z `api-version=1.3` i `format=json` w requestDefaults.qs
- [x] **NFZ-08**: Obsługa błędów HTTP jako NodeApiError z czytelnym komunikatem po angielsku
- [x] **NFZ-09**: Testy z nock — happy path + error handling, description validation
- [x] **NFZ-10**: package.json (n8n-community-node-package keyword), codex, SVG ikona, README

### LinkerCloud Node

- [x] **LC-01**: Credentials — domain + apiKey (query param auth)
- [x] **LC-02**: Resource: Orders — operacje List, Get, Create, Update, Cancel
- [x] **LC-03**: Resource: Products — operacje List, Create, Update
- [x] **LC-04**: Resource: Stock — operacje List, batch Update by SKU
- [x] **LC-05**: Resource: Shipments — operacje Create, Create by Order#, Get Label (binary), Get Status, Cancel
- [x] **LC-06**: Resource: Inbound Orders — operacje List, Get, Create, Update, Confirm
- [x] **LC-07**: Resource: Order Returns — operacje List, Get, Create, Accept
- [x] **LC-08**: Paginacja offset+limit z bracket-notation filters
- [x] **LC-09**: Label download — base64 JSON response decoded to binary via prepareBinaryData
- [x] **LC-10**: Obsługa błędów, testy nock, package.json, codex, ikona, README

### NBP Exchange Rates Node

- [x] **NBP-01**: Brak credentials — publiczne API NBP, brak autoryzacji
- [x] **NBP-02**: Resource: Exchange Rate — operacje Get Current, Get by Date, Get Date Range (Tables A, B, C)
- [x] **NBP-03**: Resource: Gold Price — operacje Get Current, Get by Date, Get Date Range, Get Last N
- [x] **NBP-04**: Styl deklaratywny z Accept: application/json w requestDefaults
- [x] **NBP-05**: Date fields jako string (YYYY-MM-DD), max 93-day range
- [x] **NBP-06**: Obsługa błędów, testy nock, package.json, codex, ikona, README

### Structural Tests

- [x] **STRUCT-01**: package.json validation — all required fields (name, version, keywords, license, author, repository, files, n8n section, peerDependencies) validated per package
- [x] **STRUCT-02**: Codex validation — .node.json files exist with valid schema (node, nodeVersion, codexVersion, categories, subcategories, resources)
- [x] **STRUCT-03**: Icon validation — SVG icon exists per node, starts with <svg or <?xml, size > 100 bytes
- [x] **STRUCT-04**: Build output alignment — dist/ files match n8n.nodes and n8n.credentials paths in package.json (conditional on dist/ existence)
- [x] **STRUCT-05**: Cross-package consistency — identical author, license, repository, n8nNodesApiVersion across all packages; source files exist for all declared nodes/credentials

### Unit Test Quality

- [x] **UTEST-01**: SMSAPI nock scopes exercised — all HTTP Integration tests make actual https.get/request calls and verify scope.isDone() is true
- [x] **UTEST-02**: VIES HTTP error tests — nock contract tests for 400 (bad request) and 500 (service unavailable) status codes
- [x] **UTEST-03**: Ceneo continueOnFail test — verifies that when continueOnFail=true, API errors return error in json.error instead of throwing




### Integration Tests (Docker)

- [x] **INT-01**: All 12 custom node types registered in n8n Docker container -- verified via /types/nodes.json internal endpoint
- [x] **INT-02**: All 7 credential types registered in n8n Docker container -- verified via /types/credentials.json internal endpoint
- [x] **INT-03**: 12 smoke workflows (one per node) import successfully via POST /api/v1/workflows
- [x] **INT-04**: docker-compose.test.yml starts n8n with all 12 packages volume-mounted, ephemeral data, port 5679
- [x] **INT-05**: CI integration test job gates publishing -- integration tests must pass before npm publish workflow triggers

### E2E Tests — Public APIs (no auth / free key)

- [x] **E2E-01**: E2E test infrastructure — jest.config.e2e.js, test:e2e script, env var loading for API keys
- [x] **E2E-02**: NBP E2E — get current EUR exchange rate returns numeric mid value from real API
- [x] **E2E-03**: NFZ E2E — search queues for known benefit returns non-empty results from real API
- [x] **E2E-04**: KRS E2E — get extract for known KRS number returns company data from real API
- [x] **E2E-05**: Biała Lista VAT E2E — search by known NIP returns subject data from real API
- [x] **E2E-06**: VIES E2E — validate known valid EU VAT number returns valid=true from real API
- [x] **E2E-07**: CEIDG E2E — search by known NIP returns company data (requires CEIDG_API_KEY env var, skip if absent)

### E2E Tests — API Key Auth

- [x] **E2E-08**: SMSAPI E2E — send SMS in test mode (test=1), list contacts, check balance via real API
- [x] **E2E-09**: Ceneo E2E — get categories and execution limits via real API
- [x] **E2E-10**: GUS REGON E2E — search by known NIP via SOAP session against test environment
- [x] **E2E-11**: Linkercloud E2E — list orders via real API
- [x] **E2E-12**: E2E tests skip gracefully when API keys not provided (no hard failures)

### E2E Tests — Sandbox/Token Auth

- [x] **E2E-13**: Fakturownia E2E — list invoices, create+retrieve invoice round-trip via trial API
- [x] **E2E-14**: InPost E2E — list shipments, create test shipment via sandbox API
- [x] **E2E-15**: E2E tests read credentials from env vars, skip if not provided

## v2 Requirements

### Deferred from v1 (nodes not yet built)

- **P24-01..10**: Przelewy24 — CRC SHA384 signing, payment transactions (10 requirements)
- **BLNKR-01..11**: BaseLinker — single-endpoint RPC, orders/products/shipping (11 requirements)
- **SHOPER-01..10**: Shoper — OAuth2 client_credentials, e-commerce (10 requirements)
- **WFIRMA-01..08**: wFirma — XML responses, invoicing/accounting (8 requirements)
- **IFIRMA-01..07**: iFirma — HMAC-SHA1 signing, invoicing (7 requirements)
- **ALLEGRO-01..08**: Allegro — OAuth2 Authorization Code, marketplace (8 requirements)

### Trigger Nodes

- **TRIGGER-01**: Fakturownia Trigger — webhook receiver dla nowych faktur
- **TRIGGER-02**: Przelewy24 Trigger — webhook receiver dla opłaconych transakcji
- **TRIGGER-03**: Allegro Trigger — webhook receiver dla nowych zamówień

### Extended Coverage

- **BLNKR-EXT**: BaseLinker V2 — pozostałe 50+ metod API (inventory, auctions, returns, etc.)
- **ALLEGRO-EXT**: Allegro V2 — pełne API (100+ endpointów, user ratings, disputes, etc.)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Trigger nodes (webhooks) dla Fakturownia/Przelewy24/Allegro | Wysoka złożoność, defer do v2 |
| BaseLinker V1: 50+ metod poza core | Scope control — najpierw zamówienia, produkty, wysyłka |
| Allegro V1: API poza minimum viable | 100+ endpointów — budować stopniowo na żądanie community |
| Ręczna publikacja npm CLI | Wyłącznie GitHub Actions (provenance wymóg od maja 2026) |
| OAuth2 PKCE flow | Tylko client_credentials i Authorization Code wymagane przez wybrane API |
| Real-time webhooks server | n8n obsługuje to przez Webhook node — nie duplikuj |
| SDK dependencies (np. smsapi-javascript-client) | Deklaratywny styl HTTP jest wystarczający, SDK = zbędna zależność |
| Ceneo Offer Management, Bidding, Buy Now (Basket) | V2 scope — 24 endpoints, defer |
| Ceneo XML output format | JSON only in V1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01..07 | Phase 1 | Complete |
| SMSAPI-01..13 | Phase 1 | Complete |
| CEIDG-01..08 | Phase 1 | Complete |
| FAKT-01..10 | Phase 2 | Complete |
| INPOST-01..09 | Phase 3 | Complete |
| P24-01..10 | Phase 4 | Deferred to v2 |
| BLNKR-01..11 | Phase 5 | Deferred to v2 |
| SHOPER-01..10 | Phase 6 | Deferred to v2 |
| WFIRMA-01..08 | Phase 7 | Deferred to v2 |
| IFIRMA-01..07 | Phase 8 | Deferred to v2 |
| ALLEGRO-01..08 | Phase 9 | Deferred to v2 |
| REGON-01..09 | Phase 10 | Complete |
| KRS-01..04 | Phase 11 | Complete |
| BL-01..06 | Phase 11 | Complete |
| VIES-01..04 | Phase 11 | Complete |
| LC-01..10 | Phase 12 | Complete |
| CENEO-01..10 | Phase 13 | Complete |
| NBP-01..06 | Phase 14 | Complete |
| NFZ-01..10 | Phase 15 | Complete |
| STRUCT-01..05 | Phase 16 | Complete |
| UTEST-01..03 | Phase 17 | Complete |
| INT-01..05 | Phase 18 | Complete |
| E2E-01..07 | Phase 19 | Complete |
| E2E-08..12 | Phase 20 | Complete |
| E2E-13..15 | Phase 21 | Complete |

**Coverage:**
- v1 requirements: 134 total (after deferring 54 to v2)
- Satisfied: 134
- Deferred to v2: 54 (P24, BLNKR, SHOPER, WFIRMA, IFIRMA, ALLEGRO)
- Original total (v1+deferred): 188

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-25 — Phase 22 gap closure: deferred phases 4-9 to v2, added LC/NBP reqs, updated statuses*
