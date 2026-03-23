# Phase 11: KRS, Biala Lista VAT, VIES, GUS - Research

**Researched:** 2026-03-23
**Domain:** Polish and EU public registry APIs (KRS, White List VAT, VIES) + GUS REGON extension assessment
**Confidence:** HIGH

## Summary

Phase 11 covers three new n8n community nodes for Polish/EU public registries, plus an assessment of whether GUS REGON (built in Phase 10) needs extension. All three new APIs are **public REST/JSON APIs requiring NO authentication** (KRS, VIES) or **minimal API key auth** (White List VAT -- but no key needed, just date param). This makes them ideal for declarative n8n node style.

**KRS API** (api-krs.ms.gov.pl) is a free government REST API returning JSON extracts from the National Court Register. It has two operations: get current extract and get full extract, both by KRS number. No authentication required. **White List VAT API** (wl-api.mf.gov.pl) is a free government REST API for verifying VAT taxpayer status and bank accounts by NIP/REGON. It has search and check endpoints with a daily rate limit (10 search queries/day for up to 30 entities, 5000 check queries). No API key required. **VIES** (ec.europa.eu) provides a free REST API for validating EU VAT numbers -- simple GET endpoint returning JSON, no authentication.

**GUS REGON** was fully implemented in Phase 10 with search by NIP/REGON/KRS and full data + PKD codes. No extension is needed -- it is feature-complete.

**Primary recommendation:** Build three separate n8n packages (n8n-nodes-krs, n8n-nodes-biala-lista-vat, n8n-nodes-vies), all using declarative style with no credentials or simple no-auth patterns. Follow the NBP (Phase 14) and CEIDG (Phase 1) patterns.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| n8n-workflow | * (peer) | Node type definitions | Required for all n8n community nodes |
| @n8n/node-cli | * (dev) | Build, lint, dev mode | Official n8n tooling |
| TypeScript | 5.9.2 | Type safety | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nock | (dev) | HTTP mocking for tests | All test files |
| jest | (dev) | Test runner | All test files |

### No Additional Dependencies

All three APIs return JSON via REST GET endpoints. No XML parsing, no SOAP, no special auth libraries needed. Zero runtime dependencies for all three packages.

**Installation:** No additional packages needed beyond existing monorepo devDependencies.

## Architecture Patterns

### Recommended Project Structure (per package)

```
packages/n8n-nodes-krs/
├── nodes/
│   └── Krs/
│       ├── Krs.node.ts          # Declarative node definition
│       ├── Krs.node.json        # Codex metadata
│       └── resources/           # (if multi-resource)
├── __tests__/
│   └── Krs.node.test.ts
├── icons/
│   └── krs.svg
├── package.json
├── tsconfig.json
├── eslint.config.mjs
├── jest.config.js
└── README.md
```

Same structure for `n8n-nodes-biala-lista-vat` and `n8n-nodes-vies`.

### Pattern 1: Declarative Node Without Credentials (NBP Pattern)
**What:** Node with `requestDefaults.baseURL`, operations defined via `routing` in field definitions, no `credentials` array.
**When to use:** KRS and VIES -- both are public APIs with no auth.
**Example:**
```typescript
// Source: packages/n8n-nodes-nbp/nodes/Nbp/Nbp.node.ts
export class Krs implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'KRS',
    name: 'krs',
    // ... no credentials array
    requestDefaults: {
      baseURL: 'https://api-krs.ms.gov.pl/api/krs',
      headers: { Accept: 'application/json' },
    },
    properties: [/* routing-based operations */],
  };
}
```

### Pattern 2: Declarative Node With Simple Credentials (CEIDG Pattern)
**What:** Node with credentials for API key auth, declarative routing for all operations.
**When to use:** White List VAT -- while no API key is needed, it could follow the no-auth pattern. However, given rate limits (10 search/day), no credentials needed.
**Example:**
```typescript
// Source: packages/n8n-nodes-ceidg/nodes/Ceidg/Ceidg.node.ts
// Routing-based field with query params
{
  displayName: 'NIP',
  name: 'nip',
  type: 'string',
  routing: {
    request: { method: 'GET', url: '/search/nip/={{$value}}' },
  },
}
```

