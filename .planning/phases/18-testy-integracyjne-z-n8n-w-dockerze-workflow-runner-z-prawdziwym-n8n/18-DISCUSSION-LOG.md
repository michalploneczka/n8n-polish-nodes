# Phase 18: Testy integracyjne z n8n w Dockerze - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 18-testy-integracyjne-z-n8n-w-dockerze-workflow-runner-z-prawdziwym-n8n
**Areas discussed:** Test scope & granularity, Docker setup strategy, Workflow definition format, CI/CD integration

---

## Test Scope & Granularity

### What should integration tests verify?

| Option | Description | Selected |
|--------|-------------|----------|
| Node loading only | Verify n8n discovers and loads all 12 custom nodes + credentials without errors. Fast, no external API calls needed. | ✓ |
| Loading + public API execution | Loading + execute workflows against 6 public API nodes (CEIDG, KRS, NBP, NFZ, VIES, Biala Lista VAT). | |
| Full execution with mock server | Loading + execute ALL 12 nodes against a mock HTTP server inside Docker. Most thorough but heaviest. | |

**User's choice:** Node loading only
**Notes:** Recommended as simplest starting point.

### Which nodes to cover?

| Option | Description | Selected |
|--------|-------------|----------|
| All 12 packages | Test all nodes — ensures nothing broken. Loading tests are cheap. | ✓ |
| Only public API nodes (6) | CEIDG, KRS, NBP, NFZ, VIES, Biala Lista VAT — no credentials needed. | |
| Representative subset (3-4) | Pick one declarative, one programmatic, one SOAP to cover patterns. | |

**User's choice:** All 12 packages

### Verify credentials too?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, verify both | Check both custom nodes AND credential types are registered. | ✓ |
| Nodes only | Only verify node classes load. | |

**User's choice:** Yes, verify both

---

## Docker Setup Strategy

### How to orchestrate n8n?

| Option | Description | Selected |
|--------|-------------|----------|
| Separate test compose | New docker-compose.test.yml dedicated to integration tests. | ✓ |
| Extend existing compose | Add test profile to current docker-compose.yml. | |
| Testcontainers (programmatic) | Use testcontainers-node library from Jest. | |

**User's choice:** Separate test compose

### How to get custom nodes into container?

| Option | Description | Selected |
|--------|-------------|----------|
| Volume mount dist/ | Mount each package's dist/ + package.json into /custom-nodes/. | ✓ |
| Custom Dockerfile with COPY | Build custom n8n image with packages baked in. | |
| npm install from local | Mount monorepo and run npm install inside container. | |

**User's choice:** Volume mount dist/

### How to verify node loading?

| Option | Description | Selected |
|--------|-------------|----------|
| n8n API endpoint | Call GET /api/v1/node-types, assert all 12 nodes appear. | ✓ |
| Container logs parsing | Parse stdout for 'Loaded custom node' messages. | |
| n8n CLI command | Run command inside container to list loaded nodes. | |

**User's choice:** n8n API endpoint

---

## Workflow Definition Format

### Workflow fixtures needed?

| Option | Description | Selected |
|--------|-------------|----------|
| API check only | No workflows — just verify node-types API. | |
| Basic smoke workflows | Minimal workflow JSON per node, import via API, no execution. | ✓ |
| Executable test workflows | Create workflows that execute (at least for public API nodes). | |

**User's choice:** Basic smoke workflows

### Where do fixtures live?

| Option | Description | Selected |
|--------|-------------|----------|
| __tests__/integration/fixtures/ | Centralized at repo root, alongside __tests__/structural/. | ✓ |
| Per-package __tests__/ | Each package has own workflow JSON. | |
| docker/test-workflows/ | Separate docker/ directory at repo root. | |

**User's choice:** __tests__/integration/fixtures/

---

## CI/CD Integration

### Run in GitHub Actions?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, separate job | New job in CI for integration tests, separate from unit tests. | ✓ |
| Yes, same workflow | Add step after unit tests in existing CI. | |
| Local only for now | No CI automation, defer. | |

**User's choice:** Yes, separate job

### Gate publishing?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, gate publish | Integration tests must pass before npm publish triggers. | ✓ |
| No, advisory only | Run but don't block publishing. | |
| Defer decision | Set up tests first, decide later. | |

**User's choice:** Yes, gate publish

### Duration budget?

| Option | Description | Selected |
|--------|-------------|----------|
| Under 2 minutes | Container startup + checks + teardown. Achievable with loading scope. | ✓ |
| Under 5 minutes | More relaxed, allows retries and cold cache. | |
| No strict budget | Focus on correctness, optimize later. | |

**User's choice:** Under 2 minutes

---

## Claude's Discretion

- n8n Docker image version pinning strategy
- Health check implementation details
- Test runner orchestration approach
- Auth configuration for test container
- Smoke workflow JSON structure
- Port mapping for test compose

## Deferred Ideas

- Execution tests against public APIs (CEIDG, KRS, NBP, NFZ, VIES, Biala Lista)
- Mock server integration tests (WireMock/MockServer)
- Performance/load testing with batch input items
