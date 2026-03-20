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
- [ ] **SMSAPI-08**: Obsługa błędów HTTP jako `NodeApiError` z czytelnym komunikatem po angielsku
- [ ] **SMSAPI-09**: Testy z nock — happy path + error handling dla każdej operacji
- [x] **SMSAPI-10**: package.json z keyword `n8n-community-node-package`, pole `n8n` z paths do dist
- [x] **SMSAPI-11**: Plik codex (.node.json) — categories: Communication, subcategory: SMS
- [x] **SMSAPI-12**: Ikona SVG 60x60 — oficjalne logo SMSAPI
- [ ] **SMSAPI-13**: README z opisem, example workflow JSON, link do API docs

### CEIDG Node

- [x] **CEIDG-01**: Credentials — API Key w header Authorization
- [x] **CEIDG-02**: Resource: Companies — operacja Search by NIP (nip query param)
- [x] **CEIDG-03**: Resource: Companies — operacja Search by Name (nazwa query param)
- [x] **CEIDG-04**: Resource: Companies — operacja Get (id path param)
- [x] **CEIDG-05**: Styl deklaratywny (routing) — żadnego execute() method
- [ ] **CEIDG-06**: Obsługa błędów HTTP jako `NodeApiError`
- [ ] **CEIDG-07**: Testy z nock — happy path + error handling
- [x] **CEIDG-08**: package.json, codex, SVG ikona, README (jak SMSAPI-10..13)

### Fakturownia Node

- [ ] **FAKT-01**: Credentials — apiToken + subdomain (każdy klient ma swoją subdomenę)
- [ ] **FAKT-02**: Resource: Invoices — operacje List (z filtrami: data, status, paginacja `page`), Get, Create, Update, Delete
- [ ] **FAKT-03**: Resource: Invoices — operacja Send by Email
- [ ] **FAKT-04**: Resource: Invoices — operacja Download PDF (binary data output)
- [ ] **FAKT-05**: Resource: Clients — operacje List, Get, Create
- [ ] **FAKT-06**: Resource: Products — operacje List, Create
- [ ] **FAKT-07**: Paginacja — obsługa `page` parameter (25 elementów per strona domyślnie)
- [ ] **FAKT-08**: Binary data handling — PDF download jako n8n binary item
- [ ] **FAKT-09**: Create Invoice — pola: kind, number, sell_date, issue_date, payment_to, buyer_name, buyer_tax_no, positions (JSON array), payment_type
- [ ] **FAKT-10**: Obsługa błędów, testy nock, package.json, codex, ikona, README

### InPost Node

- [ ] **INPOST-01**: Credentials — Bearer Token + organization_id + environment toggle (sandbox/production)
- [ ] **INPOST-02**: Resource: Shipments — operacja Create z polami: service, receiver (name/phone/email), target_point, parcels (dimensions+weight), cod, insurance
- [ ] **INPOST-03**: Resource: Shipments — operacje Get, List, Cancel
- [ ] **INPOST-04**: Resource: Shipments — operacja Get Label (PDF binary, format A4/A6)
- [ ] **INPOST-05**: Resource: Points — operacje List, Get (Paczkomaty)
- [ ] **INPOST-06**: Resource: Tracking — operacja Get by tracking number
- [ ] **INPOST-07**: Styl programmatic (`execute()` method) — złożona logika tworzenia przesyłek
- [ ] **INPOST-08**: Rate limit awareness — 100 req/min (nie wymuszaj retry automatycznie, dokumentuj w README)
- [ ] **INPOST-09**: Obsługa błędów, testy nock, package.json, codex, ikona, README

### Przelewy24 Node

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

### BaseLinker Node

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

### Shoper Node

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

### wFirma Node

