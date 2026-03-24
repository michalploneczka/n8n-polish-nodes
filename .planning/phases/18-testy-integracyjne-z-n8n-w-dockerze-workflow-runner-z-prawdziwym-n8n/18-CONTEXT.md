# Phase 18: Testy integracyjne z n8n w Dockerze - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Integration tests that spin up a real n8n instance in Docker, verify all 12 custom nodes and their credentials load correctly, and validate that n8n can import basic smoke workflows for each node without errors. This is NOT execution testing — no real API calls, no mock servers. The goal is to catch broken dist/ output, misconfigured package.json paths, and schema issues before publishing.

</domain>

<decisions>
## Implementation Decisions

### Test Scope & Granularity
- **D-01:** Test **node loading only** — verify n8n discovers and registers all 12 custom nodes + their credential types. No workflow execution against real or mock APIs.
- **D-02:** Cover **all 12 packages** — SMSAPI, CEIDG, Fakturownia, InPost, LinkerCloud, NBP, Biala Lista VAT, Ceneo, GUS REGON, KRS, NFZ, VIES.
- **D-03:** Verify **both nodes AND credentials** are registered — catches mismatched paths in package.json `n8n.nodes` and `n8n.credentials` fields.
- **D-04:** Additionally create **basic smoke workflows** — minimal workflow JSON per node (node configured but not executed), imported via n8n API to verify config schema validity.

### Docker Setup Strategy
- **D-05:** **Separate `docker-compose.test.yml`** dedicated to integration tests. Keep existing `docker-compose.yml` for dev use unchanged.
- **D-06:** **Volume mount dist/ + package.json** into `/custom-nodes/` (same pattern as current docker-compose.yml). Requires `build:all` before running integration tests.
- **D-07:** Use **n8n REST API** (`GET /api/v1/node-types`) to verify node registration. No log parsing or container exec.
- **D-08:** Ephemeral volume for n8n data — no persistence between test runs.

### Workflow Definition Format
- **D-09:** **No executable workflows** — smoke workflows only verify import (POST /api/v1/workflows), not execution.
- **D-10:** Workflow fixture JSONs live in **`__tests__/integration/fixtures/`** at repo root, alongside existing `__tests__/structural/`.

### CI/CD Integration
- **D-11:** Integration tests run in **GitHub Actions as a separate job** — distinct from unit tests.
- **D-12:** **Gate publishing** on integration test pass — integration tests must pass before npm publish workflow triggers.
- **D-13:** Target duration **under 2 minutes** — n8n container startup (~30s) + API checks + smoke imports + teardown.

### Claude's Discretion
- n8n Docker image version pinning strategy (latest vs specific tag)
- Health check implementation (polling interval, timeout)
- Test runner orchestration (Jest with docker-compose up/down in beforeAll/afterAll, or shell script wrapper)
- Whether to use n8n API key auth or disable auth for test container
- Exact structure of smoke workflow JSONs (minimal viable n8n workflow format)
- docker-compose.test.yml port mapping (avoid conflicts with dev compose)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Docker setup
- `docker-compose.yml` — Current dev Docker setup with n8n + volume mounts pattern (reuse mount structure)

### Existing test infrastructure
- `__tests__/structural/cross-package.test.ts` — Structural test pattern at repo root level
- `jest.config.structural.js` — Separate Jest config for non-package tests (pattern to follow for integration config)
- `shared/test-utils/` — Shared test utilities

### n8n API documentation
- n8n REST API `/api/v1/node-types` — endpoint to list registered nodes
- n8n REST API `/api/v1/workflows` — endpoint to import workflows

### Project docs
- `.planning/REQUIREMENTS.md` — requirements context (Phase 18 TBD)
- `.planning/ROADMAP.md` §Phase 18 — phase goal and dependencies

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `docker-compose.yml` — Volume mount pattern for all 12 packages into `/custom-nodes/node_modules/` (copy and adapt for test compose)
- `__tests__/structural/` — Repo-root test directory pattern with dedicated jest config
- `jest.config.structural.js` — Template for creating `jest.config.integration.js`
- Root `package.json` scripts — Pattern for adding `test:integration` script

### Established Patterns
- Separate jest configs for different test types (per-package vs structural)
- `pnpm --filter` for running cross-package commands
- `build:all` must run before integration tests (dist/ required)

### Integration Points
- Root `package.json` — needs `test:integration` script
- `.github/workflows/publish.yml` — needs integration test job as publish gate
- `docker-compose.test.yml` — new file, mounts same packages as dev compose
- `__tests__/integration/` — new directory for integration tests and fixtures

</code_context>

<specifics>
## Specific Ideas

- Smoke workflow JSON should be minimal: a Manual Trigger node connected to the custom node with default config — just enough to validate n8n can parse the node's description schema
- The n8n API check should assert exact node type names (e.g., `n8n-nodes-smsapi.smsapi`) matching what's declared in each package's `.node.json` codex files
- Consider a helper that dynamically generates the expected node list from all packages' `package.json` `n8n` fields — single source of truth, no manual list maintenance

</specifics>

<deferred>
## Deferred Ideas

- **Execution tests against public APIs** — Run real workflows against CEIDG, KRS, NBP, NFZ, VIES, Biala Lista VAT (no credentials needed). Could be Phase 19 or future enhancement.
- **Mock server integration tests** — WireMock/MockServer container simulating all API responses for credential-required nodes. Heavy to maintain.
- **Performance/load testing** — Verify nodes handle n8n's batch processing (multiple input items). Out of scope for loading tests.

</deferred>

---

*Phase: 18-testy-integracyjne-z-n8n-w-dockerze-workflow-runner-z-prawdziwym-n8n*
*Context gathered: 2026-03-24*
