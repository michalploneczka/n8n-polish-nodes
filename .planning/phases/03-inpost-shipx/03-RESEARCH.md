# Phase 3: InPost ShipX - Research

**Researched:** 2026-03-23
**Domain:** InPost ShipX REST API v1 -- shipment management, label download, parcel locker points, tracking
**Confidence:** HIGH

## Summary

InPost ShipX API v1 is a well-documented REST API for managing parcel shipments in Poland. The API uses Bearer token authentication with organization-scoped endpoints. Two environments exist: production (`api-shipx-pl.easypack24.net`) and sandbox (`sandbox-api-shipx-pl.easypack24.net`). All responses are JSON. Pagination uses `page` + `per_page` query parameters with a standard envelope (`count`, `page`, `per_page`, `total_pages`, `items`).

The node requires programmatic style (`execute()`) because shipment creation involves complex nested objects (receiver, parcels with dimensions, custom_attributes with target_point, cod, insurance). The binary PDF label download follows the same pattern already established in Fakturownia (Phase 2). The Points endpoint is publicly accessible (no auth needed for listing/searching parcel lockers), but we route all requests through the same authenticated client for consistency.

**Primary recommendation:** Build as a programmatic node following the Fakturownia pattern exactly -- GenericFunctions with `inpostApiRequest`, resource files for field definitions, binary download for labels. Use `fixedCollection` for nested receiver data and parcels arrays.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INPOST-01 | Credentials -- Bearer Token + organization_id + environment toggle (sandbox/production) | Two base URLs confirmed: `api-shipx-pl.easypack24.net` (prod), `sandbox-api-shipx-pl.easypack24.net` (sandbox). Bearer auth confirmed. org_id in URL path. |
| INPOST-02 | Shipments Create -- nested receiver, parcels, service, target_point, cod, insurance | Full request body schema verified from PHP SDKs and official docs. Two service patterns: locker (target_point required) and courier (address required). |
| INPOST-03 | Shipments Get, List, Cancel | GET `/v1/shipments/{id}`, GET `/v1/organizations/{org}/shipments`, DELETE `/v1/organizations/{org}/shipments/{id}`. Pagination via page/per_page. |
| INPOST-04 | Shipments Get Label -- binary PDF, A4/A6 | GET `/v1/organizations/{org}/shipments/{id}/label` with `format=pdf` and `type=normal/A6`. Binary download pattern from Fakturownia reusable. |
| INPOST-05 | Points List, Get (Paczkomaty) | GET `/v1/points` (paginated, 31k+ items), GET `/v1/points/{name}`. Rich point data: coordinates, address, functions, type, status. |
| INPOST-06 | Tracking Get by tracking number | GET `/v1/tracking/{tracking_number}`. 50+ status types confirmed from live API. |
| INPOST-07 | Programmatic style (execute method) | Required -- complex nested shipment body, conditional fields (locker vs courier), binary download. |
| INPOST-08 | Rate limit awareness (100 req/min) | Document in README. No automatic retry implementation per requirements. |
| INPOST-09 | Error handling, tests, package.json, codex, icon, README | Standard pattern from Phase 2. NodeApiError wrapping, nock tests, codex categories. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Programmatic style when API requires complex logic (applies to InPost -- nested shipment data)
- Credentials separate from node code
- Tests with nock mocks -- happy path + error handling
- README per node with description, screenshot, example workflow JSON, API docs link
- SVG icon 60x60 from official InPost logo
- NodeApiError with English messages for all HTTP errors
- `n8n-community-node-package` keyword in package.json
- No SDK dependencies -- use HTTP directly
- `continueOnFail()` support in execute loop
- eslint-disable for `no-http-request-with-manual-auth` when justified (dynamic URL or custom auth)

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| n8n-workflow | * (peerDep) | Node type interfaces, NodeApiError | Required n8n runtime |
| @n8n/node-cli | * (devDep) | Build, lint, dev mode | Official n8n CLI tooling |
| typescript | 5.9.2 | TypeScript compilation | Matches project convention |
| eslint | 9.32.0 | Linting | Matches project convention |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nock | (devDep via test-utils) | HTTP mocking for tests | All API contract tests |
| jest + ts-jest | (devDep via base config) | Test runner | All tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Direct HTTP | InPost JS SDK (none exists) | No official JS SDK available -- HTTP is the only option |
| fixedCollection | JSON string field | fixedCollection gives better UX for nested objects in n8n UI |

