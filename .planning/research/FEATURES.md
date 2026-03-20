# Feature Landscape: n8n Polish Community Nodes

**Domain:** n8n community node development (Polish service integrations)
**Researched:** 2026-03-20
**Overall confidence:** MEDIUM (based on n8n documentation knowledge from training data; WebSearch/WebFetch unavailable for live verification)

> **Confidence note:** WebSearch and WebFetch were unavailable during this research. Findings are based on training data knowledge of n8n node development patterns (as of early 2025), the project's existing CLAUDE.md documentation, and general n8n ecosystem knowledge. The n8n Creator Portal and verification process details should be verified against current docs.n8n.io before submission.

---

## Table Stakes

Features every well-crafted n8n community node must have. Missing any of these = node feels amateur or gets rejected from verification.

### Node Structure and Metadata

| Feature | Why Expected | Complexity | Per-Node Notes |
|---------|--------------|------------|----------------|
| Proper `package.json` with `n8n-community-node-package` keyword | Required for n8n to discover the node in npm registry | Low | All 11 nodes |
| Codex file (`.node.json`) with categories/subcategories | Enables proper categorization in n8n node panel | Low | All 11 nodes |
| SVG icon 60x60 pixels, square aspect ratio | Visual identity in node panel; blurry/missing icons = unprofessional | Low | All 11 -- use official service logos |
| `n8nNodesApiVersion: 1` in package.json | Required for n8n to load the node correctly | Low | All 11 nodes |
| `displayName` and `description` in English | n8n is an international platform; English is required even for Polish services | Low | All 11 nodes |
| `documentationUrl` on credential type | Helps users find API docs directly from n8n credential setup | Low | All 11 nodes |

### Credential Separation

| Feature | Why Expected | Complexity | Per-Node Notes |
|---------|--------------|------------|----------------|
| Dedicated credential type class | n8n architecture requires credentials separate from node logic | Low | All 11 nodes |
| `typeOptions: { password: true }` on secret fields | Prevents tokens from being visible in UI | Low | All 11 nodes |
| Test/authenticate method on credential | Allows "Test Connection" button in n8n credential setup | Medium | All 11 -- use a lightweight GET endpoint |
| Sandbox/production toggle | Users need to test before going live | Low | InPost, Przelewy24, Allegro, Shoper |

### Error Handling

| Feature | Why Expected | Complexity | Per-Node Notes |
|---------|--------------|------------|----------------|
| All HTTP errors wrapped as `NodeApiError` | n8n standard; provides consistent error display in workflow UI | Medium | All 11 nodes |
| Human-readable English error messages | Users must understand what went wrong without reading API docs | Medium | All 11 nodes |
| HTTP status code included in error context | Debugging requires knowing if it was 401 vs 404 vs 500 | Low | All 11 nodes |
| `continueOnFail()` support | Allows workflows to continue processing other items on error | Medium | All 11 nodes (programmatic style) |
| Input validation with `NodeOperationError` | Catch invalid inputs before making API calls (e.g., invalid NIP format) | Low | CEIDG, GUS REGON, SMSAPI (phone format) |

### Operations Pattern (Resource + Operation)

| Feature | Why Expected | Complexity | Per-Node Notes |
|---------|--------------|------------|----------------|
| Resource/Operation two-level menu | Standard n8n UX pattern; users expect to pick Resource then Operation | Low | All 11 nodes |
| Consistent CRUD naming (Create, Get, Update, Delete, Get Many) | n8n convention uses these exact verbs, not "Add"/"Remove"/"Fetch" | Low | All multi-operation nodes |
| "Get Many" (not "List") naming convention | n8n internally uses "Get Many" for list operations | Low | All nodes with list endpoints |
| Operation descriptions with examples | Helps users understand what each operation does | Low | All 11 nodes |

### Output Formatting

| Feature | Why Expected | Complexity | Per-Node Notes |
|---------|--------------|------------|----------------|
| Return data as `INodeExecutionData[]` | Required n8n return format | Low | All 11 nodes |
| Each API item as separate n8n item | Enables downstream nodes to process items individually | Low | All 11 nodes |
| Consistent JSON output structure | Users build workflows expecting stable output shapes | Low | All 11 nodes |

