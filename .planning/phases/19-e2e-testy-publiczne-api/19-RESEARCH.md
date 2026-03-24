# Phase 19: E2E testy - publiczne API (NBP, NFZ, KRS, Biala Lista VAT, VIES, CEIDG) - Research

**Researched:** 2026-03-24
**Domain:** End-to-end testing with real public APIs via n8n Docker container, webhook-based workflow execution
**Confidence:** HIGH

## Summary

This phase creates E2E tests that exercise 6 custom n8n nodes against their real live APIs: 5 public no-auth APIs (NBP, NFZ, KRS, Biala Lista VAT, VIES) and 1 API-key-auth API (CEIDG). Tests run inside the existing n8n Docker test infrastructure from Phase 18, using webhook-triggered workflows to execute nodes against real endpoints and validate response schemas.

The critical architectural discovery is that n8n has NO public REST API endpoint to execute a workflow by ID. The standard approach for programmatic workflow execution is the Webhook trigger pattern: create a workflow with a Webhook node as trigger, activate it, then POST to the webhook URL to trigger execution synchronously. When the Webhook node's "Respond With" is set to "Last Node" (responseMode: lastNode), the HTTP response contains the output of the last node in the workflow -- exactly what E2E tests need to validate.

All 6 target APIs have been verified live (2026-03-24): NBP returns EUR/PLN rate with `mid` field, KRS returns company data for KRS 0000019193, VIES confirms PL/5213017228 as valid, Biala Lista VAT returns subject data for NIP 5213017228, NFZ returns queue results for "ortop" benefit search, and CEIDG requires API key. Test data uses well-known stable entities (ZUS - NIP 5213017228, PKN Orlen - KRS 0000019193) that are unlikely to change.

**Primary recommendation:** Use the Webhook trigger + "Respond With Last Node" pattern for all E2E tests. Create workflow fixtures with Webhook -> Custom Node -> (implicit respond with last node). Activate via `POST /api/v1/workflows/{id}/activate`. Call the production webhook URL. Assert on the JSON response. For CEIDG, create credentials via `POST /api/v1/credentials` before workflow creation.

## Project Constraints (from CLAUDE.md)

- TypeScript strict mode
- Monorepo with packages/ directory, pnpm workspaces
- `build:all` must run before tests (dist/ required for n8n container)
- Each node is a separate npm package
- Tests are mandatory for each node
- Error handling via `NodeApiError`
- Jest as test framework

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| E2E-01 | E2E test infrastructure -- jest.config.e2e.js, test:e2e script, env var loading for API keys | Jest E2E config pattern, dotenv for CEIDG_API_KEY, e2e-test.sh script |
| E2E-02 | NBP E2E -- get current EUR exchange rate returns numeric mid value from real API | Verified: `GET /api/exchangerates/rates/A/EUR/` returns `{rates:[{mid: number}]}` |
| E2E-03 | NFZ E2E -- search queues for known benefit returns non-empty results from real API | Verified: `GET /queues?case=1&benefit=ortop&limit=1` returns `{data: [...]}` with count > 0 |
| E2E-04 | KRS E2E -- get extract for known KRS number returns company data from real API | Verified: `GET /OdpisAktualny/0000019193` returns `{odpis: {naglowekA: {numerKRS: ...}}}` |
| E2E-05 | Biala Lista VAT E2E -- search by known NIP returns subject data from real API | Verified: `GET /api/search/nip/5213017228?date=YYYY-MM-DD` returns `{result: {subject: {nip, statusVat}}}` |
| E2E-06 | VIES E2E -- validate known valid EU VAT number returns valid=true from real API | Verified: `GET /ms/PL/vat/5213017228` returns `{isValid: true, name: "ZAKLAD UBEZPIECZEN..."}` |
| E2E-07 | CEIDG E2E -- search by known NIP returns company data (requires CEIDG_API_KEY env var, skip if absent) | CEIDG API v3 uses Bearer token auth, `GET /firma?nip=...` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jest | ^29.7.0 | Test runner | Already used in project for unit, structural, integration tests |
| ts-jest | ^29.2.0 | TypeScript support for Jest | Already configured in project |
| docker compose | v2.35+ | Container orchestration | Already used by Phase 18 integration tests |
| n8nio/n8n | 2.12.3 (pinned) | n8n instance for E2E testing | Same image as Phase 18 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| dotenv | ^16.x | Load .env file for CEIDG_API_KEY | Only needed if .env file approach preferred over direct env var |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Webhook workflow execution | Direct HTTP calls from Jest (bypass n8n) | Direct calls are simpler but don't test the full n8n node pipeline |
| n8n Docker execution | n8n CLI `execute` command inside container | Requires `docker exec`, harder to capture output, not officially supported for testing |