**Installation:**
No additional npm packages needed. Standard project devDependencies only.

## Architecture Patterns

### Recommended Project Structure
```
packages/n8n-nodes-inpost/
├── credentials/
│   └── InpostApi.credentials.ts
├── nodes/
│   └── Inpost/
│       ├── Inpost.node.ts
│       ├── Inpost.node.json
│       ├── GenericFunctions.ts
│       └── resources/
│           ├── shipments.ts
│           ├── points.ts
│           └── tracking.ts
├── icons/
│   └── inpost.svg
├── __tests__/
│   └── Inpost.node.test.ts
├── package.json
├── tsconfig.json
├── jest.config.js
├── eslint.config.mjs
└── README.md
```

### Pattern 1: GenericFunctions with Environment Toggle
**What:** Single API request helper that switches base URL based on credential environment setting.
**When to use:** Always -- all API calls go through this.
**Example:**
```typescript
// Source: Fakturownia GenericFunctions pattern + InPost API docs
export async function inpostApiRequest(
  this: IExecuteFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body: IDataObject = {},
  qs: IDataObject = {},
  options: IDataObject = {},
): Promise<IDataObject | IDataObject[] | Buffer | undefined> {
  const credentials = await this.getCredentials('inpostApi');
  const environment = credentials.environment as string;
  const baseUrl = environment === 'sandbox'
    ? 'https://sandbox-api-shipx-pl.easypack24.net'
    : 'https://api-shipx-pl.easypack24.net';
  const url = `${baseUrl}${endpoint}`;

  const requestOptions: IHttpRequestOptions = {
    method,
    url,
    headers: {
      Authorization: `Bearer ${credentials.apiToken as string}`,
    },
    qs,
    json: true,
    ...options,
  };

  if (method === 'POST' || method === 'PUT') {
    requestOptions.body = body;
  }

  try {
    // eslint-disable-next-line @n8n/community-nodes/no-http-request-with-manual-auth
    return await this.helpers.httpRequest(requestOptions);
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as JsonObject, {
      message: `InPost API error: ${(error as Error).message}`,
    });
  }
}
```

### Pattern 2: Pagination Helper
**What:** Standard paginated list following InPost's envelope pattern.
**When to use:** Shipments List, Points List.
**Example:**
```typescript
export async function inpostApiRequestAllItems(
  this: IExecuteFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body: IDataObject = {},
  qs: IDataObject = {},
): Promise<IDataObject[]> {
  const returnAll = this.getNodeParameter('returnAll', 0) as boolean;
  const limit = returnAll ? 0 : (this.getNodeParameter('limit', 0) as number);
  const perPage = 25;
  let page = 1;
  const allItems: IDataObject[] = [];

  while (true) {
    const response = await inpostApiRequest.call(this, method, endpoint, body, {
      ...qs,
      page,
      per_page: perPage,
    }) as IDataObject;

    const items = (response.items || []) as IDataObject[];
    allItems.push(...items);

    if (!returnAll && allItems.length >= limit) {
      return allItems.slice(0, limit);
    }

    const totalPages = response.total_pages as number;
    if (page >= totalPages || items.length < perPage) break;
    page++;
  }
  return allItems;
}
```

### Pattern 3: fixedCollection for Nested Objects
**What:** n8n UI pattern for complex nested data (receiver, parcels).
**When to use:** Shipment Create -- receiver data, parcel dimensions.
**Example:**
```typescript
// In resources/shipments.ts
{
  displayName: 'Receiver',
  name: 'receiver',
  type: 'fixedCollection',
  typeOptions: { multipleValues: false },
  default: {},
  displayOptions: { show: { resource: ['shipment'], operation: ['create'] } },
  options: [
    {
      displayName: 'Receiver Details',
      name: 'receiverDetails',
      values: [
        { displayName: 'Name', name: 'name', type: 'string', default: '' },
        { displayName: 'Email', name: 'email', type: 'string', default: '' },
        { displayName: 'Phone', name: 'phone', type: 'string', default: '' },
        { displayName: 'First Name', name: 'first_name', type: 'string', default: '' },
        { displayName: 'Last Name', name: 'last_name', type: 'string', default: '' },
        { displayName: 'Company Name', name: 'company_name', type: 'string', default: '' },
      ],
    },
  ],
}
```

