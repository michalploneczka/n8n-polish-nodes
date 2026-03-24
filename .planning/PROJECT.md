# n8n Polish Nodes

## What This Is

Monorepo zestawu community node'ów n8n dla polskich serwisów. Każdy node to osobny npm package publikowany na npmjs.com z provenance attestation. Projekt wypełnia lukę — żaden z targetowanych serwisów nie ma dedykowanego n8n community node (stan: marzec 2026).

Autor: Michał Płoneczka (codersgroup.pl) | Licencja: MIT | Repo: github.com/michalploneczka/n8n-polish-nodes

## Core Value

Kompletny ekosystem polskich integracji n8n — od wysyłki SMS, przez faktury, po płatności i e-commerce — działający jako zestaw niezależnych, gotowych do instalacji community node'ów.

## Requirements

### Validated

- [x] Monorepo structure z wspólnym toolingiem i osobnymi publishami per package — Validated in Phase 01: monorepo-bootstrap-smsapi-ceidg
- [x] NODE #1: SMSAPI.pl — SMS: Send/Send Group/Get Report, Contacts CRUD, Groups List, Account Balance (deklaratywny) — Validated in Phase 01: monorepo-bootstrap-smsapi-ceidg
- [x] NODE #10: CEIDG — Companies: Search by NIP/Name, Get (deklaratywny, najprostszy) — Validated in Phase 01: monorepo-bootstrap-smsapi-ceidg
- [x] CI/CD: GitHub Actions publish workflow z provenance attestation — Validated in Phase 01: monorepo-bootstrap-smsapi-ceidg
- [x] Testy per node z nock (mock HTTP) — happy path + error handling — Validated in Phase 01: monorepo-bootstrap-smsapi-ceidg
- [x] README per node z example workflow JSON — Validated in Phase 01: monorepo-bootstrap-smsapi-ceidg
- [x] SVG ikona 60x60 per node — Validated in Phase 01: monorepo-bootstrap-smsapi-ceidg

### Active

- [ ] NODE #2: Fakturownia.pl — Invoices/Clients/Products CRUD + PDF download (deklaratywny)
- [ ] NODE #2: Fakturownia.pl — Invoices/Clients/Products CRUD + PDF download (deklaratywny)
- [x] NODE #3: InPost ShipX — Shipments CRUD + Label/Tracking, Points List (programmatic) — Validated in Phase 03: inpost-shipx
- [ ] NODE #4: Przelewy24 — Transactions Register/Verify/Refund, Payment Methods (programmatic, CRC checksum)
- [ ] NODE #5: BaseLinker — Orders/Products/Shipping przez single-endpoint API (programmatic)
- [ ] NODE #6: Shoper — Products/Orders/Customers/Categories (programmatic, OAuth2)
- [ ] NODE #7: wFirma — Invoices/Contractors/Expenses (programmatic, XML responses)
- [ ] NODE #8: iFirma — Invoices/Expenses/Contractors (programmatic, HMAC-SHA1)
- [ ] NODE #9: Allegro — Offers/Orders/Shipping (programmatic, OAuth2 Authorization Code)
- [x] NODE #11: GUS REGON (BIR) — Search by NIP/REGON/KRS (programmatic, SOAP/XML) — Validated in Phase 10: gus-regon
- [x] NODE: KRS — Company lookup by KRS number (getCurrentExtract, getFullExtract), declarative, no credentials — Validated in Phase 11: KRS, Biala Lista VAT, VIES
- [x] NODE: Biala Lista VAT — Subject search (NIP/NIPs/REGON/REGONs/Bank Account/Bank Accounts) + Account verification (NIP/REGON), declarative, no credentials — Validated in Phase 11: KRS, Biala Lista VAT, VIES
- [x] NODE: VIES — EU VAT number validation (28 country codes), declarative, no credentials — Validated in Phase 11: KRS, Biala Lista VAT, VIES

### Out of Scope