**Installation:**
No new dependencies required. All tools already present from Phase 18. dotenv is optional -- can use `CEIDG_API_KEY=xxx pnpm run test:e2e` directly.

## Architecture Patterns

### Recommended Project Structure
```
__tests__/
  e2e/
    e2e.test.ts                    # Main E2E test file (6 describe blocks)
    helpers.ts                     # Shared helpers (createWorkflow, activateWorkflow, executeViaWebhook, createCredential)
    fixtures/
      e2e-nbp.json                # Webhook -> NBP node workflow
      e2e-nfz.json                # Webhook -> NFZ node workflow
      e2e-krs.json                # Webhook -> KRS node workflow
      e2e-biala-lista-vat.json    # Webhook -> Biala Lista VAT node workflow
      e2e-vies.json               # Webhook -> VIES node workflow
      e2e-ceidg.json              # Webhook -> CEIDG node workflow (needs credentials)
jest.config.e2e.js                # Dedicated E2E Jest config (30s timeout)
scripts/
  e2e-test.sh                    # Orchestration: build -> docker up -> jest e2e -> teardown
```

### Pattern 1: Webhook-Triggered E2E Workflow
**What:** Each E2E test creates a workflow with Webhook trigger -> Custom Node, activates it, calls the webhook URL, and validates the response.
**When to use:** For every E2E test case -- this is the only reliable way to execute workflows programmatically via n8n API.

**Workflow fixture format:**
```json
{
  "name": "E2E - NBP Get Current EUR Rate",
  "nodes": [
    {
      "id": "webhook-1",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "webhookId": "nbp-e2e-test",
      "position": [250, 300],
      "parameters": {
        "path": "e2e-nbp",
        "httpMethod": "GET",
        "responseMode": "lastNode",
        "options": {}
      }
    },
    {
      "id": "nbp-1",
      "name": "NBP",
      "type": "n8n-nodes-nbp.nbp",
      "typeVersion": 1,
      "position": [450, 300],
      "parameters": {
        "resource": "exchangeRate",
        "operation": "getCurrentRate",
        "table": "A",
        "currencyCode": "EUR"
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "NBP", "type": "main", "index": 0 }]]
    }
  },
  "settings": {}
}
```

### Pattern 2: E2E Test Lifecycle
**What:** Full test lifecycle: import workflow -> activate -> call webhook -> assert response -> cleanup.
**Example:**
```typescript
describe('NBP E2E (E2E-02)', () => {
  let workflowId: string;

  beforeAll(async () => {
    const workflow = loadFixture('e2e-nbp.json');
    const created = await createWorkflow(workflow);
    workflowId = created.id;
    await activateWorkflow(workflowId);
  });

  afterAll(async () => {
    if (workflowId) {
      await deactivateWorkflow(workflowId);
      await deleteWorkflow(workflowId);
    }
  });

  it('should return current EUR exchange rate with numeric mid value', async () => {
    try {
      const result = await callWebhook('e2e-nbp', 'GET');
      expect(result).toBeDefined();
      // NBP returns { table, currency, code, rates: [{ no, effectiveDate, mid }] }
      expect(result).toHaveProperty('table', 'A');
      expect(result).toHaveProperty('code', 'EUR');
      expect(result.rates).toBeInstanceOf(Array);
      expect(result.rates.length).toBeGreaterThan(0);
      expect(typeof result.rates[0].mid).toBe('number');
      expect(result.rates[0].mid).toBeGreaterThan(0);
    } catch (error) {
      // Network unavailable -- skip gracefully
      if (isNetworkError(error)) {
        console.warn('NBP API unavailable, skipping E2E test');
        return;
      }
      throw error;
    }
  });
});
```

