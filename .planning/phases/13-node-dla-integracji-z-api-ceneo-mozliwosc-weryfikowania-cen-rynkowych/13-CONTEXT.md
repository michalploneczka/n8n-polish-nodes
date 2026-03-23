# Phase 13: Ceneo API Integration - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

n8n community node for Ceneo (Poland's largest price comparison platform) enabling merchants to verify market prices for their products. V1 scope: Price Analysis operations + Categories listing. Offer Management, Bidding, and Buy Now (Basket) deferred to V2.

</domain>

<decisions>
## Implementation Decisions

### API & Authentication
- **D-01:** Use Ceneo Developer API at `https://developers.ceneo.pl`
- **D-02:** Credentials store API Key only. Node automatically calls `GET /AuthorizationService.svc/GetToken` with the API key to obtain Bearer token before each request session.
- **D-03:** Bearer token injected in `Authorization` header on all subsequent API calls. Token management is transparent to the user.

### Operations Scope (V1)
- **D-04:** V1 includes **Price Analysis** resource group + **Categories** helper only. Four operations total:

| Resource | Operation | Endpoint | Method |
|----------|-----------|----------|--------|
| Products | Get Top Category Products | `/api/v3/GetTopCategoryProducts` | GET |
| Products | Get All Offers | `/api/v2/function/webapi_data_critical.shop_getProductOffersBy_IDs/Call` | POST |
| Products | Get Top 10 Cheapest Offers | `/api/v2/function/webapi_data_critical.shop_getProductTop10OffersByIDs/Call` | POST |
| Categories | List | `/api/v3/GetCategories` | GET |

- **D-05:** `GetTopCategoryProducts` params: `categoryName` (string, required), `top` (number, max 100, default 100)
- **D-06:** `shop_getProductOffersBy_IDs` and `shop_getProductTop10OffersByIDs` params: `shop_product_ids` (string, required, comma-separated, max 300 IDs)
- **D-07:** `GetCategories` has no required params, returns all Ceneo categories (cached up to 60 min server-side)

### Node Style
- **D-08:** Programmatic node (`execute()` method) — required for two-step auth (GetToken -> Bearer) and mixed v2/v3 endpoint patterns
- **D-09:** v2 endpoints use **POST** method (not GET) — 300 IDs in query string would hit URL length limits
- **D-10:** **JSON only** — always request JSON responses. No format toggle for XML. Consistent with all other nodes in monorepo.
- **D-11:** Follow GenericFunctions pattern from Fakturownia/LinkerCloud — centralized API request helper with automatic token management

### Use Case
- **D-12:** Primary workflow: **price monitoring** — periodic competitive price checks ("Are my products priced competitively?"). Node description and README should frame around this use case.

### Claude's Discretion
- Token caching strategy (per-execution vs per-call)
- Error handling specifics for v2 vs v3 endpoint error formats
- Whether to expose `GetExecutionLimits` as a debug/helper operation
- README example workflow structure

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Ceneo API Documentation
- `https://developers.ceneo.pl/swagger/ui/index` — Swagger UI with all endpoints
- `https://developers.ceneo.pl/swagger/docs/v1` — OpenAPI spec (JSON) with full parameter definitions and response schemas

### Existing node patterns (reuse)
- `packages/n8n-nodes-fakturownia/nodes/Fakturownia/GenericFunctions.ts` — programmatic node with API helper, token in query param, dynamic URL
- `packages/n8n-nodes-linkercloud/nodes/LinkerCloud/GenericFunctions.ts` — programmatic node with API helper, apikey auth, pagination
- `packages/n8n-nodes-ceidg/credentials/CeidgApi.credentials.ts` — API Key credential pattern with IAuthenticateGeneric

### Project docs
- `.planning/REQUIREMENTS.md` — requirements TBD for Phase 13 (to be defined during planning)
- `.planning/ROADMAP.md` §Phase 13 — phase goal and dependencies

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `GenericFunctions.ts` pattern (Fakturownia, LinkerCloud) — centralized API request helper with auth injection
- Credential pattern with API Key → header auth (CEIDG, SMSAPI)
- Nock-based test pattern from all existing packages

### Established Patterns
- Programmatic nodes use `execute()` with GenericFunctions helper for HTTP calls
- Error wrapping: `NodeApiError` with descriptive English messages
- Package naming: `n8n-nodes-ceneo`
- Resource/operation split in node description properties

### Integration Points
- Package at `packages/n8n-nodes-ceneo/`
- Root workspace config in `package.json` (npm workspaces)
- CI/CD via existing `publish.yml` GitHub Actions workflow
- Shared test-utils from `shared/test-utils/`

</code_context>

<specifics>
## Specific Ideas

- Token management should be automatic — user provides API key, node handles GetToken call transparently
- v2 endpoints use function-call URL pattern: `/api/v2/function/{method}/Call` with POST body
- v3 endpoints are cleaner REST with query params
- `shop_product_ids` accepts up to 300 comma-separated IDs — field should accept string input
- Price monitoring is the primary use case — README example should show a periodic workflow checking competitor prices

</specifics>

<deferred>
## Deferred Ideas

- **Offer Management** (Set/Remove promotional text) — V2 scope, 4 endpoints
- **Bidding** (Set/Get CPC bid rates) — V2 scope, 4 endpoints
- **Buy Now (Basket)** (Full order lifecycle) — V2 scope, 16 endpoints
- **GetExecutionLimits** helper — Claude's discretion whether to include in V1
- **XML output format** — JSON only in V1, could expose format toggle in V2

</deferred>

---

*Phase: 13-node-dla-integracji-z-api-ceneo-mozliwosc-weryfikowania-cen-rynkowych*
*Context gathered: 2026-03-23*