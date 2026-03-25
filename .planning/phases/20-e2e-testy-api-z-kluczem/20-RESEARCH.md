# Phase 20: E2E testy - API z kluczem (SMSAPI, Ceneo, GUS REGON, Linkercloud) - Research

**Researched:** 2026-03-25
**Domain:** End-to-end testing of 4 API-key-authenticated n8n nodes against real/sandbox APIs
**Confidence:** HIGH

## Summary

This phase adds E2E tests for 4 nodes that require API key authentication: SMSAPI, Ceneo, GUS REGON, and Linkercloud. All tests reuse the existing E2E infrastructure from Phase 19 (jest.config.e2e.js, helpers.ts with workflow lifecycle functions, e2e-test.sh script, docker-compose.test.yml). The key difference from Phase 19 is that every test requires creating credentials via the n8n API before creating workflows -- the pattern already proven with CEIDG in Phase 19.

GUS REGON is unique because it has a free public test environment with a known test key (`abcde12345abcde12345`) and the test environment has specific test data (NIP 7171642051 returns test entity "KRAJOWA INFORMACJA SKARBOWA"). This means GUS REGON tests can run without any user-supplied API key. SMSAPI has a safe test mode (test=1 parameter) that neither sends SMS nor consumes credits. Ceneo and Linkercloud require real API keys and must skip gracefully when keys are not provided.

**Primary recommendation:** Create 4 new workflow fixtures with credential placeholders (following the CEIDG fixture pattern), add 4 new describe blocks to the existing e2e.test.ts file, and update e2e-test.sh to pass through the 5 new env vars (SMSAPI_TOKEN, CENEO_API_KEY, GUS_REGON_KEY, LINKERCLOUD_API_KEY, LINKERCLOUD_DOMAIN). GUS REGON can hardcode the test key and test environment, making it always-runnable without env vars.

## Project Constraints (from CLAUDE.md)

- TypeScript strict mode
- Monorepo with packages/ directory
- `build:all` must run before tests (dist/ required for n8n container)
- Each node is a separate npm package
- Jest as test framework
- Error handling via `NodeApiError`
- Testy mandatory for each node (E2E expands test coverage)

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| E2E-08 | SMSAPI E2E -- send SMS in test mode (test=1), list contacts, check balance via real API | SMSAPI is declarative node with smsapiApi credential (apiToken field). SMS send with test=1 in additionalFields is safe. Account balance via GET /profile. Contacts via GET /contacts. |
| E2E-09 | Ceneo E2E -- get categories and execution limits via real API | Ceneo is programmatic node with ceneoApi credential (apiKey field). GetCategories uses v3 auth (Bearer from GetToken). GetExecutionLimits uses v2 auth (apiKey as query param). |
| E2E-10 | GUS REGON E2E -- search by known NIP via SOAP session against test environment | GUS REGON has public test key abcde12345abcde12345 and test URL. Credential has apiKey + environment (test/production) fields. Search by NIP returns XML parsed to JSON. |
| E2E-11 | Linkercloud E2E -- list orders via real API | LinkerCloud credential has domain + apiKey fields. Order list uses GET /public-api/v1/orders with apikey query param. |
| E2E-12 | E2E tests skip gracefully when API keys not provided (no hard failures) | Use `describe.skip` pattern from CEIDG test. GUS REGON uses hardcoded test key so always runs. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jest | ^29.7.0 | Test runner | Already used in project, configured for E2E |
| ts-jest | ^29.2.0 | TypeScript support for Jest | Already configured |
| docker compose | v2.35+ | Container orchestration | Reused from Phase 18/19 |
| n8nio/n8n | 2.12.3 (pinned) | n8n instance for E2E testing | Same image as Phase 18/19 |

### Supporting
No new dependencies. All infrastructure from Phase 19 is reused.

**Installation:**
No new packages needed.

## Architecture Patterns

