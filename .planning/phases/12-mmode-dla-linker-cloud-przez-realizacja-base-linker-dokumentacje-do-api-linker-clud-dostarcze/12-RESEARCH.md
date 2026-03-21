# Phase 12: Linker Cloud - Research

**Researched:** 2026-03-21
**Domain:** Linker Cloud WMS/OMS/Fulfillment REST API - n8n community node
**Confidence:** HIGH

## Summary

Linker Cloud is a Polish eCommerce fulfillment platform (linkercloud.com / linker.shop) providing WMS (Warehouse Management System), OMS (Order Management System), and courier integration as a SaaS solution. The public API (Swagger 2.0) exposes 40+ endpoints across Orders, Products, Stock, Shipments, Inbound Orders (Supplier Orders), Order Returns, Pickups, Workflows, and Attachments. The API host is `api-demo.linker.shop` (demo) with production being a customer-specific domain.

Auth is via API key passed as a query parameter named `apikey`. The API uses standard REST patterns with JSON request/response bodies, offset+limit pagination (default 100 items), and date format `Y-m-d H:i:s` (PHP-style). The Order model is extremely large (180+ fields on Order2) reflecting the complexity of fulfillment operations.

This node requires **programmatic style** (`execute()` method) because: (1) the API key is a query param requiring dynamic URL construction, (2) Order creation has deeply nested items with complex required fields, (3) shipment label download returns base64-encoded binary, (4) pagination uses offset+limit pattern needing helper functions, and (5) the domain is user-configurable.

**Primary recommendation:** Build a programmatic n8n node following the Fakturownia pattern (GenericFunctions.ts with API helper + pagination helper, resource files split per domain). Focus V1 on the 5 core resources: Order, Product, Stock, Shipment, Inbound Order. Exclude low-value endpoints (webhooks, workflows, sequences, WMS reports) from V1.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LC-01 | Package scaffold with credentials (API key + domain) | Auth: apiKey query param, host configurable per customer |
| LC-02 | GenericFunctions with API request helper + pagination | offset+limit pagination (default 100), filters as query string |
| LC-03 | Order resource (List, Get, Create, Update, Cancel) | 5 endpoints, OrderType has 58 properties, 13 required |
| LC-04 | Product resource (List, Create, Update) | 3 endpoints, ProductType has 45 properties, 13 required booleans |
| LC-05 | Stock resource (List, Update) | GET /stocks with filters, PUT /products-stocks for batch update |
| LC-06 | Shipment resource (Create, Create by Order Number, Get Label) | POST /deliveries, POST /deliveries/packages, GET label (base64) |
| LC-07 | Inbound Order / Supplier Order resource (List, Get, Create, Update, Confirm) | 5 endpoints, nested supplier object, items array |
| LC-08 | Order Returns resource (List, Get, Create, Accept) | 4 endpoints for return management |
| LC-09 | Additional order operations (Tracking Number, Payment Status, Transitions, Attachments) | Specialized PUT/POST endpoints |
| LC-10 | Tests, codex, SVG icon, README, build verification | Standard package finalization per project conventions |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| n8n-workflow | * (peerDep) | n8n type definitions and NodeApiError | Required for all n8n community nodes |
| typescript | 5.9.x | Type-safe node implementation | Matches monorepo devDep |
| @n8n/node-cli | * | Build, lint, dev mode | Official n8n tooling |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nock | latest | HTTP mocking for tests | All API contract tests |
| jest | latest | Test runner | Standard test framework in monorepo |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Programmatic style | Declarative routing | Declarative cannot handle dynamic domain URL + apikey query param auth; programmatic required |

**Installation:** No additional dependencies beyond monorepo devDeps. The node uses `this.helpers.httpRequest()` from n8n-workflow.

## Architecture Patterns