### Pattern 3: Date Parameter as Required Field
**What:** White List VAT API requires a `date` query parameter on every request.
**When to use:** All White List VAT operations.
**Example:**
```typescript
{
  displayName: 'Date',
  name: 'date',
  type: 'string',
  required: true,
  default: '',
  placeholder: '2026-03-23',
  description: 'Date for which to check VAT status (YYYY-MM-DD format)',
  routing: {
    send: { type: 'query', property: 'date' },
  },
}
```

### Anti-Patterns to Avoid
- **Programmatic style for simple GET APIs:** All three APIs are simple REST GET with JSON responses -- no reason to use execute() method.
- **Creating credentials for public APIs:** KRS and VIES require no auth. Do not create unnecessary credential types.
- **Single monolithic multi-API node:** Each API should be a separate npm package per CLAUDE.md rules.

## API Details

### KRS API (Krajowy Rejestr Sadowy)

| Property | Value |
|----------|-------|
| Base URL | `https://api-krs.ms.gov.pl/api/krs` |
| Auth | None (public API) |
| Format | JSON |
| Rate Limits | Not documented (public) |

**Verified endpoints (tested 2026-03-23):**

| Operation | Method | Path | Parameters | Description |
|-----------|--------|------|------------|-------------|
| Get Current Extract | GET | `/OdpisAktualny/{krsNumber}` | `rejestr` (optional: P/S), `format=json` | Current extract with company data |
| Get Full Extract | GET | `/OdpisPelny/{krsNumber}` | `rejestr` (optional: P/S), `format=json` | Full historical extract |

**Response structure (verified):**
```json
{
  "odpis": {
    "rodzaj": "Aktualny",
    "naglowekA": { "rejestr": "RejP", "numerKRS": "0000019193", ... },
    "dane": {
      "dzial1": { "danePodmiotu": { "nazwa": "...", "identyfikatory": { "regon": "...", "nip": "..." } } },
      "dzial2": { /* board members, representation */ },
      "dzial3": { /* business activity, PKD codes */ },
      "dzial4": { /* debts, pledges */ },
      "dzial5": { /* partnerships */ },
      "dzial6": { /* liquidation, bankruptcy */ }
    }
  }
}
```

**Notes:**
- `rejestr` param: P = przedsiebiorcy (entrepreneurs), S = stowarzyszenia (associations). If omitted, API auto-detects.
- `format=json` query param required to get JSON (default is PDF).
- JSON response anonymizes personal data (first letters of names, first digit of PESEL). PDF contains full data.
- KRS number is always 10 digits, zero-padded.

### White List VAT API (Biala Lista Podatnikow VAT)

| Property | Value |
|----------|-------|
| Base URL (prod) | `https://wl-api.mf.gov.pl` |
| Base URL (test) | `https://wl-test.mf.gov.pl` |
| Auth | None (public API) |
| Format | JSON |
| Rate Limits | Search: 10 queries/day (max 30 entities each). Check: 5000/day. Reset at 00:00. |

**Verified endpoints (tested 2026-03-23):**

| Operation | Method | Path | Query Params | Description |
|-----------|--------|------|--------------|-------------|
| Search by NIP | GET | `/api/search/nip/{nip}` | `date` (required) | Full subject data by NIP |
| Search by NIPs | GET | `/api/search/nips/{nips}` | `date` (required) | Batch search (comma-sep, max 30) |
| Search by REGON | GET | `/api/search/regon/{regon}` | `date` (required) | Full subject data by REGON |
| Search by REGONs | GET | `/api/search/regons/{regons}` | `date` (required) | Batch search (max 30) |
| Search by Bank Account | GET | `/api/search/bank-account/{account}` | `date` (required) | Find subject by bank account |
| Search by Bank Accounts | GET | `/api/search/bank-accounts/{accounts}` | `date` (required) | Batch search (max 30) |
| Check NIP + Account | GET | `/api/check/nip/{nip}/bank-account/{account}` | `date` (required) | Verify account belongs to NIP |
| Check REGON + Account | GET | `/api/check/regon/{regon}/bank-account/{account}` | `date` (required) | Verify account belongs to REGON |

