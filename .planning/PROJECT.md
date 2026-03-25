# n8n Polish Nodes

## What This Is

Monorepo z 12 community node'ami n8n dla polskich i europejskich serwisów. Każdy node to osobny npm package publikowany z provenance attestation. Projekt wypełnia lukę — żaden z targetowanych serwisów nie miał dedykowanego n8n community node (stan: marzec 2026). v1.0 shipped z pełnym test pyramid (structural, unit, integration, E2E).

Autor: Michał Płoneczka (codersgroup.pl) | Licencja: MIT | Repo: github.com/michalploneczka/n8n-polish-nodes

## Core Value

Kompletny ekosystem polskich integracji n8n — od wysyłki SMS, przez faktury, po śledzenie przesyłek i weryfikację kontrahentów — działający jako zestaw niezależnych, gotowych do instalacji community node'ów.

## Requirements

### Validated

- ✓ Monorepo structure z wspólnym toolingiem i osobnymi publishami per package — v1.0
- ✓ NODE: SMSAPI.pl — SMS Send/Group/Report, Contacts CRUD, Groups List, Account Balance — v1.0
- ✓ NODE: CEIDG — Companies Search by NIP/Name, Get — v1.0
- ✓ NODE: Fakturownia.pl — Invoices CRUD + PDF download, Clients, Products — v1.0
- ✓ NODE: InPost ShipX — Shipments CRUD + Labels, Points, Tracking — v1.0
- ✓ NODE: GUS REGON — Search by NIP/REGON/KRS via SOAP/XML — v1.0
- ✓ NODE: KRS — Company extract lookup — v1.0
- ✓ NODE: Biała Lista VAT — Subject search + bank account verification — v1.0
- ✓ NODE: VIES — EU VAT number validation — v1.0
- ✓ NODE: LinkerCloud — Orders, Products, Stock, Shipments, Inbound, Returns — v1.0
- ✓ NODE: Ceneo — Products, Categories, Account Limits (dual auth v2/v3) — v1.0
- ✓ NODE: NBP — Exchange Rates (Tables A/B/C) + Gold Prices — v1.0
- ✓ NODE: NFZ — Queue search, Benefits, Localities — v1.0
- ✓ CI/CD: GitHub Actions with provenance attestation — v1.0
- ✓ Tests: 499 structural + ~200 unit + 12 Docker integration + 19 E2E fixtures — v1.0

### Active

- [ ] NODE: Przelewy24 — Transactions Register/Verify/Refund (CRC SHA384 signing)
- [ ] NODE: BaseLinker — Orders/Products/Shipping (single-endpoint RPC)
- [ ] NODE: Shoper — Products/Orders/Customers (OAuth2 client_credentials)
- [ ] NODE: wFirma — Invoices/Contractors/Expenses (XML responses)
- [ ] NODE: iFirma — Invoices/Expenses (HMAC-SHA1 signing)
- [ ] NODE: Allegro — Offers/Orders/Shipping (OAuth2 Authorization Code)
- [ ] Trigger nodes for Fakturownia/Przelewy24/Allegro webhooks
- [ ] npm publication of all 12 packages (provenance attestation via GitHub Actions)

### Out of Scope

- BaseLinker V1: 50+ metod poza core — budować stopniowo na żądanie community
- Allegro V1: tylko minimum viable — 100+ endpointów zbyt duże jak na start
- Ręczna publikacja npm CLI — wyłącznie przez GitHub Actions (provenance)
- Mobile/desktop app — web-only (n8n jest web-based)
- Ceneo Offer Management, Bidding, Buy Now — defer do v2+
- SDK dependencies (smsapi-javascript-client etc.) — HTTP deklaratywny wystarczający

## Context

**Shipped v1.0** with 12 npm packages, 42,848 LOC TypeScript across 308 files.

Tech stack: TypeScript strict mode, pnpm workspace, @n8n/node-cli, Jest + nock, Docker Compose for integration tests.

Node types built:
- **Declarative** (routing): CEIDG, NBP, NFZ, KRS, Biała Lista VAT, VIES (6 nodes)
- **Programmatic** (execute): SMSAPI, Fakturownia, InPost, GUS REGON, LinkerCloud, Ceneo (6 nodes)

Test pyramid: structural validation (499 tests), unit tests with nock (~200), Docker integration (12 workflows), E2E against live APIs (19 fixtures).

Known tech debt (all low severity):
- n8n UI node picker verification needed (manual, Phases 01/02)
- `n8n-node lint` CLI hangs (Phases 12/13 — code is correct, CLI issue)
- Docker auth path empirically unverified (Phase 18 — fail-fast logic present)
- Public API E2E tests not wired into CI (nice-to-have)

## Constraints

- **Tech stack**: TypeScript + @n8n/node-cli — oficjalne n8n tooling
- **Naming**: keyword `n8n-community-node-package` wymagane do odkrycia przez n8n
- **Publish**: tylko przez GitHub Actions z provenance attestation
- **Rate limits**: SMSAPI/BaseLinker 100 req/min; Shoper 2 req/sec
- **Błędy HTTP**: każdy jako `NodeApiError` z czytelnym komunikatem po angielsku
- **Linter**: `npm run lint` musi przechodzić przed publishem

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Styl deklaratywny domyślnie | Mniej kodu, łatwiejszy maintenance, n8n best practices | ✓ Good — 6/12 nodes declarative |
| Każdy node = osobny npm package | Użytkownicy instalują tylko to czego potrzebują | ✓ Good — 12 independent packages |
| Monorepo (nie osobne repozytoria) | Wspólne tooling, cross-package consistency | ✓ Good — shared tsconfig, jest, test-utils |
| SMSAPI + CEIDG pierwsze | SMSAPI: demand (2022 request), CEIDG: pipeline test | ✓ Good — validated full pipeline |
| pnpm workspace (nie npm) | shamefully-hoist=true for @n8n/node-cli compatibility | ✓ Good — resolved hoisting issues |
| ES2019 target + CJS output | Matches n8n runtime; ts-jest diagnostics:false workaround | ✓ Good — all packages compile |
| Tag-based publishing | Simpler for solo developer vs changesets | — Pending (not yet published) |
| Allegro last (deferred to v2) | Highest complexity — OAuth2 Auth Code + 100+ endpoints | ✓ Good — focus on simpler nodes first |
| GUS REGON: template-literal SOAP | 5 fixed endpoints, no need for soap npm package | ✓ Good — zero additional deps |
| Docker integration on n8n 2.12.3 | Pinned for reproducibility | ✓ Good — stable CI |
| Phases 4-9 deferred to v2 | Focus v1.0 on shipping 12 nodes with full test coverage | ✓ Good — clean milestone |

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
*Last updated: 2026-03-25 after v1.0 milestone*