### Recommended Project Structure
```
__tests__/
  e2e/
    e2e.test.ts                    # EXISTING -- add 4 new describe blocks
    helpers.ts                     # EXISTING -- no changes needed
    fixtures/
      e2e-smsapi-send.json        # NEW -- Webhook -> SMSAPI (SMS Send test mode)
      e2e-smsapi-contacts.json    # NEW -- Webhook -> SMSAPI (Contact List)
      e2e-smsapi-balance.json     # NEW -- Webhook -> SMSAPI (Account Balance)
      e2e-ceneo-categories.json   # NEW -- Webhook -> Ceneo (Category List)
      e2e-ceneo-limits.json       # NEW -- Webhook -> Ceneo (Account GetLimits)
      e2e-gus-regon.json          # NEW -- Webhook -> GUS REGON (Search by NIP)
      e2e-linkercloud.json        # NEW -- Webhook -> LinkerCloud (Order List)
scripts/
  e2e-test.sh                     # EXISTING -- update env var passthrough
```

### Pattern 1: Credential-Based E2E Test (proven by CEIDG in Phase 19)
**What:** Create credential via n8n API, patch fixture with credential ID, create workflow, activate, call webhook.
**When to use:** For every API-key-auth node.
**Example:**
```typescript
const SMSAPI_TOKEN = process.env.SMSAPI_TOKEN;
const smsapiDescribe = SMSAPI_TOKEN ? describe : describe.skip;

smsapiDescribe('SMSAPI E2E (E2E-08)', () => {
  let workflowId: string;

  beforeAll(async () => {
    const credentialId = await createCredential('SMSAPI E2E', 'smsapiApi', {
      apiToken: SMSAPI_TOKEN!,
    });
    const fixture = loadFixture('e2e-smsapi-balance.json') as any;
    const patched = JSON.parse(JSON.stringify(fixture));
    patched.nodes[1].credentials.smsapiApi.id = credentialId;
    const { id } = await createWorkflow(patched);
    workflowId = id;
    await activateWorkflow(workflowId);
  });

  afterAll(async () => {
    if (workflowId) {
      await deactivateWorkflow(workflowId);
      await deleteWorkflow(workflowId);
    }
  });

  it('should return account balance', async () => {
    try {
      const raw = await callWebhook('e2e-smsapi-balance');
      const result = unwrapResult(raw);
      expect(result).toBeDefined();
      // Profile endpoint returns points/pro_count fields
      expect(typeof result.points).toBe('number');
    } catch (error) {
      if (isNetworkError(error)) {
        console.warn('SMSAPI unavailable, skipping');
        return;
      }
      throw error;
    }
  });
});
```

### Pattern 2: GUS REGON with Hardcoded Test Key (always-runnable)
**What:** GUS REGON has a publicly documented test key and test environment. No env var needed.
**When to use:** Only for GUS REGON.
**Example:**
```typescript
// GUS REGON always runs -- public test key, no env var required
describe('GUS REGON E2E (E2E-10)', () => {
  let workflowId: string;

  beforeAll(async () => {
    const credentialId = await createCredential('GUS REGON E2E', 'gusRegonApi', {
      apiKey: 'abcde12345abcde12345',
      environment: 'test',
    });
    const fixture = loadFixture('e2e-gus-regon.json') as any;
    const patched = JSON.parse(JSON.stringify(fixture));
    patched.nodes[1].credentials.gusRegonApi.id = credentialId;
    const { id } = await createWorkflow(patched);
    workflowId = id;
    await activateWorkflow(workflowId);
  });
  // ...
});
```

### Pattern 3: Multiple Operations per Node (SMSAPI)
**What:** SMSAPI E2E-08 requires testing 3 operations (send SMS test mode, list contacts, check balance). Use separate fixtures and separate `it()` blocks within one `describe`, each with their own workflow.
**When to use:** When a single requirement covers multiple operations.
**Approach:** Create one credential in the outer `beforeAll`, create 3 workflows (one per fixture), test each in separate `it()` blocks.