**Response structure (verified):**
- Search: `{"result": {"subject": {"name","nip","statusVat","regon","accountNumbers":[...],...}, "requestId","requestDateTime"}}`
- Check: `{"result": {"accountAssigned": "TAK"/"NIE", "requestId", "requestDateTime"}}`
- `statusVat` values: "Czynny" (active), "Zwolniony" (exempt), "Niezarejestrowany" (unregistered)

**Notes:**
- `date` parameter is required on every request (YYYY-MM-DD format).
- Bank account numbers use 26-digit NRB format (no spaces, no dashes).
- Test environment available at wl-test.mf.gov.pl for development.
- Consider adding environment toggle (test/production) even though no auth is needed.

### VIES API (VAT Information Exchange System)

| Property | Value |
|----------|-------|
| Base URL | `https://ec.europa.eu/taxation_customs/vies/rest-api` |
| Auth | None (public API) |
| Format | JSON |
| Rate Limits | Soft -- "MS_MAX_CONCURRENT_REQ" error possible |

**Verified endpoint (tested 2026-03-23):**

| Operation | Method | Path | Description |
|-----------|--------|------|-------------|
| Check VAT Number | GET | `/ms/{countryCode}/vat/{vatNumber}` | Validate EU VAT number |

**Response structure (verified):**
```json
{
  "isValid": true,
  "requestDate": "2026-03-23T07:24:03.811Z",
  "userError": "VALID",
  "name": "ZAKLAD UBEZPIECZEN SPOLECZNYCH",
  "address": "SZAMOCKA 3/5\n01-748 WARSZAWA",
  "vatNumber": "5213017228",
  "viesApproximate": {
    "name": "---", "street": "---", "postalCode": "---",
    "city": "---", "companyType": "---",
    "matchName": 3, "matchStreet": 3, ...
  }
}
```

**Notes:**
- `countryCode`: 2-letter ISO (AT, BE, BG, CY, CZ, DE, DK, EE, EL, ES, FI, FR, HR, HU, IE, IT, LT, LU, LV, MT, NL, PL, PT, RO, SE, SI, SK, XI)
- `vatNumber`: 2-12 chars alphanumeric
- `userError` values: "VALID", "INVALID", "GLOBAL_MAX_CONCURRENT_REQ", "MS_MAX_CONCURRENT_REQ", "MS_UNAVAILABLE", "TIMEOUT"
- When invalid: `isValid: false`, name/address show "---"
- This is a REST endpoint (not the legacy SOAP WSDL). No API key or registration needed.
- SOAP endpoint also exists (`checkVatService.wsdl`) but REST is simpler and sufficient.

### GUS REGON Assessment

GUS REGON was fully implemented in Phase 10 with:
- Search by NIP, REGON, KRS
- Get full company data with PKD codes
- SOAP session management
- Double XML decoding

**Conclusion: No extension needed.** The Phase 10 implementation is feature-complete for v1 scope.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date formatting | Custom date parser | String field with YYYY-MM-DD placeholder | APIs expect simple string format |
| Country code dropdown | Hardcoded string input | Options list with all EU country codes | Prevents typos, better UX |
| KRS number validation | Custom validator | 10-digit string with placeholder hint | API returns clear error for invalid numbers |
| Batch NIP/REGON input | Custom array builder | Comma-separated string field | API expects comma-separated in URL path |

**Key insight:** All three APIs are simple enough that declarative routing handles everything. No custom GenericFunctions, no XML parsing, no session management needed.

## Common Pitfalls