### Pattern 3: Credential Creation for CEIDG
**What:** CEIDG requires API key auth. Before creating the CEIDG workflow, create credentials via n8n API.
**Example:**
```typescript
async function createCredential(apiKey: string, type: string, name: string, data: Record<string, string>): Promise<string> {
  const response = await fetch(`${N8N_BASE_URL}/api/v1/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': apiKey,
    },
    body: JSON.stringify({
      name,
      type,
      data,
    }),
  });
  const result = await response.json();
  return result.id;
}
```

### Pattern 4: Graceful Skip on Network Failure
**What:** External APIs may be temporarily unavailable. Tests must not hard-fail on network issues.
**Example:**
```typescript
function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('fetch failed')
    );
  }
  return false;
}
```

### Anti-Patterns to Avoid
- **Hardcoding webhook URLs with random UUIDs:** Use deterministic webhook paths (e.g., `e2e-nbp`) set via `webhookId` parameter so the URL is predictable.
- **Not cleaning up workflows after tests:** Leaked active workflows with webhook triggers consume resources. Always deactivate + delete in afterAll.
- **Using test webhook URLs instead of production:** Test webhooks only work from the n8n editor UI. Production webhooks work when the workflow is activated.
- **Assuming APIs are always available:** Always wrap external calls in try/catch with graceful skip for network errors.
- **Running CEIDG tests without checking for env var first:** Use `describe.skipIf(!process.env.CEIDG_API_KEY)` or conditional skip.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Workflow execution | Custom Docker exec commands | Webhook trigger + n8n REST API | Official pattern, stable across versions |
| HTTP client | axios or node-fetch | Native `fetch()` (Node 18+) | Zero dependencies, already used in integration tests |
| API key loading | Custom file parser | `process.env.CEIDG_API_KEY` | Standard Node.js env var pattern |
| Docker lifecycle | Jest globalSetup/teardown | Shell script wrapper (reuse Phase 18 pattern) | Simpler, proven in Phase 18 |
| Today's date for Biala Lista VAT | Hardcoded date string | `new Date().toISOString().split('T')[0]` | API requires current or recent date |

**Key insight:** The existing Phase 18 infrastructure (docker-compose.test.yml, integration-test.sh, helpers.ts) provides the foundation. E2E tests add webhook-based workflow execution on top of this.

## Common Pitfalls

### Pitfall 1: n8n Webhook URL Format
**What goes wrong:** Tests call the wrong webhook URL and get 404.
**Why it happens:** n8n webhook URLs differ between test mode (editor) and production mode (activated workflow). The production URL format is `http://localhost:5679/webhook/{path}` (not `/webhook-test/`).
**How to avoid:** Always activate workflows before calling webhooks. Use the `/webhook/{path}` format, not `/webhook-test/`.
**Warning signs:** 404 responses from webhook calls.

### Pitfall 2: Biala Lista VAT Rate Limit (10 searches/day)
**What goes wrong:** E2E tests start failing after 10 runs per day.
**Why it happens:** The Biala Lista VAT API enforces a strict rate limit of 10 search requests per day for the free tier.
**How to avoid:** Use the single-NIP search endpoint (not batch). Cache results mentally -- each test run costs 1 API call. Consider using the `check` endpoint (verification) instead of `search` if it has different limits.
**Warning signs:** HTTP 429 or empty responses after repeated test runs.

### Pitfall 3: VIES Service Unavailability
**What goes wrong:** VIES E2E test fails intermittently.
**Why it happens:** VIES depends on member state services (MS_UNAVAILABLE error). Individual country services go down for maintenance regularly.
**How to avoid:** Use a stable country code for testing (PL is generally reliable). Add graceful skip for MS_UNAVAILABLE responses. Consider testing with DE (Germany) as a backup.
**Warning signs:** `userError: "MS_UNAVAILABLE"` in response instead of `isValid`.

