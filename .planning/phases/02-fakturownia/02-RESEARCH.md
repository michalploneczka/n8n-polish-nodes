# Phase 2: Fakturownia - Research

**Researched:** 2026-03-21
**Domain:** Fakturownia.pl REST API, n8n programmatic node with pagination and binary PDF download
**Confidence:** HIGH

## Summary

Fakturownia (InvoiceOcean) provides a straightforward REST JSON API at `https://{subdomain}.fakturownia.pl/`. Authentication supports `Authorization: Bearer API_TOKEN` header (confirmed from official docs), which maps cleanly to n8n's `IAuthenticateGeneric` pattern already used in Phase 1. The API uses page-based pagination (`page` + `per_page` params, max 100 per page) without total-page metadata in responses -- pagination end must be detected by response array length < per_page.

The node will be **hybrid style**: mostly programmatic (`execute()` method) because PDF download requires `encoding: 'arraybuffer'` + `this.helpers.prepareBinaryData()`, and pagination requires a loop. Declarative routing cannot handle either of these. The resource description files will still follow the Phase 1 split pattern (`resources/invoices.ts`, `resources/clients.ts`, `resources/products.ts`) for field definitions, but the node class will have `execute()` that dispatches based on resource/operation.

**Primary recommendation:** Build a fully programmatic node with `execute()` method, using the Wise.node.ts binary download pattern from official n8n repo, and page-based pagination with empty-response termination. Credentials use `IAuthenticateGeneric` with Bearer token + subdomain field for dynamic base URL construction.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FAKT-01 | Credentials -- apiToken + subdomain | Bearer auth in header via IAuthenticateGeneric; subdomain stored in credential, used to construct base URL dynamically |
| FAKT-02 | Invoices -- List/Get/Create/Update/Delete | Standard REST endpoints at /invoices.json; List supports page + per_page + period + status filters |
| FAKT-03 | Invoices -- Send by Email | POST /invoices/{id}/send_by_email.json with email_to, email_cc, email_pdf params |
| FAKT-04 | Invoices -- Download PDF | GET /invoices/{id}.pdf returns binary; use encoding: 'arraybuffer' + prepareBinaryData() |
| FAKT-05 | Clients -- List/Get/Create | Standard REST at /clients.json; fields: name, tax_no, email, phone, street, post_code, city |
| FAKT-06 | Products -- List/Create | Standard REST at /products.json; fields: name, code, price_net, tax |
| FAKT-07 | Pagination -- page parameter | page + per_page (default 25, max 100); detect end by response.length < per_page |
| FAKT-08 | Binary data handling -- PDF | Wise.node.ts pattern: httpRequest with arraybuffer encoding, prepareBinaryData, set filename |
| FAKT-09 | Create Invoice fields | kind, number, sell_date, issue_date, payment_to, buyer_name, buyer_tax_no, positions JSON array, payment_type |
| FAKT-10 | Error handling, tests, package | NodeApiError wrapping, nock tests for all operations, package.json with n8n config, codex, icon, README |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| n8n-workflow | * (peer) | Node type interfaces, NodeApiError | Required by all n8n community nodes |
| @n8n/node-cli | * (dev) | Build, lint, dev mode | Official n8n node tooling |
| typescript | 5.9.2 | TypeScript compilation | Matches Phase 1 |
| eslint | 9.32.0 | Linting | Matches Phase 1 |
| ts-jest | (from base) | Test runner | Matches Phase 1 |
| nock | (from base) | HTTP mocking | Matches Phase 1 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @n8n-polish-nodes/test-utils | workspace | Mock IExecuteFunctions, nock helpers | All tests |

**No new dependencies needed.** Fakturownia API is pure JSON REST, no XML or crypto required.

**Installation:**
```bash
# No additional packages -- reuse Phase 1 workspace setup
cd packages/n8n-nodes-fakturownia
# package.json will reference same devDeps as SMSAPI/CEIDG
```

## Architecture Patterns

