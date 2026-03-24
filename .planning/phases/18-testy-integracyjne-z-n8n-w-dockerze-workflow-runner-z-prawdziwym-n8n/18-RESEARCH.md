# Phase 18: Testy integracyjne z n8n w Dockerze - Research

**Researched:** 2026-03-24
**Domain:** Docker integration testing, n8n REST API, custom node loading verification
**Confidence:** HIGH

## Summary

This phase creates integration tests that spin up a real n8n instance in Docker, verify all 12 custom nodes and their credentials load correctly, and validate that n8n can import basic smoke workflows for each node. The scope is explicitly limited to loading verification -- no real API calls, no mock servers.

The approach is straightforward: `docker compose -f docker-compose.test.yml up`, wait for n8n health check, query the internal `/types/nodes.json` endpoint to verify all 12 node types are registered, then POST minimal workflow JSONs to `/api/v1/workflows` to verify schema validity. All orchestrated by Jest with `beforeAll`/`afterAll` managing the Docker lifecycle.

**Primary recommendation:** Use a shell script wrapper (`scripts/integration-test.sh`) that handles build + docker compose up + Jest run + teardown, with Jest itself only doing HTTP assertions against the running n8n container. This keeps Docker lifecycle management simple and debuggable.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Test node loading only -- verify n8n discovers and registers all 12 custom nodes + their credential types. No workflow execution against real or mock APIs.
- **D-02:** Cover all 12 packages -- SMSAPI, CEIDG, Fakturownia, InPost, LinkerCloud, NBP, Biala Lista VAT, Ceneo, GUS REGON, KRS, NFZ, VIES.
- **D-03:** Verify both nodes AND credentials are registered -- catches mismatched paths in package.json `n8n.nodes` and `n8n.credentials` fields.
- **D-04:** Additionally create basic smoke workflows -- minimal workflow JSON per node (node configured but not executed), imported via n8n API to verify config schema validity.
- **D-05:** Separate `docker-compose.test.yml` dedicated to integration tests. Keep existing `docker-compose.yml` for dev use unchanged.
- **D-06:** Volume mount dist/ + package.json into `/custom-nodes/` (same pattern as current docker-compose.yml). Requires `build:all` before running integration tests.
- **D-07:** Use n8n REST API (`GET /api/v1/node-types`) to verify node registration. No log parsing or container exec.
- **D-08:** Ephemeral volume for n8n data -- no persistence between test runs.
- **D-09:** No executable workflows -- smoke workflows only verify import (POST /api/v1/workflows), not execution.
- **D-10:** Workflow fixture JSONs live in `__tests__/integration/fixtures/` at repo root, alongside existing `__tests__/structural/`.
- **D-11:** Integration tests run in GitHub Actions as a separate job -- distinct from unit tests.
- **D-12:** Gate publishing on integration test pass -- integration tests must pass before npm publish workflow triggers.
- **D-13:** Target duration under 2 minutes -- n8n container startup (~30s) + API checks + smoke imports + teardown.

### Claude's Discretion
- n8n Docker image version pinning strategy (latest vs specific tag)
- Health check implementation (polling interval, timeout)
- Test runner orchestration (Jest with docker-compose up/down in beforeAll/afterAll, or shell script wrapper)
- Whether to use n8n API key auth or disable auth for test container
- Exact structure of smoke workflow JSONs (minimal viable n8n workflow format)
- docker-compose.test.yml port mapping (avoid conflicts with dev compose)

### Deferred Ideas (OUT OF SCOPE)
- Execution tests against public APIs (Phase 19 or future)
- Mock server integration tests (WireMock/MockServer)
- Performance/load testing
</user_constraints>

## Project Constraints (from CLAUDE.md)

- TypeScript strict mode
- Monorepo with packages/ directory, pnpm workspaces
- `build:all` must run before integration tests (dist/ required)
- Each node is a separate npm package with `n8n-community-node-package` keyword
- Tests are mandatory for each node
- GitHub Actions for CI/CD with provenance attestation
- Error handling via `NodeApiError`

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jest | ^29.7.0 | Test runner | Already used in project for unit + structural tests |
| ts-jest | ^29.2.0 | TypeScript support for Jest | Already configured in project |
| docker compose | v2.35+ | Container orchestration | Already installed, used by existing docker-compose.yml |
| n8nio/n8n | 2.12.3 (pinned) | n8n instance for testing | Official Docker image, current stable |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node-fetch or built-in fetch | native | HTTP calls to n8n API | Node 18+ has native fetch; no new dependency needed |
| wait-on (optional) | ^8.0.0 | Wait for HTTP endpoint | Only if health check polling needs simplification |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Jest beforeAll/afterAll docker | Shell script wrapper | Shell script is simpler, more debuggable, recommended |
| testcontainers | docker compose | Docker compose is simpler for single-service setup, already in project |
| wait-on npm | Custom polling loop | Custom loop avoids new dependency, 10 lines of code |