### Pitfall 1: White List VAT Rate Limits
**What goes wrong:** Users hit the 10 search/day limit quickly in production workflows.
**Why it happens:** Rate limit is very low (10 search queries/day per IP).
**How to avoid:** Document rate limits prominently in README. Suggest using "check" endpoint (5000/day) for bank account verification workflows. Consider test environment for development.
**Warning signs:** HTTP 429 or blocking response after ~10 queries.

### Pitfall 2: KRS format=json Parameter
**What goes wrong:** API returns PDF binary instead of JSON.
**Why it happens:** Default response format is PDF, not JSON.
**How to avoid:** Always include `format=json` in query params via `requestDefaults.qs`.
**Warning signs:** Response starts with `%PDF` instead of `{`.

### Pitfall 3: VIES Country-Specific Unavailability
**What goes wrong:** Validation fails with MS_UNAVAILABLE for specific countries.
**Why it happens:** VIES queries each country's tax authority in real time; some are periodically down.
**How to avoid:** Handle `userError` field in response. Return clear error message indicating which country's service is down.
**Warning signs:** `userError: "MS_UNAVAILABLE"` or `"MS_MAX_CONCURRENT_REQ"`.

### Pitfall 4: White List Date Parameter
**What goes wrong:** API returns error when date is missing or in wrong format.
**Why it happens:** `date` query parameter is mandatory on every endpoint.
**How to avoid:** Make date field required in node definition. Use string type with YYYY-MM-DD placeholder (same pattern as NBP).
**Warning signs:** HTTP 400 with error about missing date parameter.

### Pitfall 5: KRS Number Padding
**What goes wrong:** Search by KRS "19193" fails.
**Why it happens:** KRS numbers must be 10 digits, zero-padded (0000019193).
**How to avoid:** Document in field description that KRS number must be 10 digits. Optionally pad with leading zeros in node logic (but declarative style makes this harder -- document instead).
**Warning signs:** 404 response for valid KRS numbers entered without padding.

### Pitfall 6: White List Batch Endpoints Path Encoding
**What goes wrong:** Batch search with comma-separated values gets URL-encoded incorrectly.
**Why it happens:** NIPs/REGONs/accounts are comma-separated in the URL path segment, not query params.
**How to avoid:** Use URL template `=/search/nips/{{$value}}` where user enters comma-separated values. Document max 30 items.
**Warning signs:** API returns "Invalid parameters" error.

## Code Examples

### Declarative Node Without Credentials (KRS)
```typescript
// Pattern: NBP node (Phase 14) -- no credentials, pure declarative
export class Krs implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'KRS',
    name: 'krs',
    icon: 'file:../../icons/krs.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Look up companies in the Polish National Court Register (KRS)',
    defaults: { name: 'KRS' },
    usableAsTool: true,
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    requestDefaults: {
      baseURL: 'https://api-krs.ms.gov.pl/api/krs',
      headers: { Accept: 'application/json' },
      qs: { format: 'json' },
    },
    properties: [/* resource + operations */],
  };
}
```

### Routing with Path Parameter (KRS)
```typescript
{
  displayName: 'KRS Number',
  name: 'krsNumber',
  type: 'string',
  required: true,
  default: '',
  placeholder: '0000019193',
  description: 'KRS number (10 digits, zero-padded)',
  displayOptions: { show: { resource: ['company'], operation: ['getCurrentExtract'] } },
  routing: {
    request: { method: 'GET', url: '=/OdpisAktualny/{{$value}}' },
  },
}
```

### Routing with Path + Query Parameter (White List VAT)
```typescript
{
  displayName: 'NIP',
  name: 'nip',
  type: 'string',
  required: true,
  default: '',
  placeholder: '5213017228',
  description: 'NIP number to search',
  displayOptions: { show: { resource: ['subject'], operation: ['searchByNip'] } },
  routing: {
    request: { method: 'GET', url: '=/api/search/nip/{{$value}}' },
  },
}
// Separate date field with routing.send
{
  displayName: 'Date',
  name: 'date',
  type: 'string',
  required: true,
  default: '',
  placeholder: '2026-03-23',
  description: 'Date for verification (YYYY-MM-DD)',
  routing: { send: { type: 'query', property: 'date' } },
}
```