### Anti-Patterns to Avoid
- **Sharing workflows between test cases:** Each test should create and destroy its own workflow to avoid state leakage.
- **Relying on SMSAPI test mode to return SMS content:** test=1 confirms the message would be sent but does not produce the same response structure as a real send. Assert on count/list/message_id fields.
- **Using GUS REGON production endpoint for tests:** Always use the test environment to avoid consuming production API quota.
- **Hardcoding Linkercloud domain:** Domain varies per customer; must come from LINKERCLOUD_DOMAIN env var.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Workflow lifecycle | Custom Docker exec | Existing helpers.ts (createWorkflow, activateWorkflow, etc.) | Proven in Phase 19 |
| Credential creation | Manual API calls | Existing createCredential() helper | Already handles auth and returns ID |
| Test orchestration | New script | Existing e2e-test.sh (update env passthrough only) | Proven infrastructure |
| Webhook response unwrap | Custom parsing | Existing unwrapResult() function | Handles both array-of-items and direct response |

## Common Pitfalls

### Pitfall 1: SMSAPI Test Mode Response Format
**What goes wrong:** Tests expect a normal SMS response but test mode returns different fields.
**Why it happens:** SMSAPI test=1 mode validates input and returns a response with `count` and `list` fields, but the message is not actually queued.
**How to avoid:** Assert on response having `count` and `list` fields, not on delivery status. Check for absence of error field.
**Warning signs:** Missing `status` field in response.

### Pitfall 2: GUS REGON Test Environment Data
**What goes wrong:** Tests search for a known NIP but get empty results.
**Why it happens:** The GUS REGON test environment has its own dataset that does not mirror production. Not all real NIPs exist in the test database.
**How to avoid:** Use a NIP known to exist in the test environment. The commonly documented test NIP is 7171642051 (KRAJOWA INFORMACJA SKARBOWA) or 5261040828. Verify which NIPs return data in the test env.
**Warning signs:** Empty search results despite valid NIP format.

### Pitfall 3: GUS REGON SOAP Session in n8n Node
**What goes wrong:** The GUS REGON node manages SOAP sessions internally (login -> search -> logout). If the n8n container cannot reach the GUS test endpoint, the error is a SOAP parsing failure rather than a clear network error.
**Why it happens:** SOAP errors come back as XML, not HTTP status codes.
**How to avoid:** Add SOAP-specific error detection in the test catch block (check for XML-related error messages in addition to standard network errors).
**Warning signs:** Errors mentioning XML parsing, SOAP envelope, or unexpected token.

### Pitfall 4: Ceneo Dual Auth Complexity
**What goes wrong:** Ceneo v3 endpoints fail while v2 endpoints work (or vice versa).
**Why it happens:** Ceneo uses two auth mechanisms: v3 uses Bearer token from GetToken endpoint, v2 uses raw API key as query param. The token may be invalid even if the API key is correct.
**How to avoid:** Test both v3 (GetCategories) and v2 (GetExecutionLimits) operations separately to isolate which auth path fails.
**Warning signs:** 401 Unauthorized on GetCategories but success on GetExecutionLimits.

### Pitfall 5: Linkercloud Empty Response is Valid
**What goes wrong:** Test fails because order list returns empty array.
**Why it happens:** A new/test Linkercloud account may have zero orders. Empty response is valid.
**How to avoid:** Assert that the API call succeeds (no error) and returns a valid structure (array or object with items), not that it has data.
**Warning signs:** Test asserting `length > 0` fails on clean accounts.

### Pitfall 6: Credential `data` Field Must Match Property Names Exactly
**What goes wrong:** Credential creation succeeds but node execution fails with "invalid credentials".
**Why it happens:** The `data` field keys must match the credential class property `name` values exactly (e.g., `apiToken` not `api_token` for SMSAPI, `apiKey` not `api_key` for Ceneo).
**How to avoid:** Cross-reference with credential class source. SMSAPI: `{ apiToken: "..." }`. Ceneo: `{ apiKey: "..." }`. GUS REGON: `{ apiKey: "...", environment: "test" }`. LinkerCloud: `{ domain: "...", apiKey: "..." }`.
**Warning signs:** 400 on credential creation or "credentials not found" during execution.

## Credential Data Field Reference

| Node | Credential Type | Data Fields | Notes |
|------|----------------|-------------|-------|
| SMSAPI | smsapiApi | `{ apiToken: "..." }` | Bearer token auth via header |
| Ceneo | ceneoApi | `{ apiKey: "..." }` | Used for both v2 (query param) and v3 (GetToken) auth |
| GUS REGON | gusRegonApi | `{ apiKey: "...", environment: "test" }` | Test key: abcde12345abcde12345. Environment must be "test" for test env |
| LinkerCloud | linkerCloudApi | `{ domain: "...", apiKey: "..." }` | Domain without protocol (e.g., "your-company.linker.shop") |

