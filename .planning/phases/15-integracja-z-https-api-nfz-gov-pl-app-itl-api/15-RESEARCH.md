# Phase 15: NFZ Terminy Leczenia (Treatment Waiting Times) - Research

**Researched:** 2026-03-23
**Domain:** NFZ public REST API (app-itl-api) - healthcare waiting times data
**Confidence:** MEDIUM

## Summary

The NFZ (Narodowy Fundusz Zdrowia / National Health Fund) publishes a public REST API called "Informator o Terminach Leczenia" (Information about Treatment Dates) at `https://api.nfz.gov.pl/app-itl-api/`. This API provides data about healthcare waiting times across Poland -- including first available treatment dates, waiting list lengths, and provider information for approximately 14,000 medical facilities with NFZ contracts. The current API version is 1.3 (released February 2020).

The API requires NO authentication (public open data), returns JSON API-standard responses, is paginated (25 results per page default), and has a rate limit of 10 requests per second per IP. This makes it an ideal candidate for a **declarative n8n node** following the NBP (National Bank of Poland) pattern -- a public API node with no credentials.

The API is behind Incapsula/Imperva WAF which blocks raw curl/programmatic access without browser-like headers. This is a significant concern for n8n runtime -- the node may need to set appropriate User-Agent and Accept headers, or the WAF may whitelist API-style requests differently from the browser-rendered documentation pages. **This requires live testing during implementation.**

**Primary recommendation:** Build a declarative n8n node (no credentials) with resources for Queues (main search), Benefits (dictionary), Localities (dictionary), and Provinces (dictionary). Follow the NBP node pattern exactly. Version the API requests with `api-version=1.3` query parameter.

## Project Constraints (from CLAUDE.md)

- Each node is a separate npm package named `n8n-nodes-{service}`
- Declarative style (routing) by default -- this API qualifies (simple GET requests, no auth)
- No credentials needed (public API) -- follows NBP/KRS/Biala Lista pattern
- Tests with nock mocks -- happy path + error handling
- README per node with description, example workflow, link to API docs
- SVG icon 60x60
- Codex file (.node.json) with categories
- `NodeApiError` for HTTP error handling
- Rate limit awareness: 10 req/sec -- document in README

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| n8n-workflow | * (peer) | Node type definitions | Required for all n8n nodes |
| @n8n/node-cli | * (dev) | Build, lint, dev mode | Official CLI tooling |
| TypeScript | 5.9.x | Type-safe development | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nock | latest | HTTP mocking for tests | All test files |
| jest | via test-utils | Test runner | All test files |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Declarative style | Programmatic (execute) | Unnecessary -- API is simple GET-only, JSON responses, no auth |

**Installation:** No additional dependencies needed -- all from workspace.

## Architecture Patterns

### Recommended Project Structure
```
packages/n8n-nodes-nfz/
├── nodes/
│   └── Nfz/
│       ├── Nfz.node.ts          # Main declarative node definition
│       └── Nfz.node.json        # Codex metadata file
├── icons/
│   └── nfz.svg                  # NFZ logo 60x60
├── __tests__/
│   └── Nfz.node.test.ts         # Description + nock contract tests
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

### Pattern 1: Declarative Public API Node (NBP Pattern)
**What:** Single-file node with all routing defined in the description object. No credentials, no execute() method.
**When to use:** Public APIs with simple GET endpoints, JSON responses, no authentication.
**Example:**
```typescript
// Source: existing NBP node pattern in this monorepo
import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

