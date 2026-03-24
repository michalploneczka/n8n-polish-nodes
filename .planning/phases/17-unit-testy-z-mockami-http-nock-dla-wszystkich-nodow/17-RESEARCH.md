# Phase 17: Unit testy z mockami HTTP (nock) dla wszystkich nodow - Research

**Researched:** 2026-03-24
**Domain:** Testing / nock HTTP mocks / n8n community nodes
**Confidence:** HIGH

## Summary

All 12 packages already have test files with varying quality. The project uses two distinct testing patterns based on node style: (1) declarative nodes use description validation + raw nock HTTP contract tests via `https.get`, and (2) programmatic nodes use `createMockExecuteFunctions` with `jest.fn()` mocking `helpers.httpRequest`. Phase 17 should focus on standardizing and strengthening existing tests, not creating them from scratch.

The key gaps identified are: SMSAPI's HTTP Integration tests set up nock scopes but never verify them with actual HTTP calls (no `isDone()` assertions), some programmatic nodes lack `continueOnFail` error handling tests, and some declarative nodes don't test error responses (KRS, NBP, VIES). The test infrastructure (shared test-utils, jest.config.base.js, nock) is already solid.

**Primary recommendation:** Audit each package's existing tests against a standardized checklist (description tests, operation coverage, error handling, nock contract verification) and fill the specific gaps per node rather than rewriting tests from scratch.

## Project Constraints (from CLAUDE.md)

- Every node MUST have tests with nock mock -- happy path + error handling for each operation
- Tests use `@n8n-polish-nodes/test-utils` shared package (via jest moduleNameMapper)
- Declarative nodes: test description structure + nock HTTP contracts
- Programmatic nodes: test via `createMockExecuteFunctions` + mock `helpers.httpRequest`
- `npm run lint` must pass without errors
- Error handling: every HTTP error must be caught and returned as `NodeApiError` with English message
- ts-jest with `diagnostics: false` in jest configs for n8n-workflow type compatibility

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jest | 29.7.0 | Test runner | Already in use across all packages |
| ts-jest | 29.2.0 | TypeScript transform | Already configured in jest.config.base.js |
| nock | 14.0.0 | HTTP mock/intercept | Already installed as devDep, used in shared test-utils |
| n8n-workflow | * | NodeApiError, IExecuteFunctions types | Already peerDep + devDep |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @n8n-polish-nodes/test-utils | internal | Shared mock utilities | Every test file imports from here |

**Installation:** No new packages needed. All dependencies already installed.

## Architecture Patterns

### Existing Test Infrastructure
```
shared/
  test-utils/
    index.ts                          # Re-exports all utilities
    nock-helpers.ts                    # setupNock, teardownNock, createNockScope
    mock-execute-functions.ts         # createMockExecuteFunctions with dot-path resolution
jest.config.base.js                   # Base config: ts-jest, testMatch, clearMocks
packages/n8n-nodes-*/
  jest.config.js                      # Per-package config extending base
  __tests__/
    *.node.test.ts                    # Test files
```

### Pattern 1: Declarative Node Tests (SMSAPI, CEIDG, NBP, VIES, NFZ, Biala Lista VAT, KRS)
**What:** Tests validate description structure (resources, operations, routing) + nock HTTP contract tests
**When to use:** Nodes without `execute()` method -- n8n runtime handles HTTP calls
**Example:**
```typescript
// Description validation
it('should have correct baseURL', () => {
  expect(description.requestDefaults?.baseURL).toBe('https://api.example.pl');
});

// Nock HTTP contract test
it('endpoint returns 200 with expected data', () => {
  const scope = createNockScope('https://api.example.pl')
    .get('/resource')
    .reply(200, { data: [] });

  const https = require('https');
  return new Promise<void>((resolve) => {
    https.get('https://api.example.pl/resource', (res) => {
      expect(res.statusCode).toBe(200);
      // ... parse body ...
      expect(scope.isDone()).toBe(true);
      resolve();
    });
  });
});
```

