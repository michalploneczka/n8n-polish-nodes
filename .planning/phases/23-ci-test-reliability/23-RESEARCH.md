# Phase 23: CI & Test Reliability - Research

**Researched:** 2026-03-25
**Domain:** CI pipeline configuration, test infrastructure, dependency management
**Confidence:** HIGH

## Summary

Phase 23 closes four specific gaps identified in the v1.0 milestone audit (MISSING-1, MISSING-3) and Phase 18/19 tech debt. All four tasks are well-scoped, independent code changes with clear success criteria. No new libraries or architectural patterns are needed -- this is purely wiring and fixing existing infrastructure.

The four tasks are: (1) add `test:structural` step to `ci.yml`, (2) declare `nock` in `shared/test-utils/package.json`, (3) fix silent 401 skip in INT-03 integration tests, (4) verify/confirm `activateWorkflow` POST+PATCH fallback in E2E helpers.

**Primary recommendation:** Execute all four tasks in a single plan -- they are independent, small, and touch different files.

## Standard Stack

No new dependencies needed. All changes use existing tooling:

| Tool | Version | Purpose | Already Installed |
|------|---------|---------|-------------------|
| Jest | ^29.7.0 | Test runner (structural, integration, e2e) | Yes (root devDep) |
| nock | ^14.0.0 | HTTP mocking for tests | Yes (root devDep, missing from test-utils) |
| GitHub Actions | N/A | CI pipeline | Yes (.github/workflows/ci.yml) |
| ts-jest | ^29.2.0 | TypeScript transform for Jest | Yes (root devDep) |

## Architecture Patterns

### Current CI Pipeline Structure (ci.yml)

```yaml
jobs:
  ci:          # lint:all -> build:all -> test:all -> verify-packages.js
  integration: # needs: ci -> build:all -> docker compose -> jest integration
```

The `test:structural` step (499 tests, runs in ~0.8s) should be added to the `ci` job after `test:all`. It is fast enough to not warrant a separate job.

### Current Test Organization

```
__tests__/
  structural/    # 499 tests, jest.config.structural.js, run via `pnpm run test:structural`
  integration/   # Docker-based, jest.config.integration.js, run via integration job
  e2e/           # Docker-based, jest.config.e2e.js, run via scripts/e2e-test.sh
packages/*/      # Per-package unit tests, run via `pnpm run test:all`
shared/test-utils/  # Shared mocks (nock-helpers.ts, mock-execute-functions.ts)
```

### INT-03 Silent Skip Pattern (Problem)

In `__tests__/integration/integration.test.ts`, lines 148-154:

```typescript
if (response.status === 401) {
  // Auth required but not available -- skip gracefully
  console.warn(`Skipping ${fixtureFile}: API requires authentication (401)`);
  return;  // <-- TEST PASSES AS NO-OP
}
```

This means if the owner setup/login both fail (no apiKey), every workflow import test silently passes with a console.warn. The test should FAIL, not silently skip, because auth is a prerequisite that must work in the Docker test environment.

### activateWorkflow Pattern (Already Fixed)

Looking at the current `__tests__/e2e/helpers.ts` (lines 119-160), `activateWorkflow` **already implements** the POST /activate with PATCH fallback pattern correctly:
- Tries `POST /api/v1/workflows/${id}/activate` first
- On 404/405, falls back to `PATCH /api/v1/workflows/${id}` with `{active: true}`
- Caches the working endpoint for subsequent calls

**This matches the plan spec from Phase 19-01-PLAN.md.** The audit finding may have been based on an older snapshot. The current code is correct. The planner should verify this is already done and mark it as a no-op task (or add a unit test to lock the behavior).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CI step ordering | Custom scripts | GitHub Actions step in existing job | Standard, simple YAML addition |
| Dependency declaration | Hoisting workarounds | Proper devDependencies in package.json | Explicit > implicit |

## Common Pitfalls

### Pitfall 1: pnpm install --frozen-lockfile after adding nock to test-utils
**What goes wrong:** Adding `nock` to `shared/test-utils/package.json` devDependencies will require updating `pnpm-lock.yaml`. If the lockfile is not committed, CI fails on `--frozen-lockfile`.
**How to avoid:** After adding the dependency, run `pnpm install` locally to update the lockfile and commit both files.