### Recommended Project Structure
```
packages/n8n-nodes-linkercloud/
├── nodes/
│   └── LinkerCloud/
│       ├── LinkerCloud.node.ts          # Main node class with execute()
│       ├── LinkerCloud.node.json        # Codex metadata
│       ├── GenericFunctions.ts          # API helper + pagination
│       └── resources/
│           ├── order.ts                 # Order operations + fields
│           ├── product.ts               # Product operations + fields
│           ├── stock.ts                 # Stock operations + fields
│           ├── shipment.ts              # Shipment operations + fields
│           ├── inboundOrder.ts          # Supplier/Inbound Order ops + fields
│           └── orderReturn.ts           # Order Return operations + fields
├── credentials/
│   └── LinkerCloudApi.credentials.ts
├── icons/
│   └── linkercloud.svg
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

### Pattern 1: GenericFunctions with Dynamic Domain
**What:** API request helper that constructs base URL from credential domain + adds apikey query param
**When to use:** Every API call
**Example:**
```typescript
// Based on Fakturownia GenericFunctions pattern
export async function linkerCloudApiRequest(
  this: IExecuteFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body: IDataObject = {},
  qs: IDataObject = {},
): Promise<IDataObject | IDataObject[]> {
  const credentials = await this.getCredentials('linkerCloudApi');
  const domain = (credentials.domain as string).replace(/^https?:\/\//, '').replace(/\/$/, '');
  const url = `https://${domain}${endpoint}`;

  const requestOptions: IHttpRequestOptions = {
    method,
    url,
    qs: {
      ...qs,
      apikey: credentials.apiKey as string,
    },
    json: true,
  };

  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    requestOptions.body = body;
  }

  try {
    return await this.helpers.httpRequest(requestOptions);
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as JsonObject, {
      message: `Linker Cloud API error: ${(error as Error).message}`,
    });
  }
}
```

### Pattern 2: Offset+Limit Pagination Helper
**What:** Automatic pagination using offset and limit query parameters
**When to use:** All List operations (orders, products, stocks, supplier orders, order returns)
**Example:**
```typescript
export async function linkerCloudApiRequestAllItems(
  this: IExecuteFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body: IDataObject = {},
  qs: IDataObject = {},
  dataKey?: string, // API may wrap results in a key
): Promise<IDataObject[]> {
  const returnAll = this.getNodeParameter('returnAll', 0) as boolean;
  const limit = returnAll ? 0 : (this.getNodeParameter('limit', 0) as number);
  const pageSize = 100;
  let offset = 0;
  const allItems: IDataObject[] = [];

  while (true) {
    const response = await linkerCloudApiRequest.call(this, method, endpoint, body, {
      ...qs,
      offset: offset.toString(),
      limit: pageSize.toString(),
    });

    const items = dataKey ? (response as IDataObject)[dataKey] as IDataObject[] : response as IDataObject[];
    allItems.push(...items);

    if (!returnAll && allItems.length >= limit) {
      return allItems.slice(0, limit);
    }

    if (items.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return allItems;
}
```

### Pattern 3: Nested Order Items via fixedCollection
**What:** Order creation requires an `items` array with nested product data
**When to use:** Order Create and Update operations
**Example approach:** Use `fixedCollection` for items array where each item has sku, quantity, description, price fields. The required fields per OrderItemType are: `serial_numbers`, `custom_properties`, `source_data`, `batch_numbers` (all arrays, can default to empty).

### Anti-Patterns to Avoid
- **Exposing all 180+ Order fields in the UI:** Only expose the most commonly used fields. Use Additional Fields for optional ones.
- **Hardcoding the demo domain:** The API domain MUST be configurable in credentials (customers have their own domains).
- **Sending empty required arrays as undefined:** OrderItemType requires `serial_numbers`, `custom_properties`, `source_data`, `batch_numbers` - always send empty arrays `[]` when user doesn't provide them.
- **Using `filters` query param as a single string:** The API uses bracket notation `filters['updatedAt']` for date filters - these need to be constructed properly as separate query params.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP requests | Custom fetch/axios | `this.helpers.httpRequest()` | n8n handles retries, proxy, SSL |
| Error wrapping | Custom error classes | `NodeApiError` from n8n-workflow | Consistent error display in n8n UI |
| Binary handling | Manual buffer management | `this.helpers.prepareBinaryData()` | Standard n8n binary data flow |
| Pagination | Manual offset tracking per operation | Shared `linkerCloudApiRequestAllItems` | DRY, consistent across all List ops |

**Key insight:** The Fakturownia node is the perfect template. Same patterns apply: dynamic domain from credentials, query param auth, programmatic style with GenericFunctions, resource file splits.

## Common Pitfalls

### Pitfall 1: API Key Authentication Format
**What goes wrong:** The Swagger spec says `apikey` in query params with description "Value: apikey {key}" which is ambiguous - it might mean the value should be prefixed with "apikey " or just the raw key.
**Why it happens:** Swagger description is unclear on exact format.
**How to avoid:** Test with the sample key `b5b329e94eec6514f04d4a9f0bd63cae` against `api-demo.linker.shop`. Try both `?apikey=b5b329e94eec6514f04d4a9f0bd63cae` and `?apikey=apikey b5b329e94eec6514f04d4a9f0bd63cae`.
**Warning signs:** 401/403 responses on first API call.

### Pitfall 2: Date Format Mismatch
**What goes wrong:** Linker Cloud uses PHP date format `Y-m-d H:i:s` (e.g., `2024-01-15 14:30:00`) not ISO 8601.
**Why it happens:** Polish/PHP backend convention differs from JavaScript defaults.
**How to avoid:** Always format dates as `YYYY-MM-DD HH:mm:ss` when sending to API. Document this format in field descriptions.
**Warning signs:** 400 validation errors on date fields.

### Pitfall 3: Huge Order Model Overwhelming UI
**What goes wrong:** Order has 180+ fields - exposing all in n8n UI makes the node unusable.
**Why it happens:** WMS/fulfillment systems have many data points per order.
**How to avoid:** Split into Required Fields (shown by default) and Additional Fields (collapsed). For Order Create: show ~15 core fields (dates, delivery address, items, carrier, payment) and put the rest in Additional Fields.
**Warning signs:** User complaints about too many fields, scrolling forever.

### Pitfall 4: Nested Items Array Structure
**What goes wrong:** Order items require arrays for `serial_numbers`, `batch_numbers`, `custom_properties`, `source_data` even when empty.
**Why it happens:** The API requires these fields but most e-commerce orders don't use serial/batch numbers.
**How to avoid:** Always default these to empty arrays `[]` in the request builder. Only expose serial_numbers/batch_numbers as Advanced Fields.
**Warning signs:** 400 validation errors on order creation with seemingly correct data.

### Pitfall 5: Filter Query Parameter Format
**What goes wrong:** List endpoints use bracket notation for filters: `filters['updatedAt']`, `filters['created_at_with_time']`.
**Why it happens:** PHP-style array query params need special encoding.
**How to avoid:** Build filter params as separate query params with bracket notation: `qs['filters[updatedAt]'] = dateValue`.
**Warning signs:** Filters being silently ignored, returning all records.

### Pitfall 6: Label Download Returns Base64 in JSON
**What goes wrong:** Shipment labels are returned as base64-encoded strings in JSON (ParcelType.label field), NOT as binary response.
**Why it happens:** The API wraps label data in the parcel response object.
**How to avoid:** Decode base64 from the `label` field and use `prepareBinaryData()` to create binary output. Different from Fakturownia where PDF is a direct binary response.
**Warning signs:** Binary data being empty or corrupted.

### Pitfall 7: Swagger Spec Has Typo in Attachment Path
**What goes wrong:** The path `/public-api/v.1/rest/orders/attachment/{attachmentId}` has a typo (`v.1` instead of `v1` and extra `/rest/`).
**Why it happens:** Swagger spec inconsistency.
**How to avoid:** Verify the correct path against the live API. Likely should be `/public-api/v1/orders/attachment/{attachmentId}`.
**Warning signs:** 404 on attachment download.

## Code Examples

### Credentials Definition
```typescript
import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class LinkerCloudApi implements ICredentialType {
  name = 'linkerCloudApi';
  displayName = 'Linker Cloud API';
  documentationUrl = 'https://linkercloud.com';
  properties: INodeProperties[] = [
    {
      displayName: 'Domain',
      name: 'domain',
      type: 'string',
      default: '',
      required: true,
      placeholder: 'your-company.linker.shop',
      description: 'Your Linker Cloud domain (e.g., your-company.linker.shop or api-demo.linker.shop for testing)',
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'API key received from your Linker Cloud operator or customer service',
    },
  ];
}
```

### Order Resource - Operations Definition
```typescript
import type { INodeProperties } from 'n8n-workflow';

export const orderOperations: INodeProperties = {
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: { show: { resource: ['order'] } },
  options: [
    { name: 'Cancel', value: 'cancel', action: 'Cancel an order' },
    { name: 'Create', value: 'create', action: 'Create an order' },
    { name: 'Get', value: 'get', action: 'Get an order' },
    { name: 'List', value: 'list', action: 'List orders' },
    { name: 'Update', value: 'update', action: 'Update an order' },
  ],
  default: 'list',
};
```

### Building Filter Query Params
```typescript
// Linker Cloud uses bracket notation for filters
const qs: IDataObject = {};
const filters = this.getNodeParameter('filters', i, {}) as IDataObject;

if (filters.updatedAt) {
  qs["filters['updatedAt']"] = filters.updatedAt;
}
if (filters.updatedAtTo) {
  qs["filters['updatedAtTo']"] = filters.updatedAtTo;
}
if (filters.created_at_with_time) {
  qs["filters['created_at_with_time']"] = filters.created_at_with_time;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| n/a | Swagger 2.0 spec (current API version) | Current | All endpoints documented in provided spec |
| Manual API token passing | apiKey query parameter | Current | Standard auth pattern for this API |

**Note:** Linker Cloud is an active Polish SaaS platform. The Swagger spec provided is the definitive API reference. No version history or deprecation notices were found.

## API Resource Map (V1 Scope)

### Tier 1 - Core (Must Have)
| Resource | Operations | Endpoints | Priority |
|----------|-----------|-----------|----------|
| Order | List, Get, Create, Update, Patch, Cancel | 6 endpoints | HIGHEST |
| Product | List, Create, Update | 3 endpoints | HIGH |
| Stock | List, Update | 2 endpoints | HIGH |
| Shipment | Create, Create by Order#, Get Label, Cancel | 4 endpoints | HIGH |

### Tier 2 - Important (Should Have)
| Resource | Operations | Endpoints | Priority |
|----------|-----------|-----------|----------|
| Inbound Order | List, Get, Create, Update, Confirm | 5 endpoints | MEDIUM |
| Order Return | List, Get, Create, Accept | 4 endpoints | MEDIUM |

### Tier 3 - Nice to Have (Defer to V2)
| Resource | Operations | Endpoints | Priority |
|----------|-----------|-----------|----------|
| Order Attachment | Create, List, Get, Print | 4 endpoints | LOW |
| Order Tracking | Update Tracking Number(s) | 2 endpoints | LOW |
| Payment Status | Update | 1 endpoint | LOW |
| Order Transition | Get Allowed, Apply | 2 endpoints | LOW |
| Picking | Confirm, Mark Picked | 2 endpoints | LOW |
| Pickup | Create | 1 endpoint | LOW |
| WMS Stock Report | Generate, Get | 2 endpoints | LOW |
| Workflow | Get | 1 endpoint | LOW |
| Sequence | Get | 1 endpoint | LOW |
| Webhook | Integration webhook | 1 endpoint | LOW |

### Key Schema Summary

**OrderType (Create Order)** - 58 properties, 13 required:
- Required: `orderDate`, `executionDate`, `deliveryEmail`, `codAmount`, `shipmentPrice`, `shipmentPriceNet`, `discount`, `items`, `paymentTransactionId`, `customProperties`, `executionDueDate`, `tags`, `validationErrors`
- Key optional: `clientOrderNumber`, `carrier`, delivery address fields, billing fields, `comments`, `priceGross`, `priceNet`, `currencySymbol`
- Items: array of OrderItemType (required fields: `serial_numbers`, `custom_properties`, `source_data`, `batch_numbers` - all arrays)

**ProductType (Create Product)** - 45 properties, 13 required (all booleans):
- Required booleans: `ignore_in_wms`, `ignore_when_packing`, `always_ask_for_serial_number`, `has_batch_number`, `is_expirable`, `is_bio`, `is_food`, `is_insert`, `is_fragile`
- Required arrays: `storageUnits`, `nameAliases`, `images`, `additionalCodes`
- Key optional: `name`, `sku`, `barcode`, `depotId`, dimensions, weights

**ShipmentType** - 7 properties, 5 required:
- Required: `orderNumber`, `packages` (array of ShipmentPackageType), `batchNumbers`, `markAsPacked`, `createAdditional`
- ShipmentPackageType required: `weight`, `items` (array)

**StockUpdateRequest** - 3 properties, `items` required:
- Each item: `sku` (required), `totalQuantity` (required), optional `ean`, `name`

## Pagination Pattern

All list endpoints use the same pattern:
- `offset` (string, default "0") - starting position
- `limit` (string, default "100") - page size
- `sortDir` (string, default "DESC") - ASC or DESC
- `sortCol` (string) - column to sort by (varies per resource)
- `filters` - bracket notation for specific filter criteria

**Important:** offset and limit are passed as strings, not integers.

## Open Questions

1. **API Key Format Ambiguity**
   - What we know: Swagger says parameter name is `apikey`, description says "Value: apikey {key}"
   - What's unclear: Does the value need "apikey " prefix or is it just the raw key?
   - Recommendation: Test both formats against demo API first. Most likely just the raw key as query param `?apikey=xxx`.

2. **Response Envelope Structure**
   - What we know: Swagger responses say "200: Returned when successful" but don't specify envelope structure
   - What's unclear: Whether list responses wrap items in a key (e.g., `{items: [...], total: N}`) or return bare arrays
   - Recommendation: Make first API call to `/public-api/v1/orders?limit=1` and inspect response structure. Pagination helper may need a `dataKey` parameter.

3. **Patch vs Put for Order Update**
   - What we know: Both PUT and PATCH exist for `/orders/{id}`
   - What's unclear: Whether PATCH does partial update (standard REST) or has different behavior
   - Recommendation: Expose both as "Update" (PUT, full) and "Patch" (PATCH, partial) operations, or just use PATCH for updates.

4. **Demo vs Production Domain Pattern**
   - What we know: Demo host is `api-demo.linker.shop`
   - What's unclear: Production domain format - could be `api.linker.shop`, `{customer}.linker.shop`, or custom domain
   - Recommendation: Make domain fully configurable in credentials with placeholder showing format.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (monorepo standard) |
| Config file | `packages/n8n-nodes-linkercloud/jest.config.js` (Wave 0) |
| Quick run command | `cd packages/n8n-nodes-linkercloud && npm test` |
| Full suite command | `npm run test --workspace=packages/n8n-nodes-linkercloud` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LC-01 | Credentials structure has domain + apiKey fields | unit | `jest --testPathPattern=credentials` | No - Wave 0 |
| LC-02 | GenericFunctions builds correct URL with domain and apikey param | unit | `jest --testPathPattern=GenericFunctions` | No - Wave 0 |
| LC-02 | Pagination iterates with offset+limit until less than pageSize items | unit | `jest --testPathPattern=GenericFunctions` | No - Wave 0 |
| LC-03 | Order CRUD operations call correct endpoints with correct methods | unit+nock | `jest --testPathPattern=order` | No - Wave 0 |
| LC-04 | Product List/Create/Update call correct endpoints | unit+nock | `jest --testPathPattern=product` | No - Wave 0 |
| LC-05 | Stock List uses correct query params, Update sends StockUpdateRequest body | unit+nock | `jest --testPathPattern=stock` | No - Wave 0 |
| LC-06 | Shipment Create sends ShipmentType body, Label returns binary | unit+nock | `jest --testPathPattern=shipment` | No - Wave 0 |
| LC-07 | Inbound Order CRUD + Confirm call correct endpoints | unit+nock | `jest --testPathPattern=inboundOrder` | No - Wave 0 |
| LC-08 | Order Return List/Get/Create/Accept work correctly | unit+nock | `jest --testPathPattern=orderReturn` | No - Wave 0 |
| LC-10 | Build compiles without errors, lint passes | integration | `npm run build && npm run lint` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `cd packages/n8n-nodes-linkercloud && npm test`
- **Per wave merge:** `npm run test --workspace=packages/n8n-nodes-linkercloud && npm run lint --workspace=packages/n8n-nodes-linkercloud`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `packages/n8n-nodes-linkercloud/jest.config.js` -- test configuration
- [ ] `packages/n8n-nodes-linkercloud/tsconfig.json` -- TypeScript config
- [ ] `packages/n8n-nodes-linkercloud/__tests__/` -- test directory structure
- [ ] Framework install: already available via monorepo devDeps

## Sources

### Primary (HIGH confidence)
- `resources/linker_cloud_api.json` - Full Swagger 2.0 specification, definitive source for all endpoints, schemas, and auth
- Fakturownia node (`packages/n8n-nodes-fakturownia/`) - Reference implementation for programmatic node pattern

### Secondary (MEDIUM confidence)
- [Linker Cloud Platform](https://linkercloud.com/platform) - Product overview, confirms WMS/OMS/fulfillment scope
- [Linker Cloud Integrations](https://linkercloud.com/oms/integrations) - Confirms 100+ integrations, API-first approach
- [Linker Shop](https://www.linker.shop/) - Platform URL, confirms active service

### Tertiary (LOW confidence)
- API key format ("Value: apikey {key}" in Swagger description) - ambiguous, needs live testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Follows established monorepo patterns from Phase 1-2
- Architecture: HIGH - Swagger spec provides complete endpoint and schema documentation
- Pitfalls: MEDIUM - Auth format ambiguity and response envelope structure need live API verification
- API coverage: HIGH - Full Swagger 2.0 spec analyzed, all 40+ endpoints catalogued

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (API is stable, Swagger spec is static reference)