---

## Differentiators

Features that elevate nodes above "minimum viable." These increase chances of verification badge and community adoption.

### Pagination Support

| Feature | Value Proposition | Complexity | Per-Node Notes |
|---------|-------------------|------------|----------------|
| Automatic pagination ("Return All" toggle) | Users get all results without manually managing pages | Medium | Fakturownia, InPost, BaseLinker, Shoper, Allegro |
| "Limit" parameter when Return All = false | Users control how many results to fetch | Low | Same as above |
| Built-in pagination with `this.helpers.requestWithAuthentication` or manual loop | Transparent multi-page fetching | Medium | Programmatic nodes |

**Pattern for pagination:**
```
returnAll (boolean toggle) → if true: loop through all pages; if false: respect "limit" parameter
```

n8n convention: `returnAll` is a boolean field. When false, show a `limit` field (default 50). Declarative nodes can use `routing.send.paginate` for simple offset/page pagination. Programmatic nodes implement the loop in `execute()`.

### Binary Data Handling

| Feature | Value Proposition | Complexity | Per-Node Notes |
|---------|-------------------|------------|----------------|
| PDF download as binary output | Users can save/email/forward files downstream | Medium | Fakturownia (invoice PDF), InPost (shipping label), wFirma (invoice PDF), iFirma (invoice PDF) |
| Binary data with proper MIME type | Downstream nodes handle files correctly | Low | All binary operations |
| Filename in binary metadata | Files save with meaningful names, not "download.bin" | Low | All binary operations |
| Binary data upload (where applicable) | Forward files from other n8n nodes into the API | Medium | None in V1 scope |

**Binary data pattern (programmatic):**
```typescript
const response = await this.helpers.httpRequest({
  method: 'GET',
  url: `${baseUrl}/invoices/${id}.pdf`,
  encoding: 'arraybuffer',
  returnFullResponse: true,
});
const binaryData = await this.helpers.prepareBinaryData(
  Buffer.from(response.body),
  `invoice-${id}.pdf`,
  'application/pdf',
);
return [{ json: {}, binary: { data: binaryData } }];
```

### Additional Fields / Options Pattern

| Feature | Value Proposition | Complexity | Per-Node Notes |
|---------|-------------------|------------|----------------|
| "Additional Fields" collection for optional params | Clean UI -- required fields visible, optional fields collapsed | Low | All nodes with optional API params |
| "Options" collection for settings | Separates configuration from data | Low | Nodes with format/encoding/mode settings |
| "Filters" collection for list operations | Clean filtering without cluttering the main form | Low | All "Get Many" operations |

**This is a critical UX pattern in n8n.** Required fields appear at the top level. Optional fields go inside an "Additional Fields" collection. This keeps the node form clean and scannable. Verified nodes universally follow this pattern.

### Rate Limiting and Retry

| Feature | Value Proposition | Complexity | Per-Node Notes |
|---------|-------------------|------------|----------------|
| Exponential backoff on 429 responses | Prevents API bans and workflow failures | Medium | SMSAPI (100/min), BaseLinker (100/min), Shoper (2/sec) |
| Configurable retry count | Power users want control | Low | Nodes with known rate limits |

### Sandbox/Environment Support

| Feature | Value Proposition | Complexity | Per-Node Notes |
|---------|-------------------|------------|----------------|
| Environment toggle in credentials | One-click switch between test and production | Low | InPost, Przelewy24, Allegro, Shoper |
| Dynamic base URL based on environment | Transparent sandbox routing | Low | Same nodes |

---

## Anti-Features

Features to explicitly NOT build. Saves time and avoids maintenance burden.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Trigger/webhook nodes (V1) | High complexity, requires persistent webhook registration, cleanup on deactivation | Defer to V2; document as "coming soon" |
| Full Allegro API coverage | 100+ endpoints = massive maintenance burden | V1: Offers, Orders, Shipping, Users only |
| Full BaseLinker API coverage | 60+ methods = scope creep | V1: Orders, Products, Shipping only |
| Custom SDK wrappers as dependencies | Adds dependency risk, version conflicts | Use `this.helpers.httpRequest` / `this.helpers.requestWithAuthentication` directly |
| Caching layer | n8n handles caching at workflow level; node-level cache = bugs | Let n8n handle it |
| Internationalization (Polish UI) | n8n UI is English; Polish labels = inconsistency with platform | English only for all labels and descriptions |
| Complex input validation beyond API requirements | Over-engineering; let the API return its own validation errors | Basic validation only (e.g., NIP format check) |
| Webhook URL generation in regular nodes | Belongs in Trigger node, not regular node | Defer to V2 trigger nodes |