- [ ] **WFIRMA-01**: Credentials — Basic Auth (login + hasło) lub API Key
- [ ] **WFIRMA-02**: XML parser — fast-xml-parser do konwersji XML responses → JSON
- [ ] **WFIRMA-03**: Resource: Invoices — operacje List, Get, Create, Download PDF
- [ ] **WFIRMA-04**: Resource: Contractors — operacje List, Get, Create
- [ ] **WFIRMA-05**: Resource: Expenses — operacje List, Create
- [ ] **WFIRMA-06**: Resource: VAT Declarations — operacja List
- [ ] **WFIRMA-07**: Styl programmatic — wymagany ze względu na XML responses
- [ ] **WFIRMA-08**: Obsługa błędów, testy nock (XML responses), package.json, codex, ikona, README

### iFirma Node

- [ ] **IFIRMA-01**: Credentials — API Key + HMAC-SHA1 signing key
- [ ] **IFIRMA-02**: HMAC-SHA1 signature generation — izolowana, unit-testowalna funkcja per request
- [ ] **IFIRMA-03**: Resource: Invoices — operacje List, Create, Get PDF (binary)
- [ ] **IFIRMA-04**: Resource: Expenses — operacje List, Create
- [ ] **IFIRMA-05**: Resource: Contractors — operacja List
- [ ] **IFIRMA-06**: Styl programmatic — wymagany dla HMAC signature
- [ ] **IFIRMA-07**: Obsługa błędów, testy (+ jednostkowe HMAC), package.json, codex, ikona, README

### Allegro Node

- [ ] **ALLEGRO-01**: Credentials — OAuth2 Authorization Code (clientId, clientSecret, redirectUri) + sandbox toggle
- [ ] **ALLEGRO-02**: Automatic token refresh (OAuth2 access/refresh token flow)
- [ ] **ALLEGRO-03**: Resource: Offers — operacje List My Offers, Get, Update
- [ ] **ALLEGRO-04**: Resource: Orders — operacje List, Get, Shipment
- [ ] **ALLEGRO-05**: Resource: Shipping — operacja Get Carriers
- [ ] **ALLEGRO-06**: Resource: Users — operacja Get Me
- [ ] **ALLEGRO-07**: Styl programmatic — OAuth2 Authorization Code wymaga execute()
- [ ] **ALLEGRO-08**: Obsługa błędów, testy nock, package.json, codex, ikona, README

### GUS REGON Node

- [ ] **REGON-01**: Credentials — API Key (bezpłatny, dane.biznes.gov.pl)
- [ ] **REGON-02**: SOAP session management — DaneZaloguj → operacja → DaneWyloguj
- [ ] **REGON-03**: XML envelope construction i XML response parsing
- [ ] **REGON-04**: Resource: Companies — operacja Search by NIP
- [ ] **REGON-05**: Resource: Companies — operacja Search by REGON
- [ ] **REGON-06**: Resource: Companies — operacja Search by KRS
- [ ] **REGON-07**: Resource: Companies — operacja Get full data + PKD codes
- [ ] **REGON-08**: Styl programmatic — SOAP wymusza execute()
- [ ] **REGON-09**: Obsługa błędów, testy nock (SOAP/XML), package.json, codex, ikona, README

## v2 Requirements

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

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01..07 | Phase 1 | Pending |
| SMSAPI-01..13 | Phase 1 | Pending |
| CEIDG-01..08 | Phase 1 | Pending |
| FAKT-01..10 | Phase 2 | Pending |
| INPOST-01..09 | Phase 3 | Pending |
| P24-01..10 | Phase 4 | Pending |
| BLNKR-01..11 | Phase 5 | Pending |
| SHOPER-01..10 | Phase 6 | Pending |
| WFIRMA-01..08 | Phase 7 | Pending |
| IFIRMA-01..07 | Phase 8 | Pending |
| ALLEGRO-01..08 | Phase 9 | Pending |
| REGON-01..09 | Phase 10 | Pending |

**Coverage:**
- v1 requirements: 88 total
- Mapped to phases: 88
- Unmapped: 0

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-20 after roadmap creation (10 phases, fine granularity)*