**Installation:**
No new dependencies required. Jest and ts-jest already installed. Docker Compose already available. Native fetch available in Node 18+.

## Architecture Patterns

### Recommended Project Structure
```
__tests__/
  integration/
    integration.test.ts          # Main integration test file
    fixtures/
      workflow-smsapi.json       # Smoke workflow per node (12 files)
      workflow-ceidg.json
      workflow-fakturownia.json
      workflow-inpost.json
      workflow-linkercloud.json
      workflow-nbp.json
      workflow-biala-lista-vat.json
      workflow-ceneo.json
      workflow-gus-regon.json
      workflow-krs.json
      workflow-nfz.json
      workflow-vies.json
    helpers.ts                   # Shared helpers (waitForHealth, n8nApi)
docker-compose.test.yml          # Test-only compose file
jest.config.integration.js       # Dedicated Jest config
scripts/
  integration-test.sh            # Orchestration script
```

### Pattern 1: Node Type Verification via Internal API
**What:** n8n exposes `/types/nodes.json` as an internal endpoint (not part of the public REST API) that returns ALL registered node types including custom community nodes.
**When to use:** To verify that n8n has discovered and loaded all 12 custom nodes from the volume mounts.
**Confidence:** MEDIUM -- This endpoint is used by the n8n frontend and referenced in community forums, but it is not part of the documented public API. It has been stable across n8n versions.
**Example:**
```typescript
// Fetch all registered node types
const response = await fetch('http://localhost:5679/types/nodes.json');
const nodeTypes = await response.json();

// Filter to only our custom nodes
const customNodes = nodeTypes.filter((n: any) =>
  n.name.startsWith('n8n-nodes-')
  && !n.name.startsWith('n8n-nodes-base')
);
```

**Alternative (D-07 compliance):** The CONTEXT.md says to use `GET /api/v1/node-types`. However, this endpoint does NOT exist in n8n's public REST API. The available option is `/types/nodes.json` (internal, no auth required) or checking node availability by importing a workflow that uses the node type (if the node isn't loaded, import will fail or warn). **Recommendation:** Use `/types/nodes.json` as the primary check since it directly returns the node registry. If this endpoint changes in future n8n versions, the test will fail fast and clearly.

### Pattern 2: Workflow Import via Public REST API
**What:** `POST /api/v1/workflows` creates a workflow. If the workflow references a node type that n8n doesn't recognize, the import still succeeds but marks the node as unknown. We need to verify the import succeeds AND the node is recognized.
**When to use:** For smoke workflow validation (D-04, D-09).
**Example:**
```typescript
// Minimal n8n workflow JSON
const workflow = {
  name: "Smoke Test - SMSAPI",
  nodes: [
    {
      id: "trigger",
      name: "Manual Trigger",
      type: "n8n-nodes-base.manualTrigger",
      typeVersion: 1,
      position: [250, 300],
      parameters: {}
    },
    {
      id: "smsapi",
      name: "SMSAPI",
      type: "n8n-nodes-smsapi.smsapi",
      typeVersion: 1,
      position: [450, 300],
      parameters: {}
    }
  ],
  connections: {
    "Manual Trigger": {
      main: [[{ node: "SMSAPI", type: "main", index: 0 }]]
    }
  },
  settings: {}
};

const response = await fetch('http://localhost:5679/api/v1/workflows', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-N8N-API-KEY': 'test-api-key'
  },
  body: JSON.stringify(workflow)
});
expect(response.status).toBe(200);
```

