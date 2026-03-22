# Phase 14: NBP Exchange Rates Node - Research

**Researched:** 2026-03-22
**Domain:** NBP (Narodowy Bank Polski) Web API - exchange rates and gold prices
**Confidence:** HIGH

## Summary

The NBP API is a free, public REST API that requires **no authentication**. It provides official exchange rate data (Tables A, B, C) and gold prices in JSON or XML format. The API is well-documented, stable, and has been available since 2002 (exchange rates) and 2013 (gold prices).

This node is one of the simplest possible n8n nodes -- no credentials needed, all GET requests, JSON responses, no pagination, no rate limits documented. It follows the same pattern as the CEIDG node (declarative style) but is even simpler because there is no authentication at all.

**Primary recommendation:** Build as a fully declarative node with no credentials. Two resources: Exchange Rate and Gold Price. Use `requestDefaults` with `baseURL: https://api.nbp.pl/api` and `format=json` in default query params.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| n8n-workflow | * (peer) | Node type definitions | Required by all n8n nodes |
| @n8n/node-cli | * (dev) | Build, lint, dev mode | Official n8n CLI |
| TypeScript | 5.9.x | Type safety | Matches monorepo |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nock | (workspace) | HTTP mocking in tests | All HTTP contract tests |
| jest | (workspace) | Test runner | All tests |

No additional dependencies needed. This node uses only built-in n8n declarative routing.

## Architecture Patterns

### Recommended Project Structure
```
packages/n8n-nodes-nbp/
├── nodes/
│   └── Nbp/
│       ├── Nbp.node.ts          # Main declarative node
│       ├── Nbp.node.json        # Codex metadata
│       └── resources/           # (optional, if splitting resources)
│           ├── exchangeRate.ts   # Exchange rate operations
│           └── goldPrice.ts      # Gold price operations
├── icons/
│   └── nbp.svg                  # NBP logo 60x60
├── __tests__/
│   └── Nbp.node.test.ts         # Description + nock tests
├── package.json
├── tsconfig.json
├── eslint.config.mjs
├── jest.config.js
└── README.md
```

### Pattern 1: No-Credential Declarative Node
**What:** A node that requires no authentication -- the NBP API is fully public.
**When to use:** When the target API has no auth requirement.
**Key difference from CEIDG:** No `credentials` array in the node description. No credentials file at all.

```typescript
// No credentials needed - NBP API is public
export class Nbp implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'NBP Exchange Rates',
        name: 'nbp',
        icon: 'file:../../icons/nbp.svg',
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
        description: 'Get official exchange rates and gold prices from NBP (National Bank of Poland)',
        defaults: { name: 'NBP' },
        usableAsTool: true,
        inputs: [NodeConnectionTypes.Main],
        outputs: [NodeConnectionTypes.Main],
        // NO credentials array - public API
        requestDefaults: {
            baseURL: 'https://api.nbp.pl/api',
            headers: { Accept: 'application/json' },
            qs: { format: 'json' },  // Force JSON responses
        },
        properties: [/* ... */],
    };
}
```

### Pattern 2: Resource-Split for Readability
**What:** Split exchange rate and gold price operations into separate resource files.
**When to use:** When a single node file would be too long (more than ~200 lines).
**Decision:** Given the moderate number of operations (around 10 total), a single file is acceptable. Split only if it exceeds 200 lines.

### Pattern 3: Table Type as Parameter
**What:** The NBP API has three table types (A, B, C) with different data:
- **Table A** - average exchange rates (most common, ~33 currencies)
- **Table B** - average exchange rates for less common currencies (~90+ currencies)
- **Table C** - buy/sell rates (bid/ask) for ~8 major currencies only

The table parameter affects both the URL path and the response structure (Table C has `bid`/`ask` instead of `mid`).

```typescript
{
    displayName: 'Table',
    name: 'table',
    type: 'options',
    options: [
        { name: 'A - Average Rates (Common Currencies)', value: 'A' },
        { name: 'B - Average Rates (All Currencies)', value: 'B' },
        { name: 'C - Buy/Sell Rates', value: 'C' },
    ],
    default: 'A',
    description: 'NBP exchange rate table type',
}
```