export class Nfz implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'NFZ Treatment Waiting Times',
    name: 'nfz',
    icon: 'file:../../icons/nfz.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Search healthcare waiting times and providers from NFZ (National Health Fund of Poland)',
    defaults: { name: 'NFZ' },
    usableAsTool: true,
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    requestDefaults: {
      baseURL: 'https://api.nfz.gov.pl/app-itl-api',
      headers: {
        Accept: 'application/json',
      },
      qs: {
        'api-version': '1.3',
        format: 'json',
      },
    },
    properties: [
      // Resource selector, operations, and parameters...
    ],
  };
}
```

### Pattern 2: JSON API Standard Response Handling
**What:** The NFZ API returns data in JSON API format (jsonapi.org standard) with `data`, `meta`, `links` sections.
**When to use:** All NFZ API responses follow this pattern.
**Response structure:**
```json
{
  "meta": {
    "context": "...",
    "count": 150,
    "title": "...",
    "page": 1,
    "limit": 25,
    "provider": "NFZ",
    "date-published": "2026-03-23T12:00:00+01:00",
    "date-modified": "2026-03-23T12:00:00+01:00",
    "description": "...",
    "keywords": "...",
    "language": "pl",
    "content-type": "application/vnd.api+json",
    "message": null
  },
  "links": {
    "first": "/app-itl-api/queues?page=1&limit=25&format=json&case=1&province=07&benefit=poradnia&api-version=1.3",
    "prev": null,
    "self": "/app-itl-api/queues?page=1&limit=25&format=json&case=1&province=07&benefit=poradnia&api-version=1.3",
    "next": "/app-itl-api/queues?page=2&limit=25&format=json&case=1&province=07&benefit=poradnia&api-version=1.3",
    "last": "/app-itl-api/queues?page=6&limit=25&format=json&case=1&province=07&benefit=poradnia&api-version=1.3"
  },
  "data": [
    {
      "type": "queue",
      "id": "GUID",
      "attributes": {
        "case": 1,
        "benefit": "PORADNIA ...",
        "many-places": "N",
        "provider": "NAZWA PLACOWKI",
        "provider-code": "...",
        "regon-provider": "...",
        "nip-provider": "...",
        "teryt-provider": "...",
        "place": "NAZWA ODDZIALU",
        "address": "UL. ...",
        "locality": "WARSZAWA",
        "phone": "+48...",
        "teryt-place": "...",
        "registry-number": "...",
        "id-resort-part-VII": "...",
        "id-resort-part-VIII": "...",
        "benefits-for-children": "N",
        "covid-19": "N",
        "toilet": "Y",
        "ramp": "Y",
        "car-park": "Y",
        "elevator": "Y",
        "latitude": 52.123,
        "longitude": 21.456,
        "statistics": {
          "provider-data": {
            "awaiting": 150,
            "removed": 10,
            "average-period": 30,
            "update": "2026-03"
          },
          "computed-data": null
        },
        "dates": {
          "applicable": true,
          "date": "2026-06-15",
          "date-situation-as-at": "2026-03-20"
        },
        "benefits-provided": {
          "type-of-benefit": 1,
          "year": 2025,
          "amount": 500
        }
      }
    }
  ]
}
```

### Anti-Patterns to Avoid
- **Using execute() method:** Unnecessary for this simple GET-only API. Stay declarative.
- **Building pagination into the node:** n8n declarative nodes do not auto-paginate. Let users control page/limit params. Pagination is a v2 feature if needed.
- **Hardcoding province codes:** Use a dropdown with all 16 Polish voivodeship codes for better UX.

## NFZ API Endpoints (Version 1.3)

### Confirmed Endpoints

| Resource | Endpoint | Method | Description | Confidence |
|----------|----------|--------|-------------|------------|
| Queues | `/queues` | GET | List first available treatment dates (main resource) | HIGH |
| Queues | `/queues/{id}` | GET | Get single queue details by ID | MEDIUM |
| Queues | `/queues/{id}/many-places` | GET | Alternative appointments at same provider | MEDIUM |
| Benefits | `/benefits` | GET | Dictionary of healthcare service names | HIGH |
| Localities | `/localities` | GET | Dictionary of localities | HIGH |
| Provinces | `/provinces` | GET | Dictionary of provinces | MEDIUM |

### Query Parameters for /queues

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `case` | integer | Yes | Medical case type: 1=stable (stabilny), 2=urgent (pilny) | `1` |
| `province` | string | No | Province code (01-16, two-digit) | `07` |
| `benefit` | string | No | Healthcare benefit name (full-text search) | `poradnia` |
| `locality` | string | No | Locality/city name | `Warszawa` |
| `page` | integer | No | Page number (default: 1) | `1` |
| `limit` | integer | No | Results per page (default: 25) | `10` |
| `format` | string | No | Response format (json/xml) | `json` |
| `api-version` | string | No | API version | `1.3` |
| `benefitForChildren` | string | No | Filter for children services (Y/N) | `Y` |

### Query Parameters for /benefits

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Benefit name (full-text search) |
| `page` | integer | No | Page number |
| `limit` | integer | No | Results per page |

### Query Parameters for /localities

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Locality name |
| `page` | integer | No | Page number |
| `limit` | integer | No | Results per page |

### Polish Province Codes (Voivodeships)

| Code | Name |
|------|------|
| 01 | dolnoslaskie |
| 02 | kujawsko-pomorskie |
| 03 | lubelskie |
| 04 | lubuskie |
| 05 | lodzkie |
| 06 | malopolskie |
| 07 | mazowieckie |
| 08 | opolskie |
| 09 | podkarpackie |
| 10 | podlaskie |
| 11 | pomorskie |
| 12 | slaskie |
| 13 | swietokrzyskie |
| 14 | warminsko-mazurskie |
| 15 | wielkopolskie |
| 16 | zachodniopomorskie |

## Proposed Node Operations

### Resource: Queue (main)
| Operation | Endpoint | Description |
|-----------|----------|-------------|
| Search | GET `/queues` | Search treatment waiting times by benefit, province, locality, case type |
| Get | GET `/queues/{id}` | Get details of a specific queue entry by ID |
| Get Many Places | GET `/queues/{id}/many-places` | Get alternative appointment locations for same benefit at same provider |

### Resource: Benefit (dictionary)
| Operation | Endpoint | Description |
|-----------|----------|-------------|
| Search | GET `/benefits` | Search healthcare benefit/service names |

### Resource: Locality (dictionary)
| Operation | Endpoint | Description |
|-----------|----------|-------------|
| Search | GET `/localities` | Search locality names where healthcare is provided |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Province dropdown | Manual string input | Options list with all 16 codes | Better UX, prevents typos |
| API versioning | Custom version logic | `api-version=1.3` in requestDefaults.qs | Consistent across all requests |
| JSON format | Manual format parameter | `format=json` in requestDefaults.qs | Default for all requests |
| Pagination | Custom pagination logic | Expose page/limit params to user | n8n declarative pattern |

## Common Pitfalls

### Pitfall 1: Incapsula/Imperva WAF Blocking
**What goes wrong:** The NFZ API is behind Incapsula WAF that returns 503 for requests without proper headers.
**Why it happens:** WAF blocks automated/bot traffic based on User-Agent and request patterns.
**How to avoid:** Set appropriate `Accept: application/json` header in requestDefaults. n8n's httpRequest typically sends proper headers. **Must be verified during live testing.**
**Warning signs:** 503 responses with HTML body containing "Incapsula incident ID".

### Pitfall 2: JSON API Response Structure
**What goes wrong:** The API returns JSON API standard format with nested `data[].attributes` structure, not flat JSON objects.
**Why it happens:** NFZ follows jsonapi.org specification.
**How to avoid:** n8n declarative nodes return the raw response. Users will need to access `data[].attributes` in subsequent nodes. Document this in README.
**Warning signs:** Users report "empty results" when they expect flat objects.

### Pitfall 3: Rate Limiting (10 req/sec)
**What goes wrong:** Exceeding 10 requests per second per IP results in throttled/blocked responses.
**Why it happens:** NFZ enforces strict rate limits on their public API.
**How to avoid:** Document in README. For batch workflows, users should add Wait nodes between iterations.
**Warning signs:** HTTP 429 or connection refused errors.

### Pitfall 4: Case Parameter Required for Queues
**What goes wrong:** Queues endpoint may return errors or unexpected results without the `case` parameter.
**Why it happens:** API requires specifying whether to search for stable (1) or urgent (2) cases.
**How to avoid:** Make `case` a required dropdown field with options: "Stable (1)" and "Urgent (2)".
**Warning signs:** Empty or error responses from queues endpoint.

### Pitfall 5: API Version Deprecation
**What goes wrong:** Using old API version (1.2) returns deprecated responses or errors.
**Why it happens:** Version 1.2 was deprecated in March 2020, only 1.3 is supported.
**How to avoid:** Hardcode `api-version=1.3` in requestDefaults.qs.
**Warning signs:** Deprecation warnings in response headers.

## Code Examples

### Declarative Queue Search Operation
```typescript
// Source: pattern from existing NBP/CEIDG nodes in this monorepo
{
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: {
      resource: ['queue'],
    },
  },
  options: [
    {
      name: 'Search',
      value: 'search',
      description: 'Search treatment waiting times',
      action: 'Search treatment waiting times',
      routing: {
        request: {
          method: 'GET',
          url: '/queues',
        },
      },
    },
    {
      name: 'Get',
      value: 'get',
      description: 'Get details of a specific queue entry',
      action: 'Get queue entry details',
    },
  ],
  default: 'search',
},
```

### Province Dropdown Field
```typescript
{
  displayName: 'Province',
  name: 'province',
  type: 'options',
  displayOptions: {
    show: {
      resource: ['queue'],
      operation: ['search'],
    },
  },
  options: [
    { name: 'All Provinces', value: '' },
    { name: 'Dolnoslaskie (01)', value: '01' },
    { name: 'Kujawsko-Pomorskie (02)', value: '02' },
    { name: 'Lubelskie (03)', value: '03' },
    { name: 'Lubuskie (04)', value: '04' },
    { name: 'Lodzkie (05)', value: '05' },
    { name: 'Malopolskie (06)', value: '06' },
    { name: 'Mazowieckie (07)', value: '07' },
    { name: 'Opolskie (08)', value: '08' },
    { name: 'Podkarpackie (09)', value: '09' },
    { name: 'Podlaskie (10)', value: '10' },
    { name: 'Pomorskie (11)', value: '11' },
    { name: 'Slaskie (12)', value: '12' },
    { name: 'Swietokrzyskie (13)', value: '13' },
    { name: 'Warminsko-Mazurskie (14)', value: '14' },
    { name: 'Wielkopolskie (15)', value: '15' },
    { name: 'Zachodniopomorskie (16)', value: '16' },
  ],
  default: '',
  description: 'Filter by Polish voivodeship (province)',
  routing: {
    send: {
      type: 'query',
      property: 'province',
      value: '={{ $value }}',
    },
  },
},
```

### Case Type Required Field
```typescript
{
  displayName: 'Case Type',
  name: 'case',
  type: 'options',
  required: true,
  displayOptions: {
    show: {
      resource: ['queue'],
      operation: ['search'],
    },
  },
  options: [
    { name: 'Stable (Stabilny)', value: 1 },
    { name: 'Urgent (Pilny)', value: 2 },
  ],
  default: 1,
  description: 'Medical case type -- stable or urgent',
  routing: {
    send: {
      type: 'query',
      property: 'case',
    },
  },
},
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| API v1.2 | API v1.3 | Feb 2020 | v1.2 deprecated, use only v1.3 |
| Multiple API base URLs | Single base URL | May 2019 | Only `api.nfz.gov.pl/app-itl-api/` supported |