### Recommended Project Structure
```
packages/n8n-nodes-fakturownia/
├── credentials/
│   └── FakturowniaApi.credentials.ts
├── nodes/
│   └── Fakturownia/
│       ├── Fakturownia.node.ts          # Programmatic node with execute()
│       ├── Fakturownia.node.json        # Codex file
│       ├── GenericFunctions.ts          # API helper, pagination helper
│       └── resources/
│           ├── invoices.ts              # Invoice field descriptions
│           ├── clients.ts               # Client field descriptions
│           └── products.ts              # Product field descriptions
├── icons/
│   └── fakturownia.svg
├── __tests__/
│   └── Fakturownia.node.test.ts
├── package.json
├── tsconfig.json
├── eslint.config.mjs
├── jest.config.js
└── README.md
```

### Pattern 1: Programmatic Node with Resource Dispatch
**What:** Node class has `execute()` method that reads resource + operation parameters and dispatches to the appropriate handler logic. Field definitions are still split into resource files for maintainability.
**When to use:** When ANY operation requires programmatic handling (PDF binary, pagination loop)
**Example:**
```typescript
// Source: Wise.node.ts pattern from official n8n repo
export class Fakturownia implements INodeType {
  description: INodeTypeDescription = {
    // ... properties from resource files
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const resource = this.getNodeParameter('resource', 0);
    const operation = this.getNodeParameter('operation', 0);

    for (let i = 0; i < items.length; i++) {
      if (resource === 'invoice') {
        if (operation === 'downloadPdf') {
          // Binary handling
          const invoiceId = this.getNodeParameter('invoiceId', i);
          const data = await fakturowniaApiRequest.call(
            this, 'GET', `/invoices/${invoiceId}.pdf`, {}, {},
            { encoding: 'arraybuffer' },
          );
          const binaryData = await this.helpers.prepareBinaryData(
            data as Buffer,
            `invoice-${invoiceId}.pdf`,
            'application/pdf',
          );
          returnData.push({ json: {}, binary: { data: binaryData } });
        }
      }
    }
    return [returnData];
  }
}
```

### Pattern 2: Dynamic Base URL from Credentials
**What:** Credentials contain a subdomain field; the API helper reads credentials and constructs the base URL at request time.
**When to use:** When each user has a different API endpoint based on their account.
**Example:**
```typescript
// In GenericFunctions.ts
export async function fakturowniaApiRequest(
  this: IExecuteFunctions,
  method: string,
  endpoint: string,
  body: IDataObject = {},
  qs: IDataObject = {},
  options: IDataObject = {},
): Promise<any> {
  const credentials = await this.getCredentials('fakturowniaApi');
  const subdomain = credentials.subdomain as string;
  const apiToken = credentials.apiToken as string;

  const requestOptions: IHttpRequestOptions = {
    method,
    url: `https://${subdomain}.fakturownia.pl${endpoint}`,
    qs: { ...qs, api_token: apiToken },
    body,
    json: true,
    ...options,
  };

  return this.helpers.httpRequest(requestOptions);
}
```

### Pattern 3: Page-Based Pagination with Return All
**What:** A helper function that loops through pages, collecting all results, with a returnAll toggle and limit cap.
**When to use:** All list operations (invoices, clients, products).
**Example:**
```typescript
// In GenericFunctions.ts
export async function fakturowniaApiRequestAllItems(
  this: IExecuteFunctions,
  method: string,
  endpoint: string,
  body: IDataObject = {},
  qs: IDataObject = {},
): Promise<IDataObject[]> {
  const returnAll = this.getNodeParameter('returnAll', 0) as boolean;
  const limit = returnAll ? 0 : (this.getNodeParameter('limit', 0) as number);
  const perPage = 100; // max allowed by Fakturownia API

  let page = 1;
  const allItems: IDataObject[] = [];

  do {
    const response = await fakturowniaApiRequest.call(
      this, method, endpoint, body,
      { ...qs, page, per_page: perPage },
    );

    allItems.push(...(response as IDataObject[]));

    if (!returnAll && allItems.length >= limit) {
      return allItems.slice(0, limit);
    }

    if ((response as IDataObject[]).length < perPage) {
      break; // Last page
    }

    page++;
  } while (true);

  return allItems;
}
```

### Pattern 4: Binary PDF Download
**What:** Request PDF endpoint with arraybuffer encoding, wrap result with prepareBinaryData.
**When to use:** Download PDF operation.
**Example:**
```typescript
// Source: Wise.node.ts from official n8n repo
const data = await fakturowniaApiRequest.call(
  this, 'GET', `/invoices/${invoiceId}.pdf`, {}, {},
  { encoding: 'arraybuffer', returnFullResponse: false },
);