---

## Feature Dependencies

```
Credential Type → Node (every node depends on its credential)
Resource/Operation structure → All operations (must be defined before operations work)
Error handling (NodeApiError) → All operations (required for any API call)
Binary data helpers → PDF download operations (Fakturownia, InPost, wFirma, iFirma)
Pagination logic → "Get Many" operations (Fakturownia, BaseLinker, Shoper, Allegro)
OAuth2 credential type → Shoper, Allegro (must be configured before any operation works)
HMAC signing utility → iFirma (all operations depend on request signing)
CRC checksum utility → Przelewy24 (transaction register/verify depend on checksum)
XML parser utility → wFirma, GUS REGON (all operations depend on XML parsing)
SOAP envelope builder → GUS REGON (all operations depend on SOAP structure)
Session management → GUS REGON (login → query → logout flow)
```

---

## Declarative vs Programmatic: Decision Matrix

Use **declarative** when:
- API is standard REST with JSON responses
- Auth is simple (API key in header/query, Basic Auth, Bearer token)
- No request signing or checksums
- No complex pagination beyond simple page/offset
- No binary data operations
- No response transformation needed

Use **programmatic** when any of these apply:
- Custom request signing (iFirma HMAC-SHA1, Przelewy24 CRC)
- Non-JSON responses (wFirma XML, GUS REGON SOAP/XML)
- Non-standard API structure (BaseLinker single-endpoint POST)
- Complex pagination patterns
- Binary data download/upload
- OAuth2 token refresh with custom logic
- Session-based auth (GUS REGON login/query/logout)
- Multi-step operations (register + redirect URL generation)

### Per-Node Style Assignment