**Deprecated/outdated:**
- API v1.2: Deprecated since March 2020, replaced by v1.3
- Old base URL (without /app-itl-api/ path): Decommissioned May 2019

## Open Questions

1. **Incapsula WAF compatibility with n8n httpRequest**
   - What we know: curl requests are blocked by Incapsula WAF (503 response). The API docs page itself is also behind WAF.
   - What's unclear: Whether n8n's httpRequest (which sends proper headers) will be blocked similarly, or if the WAF only blocks obvious bot User-Agents.
   - Recommendation: Test during implementation with actual n8n runtime. If blocked, may need to switch to programmatic style to set specific headers, or document that the API may be intermittently unavailable.

2. **Complete list of /queues query parameters**
   - What we know: case, province, benefit, locality, page, limit, format, api-version, benefitForChildren
   - What's unclear: There may be additional filter parameters visible only in the Swagger UI (which requires JavaScript to render).
   - Recommendation: Implement confirmed parameters first. Add more if discovered during live testing.

3. **Exact response schema for all endpoints**
   - What we know: JSON API format with data/meta/links sections. Queue attributes include case, benefit, provider, locality, statistics, dates, etc.
   - What's unclear: Complete attribute list for queue objects, exact schema for benefits/localities/provinces responses.
   - Recommendation: HIGH confidence on the general structure. Exact fields will be confirmed during nock test writing by fetching actual API responses.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified -- code/config-only changes using existing monorepo tooling).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (via workspace jest.config.base.js) |