## Node Parameter Reference for E2E Fixtures

| Node | Type Name | Resource | Operation | Required Parameters |
|------|-----------|----------|-----------|---------------------|
| SMSAPI (send) | smsapi | sms | send | to: "48000000000", message: "E2E test", additionalFields: { test: true } |
| SMSAPI (contacts) | smsapi | contact | list | (none) |
| SMSAPI (balance) | smsapi | account | getBalance | (none) |
| Ceneo (categories) | ceneo | category | list | (none) |
| Ceneo (limits) | ceneo | account | getLimits | (none) |
| GUS REGON | gusRegon | company | searchByNip | nip: "7171642051" |
| LinkerCloud | linkerCloud | order | list | returnAll: false, limit: 5 |

## Workflow Fixture Templates

### SMSAPI SMS Send (test mode)
```json
{
  "name": "E2E - SMSAPI Send SMS",
  "nodes": [
    {
      "id": "webhook-1",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "webhookId": "e2e-smsapi-send",
      "position": [250, 300],
      "parameters": {
        "path": "e2e-smsapi-send",
        "httpMethod": "GET",
        "responseMode": "lastNode",
        "options": {}
      }
    },
    {
      "id": "smsapi-1",
      "name": "SMSAPI",
      "type": "n8n-nodes-smsapi.smsapi",
      "typeVersion": 1,
      "position": [450, 300],
      "parameters": {
        "resource": "sms",
        "operation": "send",
        "to": "48000000000",
        "message": "E2E test message",
        "additionalFields": {
          "test": true
        }
      },
      "credentials": {
        "smsapiApi": {
          "id": "PLACEHOLDER",
          "name": "SMSAPI E2E"
        }
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "SMSAPI", "type": "main", "index": 0 }]]
    }
  },
  "settings": {}
}
```

### GUS REGON Search by NIP
```json
{
  "name": "E2E - GUS REGON",
  "nodes": [
    {
      "id": "webhook-1",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "webhookId": "e2e-gus-regon",
      "position": [250, 300],
      "parameters": {
        "path": "e2e-gus-regon",
        "httpMethod": "GET",
        "responseMode": "lastNode",
        "options": {}
      }
    },
    {
      "id": "gus-1",
      "name": "GUS REGON",
      "type": "n8n-nodes-gus-regon.gusRegon",
      "typeVersion": 1,
      "position": [450, 300],
      "parameters": {
        "resource": "company",
        "operation": "searchByNip",
        "nip": "7171642051"
      },
      "credentials": {
        "gusRegonApi": {
          "id": "PLACEHOLDER",
          "name": "GUS REGON E2E"
        }
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "GUS REGON", "type": "main", "index": 0 }]]
    }
  },
  "settings": {}
}
```

## Environment Variables

| Env Var | Required By | Default | Notes |
|---------|-------------|---------|-------|
| SMSAPI_TOKEN | E2E-08 | (none -- skip if absent) | Bearer token from SMSAPI panel |
| CENEO_API_KEY | E2E-09 | (none -- skip if absent) | API key from Ceneo Partner Panel |
| GUS_REGON_KEY | E2E-10 | abcde12345abcde12345 | Test key is public; env var overrides for production key |
| LINKERCLOUD_API_KEY | E2E-11 | (none -- skip if absent) | API key from Linkercloud operator |
| LINKERCLOUD_DOMAIN | E2E-11 | (none -- skip if absent) | Customer domain (e.g., api-demo.linker.shop) |

**e2e-test.sh update needed:**
```bash
SMSAPI_TOKEN="${SMSAPI_TOKEN:-}" \
CENEO_API_KEY="${CENEO_API_KEY:-}" \
GUS_REGON_KEY="${GUS_REGON_KEY:-abcde12345abcde12345}" \
LINKERCLOUD_API_KEY="${LINKERCLOUD_API_KEY:-}" \
LINKERCLOUD_DOMAIN="${LINKERCLOUD_DOMAIN:-}" \
CEIDG_API_KEY="${CEIDG_API_KEY:-}" \
npx jest --config jest.config.e2e.js "$@"
```