### Pattern 3: Docker Compose Test Configuration
**What:** Separate docker-compose.test.yml with ephemeral volumes, different port, and test-specific env vars.
**When to use:** Always for integration tests.
**Example:**
```yaml
version: '3.8'
services:
  n8n-test:
    image: n8nio/n8n:2.12.3
    container_name: n8n-integration-test
    ports:
      - "5679:5678"  # Different port to avoid dev conflicts
    environment:
      - N8N_CUSTOM_EXTENSIONS=/custom-nodes
      - N8N_BASIC_AUTH_ACTIVE=false
      - N8N_DIAGNOSTICS_ENABLED=false
      - N8N_PERSONALIZATION_ENABLED=false
      - N8N_USER_MANAGEMENT_DISABLED=true
      - N8N_PUBLIC_API_DISABLED=false
      - GENERIC_TIMEZONE=Europe/Warsaw
      - TZ=Europe/Warsaw
    volumes:
      # Mount each package's full directory (dist/ must exist)
      - ./packages/n8n-nodes-smsapi:/custom-nodes/node_modules/n8n-nodes-smsapi
      - ./packages/n8n-nodes-ceidg:/custom-nodes/node_modules/n8n-nodes-ceidg
      # ... all 12 packages
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5678/healthz"]
      interval: 5s
      timeout: 5s
      retries: 30
      start_period: 10s
    tmpfs:
      - /home/node/.n8n  # Ephemeral data - no persistence
```

### Pattern 4: Health Check Polling
**What:** Wait for n8n container to be fully ready before running tests.
**When to use:** In Jest globalSetup or test beforeAll.
**Example:**
```typescript
async function waitForN8n(url: string, timeoutMs = 60000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/healthz`);
      if (res.ok) return;
    } catch {
      // Container not ready yet
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error(`n8n did not become healthy within ${timeoutMs}ms`);
}
```

### Anti-Patterns to Avoid
- **Parsing container logs for node loading:** Fragile, depends on log format. Use API instead.
- **Using `docker exec` to inspect container state:** Couples tests to container internals. Use HTTP API.
- **Running `docker compose up` inside Jest:** Use shell script or globalSetup to manage lifecycle separately from test assertions.
- **Using `latest` tag without pinning:** Breaks tests unpredictably when n8n releases new versions.
- **Not waiting for health check:** Tests fail intermittently if n8n hasn't finished starting.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Container health waiting | Custom bash loop with sleep | Docker compose healthcheck + polling in test setup | Built-in, reliable, configurable |
| Expected node list | Hardcoded array of 12 names | Dynamic generation from packages/*/package.json | Single source of truth, auto-updates when new packages added |
| Docker lifecycle | Complex Jest globalSetup/teardown | Shell script wrapping docker compose + jest | Simpler, debuggable, CI-friendly |
| HTTP client | axios or node-fetch dependency | Native `fetch()` (Node 18+) | Zero dependencies, built-in |

**Key insight:** The test infrastructure should be as thin as possible. Docker Compose handles container lifecycle. Jest handles assertions. A shell script glues them together. No test frameworks for Docker needed.

## Common Pitfalls

### Pitfall 1: n8n Owner Setup Wizard Blocking API Access
**What goes wrong:** Fresh n8n instance requires completing owner setup before API is accessible. API calls return 401 or redirect to setup page.
**Why it happens:** n8n v2.x requires initial owner account creation on first launch.
**How to avoid:** Set `N8N_USER_MANAGEMENT_DISABLED=true` or programmatically create the owner account via `/api/v1/owner/setup` before running tests. Alternatively, use the internal `/types/nodes.json` endpoint which may not require authentication.
**Warning signs:** Tests pass locally (where n8n was already set up) but fail in CI (fresh instance).

### Pitfall 2: dist/ Not Built Before Running Integration Tests
**What goes wrong:** Volume mounts point to dist/ directories that don't exist or contain stale code.
**Why it happens:** Developer runs `npm run test:integration` without `build:all` first.
**How to avoid:** Shell script wrapper runs `pnpm run build:all` before `docker compose up`. Document this dependency clearly.
**Warning signs:** n8n starts but doesn't discover any custom nodes.

### Pitfall 3: Port Conflict with Dev Docker Compose
**What goes wrong:** Test compose fails to start because port 5678 is already in use by dev compose.
**Why it happens:** Both compose files use the same port.
**How to avoid:** Use port 5679 (or another) for test compose. Different container name too (`n8n-integration-test` vs `n8n`).
**Warning signs:** "port already in use" error.

### Pitfall 4: n8n API Key Authentication Requirements
**What goes wrong:** `POST /api/v1/workflows` returns 401 because no API key is set.
**Why it happens:** n8n public REST API requires authentication via `X-N8N-API-KEY` header.
**How to avoid:** Either (a) disable user management and use internal endpoints, or (b) create owner account programmatically and generate API key. Option (a) is simpler for testing.
**Warning signs:** Health check passes but API calls fail with 401.

### Pitfall 5: Volume Mount Path Mismatches
**What goes wrong:** n8n doesn't find custom nodes because the volume mount path doesn't match what n8n expects.
**Why it happens:** `N8N_CUSTOM_EXTENSIONS` path doesn't match the volume mount target, or the node_modules structure inside the custom extensions directory is wrong.
**How to avoid:** Follow the exact pattern from existing `docker-compose.yml` which is proven to work. Mount packages to `/custom-nodes/node_modules/{package-name}`.
**Warning signs:** n8n starts, healthcheck passes, but `/types/nodes.json` shows zero custom nodes.

### Pitfall 6: tmpfs Permissions in Docker
**What goes wrong:** n8n container can't write to /home/node/.n8n when using tmpfs.
**Why it happens:** tmpfs default permissions may not match the `node` user in the container.
**How to avoid:** Use `tmpfs: /home/node/.n8n:uid=1000,gid=1000` or use an anonymous volume instead of tmpfs: `volumes: - /home/node/.n8n`.
**Warning signs:** n8n container crashes on startup with permission errors.

## Code Examples

### Complete Smoke Workflow Fixture (SMSAPI)
```json
{
  "name": "Smoke Test - SMSAPI",
  "nodes": [
    {
      "id": "trigger-1",
      "name": "Manual Trigger",
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [250, 300],
      "parameters": {}
    },
    {
      "id": "smsapi-1",
      "name": "SMSAPI",
      "type": "n8n-nodes-smsapi.smsapi",
      "typeVersion": 1,
      "position": [450, 300],
      "parameters": {}
    }
  ],
  "connections": {
    "Manual Trigger": {
      "main": [[{"node": "SMSAPI", "type": "main", "index": 0}]]
    }
  },
  "settings": {}
}
```

### Dynamic Expected Node List Generator
```typescript
// helpers.ts
import * as fs from 'fs';
import * as path from 'path';

