# Phase 13: Ceneo API Integration - Research

**Researched:** 2026-03-23
**Domain:** n8n community node for Ceneo price comparison API (Polish market)
**Confidence:** HIGH

## Summary

Phase 13 implements an n8n community node for Ceneo, Poland's largest price comparison platform. The node enables merchants to verify market prices for their products via the Ceneo Developer API. V1 scope covers 4 operations across 2 resources (Products and Categories), using a programmatic node style due to the two-step authentication flow (API Key -> Bearer Token) and mixed v2/v3 endpoint patterns.

The Ceneo API has a split architecture: v3 endpoints use Bearer token auth via header, while v2 endpoints use the raw API key as a query/form parameter. The GenericFunctions helper must handle both auth modes transparently. The node follows established patterns from Fakturownia and LinkerCloud nodes already in the monorepo.

**Primary recommendation:** Build a programmatic node with GenericFunctions handling automatic token acquisition for v3 calls and direct apiKey injection for v2 calls. Follow the LinkerCloud resource-split pattern with 2 resource files (product.ts, category.ts).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use Ceneo Developer API at `https://developers.ceneo.pl`
- **D-02:** Credentials store API Key only. Node automatically calls `GET /AuthorizationService.svc/GetToken` with the API key to obtain Bearer token before each request session.
- **D-03:** Bearer token injected in `Authorization` header on all subsequent API calls. Token management is transparent to the user.
- **D-04:** V1 includes Price Analysis resource group + Categories helper only. Four operations total.
- **D-05:** `GetTopCategoryProducts` params: `categoryName` (string, required), `top` (number, max 100, default 100)
- **D-06:** `shop_getProductOffersBy_IDs` and `shop_getProductTop10OffersByIDs` params: `shop_product_ids` (string, required, comma-separated, max 300 IDs)
- **D-07:** `GetCategories` has no required params, returns all Ceneo categories (cached up to 60 min server-side)
- **D-08:** Programmatic node (`execute()` method) -- required for two-step auth and mixed v2/v3 patterns
- **D-09:** v2 endpoints use POST method -- 300 IDs in query string would hit URL length limits
- **D-10:** JSON only -- always request JSON responses
- **D-11:** Follow GenericFunctions pattern from Fakturownia/LinkerCloud
- **D-12:** Primary use case: price monitoring workflows

### Claude's Discretion
- Token caching strategy (per-execution vs per-call)
- Error handling specifics for v2 vs v3 endpoint error formats
- Whether to expose `GetExecutionLimits` as a debug/helper operation
- README example workflow structure

### Deferred Ideas (OUT OF SCOPE)
- Offer Management (Set/Remove promotional text) -- V2 scope
- Bidding (Set/Get CPC bid rates) -- V2 scope
- Buy Now (Basket) (Full order lifecycle) -- V2 scope
- XML output format -- JSON only in V1
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| n8n-workflow | ^1.x (peerDep) | Node type interfaces, NodeApiError | Required by all n8n nodes |
| typescript | inherited from root tsconfig | Strict mode compilation | Monorepo standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nock | ^13.x (devDep) | HTTP mocking for tests | All test files |
| jest | ^29.x (devDep) | Test runner | All test files |
| @n8n-polish-nodes/test-utils | workspace | Mock IExecuteFunctions | Test helper |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual httpRequest | httpRequestWithAuthentication | Cannot use -- v2 and v3 have different auth mechanisms; GenericFunctions must handle both |

**Installation:**
No additional packages needed beyond monorepo workspace dependencies.

## Architecture Patterns

### Recommended Project Structure
```
packages/n8n-nodes-ceneo/
├── nodes/
│   └── Ceneo/
│       ├── Ceneo.node.ts           # Main node with execute()
│       ├── Ceneo.node.json         # Codex metadata
│       ├── GenericFunctions.ts     # API helpers with dual auth
│       └── resources/
│           ├── product.ts          # Products operations + fields
│           └── category.ts         # Categories operations + fields
├── credentials/
│   └── CeneoApi.credentials.ts    # API Key credential
├── icons/
│   └── ceneo.svg                  # 60x60 SVG icon
├── __tests__/
│   └── Ceneo.node.test.ts         # Nock-based tests
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

### Pattern 1: Dual Auth GenericFunctions

**What:** The Ceneo API has two authentication modes -- v3 endpoints use Bearer token (obtained from GetToken), v2 endpoints use raw API key as query parameter. GenericFunctions must transparently handle both.

**When to use:** All API calls from the node.

**Example:**
```typescript
// GenericFunctions.ts pattern
const BASE_URL = 'https://developers.ceneo.pl';