### EU Country Code Options (VIES)
```typescript
{
  displayName: 'Country Code',
  name: 'countryCode',
  type: 'options',
  required: true,
  options: [
    { name: 'Austria (AT)', value: 'AT' },
    { name: 'Belgium (BE)', value: 'BE' },
    // ... all 27 EU member states + XI (Northern Ireland)
    { name: 'Poland (PL)', value: 'PL' },
    // ...
  ],
  default: 'PL',
  routing: {
    request: { method: 'GET', url: '=/ms/{{$value}}/vat/' },
  },
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| KRS via SOAP/scraping | REST JSON API at api-krs.ms.gov.pl | 2022 | Free, structured access |
| VIES via SOAP only | REST API at ec.europa.eu (JSON) | ~2023 | No XML parsing needed |
| White List via website | REST API at wl-api.mf.gov.pl | 2019 | Programmable verification |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest with ts-jest |
| Config file | `jest.config.js` per package (inherits `jest.config.base.js`) |
| Quick run command | `npm test -- --testPathPattern={file}` |
| Full suite command | `npm run test` (per package) |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| KRS-01 | Get current extract by KRS number | unit + nock | `jest Krs.node.test.ts` | Wave 0 |
| KRS-02 | Get full extract by KRS number | unit + nock | `jest Krs.node.test.ts` | Wave 0 |
| BL-01 | Search subject by NIP | unit + nock | `jest BialaListaVat.node.test.ts` | Wave 0 |
| BL-02 | Search subject by REGON | unit + nock | `jest BialaListaVat.node.test.ts` | Wave 0 |
| BL-03 | Search by bank account | unit + nock | `jest BialaListaVat.node.test.ts` | Wave 0 |
| BL-04 | Check NIP + bank account | unit + nock | `jest BialaListaVat.node.test.ts` | Wave 0 |
| VIES-01 | Validate EU VAT number | unit + nock | `jest Vies.node.test.ts` | Wave 0 |
| ALL-ERR | Error handling for all nodes | unit + nock | per-package test suite | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test` in affected package
- **Per wave merge:** `npm run test` from root
- **Phase gate:** Full suite green + build + lint

### Wave 0 Gaps
- [ ] `packages/n8n-nodes-krs/__tests__/Krs.node.test.ts` -- covers KRS operations
- [ ] `packages/n8n-nodes-biala-lista-vat/__tests__/BialaListaVat.node.test.ts` -- covers WL operations
- [ ] `packages/n8n-nodes-vies/__tests__/Vies.node.test.ts` -- covers VIES validation
- [ ] `packages/n8n-nodes-krs/jest.config.js` -- standard config
- [ ] `packages/n8n-nodes-biala-lista-vat/jest.config.js` -- standard config
- [ ] `packages/n8n-nodes-vies/jest.config.js` -- standard config

## Node Design Decisions

### Package Names and Structure

| Node | Package Name | Style | Credentials | Resources |
|------|-------------|-------|-------------|-----------|
| KRS | n8n-nodes-krs | Declarative | None | Company (2 ops) |
| Biala Lista VAT | n8n-nodes-biala-lista-vat | Declarative | None | Subject (6 ops), Verification (2 ops) |
| VIES | n8n-nodes-vies | Declarative | None | VAT Number (1 op) |

### KRS Node Operations

| Resource | Operation | Endpoint | Description |
|----------|-----------|----------|-------------|
| Company | Get Current Extract | GET `/OdpisAktualny/{krs}?format=json` | Current company data (dzial 1-6) |
| Company | Get Full Extract | GET `/OdpisPelny/{krs}?format=json` | Full historical data |

### White List VAT Node Operations

