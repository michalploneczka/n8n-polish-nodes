# Phase 13: Ceneo API Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-23
**Phase:** 13-node-dla-integracji-z-api-ceneo-mozliwosc-weryfikowania-cen-rynkowych
**Areas discussed:** API & Auth model, Operations scope, Node style, Use case focus

---

## API & Auth Model

| Option | Description | Selected |
|--------|-------------|----------|
| Partner/merchant API | I have (or will get) a Ceneo partner account with API access and documentation | |
| Public endpoints | I know of public Ceneo endpoints that return product/price data | ✓ |
| Need research | I'm not sure what API exists — research what's available before deciding | |

**User's choice:** Public endpoints
**Notes:** User provided Swagger docs URL: https://developers.ceneo.pl/swagger/ui/index. API turned out to be a merchant/partner API with Bearer token auth (API key → GetToken → Bearer).

### Auth Sub-question

| Option | Description | Selected |
|--------|-------------|----------|
| API Key only (Recommended) | Store API key in credentials, call GetToken automatically | ✓ |
| API Key + manual token | Let user choose: provide API key or paste pre-generated Bearer token | |

**User's choice:** API Key only (Recommended)

---

## Operations Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Price Analysis (Recommended) | GetTopCategoryProducts, GetProductOffers (all/top10) — core price verification | ✓ |
| Offer Management | Set/Remove promotional text on products and categories | |
| Bidding | Set/Get bid rates on products and categories (CPC management) | |
| Buy Now (Basket) | Full order lifecycle: list, get, confirm, ship, cancel orders | |

**User's choice:** Price Analysis only
**Notes:** V1 keeps scope tight — only the core "weryfikowanie cen rynkowych" use case.

### Categories Sub-question

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, include it (Recommended) | Users need category names for GetTopCategoryProducts | ✓ |
| No, skip it | Keep it minimal — only price operations | |

**User's choice:** Yes, include GetCategories

---

## Node Style

| Option | Description | Selected |
|--------|-------------|----------|
| Programmatic (Recommended) | execute() method — needed for auto-token management and mixed v2/v3 patterns | ✓ |
| Declarative with preSend | Try declarative routing with preSend hook for token injection | |

**User's choice:** Programmatic (Recommended)

### HTTP Method Sub-question

| Option | Description | Selected |
|--------|-------------|----------|
| POST (Recommended) | More conventional for data queries, body params cleaner for 300 IDs | ✓ |
| GET | All params in query string, may hit URL length limits | |
| You decide | Claude picks based on API behavior | |

### Format Sub-question

| Option | Description | Selected |
|--------|-------------|----------|
| JSON only (Recommended) | Always request JSON, consistent with all other nodes | ✓ |
| JSON + XML option | Let users choose output format | |

---

## Use Case Focus

| Option | Description | Selected |
|--------|-------------|----------|
| Price monitoring | Periodic competitive price checks, trigger alerts when undercut | ✓ |
| Price validation | Before listing — check if price is reasonable for category | |
| Both equally | Serve both without favoring either | |
| You decide | Claude picks based on API capabilities | |

**User's choice:** Price monitoring

---

## Claude's Discretion

- Token caching strategy
- Error handling for v2 vs v3 endpoint error formats
- Whether to expose GetExecutionLimits
- README example workflow structure

## Deferred Ideas

- Offer Management (4 endpoints) — V2
- Bidding (4 endpoints) — V2
- Buy Now/Basket (16 endpoints) — V2
- XML output format toggle — V2