// Cache token per execution (not per-call) to avoid unnecessary GetToken calls
let cachedToken: string | undefined;

async function getToken(
  this: IExecuteFunctions,
): Promise<string> {
  if (cachedToken) return cachedToken;
  const credentials = await this.getCredentials('ceneoApi');
  const apiKey = credentials.apiKey as string;

  const response = await this.helpers.httpRequest({
    method: 'GET',
    url: `${BASE_URL}/AuthorizationService.svc/GetToken`,
    headers: { Authorization: `Basic ${apiKey}` },
    json: true,
  });

  cachedToken = response as unknown as string; // GetToken returns token string
  return cachedToken;
}

// v3 endpoints (Bearer auth)
export async function ceneoApiRequestV3(
  this: IExecuteFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  qs: IDataObject = {},
): Promise<IDataObject | IDataObject[]> {
  const token = await getToken.call(this);
  // ... httpRequest with Authorization: Bearer {token}
}

// v2 endpoints (API key as form param)
export async function ceneoApiRequestV2(
  this: IExecuteFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body: IDataObject = {},
): Promise<IDataObject | IDataObject[]> {
  const credentials = await this.getCredentials('ceneoApi');
  // POST with apiKey + params as form body or query
}
```

### Pattern 2: Resource-Split Node Structure

**What:** Operations and field definitions split into separate files per resource, imported into main node file.
**When to use:** Standard pattern for multi-resource programmatic nodes in this monorepo (LinkerCloud, Fakturownia).
**Example:** See `packages/n8n-nodes-linkercloud/nodes/LinkerCloud/resources/stock.ts` for the canonical pattern.

### Pattern 3: Token Caching Strategy (Claude's Discretion)

**Recommendation:** Cache token as a module-level variable within GenericFunctions, reset at the start of each `execute()` call. This avoids calling GetToken for every single API request within one execution batch (which may process multiple input items), while ensuring a fresh token for each new node execution. This is the simplest approach and avoids TTL complexity.

```typescript
// In GenericFunctions.ts
let cachedToken: string | undefined;