| Config file | `packages/n8n-nodes-nfz/jest.config.js` (Wave 0) |
| Quick run command | `cd packages/n8n-nodes-nfz && npm test` |
| Full suite command | `npm run test:all` (root) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NFZ-01 | No credentials on node description | unit | `npm test -- --testPathPattern=Nfz` | Wave 0 |
| NFZ-02 | Queue Search routing + params | unit | `npm test -- --testPathPattern=Nfz` | Wave 0 |
| NFZ-03 | Queue Get routing | unit | `npm test -- --testPathPattern=Nfz` | Wave 0 |
| NFZ-04 | Queue Many Places routing | unit | `npm test -- --testPathPattern=Nfz` | Wave 0 |
| NFZ-05 | Benefit Search routing | unit | `npm test -- --testPathPattern=Nfz` | Wave 0 |
| NFZ-06 | Locality Search routing | unit | `npm test -- --testPathPattern=Nfz` | Wave 0 |
| NFZ-07 | api-version=1.3 in requestDefaults | unit | `npm test -- --testPathPattern=Nfz` | Wave 0 |
| NFZ-08 | Error handling (NodeApiError) | unit | `npm test -- --testPathPattern=Nfz` | Wave 0 |
| NFZ-09 | Codex, package.json, README | manual | Visual inspection | N/A |