- Trigger nodes (webhook receivers) dla Fakturownia/Przelewy24 — wysoka złożoność, defer do v2
- Allegro V1: tylko minimum viable (Offers/Orders/Shipping/Users), nie cały 100+ endpoint API — zbyt duże jak na start
- BaseLinker V1: tylko core (Orders + Products + Shipping z 60+ dostępnych metod) — reszta w V2
- Ręczna publikacja npm CLI — wyłącznie przez GitHub Actions (wymóg provenance)
- Mobile/desktop app — web-only (n8n jest web-based)

## Context

- **Tech stack**: TypeScript strict mode, @n8n/node-cli (scaffold/build/lint/dev), nock do testów
- **Styl domyślny**: deklaratywny (routing w operations) — przejście na programmatic tylko gdy API wymaga podpisu, paginacji lub niestandardowego flow
- **Credentials**: zawsze oddzielnie jako n8n credential types; nigdy hardkodowane tokeny
- **Provenance**: npm publish WYŁĄCZNIE przez GitHub Actions od 1 maja 2026 (obowiązkowe)
- **Kolejność budowania**: Tydzień 1: SMSAPI + CEIDG → Tydzień 2: Fakturownia → Tydzień 3: InPost → Tydzień 4: Przelewy24 → Tyg 5-6: BaseLinker → Tyg 7: Shoper + wFirma → Tyg 8+: iFirma, Allegro, GUS REGON
- **Kluczowe wyjątki techniczne**:
  - wFirma: zwraca XML, nie JSON — parser wymagany
  - iFirma: HMAC-SHA1 signature per request
  - GUS REGON: SOAP/XML — najtrudniejszy technicznie
  - BaseLinker: wszystkie requesty to POST na jeden URL z `method` w body
  - Przelewy24: kwoty w groszach (integer), CRC SHA384 checksum
  - SMSAPI: dodawaj `format=json` do query params; starsze endpointy nie zwracają JSON

## Constraints

- **Tech stack**: TypeScript + @n8n/node-cli — nie zmieniaj bez uzgodnienia, to oficjalne n8n tooling
- **Naming**: każdy package musi mieć keyword `n8n-community-node-package` — wymagane do odkrycia przez n8n
- **Publish**: tylko przez GitHub Actions z provenance attestation — ręczny publish niedozwolony (od maja 2026 obowiązkowe)
- **Rate limits**: SMSAPI i BaseLinker: 100 req/min; Shoper: 2 req/sec — retry z exponential backoff gdzie udokumentowane
- **Błędy HTTP**: każdy musi być złapany jako `NodeApiError` z czytelnym komunikatem po angielsku
- **Linter**: `npm run lint` musi przechodzić przed każdym publishem

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Styl deklaratywny domyślnie | Mniej kodu, łatwiejszy maintenance, zgodny z n8n best practices | — Pending |
| Każdy node = osobny npm package | Użytkownicy instalują tylko to czego potrzebują, osobny lifecycle wersjonowania | — Pending |
| Monorepo (nie osobne repozytoria) | Wspólne tooling, łatwiejsze cross-package consistency, jeden workflow CI/CD | — Pending |
| Kolejność: SMSAPI + CEIDG pierwsze | SMSAPI: potwierdzony demand (feature request 2022), CEIDG: najprostszy (dobry test pipeline) | — Pending |
| Allegro budowany ostatni | Najwyższa złożoność (OAuth2 Authorization Code + 100+ endpointów) — najpierw zdobyć doświadczenie | — Pending |
| GUS REGON po CEIDG | SOAP/XML najtrudniejszy technicznie — budować gdy community zapyta | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-24 after Phase 16 completion — Root-level structural test suite delivered (5 test files, 499 tests, 12 packages). Auto-discovers all packages and validates: package.json fields (STRUCT-01), codex metadata schemas (STRUCT-02), SVG icons (STRUCT-03), build output alignment (STRUCT-04), cross-package consistency (STRUCT-05). Run via `npm run test:structural`.*