export function resetTokenCache() {
  cachedToken = undefined;
}
```

Called at the top of `execute()` in the main node:
```typescript
async execute(this: IExecuteFunctions) {
  resetTokenCache(); // Fresh token per execution
  // ... process items
}
```

### Pattern 4: GetExecutionLimits (Claude's Discretion)

**Recommendation:** Include `GetExecutionLimits` as a third resource "Account" with a single operation "Get Limits". It is trivially small to implement (one v2 endpoint), provides useful debugging info for users, and follows the pattern of other nodes (SMSAPI has Account > Balance). It gives users visibility into their API quota without leaving n8n.

### Anti-Patterns to Avoid
- **Calling GetToken per API request:** Wasteful -- cache per execution instead
- **Using GET for v2 endpoints with many IDs:** URL length limits -- use POST as per D-09
- **Mixing auth in a single helper function:** Keep v2 and v3 helpers separate for clarity
- **Hardcoding base URL in multiple places:** Define once in GenericFunctions as constant

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP requests | Raw fetch/axios | `this.helpers.httpRequest` | n8n standard, handles retries, proxy |
| Error wrapping | Custom error classes | `NodeApiError` from n8n-workflow | Consistent error display in n8n UI |
| Mock functions | Custom test mocks | `createMockExecuteFunctions` from test-utils | Shared across all monorepo packages |
| HTTP test mocks | Manual request interception | nock library | Standard in all monorepo test files |

## Common Pitfalls

### Pitfall 1: v2 vs v3 Auth Confusion
**What goes wrong:** Using Bearer token on v2 endpoints or API key on v3 endpoints causes 401 errors.
**Why it happens:** Ceneo API has inconsistent auth across versions -- v3 uses Bearer from GetToken, v2 uses raw API key as parameter.
**How to avoid:** Separate `ceneoApiRequestV2` and `ceneoApiRequestV3` functions. Never mix.
**Warning signs:** 401 Unauthorized on endpoints that should work.

### Pitfall 2: v2 POST Body Format
**What goes wrong:** Sending JSON body to v2 endpoints when they expect form-urlencoded or query parameters.
**Why it happens:** v2 endpoints documented as accepting params via query OR form. The Swagger spec shows parameters as `query` type even for POST.
**How to avoid:** For v2 POST endpoints, send parameters as `qs` (query string) with `json: false`, or test both form and query approaches during implementation. The Swagger lists params as query even for POST methods.
**Warning signs:** Empty or error responses from v2 endpoints.

### Pitfall 3: GetToken Response Format
**What goes wrong:** Trying to parse a JSON object when GetToken returns a plain string token.
**Why it happens:** Most APIs return `{ "token": "..." }` but Ceneo GetToken may return the token directly as a string.
**How to avoid:** Test the actual response format. Handle both cases: if response is a string, use directly; if object, extract token field.
**Warning signs:** Token appears as `[object Object]` in Authorization header.

### Pitfall 4: shop_product_ids Max Limit
**What goes wrong:** Sending more than 300 IDs causes API error or silent truncation.
**Why it happens:** API has a hard 300 ID limit per request.
**How to avoid:** Document the 300 limit in the field description. Do NOT auto-batch -- let users handle this in their workflow.
**Warning signs:** API errors on large ID lists.

### Pitfall 5: eslint no-http-request-with-manual-auth
**What goes wrong:** Lint fails because httpRequest is used without httpRequestWithAuthentication.
**Why it happens:** GenericFunctions manually constructs auth headers/params.
**How to avoid:** Add `eslint-disable` comment with justification (dual auth modes require manual handling). This is the same pattern used in Fakturownia and LinkerCloud.
**Warning signs:** Lint errors on CI.

### Pitfall 6: Credential icon property
**What goes wrong:** Lint fails on credentials file missing `icon` property.
**Why it happens:** New eslint rule added (discovered in Phase 12).
**How to avoid:** Add `icon = 'file:ceneo.svg' as const;` to credential class. Ensure SVG is in icons/ directory.
**Warning signs:** Phase 12 decision: "Credential icon property added for lint compliance -- new eslint rule"

## Code Examples

### Credential File Pattern
```typescript
// Source: existing monorepo pattern (LinkerCloudApi.credentials.ts)
import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class CeneoApi implements ICredentialType {
  name = 'ceneoApi';
  displayName = 'Ceneo API';
  icon = 'file:ceneo.svg' as const;
  documentationUrl = 'https://developers.ceneo.pl';
  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'API key from Ceneo Partner Panel',
    },
  ];
  // Note: No ICredentialTestRequest -- GetToken is programmatic
  // and testing requires the two-step flow handled in GenericFunctions
}
```

### v3 API Call (GetTopCategoryProducts)
```typescript
// Source: Ceneo Swagger docs + existing GenericFunctions pattern
export async function ceneoApiRequestV3(
  this: IExecuteFunctions,
  endpoint: string,
  qs: IDataObject = {},
): Promise<IDataObject | IDataObject[]> {
  const token = await getToken.call(this);
  const requestOptions: IHttpRequestOptions = {
    method: 'GET',
    url: `${BASE_URL}${endpoint}`,
    headers: { Authorization: `Bearer ${token}` },
    qs,
    json: true,
  };

  try {
    // eslint-disable-next-line @n8n/community-nodes/no-http-request-with-manual-auth
    return await this.helpers.httpRequest(requestOptions);
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as JsonObject, {
      message: `Ceneo API error: ${(error as Error).message}`,
    });
  }
}
```

### v2 API Call (shop_getProductOffersBy_IDs)
```typescript
// Source: Ceneo Swagger docs -- v2 uses apiKey as query param
export async function ceneoApiRequestV2(
  this: IExecuteFunctions,
  functionName: string,
  params: IDataObject = {},
): Promise<IDataObject | IDataObject[]> {
  const credentials = await this.getCredentials('ceneoApi');
  const endpoint = `/api/v2/function/${functionName}/Call`;

  const requestOptions: IHttpRequestOptions = {
    method: 'POST',
    url: `${BASE_URL}${endpoint}`,
    qs: {
      apiKey: credentials.apiKey as string,
      resultFormatter: 'json',
      ...params,
    },
    json: true,
  };

  try {
    // eslint-disable-next-line @n8n/community-nodes/no-http-request-with-manual-auth
    return await this.helpers.httpRequest(requestOptions);
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as JsonObject, {
      message: `Ceneo API error: ${(error as Error).message}`,
    });
  }
}
```

### Test Pattern
```typescript
// Source: existing monorepo test pattern (LinkerCloud.node.test.ts)
import { createMockExecuteFunctions } from '@n8n-polish-nodes/test-utils';
import { Ceneo } from '../nodes/Ceneo/Ceneo.node';