### Pitfall 4: KRS API Response Format
**What goes wrong:** Tests break because KRS returns nested JSON with Polish field names.
**Why it happens:** The KRS API returns deeply nested objects with Polish-language keys (e.g., `odpis.naglowekA.numerKRS`).
**How to avoid:** Assert on specific deep paths. Don't try to validate the entire response structure -- just check the key identifying fields exist and have correct types.
**Warning signs:** TypeError accessing nested properties.

### Pitfall 5: NFZ API Slow Responses
**What goes wrong:** NFZ E2E test times out.
**Why it happens:** NFZ API can be slow (3-10 seconds for queue searches) and has no SLA.
**How to avoid:** Set individual test timeout to 30 seconds. Use a narrow search (specific benefit + specific province) to get faster responses.
**Warning signs:** Jest timeout errors specifically for NFZ tests.

### Pitfall 6: Webhook Node Version Mismatch
**What goes wrong:** Webhook node in fixture doesn't work with n8n 2.12.3.
**Why it happens:** Webhook node has typeVersion 1 and 2 with different parameter schemas.
**How to avoid:** Use `typeVersion: 2` for Webhook node in n8n 2.12.3. Verify the `responseMode` parameter exists at this version.
**Warning signs:** Workflow import succeeds but webhook call returns unexpected response.

### Pitfall 7: Credential Data Encryption
**What goes wrong:** CEIDG credential creation via API fails or credential doesn't work.
**Why it happens:** n8n encrypts credential data at rest. When creating credentials via API, n8n handles encryption internally. However, the `data` field format must match what the credential type expects.
**How to avoid:** Pass credential data as plain key-value pairs matching the credential class properties (e.g., `{ apiKey: "the-actual-key" }`). n8n handles encryption.
**Warning signs:** 400 error on credential creation, or node execution fails with "invalid credentials".

## Code Examples

### jest.config.e2e.js
```javascript
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/__tests__/e2e/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { diagnostics: false }],
  },
  clearMocks: true,
  testTimeout: 30000,  // 30s per test for slow external APIs
};
```

### E2E Helper Functions
```typescript
// __tests__/e2e/helpers.ts
export const N8N_BASE_URL = 'http://localhost:5679';

let apiKey: string | undefined;

export async function setupN8nAuth(): Promise<string> {
  if (apiKey) return apiKey;

  // Reuse the same owner setup pattern from integration tests
  try {
    const setupResponse = await fetch(`${N8N_BASE_URL}/api/v1/owner/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'TestPassword123!',
      }),
    });
    if (setupResponse.ok) {
      const data = await setupResponse.json();
      apiKey = data.apiKey;
    }
  } catch { /* owner may already exist */ }

  if (!apiKey) {
    const loginResponse = await fetch(`${N8N_BASE_URL}/api/v1/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'TestPassword123!',
      }),
    });
    if (loginResponse.ok) {
      const data = await loginResponse.json();
      apiKey = data.apiKey;
    }
  }

  if (!apiKey) throw new Error('Could not obtain n8n API key');
  return apiKey;
}

export async function createWorkflow(workflow: object): Promise<{ id: string }> {
  const key = await setupN8nAuth();
  const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': key,
    },
    body: JSON.stringify(workflow),
  });
  if (!response.ok) throw new Error(`Failed to create workflow: ${response.status}`);
  return response.json();
}

export async function activateWorkflow(id: string): Promise<void> {
  const key = await setupN8nAuth();
  const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${id}/activate`, {
    method: 'POST',
    headers: { 'X-N8N-API-KEY': key },
  });
  if (!response.ok) throw new Error(`Failed to activate workflow: ${response.status}`);
}

export async function deactivateWorkflow(id: string): Promise<void> {
  const key = await setupN8nAuth();
  await fetch(`${N8N_BASE_URL}/api/v1/workflows/${id}/deactivate`, {
    method: 'POST',
    headers: { 'X-N8N-API-KEY': key },
  }).catch(() => { /* best effort */ });
}

export async function deleteWorkflow(id: string): Promise<void> {
  const key = await setupN8nAuth();
  await fetch(`${N8N_BASE_URL}/api/v1/workflows/${id}`, {
    method: 'DELETE',
    headers: { 'X-N8N-API-KEY': key },
  }).catch(() => { /* best effort */ });
}