### Anti-Patterns to Avoid
- **Adding credentials for a public API:** The NBP API has no auth. Do not create a credentials file -- it would confuse users.
- **Trying to paginate:** NBP API does not paginate. Each endpoint returns the full result set. The 93-day limit on date ranges is a query constraint, not pagination.
- **Hardcoding currency codes:** Let users type the ISO 4217 code as a string input. Do not create a dropdown with all currencies -- the list differs between tables A, B, and C.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON format forcing | Custom Accept header logic | `qs: { format: 'json' }` in requestDefaults | NBP API respects query param |
| Date formatting | Custom date formatter | n8n's built-in dateTime type field | Gives date picker UI, outputs ISO format |
| Error handling for 404 | Custom "no data" error | n8n's built-in NodeApiError from declarative routing | NBP returns 404 when no data for date/range |

## Common Pitfalls

### Pitfall 1: 404 on Weekends and Holidays
**What goes wrong:** NBP publishes rates only on business days. Requesting `today` on a weekend or holiday returns 404.
**Why it happens:** No exchange rate table is published on non-business days.
**How to avoid:** Document this clearly in the node description. The "current" endpoint (no date) returns the LATEST published rate, which works on weekends. Only "today" endpoint fails on non-business days.
**Warning signs:** Tests that hardcode `today/` in URLs may fail intermittently.

### Pitfall 2: Response Structure Differs by Table
**What goes wrong:** Table C responses have `bid` and `ask` fields, while Tables A and B have `mid`.
**Why it happens:** Table C represents buy/sell rates, not averages.
**How to avoid:** This is fine -- n8n returns the raw JSON. Just document the difference.

### Pitfall 3: 93-Day Date Range Limit
**What goes wrong:** Requesting a date range longer than 93 days returns 400 error.
**Why it happens:** NBP API enforces this limit to prevent excessive data retrieval.
**How to avoid:** Add a description note on the date range fields: "Maximum 93-day range."

### Pitfall 4: Gold Price Field Names are Polish
**What goes wrong:** Gold price response uses `data` (Polish for "date") and `cena` (Polish for "price") as field names.
**Why it happens:** NBP API returns Polish field names for gold prices (but English-ish names for exchange rates).
**How to avoid:** Nothing to do -- n8n passes through raw JSON. Document this in README.

### Pitfall 5: No Credential Test Endpoint
**What goes wrong:** n8n credential types typically have a `test` request. Since there are no credentials, there is no test.
**Why it happens:** Public API with no auth.
**How to avoid:** Simply omit the credentials entirely. No credential type class needed.

## NBP API Reference

### Base URL
`https://api.nbp.pl/api/`

### Exchange Rate Endpoints (all GET)

| Operation | Endpoint | Description |
|-----------|----------|-------------|
| Get Current Table | `/exchangerates/tables/{table}/` | Latest published table |
| Get Table Today | `/exchangerates/tables/{table}/today/` | Today's table (404 on weekends) |
| Get Table by Date | `/exchangerates/tables/{table}/{date}/` | Table for specific date |
| Get Table Date Range | `/exchangerates/tables/{table}/{startDate}/{endDate}/` | Tables in date range (max 93 days) |
| Get Last N Tables | `/exchangerates/tables/{table}/last/{topCount}/` | Last N published tables |
| Get Current Rate | `/exchangerates/rates/{table}/{code}/` | Latest rate for currency |
| Get Rate Today | `/exchangerates/rates/{table}/{code}/today/` | Today's rate (404 on weekends) |
| Get Rate by Date | `/exchangerates/rates/{table}/{code}/{date}/` | Rate on specific date |
| Get Rate Date Range | `/exchangerates/rates/{table}/{code}/{startDate}/{endDate}/` | Rates in range (max 93 days) |
| Get Last N Rates | `/exchangerates/rates/{table}/{code}/last/{topCount}/` | Last N rates for currency |