const PACKAGES_DIR = path.join(__dirname, '../../packages');

interface ExpectedNode {
  packageName: string;
  nodeType: string;   // e.g., "n8n-nodes-smsapi.smsapi"
  credentials: string[]; // credential class names
}

export function getExpectedNodes(): ExpectedNode[] {
  return fs.readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && e.name.startsWith('n8n-nodes-'))
    .map(e => {
      const pkgJson = JSON.parse(
        fs.readFileSync(path.join(PACKAGES_DIR, e.name, 'package.json'), 'utf-8')
      );
      const n8n = pkgJson.n8n;
      // Extract node type from dist path: "dist/nodes/Smsapi/Smsapi.node.js" -> "smsapi"
      const nodePath = n8n.nodes[0];
      const className = nodePath.split('/').pop()!.replace('.node.js', '');
      const nodeType = `${pkgJson.name}.${className.charAt(0).toLowerCase() + className.slice(1)}`;

      return {
        packageName: pkgJson.name,
        nodeType,
        credentials: (n8n.credentials || []).map((c: string) => {
          const credClass = c.split('/').pop()!.replace('.credentials.js', '');
          return credClass.charAt(0).toLowerCase() + credClass.slice(1);
        })
      };
    })
    .sort((a, b) => a.packageName.localeCompare(b.packageName));
}
```

### Integration Test Shell Script
```bash
#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="docker-compose.test.yml"
PROJECT_NAME="n8n-integration-test"

cleanup() {
  echo "Tearing down test containers..."
  docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down --volumes --remove-orphans 2>/dev/null || true
}
trap cleanup EXIT

echo "Building all packages..."
pnpm run build:all

echo "Starting n8n test container..."
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d --wait

echo "Running integration tests..."
npx jest --config jest.config.integration.js