| Node | Style | Rationale |
|------|-------|-----------|
| SMSAPI (#1) | **Declarative** | Standard REST, Bearer token, JSON (with `format=json`) |
| CEIDG (#10) | **Declarative** | Simplest API, GET only, API key, JSON |
| Fakturownia (#2) | **Mostly declarative, programmatic for PDF** | REST JSON for CRUD; PDF download needs `execute()` for binary |
| InPost (#3) | **Programmatic** | Complex shipment creation, binary label download, org ID routing |
| Przelewy24 (#4) | **Programmatic** | CRC SHA384 checksum required for register/verify |
| BaseLinker (#5) | **Programmatic** | Single-endpoint POST with `method` in body -- incompatible with declarative routing |
| Shoper (#6) | **Programmatic** | OAuth2 client_credentials with custom token refresh, rate limiting |
| wFirma (#7) | **Programmatic** | XML responses require parsing |
| iFirma (#8) | **Programmatic** | HMAC-SHA1 signature per request |
| Allegro (#9) | **Programmatic** | OAuth2 Authorization Code, complex API, varying rate limits |
| GUS REGON (#11) | **Programmatic** | SOAP/XML, session-based auth |

---

## Credential Type Patterns

### Pattern 1: API Key (simplest)

**Used by:** SMSAPI, Fakturownia, BaseLinker, CEIDG, GUS REGON, iFirma

```typescript
export class ServiceApi implements ICredentialType {
  name = 'serviceApi';
  displayName = 'Service API';
  documentationUrl = 'https://...';
  properties: INodeProperties[] = [
    {
      displayName: 'API Token',
      name: 'apiToken',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
    },
  ];
  // Optional: authenticate method for "Test Connection"
  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: { Authorization: '={{"Bearer " + $credentials.apiToken}}' },
    },
  };
}
```

### Pattern 2: API Key + Subdomain/Domain

**Used by:** Fakturownia (subdomain), Shoper (shop domain)

Add a `subdomain` or `domain` field. Build base URL dynamically: `https://${subdomain}.fakturownia.pl/`

### Pattern 3: Basic Auth

**Used by:** Przelewy24, wFirma (alternative)

```typescript
properties: [
  { displayName: 'Merchant ID', name: 'merchantId', type: 'string', ... },
  { displayName: 'CRC Key', name: 'crcKey', type: 'string', typeOptions: { password: true }, ... },
  { displayName: 'Environment', name: 'environment', type: 'options',
    options: [
      { name: 'Sandbox', value: 'sandbox' },
      { name: 'Production', value: 'production' },
    ],
    default: 'sandbox',
  },
];
```

### Pattern 4: OAuth2

**Used by:** Shoper (client_credentials), Allegro (authorization_code)

n8n has built-in OAuth2 credential support. You extend `ICredentialType` and set:

```typescript
export class AllegroOAuth2Api implements ICredentialType {
  name = 'allegroOAuth2Api';
  extends = ['oAuth2Api'];  // Key: extends n8n's built-in OAuth2
  displayName = 'Allegro OAuth2 API';
  properties: INodeProperties[] = [
    // Override defaults for Allegro-specific URLs
    {
      displayName: 'Grant Type',
      name: 'grantType',
      type: 'hidden',
      default: 'authorizationCode', // or 'clientCredentials' for Shoper
    },
    {
      displayName: 'Authorization URL',
      name: 'authUrl',
      type: 'hidden',
      default: 'https://allegro.pl/auth/oauth/authorize',
    },
    {
      displayName: 'Access Token URL',
      name: 'accessTokenUrl',
      type: 'hidden',
      default: 'https://allegro.pl/auth/oauth/token',
    },
    {
      displayName: 'Scope',
      name: 'scope',
      type: 'hidden',
      default: 'allegro:api:orders:read allegro:api:offers:write',
    },
  ];
}
```

For **Shoper (client_credentials):** n8n handles token refresh automatically when using `this.helpers.requestWithAuthentication('shoperOAuth2Api', requestOptions)`.

For **Allegro (authorization_code):** n8n provides the full OAuth2 flow UI (redirect, consent, callback). The credential type just needs the right URLs and scopes.

### Pattern 5: Custom Signing (HMAC)

**Used by:** iFirma

Cannot use declarative auth. Must implement signing in `execute()`:

```typescript
import { createHmac } from 'crypto';

// In execute():
const hmac = createHmac('sha1', apiKey);
hmac.update(url + userName + keyName + requestBody);
const signature = hmac.digest('hex');
// Add to request headers
```

---

## Error Handling Patterns

### Standard Pattern: NodeApiError

```typescript
try {
  const response = await this.helpers.httpRequest(options);
  return response;
} catch (error) {
  throw new NodeApiError(this.getNode(), error as JsonObject, {
    message: 'Failed to create invoice',
    description: `The API returned: ${error.message}`,
    httpCode: String(error.statusCode),
  });
}
```

### Pattern for APIs with Custom Error Formats

**BaseLinker** returns `{"status": "ERROR", "error_code": "...", "error_message": "..."}` with HTTP 200. Must check response body:

```typescript
const response = await this.helpers.httpRequest(options);
if (response.status === 'ERROR') {
  throw new NodeApiError(this.getNode(), response as JsonObject, {
    message: `BaseLinker error: ${response.error_code}`,
    description: response.error_message,
  });
}
```

### continueOnFail Pattern

```typescript
const items = this.getInputData();
const returnData: INodeExecutionData[] = [];

for (let i = 0; i < items.length; i++) {
  try {
    // ... process item
    returnData.push({ json: responseData });
  } catch (error) {
    if (this.continueOnFail()) {
      returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
      continue;
    }
    throw error;
  }
}
```

---

## Pagination Patterns

### Pattern 1: Page-based (Fakturownia, BaseLinker)

```typescript
// Standard n8n pagination pattern
const returnAll = this.getNodeParameter('returnAll', i) as boolean;
const limit = this.getNodeParameter('limit', i, 50) as number;

if (returnAll) {
  responseData = await getAllItems.call(this, endpoint, query);
} else {
  query.per_page = limit;
  query.page = 1;
  responseData = await this.helpers.httpRequest({ ...options, qs: query });
}
```

### Pattern 2: Offset-based (Shoper)

```typescript
let offset = 0;
const perPage = 50;
do {
  const response = await this.helpers.httpRequest({
    ...options,
    qs: { limit: perPage, offset },
  });
  results.push(...response.list);
  offset += perPage;
} while (results.length < response.count);
```

### Pattern 3: Cursor/Token-based (Allegro)

```typescript
let nextPage: string | undefined;
do {
  const qs: any = { limit: 100 };
  if (nextPage) qs.offset = nextPage;
  const response = await this.helpers.httpRequest({ ...options, qs });
  results.push(...response.offers);
  nextPage = response.nextPage?.offset;
} while (nextPage);
```

---

## n8n Verification Badge Requirements

**Confidence: MEDIUM** -- Based on training data knowledge as of early 2025. The n8n Creator Portal and verification process may have evolved. Verify against current docs.n8n.io/integrations/creating-nodes/submit/ before submission.

### What the Verified Badge Means

The n8n verified badge indicates that n8n has reviewed the community node and confirmed it meets quality standards. Verified nodes appear with a checkmark in the n8n node panel and are more discoverable.

### Known Requirements (verify against current docs)

| Requirement | Details | Status for This Project |
|-------------|---------|------------------------|
| **npm published with provenance** | Package must have npm provenance attestation (published via CI, not manual) | Planned: GitHub Actions publish |
| **`n8n-community-node-package` keyword** | Required in package.json keywords for discovery | Planned in all packages |
| **Working credential test** | "Test Connection" button must work | Must implement `authenticate` or `test` on credentials |
| **Proper error handling** | Errors must be `NodeApiError` with clear messages | Planned pattern across all nodes |
| **No hardcoded secrets** | All auth via credential types | Planned architecture |
| **English labels and descriptions** | All user-facing text in English | Planned |
| **Icon** | SVG, 60x60, official service logo | Planned per node |
| **README with usage instructions** | Clear documentation of what the node does and how to use it | Planned per package |
| **Codex file** | `.node.json` with categories, subcategories, documentation URL | Planned per node |
| **Consistent UX patterns** | Resource/Operation structure, Additional Fields, standard verbs | Planned |
| **MIT or compatible license** | Open source license required | MIT planned |
| **Active maintenance** | Responding to issues, updating for n8n version compatibility | Author commitment |
| **No unnecessary dependencies** | Minimal npm dependencies; prefer n8n built-in helpers | Use `this.helpers.*` over external libs |

### Creator Portal Submission Process (verify current process)

1. Publish node to npm with provenance
2. Register on n8n Creator Portal (creator.n8n.io or similar)
3. Submit node for review
4. n8n team reviews: code quality, UX consistency, error handling, security
5. If approved: verified badge appears in n8n community nodes listing
6. Ongoing: maintain compatibility with n8n updates

### What Gets Nodes Rejected (common issues)

- Hardcoded credentials or secrets in code
- Missing error handling (raw API errors exposed to users)
- Non-standard operation naming (using "Fetch" instead of "Get")
- Missing credential test functionality
- Poor documentation / missing README
- Excessive npm dependencies
- Node crashes on invalid input instead of returning `NodeApiError`
- Missing `continueOnFail` support in programmatic nodes

---

## Special Treatment: Per-Node Feature Requirements

### Nodes Needing Binary Data Support

| Node | Binary Operation | Format | Notes |
|------|-----------------|--------|-------|
| Fakturownia (#2) | Download Invoice PDF | PDF | `GET /invoices/{id}.pdf` |
| InPost (#3) | Download Shipping Label | PDF (A4/A6) | `GET /shipments/{id}/label` with format param |
| wFirma (#7) | Download Invoice PDF | PDF | Specific endpoint TBD |
| iFirma (#8) | Download Invoice PDF | PDF | Specific endpoint TBD |

### Nodes Needing Custom Auth Logic

| Node | Auth Type | Special Logic |
|------|-----------|---------------|
| iFirma (#8) | HMAC-SHA1 | Sign every request with `createHmac('sha1', key)` |
| Przelewy24 (#4) | CRC Checksum | SHA384 checksum on transaction data |
| GUS REGON (#11) | Session-based | Login → get session ID → use in subsequent requests → logout |
| Allegro (#9) | OAuth2 Authorization Code | Full OAuth2 flow with user consent redirect |
| Shoper (#6) | OAuth2 Client Credentials | Auto token refresh via n8n OAuth2 support |

### Nodes Needing XML/SOAP Handling

| Node | Challenge | Approach |
|------|-----------|----------|
| wFirma (#7) | API returns XML, not JSON | Parse XML responses with `xml2js` or `fast-xml-parser` in `execute()` |
| GUS REGON (#11) | Full SOAP API | Build SOAP envelopes, parse XML responses, manage session lifecycle |

**Recommendation for XML parsing:** Use `fast-xml-parser` (lightweight, no native dependencies, well-maintained). Avoid `xml2js` (callback-based, older). For SOAP envelope construction, use template literals -- do not add a full SOAP library dependency.

### Nodes Needing Non-Standard Request Structure

| Node | Issue | Approach |
|------|-------|----------|
| BaseLinker (#5) | All requests = POST to single URL with `method` in body | Custom request builder in `execute()` |
| SMSAPI (#1) | Legacy endpoints need `format=json` query param | Add to all requests via declarative routing `send.preSend` or query defaults |
| Fakturownia (#2) | API token can go in URL or header; subdomain-based base URL | Dynamic base URL from credentials |

---

## MVP Recommendation

### Phase 1 MVP: SMSAPI + CEIDG (Week 1)

**Prioritize these table-stakes features:**
1. Resource/Operation structure with standard naming
2. Credential type with test connection
3. `NodeApiError` wrapping on all operations
4. Codex file with proper categorization
5. SVG icon
6. README with example workflow JSON

**Defer from Phase 1:**
- Pagination (CEIDG has max ~few results; SMSAPI contacts can wait)
- Binary data (not applicable to these nodes)
- Rate limiting retry (SMSAPI test mode has no limits)

### Phase 2: Fakturownia (Week 2)

**Add these features:**
1. Pagination support (`returnAll` toggle) for invoices/clients/products lists
2. Binary data download (PDF invoices)
3. "Additional Fields" pattern for optional invoice fields
4. Subdomain-based dynamic base URL

### Phase 3: InPost (Week 3)

**Add these features:**
1. Complex object input (nested shipment data: receiver, parcels, dimensions)
2. Binary data download (shipping labels, A4/A6 format selection)
3. Sandbox/Production environment toggle
4. Organization ID in credentials

### Phase 4+: Progressively add complexity

Each subsequent node adds one new pattern:
- **Przelewy24:** CRC checksum signing
- **BaseLinker:** Single-endpoint POST pattern, Unix timestamp handling
- **Shoper:** OAuth2 client_credentials
- **wFirma:** XML response parsing
- **iFirma:** HMAC request signing
- **Allegro:** OAuth2 authorization_code (full flow)
- **GUS REGON:** SOAP/XML, session management

---

## Sources and Confidence

| Source | Type | Confidence |
|--------|------|------------|
| Project CLAUDE.md | Direct project documentation | HIGH |
| Project PROJECT.md | Direct project requirements | HIGH |
| n8n node development docs (training data) | Training data, not live-verified | MEDIUM |
| n8n Creator Portal requirements | Training data, may have changed | MEDIUM |
| n8n operation naming conventions | Training data, well-established pattern | MEDIUM-HIGH |
| Binary data handling patterns | Training data, core n8n feature | MEDIUM |
| OAuth2 credential patterns | Training data, core n8n feature | MEDIUM |
| Verification badge specific requirements | Training data, LOW confidence -- verify at docs.n8n.io | LOW-MEDIUM |

**Key verification needed before acting on this research:**
1. Check current n8n Creator Portal URL and submission process at docs.n8n.io
2. Verify `n8nNodesApiVersion` -- may have incremented to 2 since training data
3. Confirm declarative routing `send.paginate` syntax in current n8n version
4. Check if n8n now has built-in XML parsing helpers (may not need external dependency)
5. Verify OAuth2 credential `extends` syntax against current n8n-workflow types