### Gold Price Endpoints (all GET)

| Operation | Endpoint | Description |
|-----------|----------|-------------|
| Get Current Price | `/cenyzlota/` | Latest gold price |
| Get Price Today | `/cenyzlota/today/` | Today's price (404 on weekends) |
| Get Price by Date | `/cenyzlota/{date}/` | Price on specific date |
| Get Price Date Range | `/cenyzlota/{startDate}/{endDate}/` | Prices in range (max 93 days) |
| Get Last N Prices | `/cenyzlota/last/{topCount}/` | Last N prices |

### Response Structures

**Table A/B (single currency):**
```json
{
    "table": "A",
    "currency": "euro",
    "code": "EUR",
    "rates": [
        { "no": "055/A/NBP/2026", "effectiveDate": "2026-03-20", "mid": 4.2742 }
    ]
}
```

**Table C (single currency):**
```json
{
    "table": "C",
    "currency": "euro",
    "code": "EUR",
    "rates": [
        { "no": "055/C/NBP/2026", "effectiveDate": "2026-03-20", "bid": 4.2315, "ask": 4.3169 }
    ]
}
```

**Full table (Table A):**
```json
[{
    "table": "A",
    "no": "055/A/NBP/2026",
    "effectiveDate": "2026-03-20",
    "rates": [
        { "currency": "bat (Tajlandia)", "code": "THB", "mid": 0.1253 },
        { "currency": "euro", "code": "EUR", "mid": 4.2742 }
    ]
}]
```

**Gold price:**
```json
[{ "data": "2026-03-20", "cena": 562.93 }]
```

### Error Responses
- **404** - No data for the specified date/range (weekends, holidays, future dates)
- **400** - Invalid query (bad date format, range > 93 days, invalid table/code)

### Key Constraints
- Date format: YYYY-MM-DD (ISO 8601)
- Date range maximum: 93 days
- Exchange rates available from: 2002-01-02
- Gold prices available from: 2013-01-02
- No authentication required
- No documented rate limits
- HTTPS only (since August 2025)

## Proposed Node Operations

### Resource: Exchange Rate

| Operation | Parameters | Endpoint |
|-----------|------------|----------|
| Get Current Rate | table, currencyCode | `/exchangerates/rates/{table}/{code}/` |
| Get Rate by Date | table, currencyCode, date | `/exchangerates/rates/{table}/{code}/{date}/` |
| Get Rate Date Range | table, currencyCode, startDate, endDate | `/exchangerates/rates/{table}/{code}/{startDate}/{endDate}/` |
| Get Last N Rates | table, currencyCode, count | `/exchangerates/rates/{table}/{code}/last/{count}/` |
| Get Current Table | table | `/exchangerates/tables/{table}/` |
| Get Table by Date | table, date | `/exchangerates/tables/{table}/{date}/` |

### Resource: Gold Price

| Operation | Parameters | Endpoint |
|-----------|------------|----------|
| Get Current Price | (none) | `/cenyzlota/` |
| Get Price by Date | date | `/cenyzlota/{date}/` |
| Get Price Date Range | startDate, endDate | `/cenyzlota/{startDate}/{endDate}/` |
| Get Last N Prices | count | `/cenyzlota/last/{count}/` |

## Code Examples

### Declarative routing for a date-parameterized endpoint
```typescript
// Source: Project pattern from CEIDG node + NBP API docs
{
    displayName: 'Currency Code',
    name: 'currencyCode',
    type: 'string',
    required: true,
    default: 'EUR',
    placeholder: 'EUR',
    description: 'ISO 4217 currency code (e.g., EUR, USD, GBP)',
    displayOptions: {
        show: {
            resource: ['exchangeRate'],
            operation: ['getCurrentRate'],
        },
    },
    routing: {
        request: {
            method: 'GET',
            url: '=/exchangerates/rates/{{$parameter["table"]}}/{{$value}}/',
        },
    },
}
```