### Pattern 2: Programmatic Node Tests (Fakturownia, InPost, Ceneo, LinkerCloud, GUS REGON)
**What:** Tests call `node.execute.call(mock)` with mocked credentials and httpRequest
**When to use:** Nodes with `execute()` method
**Example:**
```typescript
function createNodeMock(params: Record<string, unknown>, continueBool = false) {
  const mock = createMockExecuteFunctions(params, undefined, continueBool);
  mock.getCredentials = jest.fn().mockResolvedValue({ apiToken: 'test' });
  mock.helpers.httpRequest = jest.fn();
  mock.helpers.prepareBinaryData = jest.fn(); // only if binary ops exist
  return mock;
}

it('should perform operation', async () => {
  const mock = createNodeMock({ resource: 'invoice', operation: 'list' });
  (mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce([{ id: 1 }]);

  const result = await node.execute.call(mock);

  expect(result[0]).toHaveLength(1);
  expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
    expect.objectContaining({ url: expect.stringContaining('/invoices.json'), method: 'GET' })
  );
});
```

### Anti-Patterns to Avoid
- **Setting up nock without verifying:** SMSAPI creates nock scopes but never calls `scope.isDone()` or makes HTTP requests. Nock scope setup without verification is a no-op test.
- **Testing only happy path:** Several nodes missing error handling tests (KRS, NBP, VIES).
- **No continueOnFail test:** Programmatic nodes should test that `continueOnFail: true` returns error in JSON instead of throwing.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mock IExecuteFunctions | Custom mock per test | `createMockExecuteFunctions()` from shared test-utils | Already handles dot-path resolution, getNode, getWorkflow |
| Nock setup/teardown | Manual nock.disableNetConnect per test | `setupNock()` / `teardownNock()` from shared test-utils | Consistent cleanup, prevents leaked interceptors |
| HTTP scope creation | Raw `nock('url')` | `createNockScope('url')` from shared test-utils | Wrapper ready for future enhancements |

## Current Test Coverage Inventory

### Per-Package Analysis

| Package | Style | Test Cases | Nock Contracts | Execute Tests | Error Tests | continueOnFail | Gaps |
|---------|-------|------------|----------------|---------------|-------------|----------------|------|
| smsapi | declarative | 24 | YES (but no isDone!) | N/A | YES | N/A | Nock scopes never verified |
| ceidg | declarative | 14 | YES (verified) | N/A | YES | N/A | OK |
| nbp | declarative | 18 | YES (verified) | N/A | NO | N/A | Missing error tests |
| vies | declarative | 13 | YES (verified) | N/A | NO | N/A | Missing error tests |
| nfz | declarative | 19 | YES (verified) | N/A | YES (1) | N/A | OK |
| biala-lista-vat | declarative | 21 | YES (verified) | N/A | YES (1) | N/A | OK |
| krs | declarative | 14 | YES (verified) | N/A | NO | N/A | Missing error tests |
| fakturownia | programmatic | 22 | N/A | YES | YES | YES | OK |
| inpost | programmatic | 16 | N/A | YES | YES | YES | OK |
| ceneo | programmatic | 8 | N/A | YES | YES | NO | Missing continueOnFail |
| linkercloud | programmatic | 18 | N/A | YES | YES | YES | OK |
| gus-regon | programmatic | 21 | N/A | YES | YES | NO | Missing continueOnFail, has XmlParser unit tests |

### Identified Gaps Summary

1. **SMSAPI:** Nock scopes set up but never exercised -- tests pass vacuously. Need to add `https.get` calls + `isDone()` assertions like CEIDG/NBP pattern.
2. **NBP:** No error handling tests (e.g., 401, 500). Missing NodeApiError wrap validation.
3. **VIES:** No error handling tests beyond MS_UNAVAILABLE response test (which tests response data, not error wrapping).
4. **KRS:** No error handling tests at all.
5. **Ceneo:** Missing `continueOnFail` test.
6. **GUS REGON:** Missing `continueOnFail` test.

### Nodes That Are Already Well-Covered
- **CEIDG** -- good description + nock + error tests
- **Fakturownia** -- comprehensive: all operations + errors + continueOnFail + edge cases
- **InPost** -- all operations + errors + continueOnFail + binary
- **LinkerCloud** -- all operations + errors + continueOnFail
- **NFZ** -- good description + nock + error tests
- **Biala Lista VAT** -- good description + nock + error tests

## Common Pitfalls

### Pitfall 1: Nock Scopes Not Consumed
**What goes wrong:** Test creates a nock scope but never makes an HTTP request against it, so the scope goes unused and the test passes vacuously.
**Why it happens:** Declarative nodes can't call `node.execute()` because n8n runtime handles HTTP. Tests set up nock "to document the contract" but forget to actually verify.
**How to avoid:** Every nock scope MUST have a corresponding HTTP call + `expect(scope.isDone()).toBe(true)`.
**Warning signs:** No `isDone()` or `https.get` after `createNockScope`.