const binaryData = await this.helpers.prepareBinaryData(
  Buffer.from(data as ArrayBuffer),
  `invoice-${invoiceId}.pdf`,
  'application/pdf',
);

returnData.push({
  json: { invoiceId },
  binary: { data: binaryData },
});
```

### Anti-Patterns to Avoid
- **Declarative routing for PDF download:** Cannot handle binary responses or arraybuffer encoding in declarative mode
- **Declarative routing for pagination loop:** n8n declarative mode has no built-in page-looping mechanism for this API style
- **Hardcoding subdomain in requestDefaults:** Each user has their own subdomain; must be dynamic from credentials
- **Using api_token in Authorization header:** While Bearer header works, Fakturownia's primary documented method is `api_token` query parameter -- use query param for maximum compatibility and simpler credential test configuration
- **Trusting response length === 0 for pagination end:** Use `response.length < per_page` instead -- handles both empty and partial pages

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Binary data preparation | Custom Buffer-to-base64 conversion | `this.helpers.prepareBinaryData()` | Handles MIME detection, n8n binary storage, streaming for large files |
| HTTP requests with auth | Raw fetch/axios calls | `this.helpers.httpRequest()` | Handles retries, proxy, SSL, timeout; integrates with n8n credential system |
| Error wrapping | Custom error classes | `NodeApiError(this.getNode(), error)` | Standardized n8n error display with httpCode, message, description fields |
| Pagination toggle UI | Custom boolean + number fields | Standard `returnAll` + `limit` pattern | Users expect this pattern; consistent across all n8n nodes |

**Key insight:** The Phase 1 test-utils mock `httpRequestWithAuthentication` but for programmatic nodes with `this.helpers.httpRequest()`, the mock must cover `httpRequest` as well. Update mock-execute-functions or mock per-test.

## Common Pitfalls

### Pitfall 1: API Token Authentication Method
**What goes wrong:** Using Authorization Bearer header when Fakturownia primarily documents api_token as query parameter
**Why it happens:** CLAUDE.md says "API Token in header Authorization: Token token=XXX" but the official GitHub docs show query param as primary method
**How to avoid:** Use `api_token` query parameter in all requests. The credential test endpoint `/account.json` works with `?api_token=TOKEN`.
**Warning signs:** 401 errors on credential test despite valid token

### Pitfall 2: Pagination End Detection Without Total Count
**What goes wrong:** Infinite loop when trying to paginate because Fakturownia API does not return total_pages or total_count metadata
**Why it happens:** Many APIs include pagination metadata; Fakturownia does not
**How to avoid:** Detect last page by checking `response.length < per_page`. If response is empty array `[]`, also break.
**Warning signs:** Node hangs on execution, excessive API calls

### Pitfall 3: Positions Array in Invoice Creation
**What goes wrong:** Sending positions as a string instead of parsed JSON array
**Why it happens:** n8n's `json` field type returns a string that needs JSON.parse()
**How to avoid:** Use `JSON.parse(this.getNodeParameter('positions', i) as string)` and wrap in try/catch with a clear "Invalid JSON in positions field" error message
**Warning signs:** 400/422 errors from Fakturownia with "positions" validation error

### Pitfall 4: PDF Response Not Treated as Binary
**What goes wrong:** PDF content is corrupted because the response is treated as text/JSON instead of binary
**Why it happens:** Default httpRequest encoding is 'utf8' which corrupts binary data
**How to avoid:** Always pass `encoding: 'arraybuffer'` for the PDF endpoint. The endpoint is `/invoices/{id}.pdf` (not `.json`).
**Warning signs:** PDF file is larger/smaller than expected, cannot be opened

### Pitfall 5: Subdomain Validation
**What goes wrong:** User enters full URL (e.g., "mycompany.fakturownia.pl") instead of just subdomain ("mycompany")
**Why it happens:** The credential field label might be unclear
**How to avoid:** Add description "Enter only your subdomain (e.g., 'mycompany', not 'mycompany.fakturownia.pl')" and strip any ".fakturownia.pl" suffix in the API helper
**Warning signs:** Double domain in URL: `mycompany.fakturownia.pl.fakturownia.pl`

### Pitfall 6: Send by Email -- Missing email_to
**What goes wrong:** Email send endpoint returns success but no email is sent
**Why it happens:** The `email_to` parameter is required but the API might not validate it strictly
**How to avoid:** Make `email_to` a required field in the node UI for the Send by Email operation
**Warning signs:** No email received despite 200 response

## Code Examples

### Credential Type with Subdomain
```typescript
// Source: Phase 1 pattern (CeidgApi.credentials.ts) + Fakturownia subdomain requirement
import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class FakturowniaApi implements ICredentialType {
  name = 'fakturowniaApi';
  displayName = 'Fakturownia API';
  icon = 'file:../icons/fakturownia.svg' as const;
  documentationUrl = 'https://app.fakturownia.pl/api';
  properties: INodeProperties[] = [
    {
      displayName: 'API Token',
      name: 'apiToken',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'API token from Settings > Account Settings > Integration > API Authorization Code',
    },
    {
      displayName: 'Subdomain',
      name: 'subdomain',
      type: 'string',
      default: '',
      required: true,
      placeholder: 'mycompany',
      description: 'Your Fakturownia subdomain (e.g., "mycompany" from mycompany.fakturownia.pl)',
    },
  ];

  // NOTE: Cannot use IAuthenticateGeneric for this API because
  // the api_token goes as query parameter and the base URL is dynamic.
  // Authentication is handled manually in GenericFunctions.ts.
  // The credential test below demonstrates the pattern.

  test: ICredentialTestRequest = {
    request: {
      method: 'GET',
      url: '=https://{{$credentials.subdomain}}.fakturownia.pl/account.json',
      qs: {
        api_token: '={{$credentials.apiToken}}',
      },
    },
  };
}
```

### Invoice Create Body Structure
```typescript
// Source: https://github.com/fakturownia/API
// Full invoice creation request body
const body = {
  api_token: apiToken,
  invoice: {
    kind: 'vat', // vat|proforma|bill|receipt|advance|final|correction|estimate
    number: null, // auto-generated if null
    sell_date: '2026-03-21',
    issue_date: '2026-03-21',
    payment_to: '2026-04-04',
    buyer_name: 'Acme Corp Sp. z o.o.',
    buyer_tax_no: '1234567890',
    payment_type: 'transfer', // transfer|card|cash|barter|cheque|payu|paypal
    positions: [
      {
        name: 'Web Development',
        quantity: 10,
        unit_price_net: 150.00, // or use total_price_gross
        tax: 23,
        quantity_unit: 'hours',
      },
    ],
  },
};
```

### Return All / Limit UI Description Pattern
```typescript
// Source: official n8n nodes-base/utils/descriptions.ts
const returnAllOrLimit: INodeProperties[] = [
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    description: 'Whether to return all results or only up to a given limit',
    displayOptions: {
      show: {
        resource: ['invoice', 'client', 'product'],
        operation: ['list'],
      },
    },
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['invoice', 'client', 'product'],
        operation: ['list'],
        returnAll: [false],
      },
    },
    typeOptions: { minValue: 1 },
    default: 50,
    description: 'Max number of results to return',
  },
];
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| api_token in query param only | Bearer header also supported | Unknown | Can use either; query param is more documented |
| Declarative-only n8n nodes | Hybrid: descriptions for UI, execute() for logic | n8n 1.0+ | Enables binary + pagination in same node |
| Custom error handling | NodeApiError with httpCode parsing | n8n-workflow 1.x | Standardized error display in UI |