| Resource | Operation | Endpoint | Description |
|----------|-----------|----------|-------------|
| Subject | Search by NIP | GET `/api/search/nip/{nip}?date=` | Full subject data |
| Subject | Search by NIPs (Batch) | GET `/api/search/nips/{nips}?date=` | Batch (max 30) |
| Subject | Search by REGON | GET `/api/search/regon/{regon}?date=` | Full subject data |
| Subject | Search by REGONs (Batch) | GET `/api/search/regons/{regons}?date=` | Batch (max 30) |
| Subject | Search by Bank Account | GET `/api/search/bank-account/{acct}?date=` | Find by account |
| Subject | Search by Bank Accounts (Batch) | GET `/api/search/bank-accounts/{accts}?date=` | Batch (max 30) |
| Verification | Check NIP + Account | GET `/api/check/nip/{nip}/bank-account/{acct}?date=` | TAK/NIE |
| Verification | Check REGON + Account | GET `/api/check/regon/{regon}/bank-account/{acct}?date=` | TAK/NIE |

### VIES Node Operations

| Resource | Operation | Endpoint | Description |
|----------|-----------|----------|-------------|
| VAT Number | Validate | GET `/ms/{countryCode}/vat/{vatNumber}` | Check EU VAT validity |

### Codex Categories

| Node | Category | Subcategory |
|------|----------|-------------|
| KRS | Data & Storage | Business Registry |
| Biala Lista VAT | Finance & Accounting | VAT |
| VIES | Finance & Accounting | VAT |

## Open Questions

1. **White List VAT test environment behavior**
   - What we know: Test URL is `wl-test.mf.gov.pl`, production is `wl-api.mf.gov.pl`
   - What's unclear: Whether test environment has same rate limits and returns same data structure
   - Recommendation: Add environment toggle to node (not credentials since no auth), test against test env during development

2. **KRS rejestr parameter necessity**
   - What we know: API auto-detects register type (P/S) when parameter omitted
   - What's unclear: Whether there are edge cases where auto-detection fails
   - Recommendation: Make `rejestr` an optional additional field, default to auto-detect

3. **VIES occasional unavailability**
   - What we know: Some EU countries' tax services go offline periodically
   - What's unclear: How frequently this happens and whether retry helps
   - Recommendation: Handle MS_UNAVAILABLE in error message, document in README. Do not auto-retry (it is a backend service issue).

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified -- all three APIs are public REST endpoints accessible via HTTP, no additional tooling needed).

## Sources

### Primary (HIGH confidence)
- KRS API: Verified live endpoint `api-krs.ms.gov.pl` tested 2026-03-23, returns JSON
- White List VAT API: Verified live endpoint `wl-api.mf.gov.pl` tested 2026-03-23, returns JSON
- VIES REST API: Verified live endpoint `ec.europa.eu/taxation_customs/vies/rest-api` tested 2026-03-23, returns JSON
- [Official KRS API announcement](https://www.gov.pl/web/sprawiedliwosc/uruchomienie-otwartego-api-krajowego-rejestru-sadowego)
- [White List VAT API docs](https://www.gov.pl/web/kas/api-wykazu-podatnikow-vat) - API v1.6.0, Swagger available
- [VIES portal](https://ec.europa.eu/taxation_customs/vies/)
- Existing codebase: GUS REGON (Phase 10), CEIDG (Phase 1), NBP (Phase 14) -- patterns verified

### Secondary (MEDIUM confidence)
- [KRS API dataset on dane.gov.pl](https://dane.gov.pl/en/dataset/27606,api-krajowego-rejestru-sadowego-api-krs)
- [VIES WSDL](https://ec.europa.eu/taxation_customs/vies/services/checkVatService.wsdl)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, reuses existing monorepo patterns
- Architecture: HIGH - All three APIs tested live, response structures verified
- Pitfalls: HIGH - Rate limits documented from official sources, format issues verified
- API endpoints: HIGH - All endpoints tested with real data on 2026-03-23

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable government APIs, unlikely to change)