### Pitfall 2: INT-03 fix must not break CI when Docker auth is legitimately unavailable
**What goes wrong:** Making the test hard-fail on 401 means if the Docker container's auth setup changes, CI breaks.
**How to avoid:** The fix should fail-fast in `beforeAll` if `apiKey` is undefined after setup attempts -- use `expect(apiKey).toBeDefined()` or throw an error. This way the entire `INT-03` describe block fails clearly rather than 12 tests silently passing. The auth setup IS expected to work in the Docker test environment (it's a fresh ephemeral container).

### Pitfall 3: test:structural must run AFTER build:all
**What goes wrong:** Structural tests validate `dist/` alignment (STRUCT-04). If run before build, those tests may fail or skip.
**How to avoid:** Place `pnpm run test:structural` after `pnpm run build:all` in ci.yml, which is already the natural ordering.

### Pitfall 4: nock version mismatch between root and test-utils
**What goes wrong:** If test-utils declares a different nock version than root, pnpm may install two copies.
**How to avoid:** Use `"nock": "^14.0.0"` (same as root package.json) or use workspace protocol `"nock": "catalog:"` if available. Simplest: use the exact same version spec as root.

## Code Examples

### Task 1: Wire test:structural into ci.yml

Add after the `test:all` step in the `ci` job:

```yaml
      - run: pnpm run test:structural
```

Location: `.github/workflows/ci.yml`, after line 27 (`- run: pnpm run test:all`).

### Task 2: Declare nock in shared/test-utils/package.json

```json
{
  "name": "@n8n-polish-nodes/test-utils",
  "version": "0.0.0",
  "private": true,
  "main": "index.ts",
  "devDependencies": {
    "n8n-workflow": "*",
    "nock": "^14.0.0"
  }
}
```

Then run `pnpm install` to update lockfile.

### Task 3: Fix INT-03 silent 401 skip

Replace the silent skip pattern in `__tests__/integration/integration.test.ts`. In the `beforeAll`, after auth attempts, assert that apiKey was obtained:

```typescript
// At the end of beforeAll, after all auth attempts:
if (!apiKey) {
  throw new Error(
    'Failed to obtain n8n API key -- owner setup and login both failed. ' +
    'INT-03 workflow import tests require authentication.'
  );
}
```

Then remove the 401 skip block from the test loop (lines 148-154), since auth is now guaranteed by beforeAll.

### Task 4: activateWorkflow verification

The current `__tests__/e2e/helpers.ts` already has the correct POST+PATCH fallback pattern. No code change needed. The plan should verify this and optionally add a comment or test.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7 + ts-jest 29.2 |
| Config files | jest.config.structural.js, jest.config.integration.js, jest.config.e2e.js |
| Quick run command | `pnpm run test:structural` |
| Full suite command | `pnpm run test:all && pnpm run test:structural` |

### Phase Requirements to Test Map
| Task | Behavior | Test Type | Automated Command | Exists? |
|------|----------|-----------|-------------------|---------|
| Task 1 | test:structural runs in CI | CI config | `pnpm run test:structural` (local verify) | N/A (CI config change) |
| Task 2 | nock declared in test-utils | structural | `node -e "require('./shared/test-utils/package.json').devDependencies.nock"` | N/A (package.json change) |
| Task 3 | INT-03 fails on missing auth | integration | `npx jest --config jest.config.integration.js` | Existing test, behavior change |
| Task 4 | activateWorkflow POST+PATCH | e2e | `grep -q "activate" __tests__/e2e/helpers.ts` | Already implemented |

### Sampling Rate
- **Per task commit:** `pnpm run test:structural` (0.8s)
- **Per wave merge:** `pnpm run test:all && pnpm run test:structural`
- **Phase gate:** All above + visual inspection of ci.yml diff

### Wave 0 Gaps
None -- existing test infrastructure covers all phase work. No new test files needed.

## Sources

### Primary (HIGH confidence)
- `.github/workflows/ci.yml` -- current CI pipeline configuration
- `shared/test-utils/package.json` -- current devDependencies (missing nock)
- `__tests__/integration/integration.test.ts` -- INT-03 silent skip pattern (lines 148-154)
- `__tests__/e2e/helpers.ts` -- activateWorkflow implementation (lines 119-160)
- `.planning/v1.0-MILESTONE-AUDIT.md` -- gap definitions (MISSING-1, MISSING-3, tech debt items)
- `package.json` (root) -- nock version `^14.0.0`

### Secondary (MEDIUM confidence)
- Phase 19-01-PLAN.md -- original spec for activateWorkflow POST+PATCH fallback

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all verified in codebase
- Architecture: HIGH - all files read and analyzed, changes are minimal
- Pitfalls: HIGH - based on direct code inspection, not external research

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable infrastructure, no external dependencies)