**Deprecated/outdated:**
- None relevant -- Fakturownia API has been stable for years with no breaking changes

## Open Questions

1. **Error response format**
   - What we know: Fakturownia docs do not document error response structure explicitly
   - What's unclear: Exact JSON structure of error responses (field names, error codes)
   - Recommendation: Make first API call during implementation, capture 400/401/404 responses, adapt NodeApiError wrapping. Likely `{"code": "error_code", "message": "description"}` or raw HTTP status.

2. **Pagination: per_page default behavior**
   - What we know: Default is 25 per page, max 100
   - What's unclear: Whether response includes any metadata (total count in headers, etc.)
   - Recommendation: Use `per_page=100` for efficiency when returnAll=true; detect end by `response.length < per_page`

3. **Invoice positions field format**
   - What we know: Positions is a JSON array with name, quantity, unit_price_net/total_price_gross, tax
   - What's unclear: Whether `unit_price_net` or `total_price_gross` is preferred/required
   - Recommendation: Use `total_price_gross` as default pricing field (simpler for users), allow override via Additional Fields

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + ts-jest (from Phase 1) |
| Config file | `packages/n8n-nodes-fakturownia/jest.config.js` (Wave 0) |
| Quick run command | `cd packages/n8n-nodes-fakturownia && npx jest --config jest.config.js` |
| Full suite command | `npm run test --workspace=packages/n8n-nodes-fakturownia` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FAKT-01 | Credential fields + test endpoint | unit | `npx jest Fakturownia.node.test.ts -t "Credentials"` | Wave 0 |
| FAKT-02 | Invoice CRUD routing + fields | unit | `npx jest Fakturownia.node.test.ts -t "Invoice"` | Wave 0 |
| FAKT-03 | Send by Email operation | unit + nock | `npx jest Fakturownia.node.test.ts -t "Send by Email"` | Wave 0 |
| FAKT-04 | PDF download binary output | unit + nock | `npx jest Fakturownia.node.test.ts -t "Download PDF"` | Wave 0 |
| FAKT-05 | Client CRUD | unit | `npx jest Fakturownia.node.test.ts -t "Client"` | Wave 0 |
| FAKT-06 | Product CRUD | unit | `npx jest Fakturownia.node.test.ts -t "Product"` | Wave 0 |
| FAKT-07 | Pagination loop | unit + nock | `npx jest Fakturownia.node.test.ts -t "pagination"` | Wave 0 |
| FAKT-08 | Binary data handling | unit + nock | `npx jest Fakturownia.node.test.ts -t "binary"` | Wave 0 |
| FAKT-09 | Invoice create fields | unit | `npx jest Fakturownia.node.test.ts -t "Create"` | Wave 0 |
| FAKT-10 | Error handling | unit + nock | `npx jest Fakturownia.node.test.ts -t "error"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --config jest.config.js`
- **Per wave merge:** `npm run test --workspace=packages/n8n-nodes-fakturownia`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `packages/n8n-nodes-fakturownia/jest.config.js` -- copy from SMSAPI pattern
- [ ] `packages/n8n-nodes-fakturownia/__tests__/Fakturownia.node.test.ts` -- covers all FAKT-* requirements
- [ ] Mock setup: extend `createMockExecuteFunctions` to mock `this.helpers.httpRequest` and `this.helpers.prepareBinaryData` for programmatic node testing
- [ ] `packages/n8n-nodes-fakturownia/eslint.config.mjs` -- copy from SMSAPI
- [ ] `packages/n8n-nodes-fakturownia/tsconfig.json` -- copy from SMSAPI

## Sources

### Primary (HIGH confidence)
- [Fakturownia API docs](https://app.fakturownia.pl/api) - Authentication, endpoints, pagination
- [Fakturownia GitHub API](https://github.com/fakturownia/API) - Invoice fields, positions structure, kind values, payment types
- Phase 1 codebase (SMSAPI, CEIDG nodes) - Established patterns for credentials, tests, package structure
- Official n8n repo (Wise.node.ts) - Binary download pattern with arraybuffer encoding

### Secondary (MEDIUM confidence)
- [n8n nodes-base/utils/descriptions.ts](returnAllOrLimit pattern) - Standard pagination UI pattern

### Tertiary (LOW confidence)
- Error response format - Not documented by Fakturownia; must be discovered during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Reuses Phase 1 stack exactly, no new dependencies
- Architecture: HIGH - Programmatic node pattern well-established in official n8n nodes (Wise, Zendesk)
- API endpoints: HIGH - Verified against official Fakturownia docs and GitHub
- Error handling: LOW - Error response format not documented; needs runtime verification
- Pagination: MEDIUM - Page-based confirmed; end detection by response length is inferred (standard pattern, not explicitly documented)

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (Fakturownia API is stable, no breaking changes expected)