const TEST_API_KEY = 'test-ceneo-api-key';

function createCeneoMock(params: Record<string, unknown>) {
  const mock = createMockExecuteFunctions(params);
  mock.getCredentials = jest.fn().mockResolvedValue({
    apiKey: TEST_API_KEY,
  });
  mock.helpers.httpRequest = jest.fn();
  return mock;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Declarative nodes only | Programmatic for complex auth | Monorepo Phase 2+ | execute() required for multi-step auth |
| No credential icon | icon property on credentials | Phase 12 | Lint rule enforcement |
| `strict: true` in eslint | `strict: false` with custom config | Phase 1 | Allows excluding test files from lint |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.x + ts-jest |
| Config file | `packages/n8n-nodes-ceneo/jest.config.js` (to be created, copy from LinkerCloud) |
| Quick run command | `cd packages/n8n-nodes-ceneo && npm test` |
| Full suite command | `npm run test:all` (root) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CENEO-01 | Credential has apiKey property | unit | `npm test -- --testNamePattern="credentials"` | Wave 0 |
| CENEO-02 | GetTopCategoryProducts returns products | unit+nock | `npm test -- --testNamePattern="GetTopCategory"` | Wave 0 |
| CENEO-03 | GetAllOffers with product IDs | unit+nock | `npm test -- --testNamePattern="GetAllOffers"` | Wave 0 |
| CENEO-04 | GetTop10Cheapest with product IDs | unit+nock | `npm test -- --testNamePattern="Top10"` | Wave 0 |
| CENEO-05 | GetCategories returns categories | unit+nock | `npm test -- --testNamePattern="categories"` | Wave 0 |
| CENEO-06 | Error handling wraps as NodeApiError | unit | `npm test -- --testNamePattern="error"` | Wave 0 |
| CENEO-07 | Token acquisition from GetToken | unit+nock | `npm test -- --testNamePattern="token"` | Wave 0 |
| CENEO-08 | Node metadata (displayName, resources) | unit | `npm test -- --testNamePattern="metadata"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd packages/n8n-nodes-ceneo && npm test`
- **Per wave merge:** `npm run test:all`
- **Phase gate:** Full suite green + `npm run lint` on ceneo package

### Wave 0 Gaps
- [ ] `packages/n8n-nodes-ceneo/__tests__/Ceneo.node.test.ts` -- all test cases
- [ ] `packages/n8n-nodes-ceneo/jest.config.js` -- copy from LinkerCloud pattern
- [ ] `packages/n8n-nodes-ceneo/tsconfig.json` -- copy from LinkerCloud pattern

## Open Questions

1. **GetToken exact response format**
   - What we know: Swagger says it returns a token for subsequent Bearer auth
   - What's unclear: Whether response is plain string, JSON object with token field, or wrapped in quotes
   - Recommendation: Implement with fallback handling -- try string first, then extract from object. Test against real API during dev testing.

2. **v2 POST parameter encoding**
   - What we know: Swagger lists params as `query` type even for POST endpoints
   - What's unclear: Whether v2 POST endpoints accept params as query string, form body, or both
   - Recommendation: Start with query string params (qs) on POST -- this matches the Swagger spec. Fall back to form body if needed.

3. **GetExecutionLimits inclusion**
   - What we know: Trivial to add, provides quota info
   - Recommendation: Include as Account > Get Limits (third resource). Minimal code cost, useful for users.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies -- code/config-only changes using existing monorepo tooling)

## Sources

### Primary (HIGH confidence)
- Ceneo Swagger OpenAPI spec (`https://developers.ceneo.pl/swagger/docs/v1`) -- full endpoint definitions, parameters, auth modes
- Existing monorepo code -- GenericFunctions patterns (Fakturownia, LinkerCloud), test patterns, credential patterns

### Secondary (MEDIUM confidence)
- Ceneo Swagger UI (`https://developers.ceneo.pl/swagger/ui/index`) -- confirms API key auth mode for v2

### Tertiary (LOW confidence)
- GetToken exact response format -- needs live verification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- identical to existing monorepo packages
- Architecture: HIGH -- follows established LinkerCloud/Fakturownia patterns with well-documented API
- Pitfalls: MEDIUM -- v2/v3 auth split is well-documented but exact response formats need live testing

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable -- Ceneo API rarely changes)