export async function callWebhook(path: string, method: string = 'GET', body?: object): Promise<any> {
  const url = `${N8N_BASE_URL}/webhook/${path}`;
  const options: RequestInit = { method };
  if (body) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Webhook call failed: ${response.status} ${await response.text()}`);
  return response.json();
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'fetch failed', 'network']
      .some(keyword => error.message.toLowerCase().includes(keyword.toLowerCase()));
  }
  return false;
}

export function todayDateString(): string {
  return new Date().toISOString().split('T')[0];
}
```

### E2E Workflow Fixture -- NBP
```json
{
  "name": "E2E - NBP EUR Rate",
  "nodes": [
    {
      "id": "webhook-1",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "webhookId": "e2e-nbp",
      "position": [250, 300],
      "parameters": {
        "path": "e2e-nbp",
        "httpMethod": "GET",
        "responseMode": "lastNode",
        "options": {}
      }
    },
    {
      "id": "nbp-1",
      "name": "NBP",
      "type": "n8n-nodes-nbp.nbp",
      "typeVersion": 1,
      "position": [450, 300],
      "parameters": {
        "resource": "exchangeRate",
        "operation": "getCurrentRate",
        "table": "A",
        "currencyCode": "EUR"
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "NBP", "type": "main", "index": 0 }]]
    }
  },
  "settings": {}
}
```

### e2e-test.sh Script
```bash
#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="docker-compose.test.yml"
PROJECT_NAME="n8n-e2e-test"

cleanup() {
  echo "Tearing down test containers..."
  docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down --volumes --remove-orphans 2>/dev/null || true
}
trap cleanup EXIT

echo "Building all packages..."
pnpm run build:all

echo "Starting n8n test container..."
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d --wait

echo "Running E2E tests..."
CEIDG_API_KEY="${CEIDG_API_KEY:-}" npx jest --config jest.config.e2e.js "$@"

echo "E2E tests passed!"
```

## Verified API Responses and Test Data

### NBP (no auth)
- **URL:** `https://api.nbp.pl/api/exchangerates/rates/A/EUR/`
- **Response verified (2026-03-24):**
```json
{"table":"A","currency":"euro","code":"EUR","rates":[{"no":"057/A/NBP/2026","effectiveDate":"2026-03-24","mid":4.2728}]}
```
- **Key assertions:** `table === "A"`, `code === "EUR"`, `rates[0].mid` is a positive number

### NFZ (no auth)
- **URL:** `https://api.nfz.gov.pl/app-itl-api/queues?case=1&benefit=ortop&limit=1&page=1&api-version=1.3&format=json`
- **Response verified (2026-03-24):** 1470 results for "ortop" queue search
- **Key assertions:** `meta.count > 0`, response contains `data` array

### KRS (no auth)
- **URL:** `https://api-krs.ms.gov.pl/api/krs/OdpisAktualny/0000019193?rejestr=P&format=json`
- **Test entity:** PKN ORLEN (KRS 0000019193) -- large public company, extremely stable in registry
- **Response verified (2026-03-24):** Returns full company extract
- **Key assertions:** `odpis.naglowekA.numerKRS === "0000019193"`, `odpis.rodzaj === "Aktualny"`

### Biala Lista VAT (no auth)
- **URL:** `https://wl-api.mf.gov.pl/api/search/nip/5213017228?date=2026-03-24`
- **Test entity:** ZUS (NIP 5213017228) -- government institution, permanently on the white list
- **Response verified (2026-03-24):** Returns subject with `statusVat: "Czynny"`
- **Key assertions:** `result.subject.nip === "5213017228"`, `result.subject.statusVat === "Czynny"`
- **Rate limit:** 10 search requests per day (free tier)

### VIES (no auth)
- **URL:** `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/PL/vat/5213017228`
- **Test entity:** ZUS (PL5213017228) -- always valid EU VAT number
- **Response verified (2026-03-24):** `isValid: true`, `name: "ZAKLAD UBEZPIECZEN SPOLECZNYCH"`
- **Key assertions:** `isValid === true`, `vatNumber === "5213017228"`, `name` is non-empty string

### CEIDG (API key auth)
- **URL:** `https://dane.biznes.gov.pl/api/ceidg/v3/firma?nip=6351723862`
- **Auth:** `Authorization: Bearer {CEIDG_API_KEY}`
- **Test entity:** NIP from credential test fixture (6351723862)
- **Key assertions:** Response contains company data matching the NIP
- **Skip condition:** `CEIDG_API_KEY` env var not set

## Webhook Node Configuration Reference

For n8n 2.12.3, the Webhook node v2 supports these key parameters:

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `path` | e.g., `e2e-nbp` | Defines the webhook URL path (`/webhook/e2e-nbp`) |
| `httpMethod` | `GET` or `POST` | HTTP method the webhook accepts |
| `responseMode` | `lastNode` | Returns output of last node as HTTP response |
| `options` | `{}` | Additional options (empty for basic use) |

**Production webhook URL format:** `http://localhost:5679/webhook/{path}`
**Test webhook URL format (DO NOT USE):** `http://localhost:5679/webhook-test/{path}`

## Node Parameter Reference for E2E Fixtures

| Node | Resource | Operation | Required Parameters |
|------|----------|-----------|---------------------|
| NBP | exchangeRate | getCurrentRate | table: "A", currencyCode: "EUR" |
| NFZ | queue | search | case: 1, benefit: "ortop", limit: 5 |
| KRS | company | getCurrentExtract | krsNumber: "0000019193" |
| Biala Lista VAT | subject | searchByNip | nip: "5213017228", date: (today) |
| VIES | vatNumber | validate | countryCode: "PL", vatNumber: "5213017228" |
| CEIDG | company | searchByNip | nip: "6351723862" |

**Note on Biala Lista VAT `date` parameter:** The date must be provided as a string in the workflow fixture. Since n8n evaluates expressions, use `={{ $now.format('yyyy-MM-dd') }}` or a static recent date. For E2E tests, a dynamically computed date is better since the API rejects dates too far in the past.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct workflow execution API | Webhook trigger pattern | n8n never had public execute API | Must use webhook pattern for E2E |
| Webhook node v1 | Webhook node v2 | n8n 1.x | Use typeVersion: 2 in fixtures |
| API key in header | Bearer token auth (CEIDG v3) | CEIDG v2 deprecation | Credentials use `Authorization: Bearer` |

## Open Questions

1. **Biala Lista VAT date expression in workflow fixture**
   - What we know: The API requires a `date` parameter in YYYY-MM-DD format. Static dates will eventually become stale.
   - What's unclear: Whether n8n evaluates expressions like `={{ $now.format('yyyy-MM-dd') }}` in declarative node parameters when the node is executed via webhook trigger.
   - Recommendation: Test with expression first. If it doesn't work, set the date dynamically in the test helper before creating the workflow (string replacement in the fixture JSON).

2. **n8n workflow activation API exact endpoint**
   - What we know: DeepWiki references `POST /workflows/:workflowId/activate`. The integration tests in Phase 18 only created (not activated) workflows.
   - What's unclear: Exact endpoint path and whether it requires the workflow to be in a specific state first.
   - Recommendation: Verify empirically. If `/activate` doesn't work, try `PATCH /api/v1/workflows/{id}` with `{ "active": true }` in the body.

3. **Credential creation API data format**
   - What we know: n8n has `POST /api/v1/credentials` endpoint. Credential data is encrypted at rest.
   - What's unclear: Exact format for the `data` field -- does it need to match the credential class property names exactly?
   - Recommendation: Use `{ "apiKey": "the-key" }` matching the `CeidgApi` credential class property name. Verify empirically.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker | Container runtime | Yes | 28.1.1 | -- |
| Docker Compose | Container orchestration | Yes | v2.35.1 | -- |
| n8nio/n8n image | n8n test instance | Yes | 2.12.3 (pinned) | -- |
| Jest | Test runner | Yes | ^29.7.0 | -- |
| NBP API | E2E-02 | Yes | Live, verified 2026-03-24 | Skip on network error |
| NFZ API | E2E-03 | Yes | Live, verified 2026-03-24 | Skip on network error |
| KRS API | E2E-04 | Yes | Live, verified 2026-03-24 | Skip on network error |
| Biala Lista VAT API | E2E-05 | Yes | Live, verified 2026-03-24 | Skip on network error |
| VIES API | E2E-06 | Yes | Live, verified 2026-03-24 | Skip on network error |
| CEIDG API | E2E-07 | Requires API key | v3 | Skip if CEIDG_API_KEY not set |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** CEIDG API key -- tests skip gracefully if not provided.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.x with ts-jest |
| Config file | `jest.config.e2e.js` (new -- Wave 0) |
| Quick run command | `npx jest --config jest.config.e2e.js` |
| Full suite command | `bash scripts/e2e-test.sh` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| E2E-01 | E2E test infrastructure | infra | `bash scripts/e2e-test.sh` | No -- Wave 0 |
| E2E-02 | NBP EUR rate | e2e | `npx jest --config jest.config.e2e.js -t "NBP"` | No -- Wave 0 |
| E2E-03 | NFZ queue search | e2e | `npx jest --config jest.config.e2e.js -t "NFZ"` | No -- Wave 0 |
| E2E-04 | KRS company extract | e2e | `npx jest --config jest.config.e2e.js -t "KRS"` | No -- Wave 0 |
| E2E-05 | Biala Lista VAT NIP search | e2e | `npx jest --config jest.config.e2e.js -t "Biala"` | No -- Wave 0 |
| E2E-06 | VIES VAT validation | e2e | `npx jest --config jest.config.e2e.js -t "VIES"` | No -- Wave 0 |
| E2E-07 | CEIDG NIP search (with API key) | e2e | `CEIDG_API_KEY=xxx npx jest --config jest.config.e2e.js -t "CEIDG"` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** N/A (E2E tests require Docker + external APIs)
- **Per wave merge:** `bash scripts/e2e-test.sh`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `jest.config.e2e.js` -- E2E test Jest config
- [ ] `__tests__/e2e/e2e.test.ts` -- main E2E test file
- [ ] `__tests__/e2e/helpers.ts` -- shared E2E helpers
- [ ] `__tests__/e2e/fixtures/e2e-*.json` -- 6 webhook workflow fixtures
- [ ] `scripts/e2e-test.sh` -- orchestration script
- [ ] Root `package.json` needs `test:e2e` script

## Sources

### Primary (HIGH confidence)
- Live API verification (2026-03-24) -- all 6 APIs tested with curl, responses verified
- Existing Phase 18 integration test infrastructure (`__tests__/integration/`, `docker-compose.test.yml`, `scripts/integration-test.sh`)
- Node source code (`packages/n8n-nodes-*/nodes/*/`) -- exact parameter names and API URLs
- CEIDG credential source (`packages/n8n-nodes-ceidg/credentials/CeidgApi.credentials.ts`) -- auth pattern

### Secondary (MEDIUM confidence)
- [n8n Webhook Node docs](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/) -- responseMode parameter, production vs test URL
- [n8n Respond to Webhook docs](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.respondtowebhook/) -- lastNode response mode
- [n8n Workflows API (DeepWiki)](https://deepwiki.com/n8n-io/n8n/3.1-workflows-and-credentials-api) -- activate/deactivate endpoints
- [n8n community: no public execute API](https://community.n8n.io/t/executing-a-workflow-via-api-call-without-webhook-or-cli-command/212895) -- confirmed no direct execution endpoint

### Tertiary (LOW confidence)
- n8n credential creation API data format -- needs empirical verification
- `POST /api/v1/workflows/{id}/activate` exact path -- needs empirical verification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- reuses Phase 18 infrastructure entirely
- Architecture: HIGH -- webhook pattern is the documented way to trigger workflows programmatically
- Test data stability: HIGH -- using government institutions (ZUS, PKN Orlen) as test entities
- API availability: MEDIUM -- public APIs have no SLA, may have rate limits or downtime
- n8n API (activate/credentials): MEDIUM -- exact endpoints need empirical verification
- Pitfalls: HIGH -- rate limits and unavailability patterns documented from live testing

**Research date:** 2026-03-24
**Valid until:** 2026-04-07 (7 days -- depends on external API availability and n8n API behavior)