### Routing with date range (compound URL)
```typescript
{
    displayName: 'End Date',
    name: 'endDate',
    type: 'dateTime',
    required: true,
    default: '',
    description: 'End date (YYYY-MM-DD). Maximum 93-day range.',
    displayOptions: {
        show: {
            resource: ['exchangeRate'],
            operation: ['getRateDateRange'],
        },
    },
    routing: {
        request: {
            method: 'GET',
            url: '=/exchangerates/rates/{{$parameter["table"]}}/{{$parameter["currencyCode"]}}/{{$parameter["startDate"]}}/{{$value}}/',
        },
    },
}
```

**Note on date fields:** n8n's `dateTime` type returns ISO timestamps. The NBP API expects YYYY-MM-DD format only. If `dateTime` sends full ISO strings, the node may need to use `string` type with a placeholder instead, or use a `preSend` function to truncate. Verify during implementation -- if `dateTime` sends `2026-03-20T00:00:00.000Z` instead of `2026-03-20`, use `string` type.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HTTP only | HTTPS only | August 2025 | Base URL must use https:// |
| Custom XML parsing | `?format=json` query param | Available since API launch | Always use JSON format |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (via workspace config) |
| Config file | `packages/n8n-nodes-nbp/jest.config.js` (Wave 0) |
| Quick run command | `npm test --workspace=packages/n8n-nodes-nbp` |
| Full suite command | `npm run test:all` (root) |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NBP-01 | No credentials, public API | unit | Description test: no credentials array | Wave 0 |
| NBP-02 | Exchange rate operations exist with correct routing | unit | Description structure tests | Wave 0 |
| NBP-03 | Gold price operations exist with correct routing | unit | Description structure tests | Wave 0 |
| NBP-04 | HTTP contract: current rate returns JSON | integration | nock-based test | Wave 0 |
| NBP-05 | HTTP contract: 404 on invalid date | integration | nock-based test | Wave 0 |
| NBP-06 | Codex, icon, README, package.json | unit | File existence + structure tests | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test --workspace=packages/n8n-nodes-nbp`
- **Per wave merge:** `npm run test:all`
- **Phase gate:** Full suite green before verify

### Wave 0 Gaps
- [ ] `packages/n8n-nodes-nbp/__tests__/Nbp.node.test.ts` -- all tests
- [ ] `packages/n8n-nodes-nbp/jest.config.js` -- jest config (copy from CEIDG)
- [ ] Package scaffold: `package.json`, `tsconfig.json`, `eslint.config.mjs`

## Open Questions

1. **dateTime field format vs NBP API date format**
   - What we know: NBP expects YYYY-MM-DD. n8n `dateTime` type may send full ISO timestamps.
   - What's unclear: Whether declarative routing truncates the date automatically.
   - Recommendation: Test with `dateTime` type first. If it sends timestamps, switch to `string` type with `placeholder: 'YYYY-MM-DD'`. Alternatively, a simple `preSend` hook could truncate.

2. **Should "Get Table Today" be a separate operation?**
   - What we know: "today" returns 404 on weekends. "current" (no date) always works.
   - Recommendation: Omit "today" operations entirely. "Get Current" covers the use case and never fails. Users who need a specific date can use "Get by Date".

## Sources

### Primary (HIGH confidence)
- NBP API official documentation at https://api.nbp.pl/ -- full endpoint reference, response formats, constraints
- Live API responses fetched for Tables A, C, and gold prices -- verified actual JSON structure

### Secondary (HIGH confidence)
- Existing CEIDG node in this monorepo -- verified project patterns, conventions, file structure
- Project CLAUDE.md -- conventions, package.json template, testing approach

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - identical to existing CEIDG node, no new dependencies
- Architecture: HIGH - follows established declarative node pattern, API is simple and well-documented
- Pitfalls: HIGH - API is live and testable, all edge cases verified against docs

**Research date:** 2026-03-22
**Valid until:** 2026-06-22 (stable government API, unlikely to change)