### Pitfall 2: No Error Path Tests for Declarative Nodes
**What goes wrong:** Only happy path tested. Error responses (401, 404, 500) not validated.
**Why it happens:** Declarative nodes rely on n8n runtime for error handling, so developers skip testing it.
**How to avoid:** Test that the API contract includes error responses and that `NodeApiError` can wrap them.
**Warning signs:** Only 200 status codes in nock replies.

### Pitfall 3: Public API Nodes Don't Need Credential Error Tests
**What goes wrong:** Trying to test 401 on nodes that have no credentials (NBP, VIES, KRS, Biala Lista VAT, NFZ).
**Why it happens:** Copy-pasting test patterns from credentialed nodes.
**How to avoid:** For public API nodes, test 404 (resource not found) and 400 (bad request) instead of 401. NBP already tests 404 and 400 correctly for some endpoints.

### Pitfall 4: ESM Module Transform Issues
**What goes wrong:** Jest fails on ESM-only dependencies (entities, fast-xml-parser).
**Why it happens:** GUS REGON uses ESM packages that ts-jest can't handle by default.
**How to avoid:** Use `transformIgnorePatterns` in jest.config.js to include these packages.
**Warning signs:** "SyntaxError: Cannot use import statement outside a module" in test output.

## Standardized Test Checklist

For each node, tests MUST cover:

### Declarative Nodes
- [ ] Node description: displayName, name, baseURL
- [ ] Credentials: property names, auth type (or no credentials for public APIs)
- [ ] Resources: correct count and values
- [ ] Operations: correct count and values per resource
- [ ] Routing: correct URL and method per operation
- [ ] No execute method assertion
- [ ] Nock HTTP contract: happy path per endpoint (with `isDone()` verification)
- [ ] Nock HTTP contract: error responses (404, 400, or 401 depending on auth)
- [ ] NodeApiError wrapping validation

### Programmatic Nodes
- [ ] Node description: displayName, name, credentials
- [ ] Resources: correct count and values
- [ ] Execute test: each operation happy path
- [ ] Execute test: correct URL, method, body/qs assertions
- [ ] Error handling: API error throws NodeApiError
- [ ] ContinueOnFail: returns error in json.error
- [ ] Binary operations: prepareBinaryData mock (if applicable)
- [ ] Special logic unit tests (e.g., XML parser, token caching, HMAC)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + ts-jest 29.2.0 |
| Config file | `jest.config.base.js` (root) + per-package `jest.config.js` |
| Quick run command | `cd packages/n8n-nodes-{name} && npx jest` |
| Full suite command | `pnpm --filter './packages/*' run test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GAP-01 | SMSAPI nock scopes verified with isDone | unit | `cd packages/n8n-nodes-smsapi && npx jest` | EXISTS (needs fix) |
| GAP-02 | NBP error handling tests | unit | `cd packages/n8n-nodes-nbp && npx jest` | EXISTS (needs addition) |
| GAP-03 | VIES error handling tests | unit | `cd packages/n8n-nodes-vies && npx jest` | EXISTS (needs addition) |
| GAP-04 | KRS error handling tests | unit | `cd packages/n8n-nodes-krs && npx jest` | EXISTS (needs addition) |
| GAP-05 | Ceneo continueOnFail test | unit | `cd packages/n8n-nodes-ceneo && npx jest` | EXISTS (needs addition) |
| GAP-06 | GUS REGON continueOnFail test | unit | `cd packages/n8n-nodes-gus-regon && npx jest` | EXISTS (needs addition) |

### Sampling Rate
- **Per task commit:** `cd packages/n8n-nodes-{name} && npx jest`
- **Per wave merge:** `pnpm --filter './packages/*' run test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. All jest configs, shared test-utils, and nock are already in place.

## Sources

### Primary (HIGH confidence)
- Direct file reads of all 12 `__tests__/*.test.ts` files
- Direct file reads of `shared/test-utils/*` (nock-helpers, mock-execute-functions, index)
- Direct file reads of `jest.config.base.js` and per-package `jest.config.js`
- Full test suite run output (all tests pass)

### Secondary (MEDIUM confidence)
- npm registry: nock@14.0.11, jest@30.3.0 (latest), ts-jest@29.4.6 (latest)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all packages already installed, versions verified
- Architecture: HIGH - two clear patterns documented from reading actual code
- Pitfalls: HIGH - gaps identified by direct analysis of each test file

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable, no moving targets)