### Pattern 4: Binary PDF Download (Label)
**What:** Reuse the Fakturownia binary pattern for label download.
**When to use:** Get Label operation.
**Example:**
```typescript
const response = await inpostApiRequest.call(
  this, 'GET',
  `/v1/organizations/${orgId}/shipments/${shipmentId}/label`,
  {}, { format: 'pdf', type: labelFormat },
  { encoding: 'arraybuffer', json: false },
);
const binaryData = await this.helpers.prepareBinaryData(
  Buffer.from(response as unknown as ArrayBuffer),
  `label-${shipmentId}.pdf`,
  'application/pdf',
);
returnData.push({ json: { shipmentId }, binary: { data: binaryData } });
```

### Anti-Patterns to Avoid
- **Hardcoding organization_id in GenericFunctions:** Put it in credentials, inject into endpoint paths in execute().
- **Sending sender data for locker shipments:** Sender is optional for locker service (InPost uses organization's default sender). Only add sender fields as optional additionalFields.
- **Using template AND dimensions together:** Parcels can use either `template` (small/medium/large) OR explicit `dimensions`. Provide both as options but document they're alternatives.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP request + auth | Custom fetch wrapper | `this.helpers.httpRequest` via GenericFunctions | Standard n8n pattern, error handling built in |
| Binary PDF handling | Manual buffer management | `this.helpers.prepareBinaryData` | n8n handles MIME types, file naming |
| Pagination | Custom page tracking | `inpostApiRequestAllItems` helper | InPost uses standard page/per_page envelope |
| Error messages | Custom error parsing | `NodeApiError` wrapping | Consistent n8n error display |

## Common Pitfalls

### Pitfall 1: Organization ID in URL Path
**What goes wrong:** Forgetting to interpolate organization_id from credentials into endpoint paths.
**Why it happens:** Many endpoints require `/v1/organizations/{org_id}/shipments` not just `/v1/shipments`.
**How to avoid:** Store org_id in credentials. In execute(), build the path dynamically. Only Tracking and Points endpoints skip org_id.
**Warning signs:** 404 errors or "organization not found" responses.

### Pitfall 2: Locker vs Courier Field Requirements
**What goes wrong:** Sending target_point for courier shipments or omitting it for locker shipments.
**Why it happens:** `inpost_locker_standard` requires `custom_attributes.target_point`, while `inpost_courier_standard` requires receiver address.
**How to avoid:** Use `displayOptions` to show target_point only when service is locker type. Show address fields only when service is courier type.
**Warning signs:** API validation errors about missing target_point or missing address.

### Pitfall 3: Pagination Envelope
**What goes wrong:** Treating API response as direct array instead of extracting from `items` field.
**Why it happens:** InPost wraps paginated responses in `{ count, page, per_page, total_pages, items: [...] }`.
**How to avoid:** Always extract `.items` from paginated responses.
**Warning signs:** Single object returned instead of array; objects have `count` and `page` fields.

### Pitfall 4: Label Format Parameter
**What goes wrong:** Using wrong query parameter names for label format.
**Why it happens:** Label endpoint uses `format=pdf` (output format) and `type=normal` or `type=A6` (paper size).
**How to avoid:** Use `format` for file type and `type` for paper size. Default to `format=pdf&type=normal` (A4).
**Warning signs:** Empty or corrupt PDF response.

### Pitfall 5: Parcel Template vs Dimensions
**What goes wrong:** Sending both template and dimensions, causing API confusion.
**Why it happens:** API accepts either `template` (small/medium/large for lockers) or explicit `dimensions` object.
**How to avoid:** Let user choose: template (for locker -- simple) or custom dimensions. Do not send both.
**Warning signs:** API validation errors about conflicting parcel specifications.

### Pitfall 6: Sandbox URL Mismatch
**What goes wrong:** Using production URL in sandbox mode or vice versa.
**Why it happens:** Token from sandbox panel does not work on production and vice versa.
**How to avoid:** Environment toggle in credentials maps directly to base URL. Make this a dropdown, not freetext.
**Warning signs:** 401 Unauthorized errors.

## Code Examples

### Credential Test Request
```typescript
// InPost does not have a simple /me endpoint; use /v1/organizations to verify token
test: ICredentialTestRequest = {
  request: {
    method: 'GET',
    url: '={{$credentials.environment === "sandbox" ? "https://sandbox-api-shipx-pl.easypack24.net" : "https://api-shipx-pl.easypack24.net"}}/v1/organizations',
    headers: {
      Authorization: '={{`Bearer ${$credentials.apiToken}`}}',
    },
  },
};
```

### Service Types
```typescript
const serviceOptions = [
  { name: 'InPost Locker Standard', value: 'inpost_locker_standard' },
  { name: 'InPost Locker Express', value: 'inpost_locker_express' },
  { name: 'InPost Courier Standard', value: 'inpost_courier_standard' },
  { name: 'InPost Courier Express', value: 'inpost_courier_express' },
  { name: 'InPost Courier Palette', value: 'inpost_courier_palette' },
];
```

### Shipment Create Body Assembly
```typescript
// Build request body in execute()
const service = this.getNodeParameter('service', i) as string;
const receiverData = this.getNodeParameter('receiver', i) as IDataObject;
const receiver = (receiverData.receiverDetails || {}) as IDataObject;

const body: IDataObject = {
  service,
  receiver,
  parcels: [],
};

// Add target_point for locker services
if (service.includes('locker')) {
  const targetPoint = this.getNodeParameter('targetPoint', i) as string;
  body.custom_attributes = { target_point: targetPoint };
}

// Add parcels
const parcelsData = this.getNodeParameter('parcels', i) as IDataObject;
const parcelItems = (parcelsData.parcelValues || []) as IDataObject[];
body.parcels = parcelItems.map((p) => ({
  dimensions: {
    length: p.length,
    width: p.width,
    height: p.height,
    unit: 'mm',
  },
  weight: {
    amount: p.weight,
    unit: 'kg',
  },
  is_non_standard: p.isNonStandard || false,
}));

// Optional: COD, Insurance
const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
if (additionalFields.codAmount) {
  body.cod = { amount: additionalFields.codAmount, currency: 'PLN' };
}
if (additionalFields.insuranceAmount) {
  body.insurance = { amount: additionalFields.insuranceAmount, currency: 'PLN' };
}
```

## API Reference Summary

### Base URLs
| Environment | URL |
|-------------|-----|
| Production | `https://api-shipx-pl.easypack24.net` |
| Sandbox | `https://sandbox-api-shipx-pl.easypack24.net` |

### Endpoints
| Resource | Operation | Method | Path | Auth |
|----------|-----------|--------|------|------|
| Shipments | Create | POST | `/v1/organizations/{org_id}/shipments` | Bearer |
| Shipments | Get | GET | `/v1/shipments/{id}` | Bearer |
| Shipments | List | GET | `/v1/organizations/{org_id}/shipments` | Bearer |
| Shipments | Cancel | DELETE | `/v1/organizations/{org_id}/shipments/{id}` | Bearer |
| Shipments | Get Label | GET | `/v1/organizations/{org_id}/shipments/{id}/label` | Bearer |
| Points | List | GET | `/v1/points` | Bearer (optional) |
| Points | Get | GET | `/v1/points/{name}` | Bearer (optional) |
| Tracking | Get | GET | `/v1/tracking/{tracking_number}` | Bearer |

### Pagination
All list endpoints use: `?page=1&per_page=25`
Response envelope: `{ href, count, page, per_page, total_pages, items: [...] }`

### Shipment Create Request Body
```json
{
  "service": "inpost_locker_standard",
  "receiver": {
    "name": "Jan Kowalski",
    "company_name": "Company",
    "first_name": "Jan",
    "last_name": "Kowalski",
    "email": "jan@example.com",
    "phone": "888000000"
  },
  "parcels": [
    {
      "dimensions": { "length": "80", "width": "360", "height": "640", "unit": "mm" },
      "weight": { "amount": "5", "unit": "kg" },
      "is_non_standard": false
    }
  ],
  "custom_attributes": {
    "target_point": "KRA010",
    "sending_method": "dispatch_order"
  },
  "insurance": { "amount": 25, "currency": "PLN" },
  "cod": { "amount": 12.50, "currency": "PLN" },
  "reference": "ORDER-123",
  "additional_services": ["email", "sms"]
}
```

### Label Query Parameters
- `format`: `pdf` (default)
- `type`: `normal` (A4) or `A6`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SOAP API | REST API v1 (ShipX) | 2018+ | All new integrations use ShipX REST |
| Static parcel sizes only | Template OR custom dimensions | ShipX v1 | More flexibility for non-standard parcels |
| Manual label URLs | API-generated labels | ShipX v1 | Programmatic label retrieval |

## Open Questions

1. **Credential Test endpoint**
   - What we know: `/v1/organizations` should return org list for valid token
   - What's unclear: Whether ICredentialTestRequest supports expression-based URL switching for environment toggle
   - Recommendation: If expression-based URL in credential test fails, omit `test` property and document like GUS REGON (Phase 10 decision: disabled credential-test-required eslint rule for complex auth)

2. **Points endpoint authentication**
   - What we know: Points listing works without auth (public endpoint), but also accepts Bearer token
   - What's unclear: Whether certain point details require auth
   - Recommendation: Always send auth header for consistency. If it fails, make points requests without auth header.

3. **Sender data**
   - What we know: Sender is optional for most services (uses organization's default). Required for some courier services.
   - What's unclear: Exact rules per service type
   - Recommendation: Add sender as optional additionalFields. Do not make it required.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + ts-jest |
| Config file | `packages/n8n-nodes-inpost/jest.config.js` (Wave 0) |
| Quick run command | `cd packages/n8n-nodes-inpost && npm test` |
| Full suite command | `cd packages/n8n-nodes-inpost && npm test -- --coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INPOST-01 | Credentials have apiToken, organizationId, environment fields | unit | `npm test -- -t "Credentials"` | Wave 0 |
| INPOST-02 | Shipment create sends correct nested body | unit + nock | `npm test -- -t "create"` | Wave 0 |
| INPOST-03 | Shipments get/list/cancel call correct endpoints | unit + nock | `npm test -- -t "shipment"` | Wave 0 |
| INPOST-04 | Label download returns binary PDF | unit + nock | `npm test -- -t "label"` | Wave 0 |
| INPOST-05 | Points list/get call correct endpoints | unit + nock | `npm test -- -t "points"` | Wave 0 |
| INPOST-06 | Tracking get returns status history | unit + nock | `npm test -- -t "tracking"` | Wave 0 |
| INPOST-07 | Node uses execute() method (programmatic) | unit | `npm test -- -t "description"` | Wave 0 |
| INPOST-08 | Rate limit documented (no code test) | manual | N/A -- README review | N/A |
| INPOST-09 | Error wrapping, continueOnFail, package.json | unit + nock | `npm test -- -t "error"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd packages/n8n-nodes-inpost && npm test`
- **Per wave merge:** `cd packages/n8n-nodes-inpost && npm test -- --coverage`
- **Phase gate:** Full suite green + lint clean before verify

### Wave 0 Gaps
- [ ] `packages/n8n-nodes-inpost/jest.config.js` -- copy from Fakturownia pattern
- [ ] `packages/n8n-nodes-inpost/__tests__/Inpost.node.test.ts` -- all operation tests
- [ ] `packages/n8n-nodes-inpost/eslint.config.mjs` -- copy from Fakturownia pattern

## Sources

### Primary (HIGH confidence)
- InPost ShipX API live endpoint: `https://api-shipx-pl.easypack24.net/v1/statuses` -- confirmed JSON response with 50+ statuses
- InPost ShipX API live endpoint: `https://api-shipx-pl.easypack24.net/v1/points?per_page=1` -- confirmed pagination envelope and point schema
- [michalbiarda/shipx-php-sdk](https://github.com/michalbiarda/shipx-php-sdk) -- endpoint mapping (44/57 endpoints), base URLs, label/tracking paths
- [imper86/php-inpost-api](https://github.com/imper86/php-inpost-api/blob/master/examples/create_shipment.php) -- shipment creation request body example

### Secondary (MEDIUM confidence)
- [InPost Developer Documentation (Confluence)](https://dokumentacja-inpost.atlassian.net/wiki/spaces/PL/pages/622754/API+ShipX) -- official docs (Confluence JS-rendered, content verified via SDK cross-reference)
- [Akinon ShipX integration docs](https://docs.akinon.com/technical-guides/3rd-party-integration/shipment-integrations/shipx-inpost-shipment-extension) -- sandbox URL, credential fields

### Tertiary (LOW confidence)
- Service type full list (only 3 confirmed: locker_standard, courier_standard, courier_express). Additional types (locker_express, courier_palette) inferred from SDK enums -- need sandbox verification.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- identical to Phase 2, no new dependencies
- Architecture: HIGH -- follows established Fakturownia pattern exactly
- API endpoints: HIGH -- verified against live API and two independent PHP SDKs
- Pitfalls: MEDIUM -- based on SDK patterns and API behavior, not direct experience
- Service types: MEDIUM -- core 3 confirmed, extended list from SDK enums

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (InPost API stable, versioned at v1)