## Skip Logic per Node

| Node | Skip Condition | Reason |
|------|---------------|--------|
| SMSAPI | `!process.env.SMSAPI_TOKEN` | Requires real API token |
| Ceneo | `!process.env.CENEO_API_KEY` | Requires real partner API key |
| GUS REGON | Never skips | Has public test key and test environment |
| LinkerCloud | `!process.env.LINKERCLOUD_API_KEY || !process.env.LINKERCLOUD_DOMAIN` | Requires both key and domain |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single CEIDG credential test | Multiple credential-based E2E tests | Phase 20 | Proven createCredential pattern scales |
| Manual GUS REGON SOAP testing | Automated via n8n node + test env | Phase 20 | Test key + test URL make it always-runnable |

## Open Questions

1. **GUS REGON test environment NIP availability**
   - What we know: NIP 7171642051 (Krajowa Informacja Skarbowa) is commonly referenced in GUS API documentation and test examples.
   - What's unclear: Whether this specific NIP returns data in the current test environment snapshot.
   - Recommendation: Try 7171642051 first. If empty, fall back to 5261040828 or another documented test NIP. The test assertion should be flexible -- check for non-empty response rather than specific company name.

2. **SMSAPI test=1 response structure**
   - What we know: test=1 parameter validates the request without sending. The API documentation states it returns the same format as a real send.
   - What's unclear: Exact response fields when test mode is active -- whether `count` and `list` are present.
   - Recommendation: Assert on response being a valid object with no error field. If `count` exists, check it equals 1. If `list` exists, check it's an array.

3. **GUS REGON credential `environment` field type in n8n API**
   - What we know: The credential class defines `environment` as an `options` type with values `test` and `production`.
   - What's unclear: Whether n8n credential creation API accepts string values for options-type fields.
   - Recommendation: Pass `environment: "test"` as a string. This matches how n8n stores option values internally.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker | Container runtime | Yes | 28.1.1 | -- |
| Docker Compose | Container orchestration | Yes | v2.35.1 | -- |
| n8nio/n8n image | n8n test instance | Yes | 2.12.3 (pinned) | -- |
| Jest | Test runner | Yes | ^29.7.0 | -- |
| SMSAPI | E2E-08 | Requires SMSAPI_TOKEN env var | -- | Skip if absent |
| Ceneo API | E2E-09 | Requires CENEO_API_KEY env var | -- | Skip if absent |
| GUS REGON test env | E2E-10 | Yes (public test endpoint) | -- | -- |
| LinkerCloud API | E2E-11 | Requires LINKERCLOUD_API_KEY + LINKERCLOUD_DOMAIN | -- | Skip if absent |