echo "Integration tests passed!"
```

### Jest Integration Config
```javascript
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/__tests__/integration/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { diagnostics: false }],
  },
  clearMocks: true,
  testTimeout: 120000, // 2 minute timeout for integration tests
};
```

## Discretion Recommendations

### n8n Docker Image Version Pinning
**Recommendation:** Pin to `n8nio/n8n:2.12.3` (current local version). Update periodically but deliberately -- not `latest`.
**Rationale:** `latest` can break tests silently when n8n changes internal APIs or node loading behavior. Pinned versions make failures reproducible.

### Health Check Implementation
**Recommendation:** Docker Compose built-in healthcheck using `wget` to `/healthz` with 5s interval, 30 retries, 10s start_period. In test setup, poll with `fetch()` every 2s with 60s total timeout.
**Rationale:** Two layers of health checking -- Docker reports container as healthy, test code confirms API is accessible.

### Test Runner Orchestration
**Recommendation:** Shell script wrapper (`scripts/integration-test.sh`) that runs build + docker compose up --wait + jest + docker compose down. Jest only does HTTP assertions.
**Rationale:** Separating Docker lifecycle from Jest keeps each tool doing what it does best. Easier to debug. `--wait` flag in docker compose v2 waits for healthcheck to pass.

### Authentication Strategy
**Recommendation:** Set `N8N_USER_MANAGEMENT_DISABLED=true` to skip owner setup. Use `/types/nodes.json` (internal, no auth) for node verification. For workflow import, check if API works without auth when user management is disabled; if not, create owner account programmatically in test setup.
**Rationale:** Simplest approach. No API key management needed for ephemeral test container.

### Smoke Workflow JSON Structure
**Recommendation:** Each fixture is a minimal 2-node workflow: Manual Trigger -> Custom Node. No parameters configured (just defaults). This validates that n8n can parse the node's description/schema.
**Rationale:** Minimal surface area. If the node description schema is invalid, import will fail. Parameters aren't needed for schema validation.

### Port Mapping
**Recommendation:** Map to host port 5679 (vs dev compose 5678). Container name `n8n-integration-test` (vs dev `n8n`).
**Rationale:** Avoids conflicts when dev compose is running.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `N8N_BASIC_AUTH_*` env vars | User management system | n8n 1.x | Basic auth deprecated, use N8N_USER_MANAGEMENT_DISABLED for testing |
| docker-compose (hyphenated) | docker compose (space) | Docker Compose v2 | Use `docker compose` command, not `docker-compose` |
| Manual health polling | `docker compose up --wait` | Docker Compose v2.20+ | Built-in wait for healthcheck, simplifies scripts |
| `N8N_CUSTOM_EXTENSIONS` only | Volume mount to `/home/node/.n8n/custom/node_modules/` | n8n 1.x+ | Both approaches work; `N8N_CUSTOM_EXTENSIONS` sets path, volume mount provides files |

## Existing Infrastructure Reference

### All 12 Node Types (auto-extracted from packages)
| Package | Node Type | Credentials |
|---------|-----------|-------------|
| n8n-nodes-biala-lista-vat | n8n-nodes-biala-lista-vat.bialaListaVat | (none) |
| n8n-nodes-ceidg | n8n-nodes-ceidg.ceidg | CeidgApi |
| n8n-nodes-ceneo | n8n-nodes-ceneo.ceneo | CeneoApi |
| n8n-nodes-fakturownia | n8n-nodes-fakturownia.fakturownia | FakturowniaApi |
| n8n-nodes-gus-regon | n8n-nodes-gus-regon.gusRegon | GusRegonApi |
| n8n-nodes-inpost | n8n-nodes-inpost.inpost | InpostApi |
| n8n-nodes-krs | n8n-nodes-krs.krs | (none) |
| n8n-nodes-linkercloud | n8n-nodes-linkercloud.linkerCloud | LinkerCloudApi |
| n8n-nodes-nbp | n8n-nodes-nbp.nbp | (none) |
| n8n-nodes-nfz | n8n-nodes-nfz.nfz | (none) |
| n8n-nodes-smsapi | n8n-nodes-smsapi.smsapi | SmsapiApi |
| n8n-nodes-vies | n8n-nodes-vies.vies | (none) |

### Existing docker-compose.yml Mount Pattern (proven working)
```yaml
volumes:
  - ./packages/n8n-nodes-smsapi:/custom-nodes/node_modules/n8n-nodes-smsapi
environment:
  - N8N_CUSTOM_EXTENSIONS=/custom-nodes