### Sampling Rate
- **Per task commit:** `cd packages/n8n-nodes-nfz && npm test`
- **Per wave merge:** `npm run test:all`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `packages/n8n-nodes-nfz/jest.config.js` -- jest config (copy from NBP)
- [ ] `packages/n8n-nodes-nfz/__tests__/Nfz.node.test.ts` -- covers NFZ-01..08
- [ ] `packages/n8n-nodes-nfz/tsconfig.json` -- TypeScript config (copy from NBP)

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NFZ-01 | No credentials -- public API, follows NBP pattern | Confirmed: API requires no authentication |
| NFZ-02 | Resource: Queue -- operation Search (`/queues` with case, province, benefit, locality, page, limit params) | Confirmed via API docs and examples |
| NFZ-03 | Resource: Queue -- operation Get (`/queues/{id}`) | Medium confidence from docs snippets |
| NFZ-04 | Resource: Queue -- operation Get Many Places (`/queues/{id}/many-places`) | Medium confidence from docs snippets |
| NFZ-05 | Resource: Benefit -- operation Search (`/benefits?name=...`) | Confirmed via API example URLs |
| NFZ-06 | Resource: Locality -- operation Search (`/localities?name=...`) | Confirmed via API docs |
| NFZ-07 | Declarative style with `api-version=1.3` and `format=json` in requestDefaults.qs | Pattern from NBP node, API version confirmed |
| NFZ-08 | Error handling as NodeApiError with English messages | Project standard from CLAUDE.md |
| NFZ-09 | Tests with nock -- happy path + error handling | Project standard from CLAUDE.md |
| NFZ-10 | package.json (n8n-community-node-package keyword), codex (Healthcare category), SVG icon, README | Project standard from CLAUDE.md |
</phase_requirements>

## Sources

### Primary (HIGH confidence)
- NFZ official announcement: https://www.nfz.gov.pl/o-nfz/programy-i-projekty/projekt-otwarte-dane-dostep-standard-edukacja-api-terminy-leczenia-nowa-wersja-1-3,17.html -- API v1.3 release
- NFZ API documentation portal: https://api.nfz.gov.pl/app-itl-api/ -- main docs (Swagger UI, requires JS)
- NFZ API queue schema: https://api.nfz.gov.pl/app-itl-api/schema/queue -- queue object schema
- Government announcement: https://www.gov.pl/web/cyfryzacja/narodowy-fundusz-zdrowia-udostepnia-przez-api-baze-terminy-leczenia -- API launch details
- Existing NBP node in this monorepo: `/Users/mploneczka/projects/n8n/packages/n8n-nodes-nbp/` -- public API pattern reference

### Secondary (MEDIUM confidence)
- Multiple web search results confirming endpoint patterns, parameters, and JSON API response format
- NFZ API decommission notice: https://www.nfz.gov.pl/o-nfz/programy-i-projekty/projekt-otwarte-dane-dostep-standard-edukacja-api-terminy-leczenia-wylaczenie-jednego-z-adresow,12.html

### Tertiary (LOW confidence)
- Exact queue attributes schema (could not render Swagger UI or fetch API directly due to Incapsula WAF)
- `/provinces` endpoint existence (inferred from parameter support, not directly confirmed)
- `benefitForChildren` parameter (referenced in search snippets, needs live verification)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- identical to existing NBP/CEIDG/KRS nodes
- Architecture: HIGH -- follows established declarative public API pattern
- API endpoints: MEDIUM -- main endpoints confirmed, exact parameters partially confirmed due to WAF blocking direct access
- Pitfalls: MEDIUM -- WAF issue is real and verified, other pitfalls inferred from documentation

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (API version 1.3 is stable since 2020, unlikely to change soon)