**Missing dependencies with no fallback:** None (all nodes skip gracefully).
**Missing dependencies with fallback:** SMSAPI, Ceneo, LinkerCloud -- tests skip via describe.skip when env vars not set.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.x with ts-jest |
| Config file | `jest.config.e2e.js` (existing from Phase 19) |
| Quick run command | `npx jest --config jest.config.e2e.js -t "SMSAPI\|Ceneo\|GUS REGON\|Linkercloud"` |
| Full suite command | `bash scripts/e2e-test.sh` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| E2E-08 | SMSAPI send test mode, list contacts, check balance | e2e | `SMSAPI_TOKEN=xxx npx jest --config jest.config.e2e.js -t "SMSAPI"` | No -- Wave 0 |
| E2E-09 | Ceneo get categories + execution limits | e2e | `CENEO_API_KEY=xxx npx jest --config jest.config.e2e.js -t "Ceneo"` | No -- Wave 0 |
| E2E-10 | GUS REGON search by NIP via SOAP | e2e | `npx jest --config jest.config.e2e.js -t "GUS REGON"` | No -- Wave 0 |
| E2E-11 | Linkercloud list orders | e2e | `LINKERCLOUD_API_KEY=xxx LINKERCLOUD_DOMAIN=xxx npx jest --config jest.config.e2e.js -t "Linkercloud"` | No -- Wave 0 |
| E2E-12 | Graceful skip without API keys | e2e | `npx jest --config jest.config.e2e.js -t "SMSAPI\|Ceneo\|Linkercloud"` (without env vars) | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** N/A (E2E tests require Docker + external APIs)
- **Per wave merge:** `bash scripts/e2e-test.sh`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/e2e/fixtures/e2e-smsapi-send.json` -- SMSAPI SMS send fixture
- [ ] `__tests__/e2e/fixtures/e2e-smsapi-contacts.json` -- SMSAPI contacts list fixture
- [ ] `__tests__/e2e/fixtures/e2e-smsapi-balance.json` -- SMSAPI balance fixture
- [ ] `__tests__/e2e/fixtures/e2e-ceneo-categories.json` -- Ceneo categories fixture
- [ ] `__tests__/e2e/fixtures/e2e-ceneo-limits.json` -- Ceneo limits fixture
- [ ] `__tests__/e2e/fixtures/e2e-gus-regon.json` -- GUS REGON fixture
- [ ] `__tests__/e2e/fixtures/e2e-linkercloud.json` -- LinkerCloud fixture
- [ ] 4 new describe blocks in `__tests__/e2e/e2e.test.ts`
- [ ] Update `scripts/e2e-test.sh` env var passthrough

## Sources

### Primary (HIGH confidence)
- SMSAPI credential source: `packages/n8n-nodes-smsapi/credentials/SmsapiApi.credentials.ts` -- field name `apiToken`, Bearer auth
- SMSAPI node source: `packages/n8n-nodes-smsapi/nodes/Smsapi/` -- resources: sms, contact, group, account; declarative node
- SMSAPI SMS resource: `packages/n8n-nodes-smsapi/nodes/Smsapi/resources/sms.ts` -- test mode via `additionalFields.test: true`
- Ceneo credential source: `packages/n8n-nodes-ceneo/credentials/CeneoApi.credentials.ts` -- field name `apiKey`
- Ceneo node source: `packages/n8n-nodes-ceneo/nodes/Ceneo/Ceneo.node.ts` -- programmatic, dual auth (v2/v3)
- Ceneo GenericFunctions: `packages/n8n-nodes-ceneo/nodes/Ceneo/GenericFunctions.ts` -- token caching, v3 Bearer, v2 apiKey query
- GUS REGON credential source: `packages/n8n-nodes-gus-regon/credentials/GusRegonApi.credentials.ts` -- fields: apiKey, environment (test/production)
- GUS REGON SOAP templates: `packages/n8n-nodes-gus-regon/nodes/GusRegon/SoapTemplates.ts` -- test URL: wyszukiwarkaregontest.stat.gov.pl
- LinkerCloud credential source: `packages/n8n-nodes-linkercloud/credentials/LinkerCloudApi.credentials.ts` -- fields: domain, apiKey
- LinkerCloud GenericFunctions: `packages/n8n-nodes-linkercloud/nodes/LinkerCloud/GenericFunctions.ts` -- apikey as query param
- Existing E2E infrastructure: `__tests__/e2e/helpers.ts`, `__tests__/e2e/e2e.test.ts`, `jest.config.e2e.js`, `scripts/e2e-test.sh`
- CEIDG E2E fixture (credential pattern): `__tests__/e2e/fixtures/e2e-ceidg.json`

### Secondary (MEDIUM confidence)
- GUS REGON test key `abcde12345abcde12345` documented in credential description field and GUS API documentation

### Tertiary (LOW confidence)
- GUS REGON test NIP 7171642051 availability -- needs empirical verification against test environment

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- reuses Phase 19 infrastructure entirely, no new deps
- Architecture: HIGH -- credential creation pattern proven by CEIDG in Phase 19
- Node parameters: HIGH -- verified from source code of all 4 nodes
- Test data: MEDIUM -- GUS REGON test NIP needs empirical verification
- Pitfalls: HIGH -- based on direct source code analysis of auth patterns

**Research date:** 2026-03-25
**Valid until:** 2026-04-08 (14 days -- stable infrastructure, external API availability may vary)