```

## Open Questions

1. **`/types/nodes.json` auth requirements with user management disabled**
   - What we know: This is an internal endpoint used by n8n frontend. Community references suggest it works without API key auth.
   - What's unclear: Whether disabling user management (`N8N_USER_MANAGEMENT_DISABLED=true`) makes this endpoint freely accessible.
   - Recommendation: Test empirically in first implementation. If blocked, fall back to programmatic owner setup + API key.

2. **Workflow import with unknown node type behavior**
   - What we know: n8n may accept workflow imports even if the node type isn't recognized (marking it as unknown).
   - What's unclear: Exact behavior -- does import return 200 with warning, or 4xx error?
   - Recommendation: Test empirically. The node type verification via `/types/nodes.json` is the primary check; workflow import is secondary validation.

3. **GUS REGON runtime dependencies in Docker**
   - What we know: GUS REGON node uses `fast-xml-parser` and `entities` as runtime deps. These are listed in its package.json dependencies.
   - What's unclear: Whether n8n Docker container will correctly resolve these dependencies from the volume-mounted package.
   - Recommendation: Verify during implementation. If n8n can't resolve them, may need to install them in the container or ensure `node_modules` is included in the mount.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker | Container runtime | Yes | 28.1.1 | -- |
| Docker Compose | Container orchestration | Yes | v2.35.1 | -- |
| n8nio/n8n image | Test n8n instance | Yes | 2.12.3 (pulled) | Pull on demand |
| Node.js (fetch) | HTTP assertions | Yes | 18+ (native fetch) | -- |
| Jest | Test runner | Yes | ^29.7.0 | -- |
| pnpm | Build orchestration | Yes | (workspace root) | -- |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.x with ts-jest |
| Config file | `jest.config.integration.js` (new -- Wave 0) |
| Quick run command | `npx jest --config jest.config.integration.js` |
| Full suite command | `bash scripts/integration-test.sh` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INT-01 | All 12 node types registered in n8n | integration | `bash scripts/integration-test.sh` | No -- Wave 0 |
| INT-02 | All 7 credential types registered | integration | `bash scripts/integration-test.sh` | No -- Wave 0 |
| INT-03 | 12 smoke workflows import successfully | integration | `bash scripts/integration-test.sh` | No -- Wave 0 |
| INT-04 | docker-compose.test.yml starts n8n | integration | `docker compose -f docker-compose.test.yml up -d --wait` | No -- Wave 0 |
| INT-05 | CI job gates publishing | CI config | Manual verification of workflow YAML | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** N/A (integration tests run as full suite only)
- **Per wave merge:** `bash scripts/integration-test.sh`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `jest.config.integration.js` -- integration test Jest config
- [ ] `__tests__/integration/integration.test.ts` -- main test file
- [ ] `__tests__/integration/helpers.ts` -- shared helpers
- [ ] `__tests__/integration/fixtures/*.json` -- 12 smoke workflow fixtures
- [ ] `docker-compose.test.yml` -- test-only Docker Compose
- [ ] `scripts/integration-test.sh` -- orchestration script
- [ ] Root `package.json` needs `test:integration` script

## Sources

### Primary (HIGH confidence)
- Existing `docker-compose.yml` in project -- proven volume mount pattern for custom nodes
- Existing `jest.config.structural.js` -- pattern for separate Jest config
- Docker Hub n8nio/n8n:2.12.3 -- current image version verified locally
- Package.json `n8n` sections -- node type names and credential paths extracted from all 12 packages

### Secondary (MEDIUM confidence)
- [n8n Docker Compose docs](https://docs.n8n.io/hosting/installation/server-setups/docker-compose/) -- Docker setup reference
- [n8n Custom nodes location](https://docs.n8n.io/hosting/configuration/configuration-examples/custom-nodes-location/) -- N8N_CUSTOM_EXTENSIONS configuration
- [n8n Community: healthcheck](https://community.n8n.io/t/docker-image-suggestion-add-healthcheck/31837) -- `/healthz` endpoint confirmed
- [n8n API authentication](https://docs.n8n.io/api/authentication/) -- X-N8N-API-KEY header requirement

### Tertiary (LOW confidence)
- [n8n Community: node types endpoint](https://community.n8n.io/t/i-need-a-available-node-node-details-for-create-workflow-by-using-your-rest-api/115909) -- `/types/nodes.json` internal endpoint (undocumented)
- [n8n Community: get-node-types](https://community.n8n.io/t/get-node-types/57642) -- Confirms no public API for node listing as of v1.63
- N8N_USER_MANAGEMENT_DISABLED env var behavior -- needs empirical verification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools already in project or installed locally
- Architecture: HIGH -- follows existing patterns (structural tests, docker-compose.yml)
- Docker setup: HIGH -- based on proven existing docker-compose.yml mount pattern
- n8n API endpoints: MEDIUM -- `/types/nodes.json` is undocumented internal API; workflow import API is documented
- Auth strategy: MEDIUM -- N8N_USER_MANAGEMENT_DISABLED behavior needs verification
- Pitfalls: HIGH -- documented from community reports and common Docker issues

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (30 days -- n8n releases frequently but custom node loading is stable)
