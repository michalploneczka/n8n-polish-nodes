---
phase: 18
slug: testy-integracyjne-z-n8n-w-dockerze-workflow-runner-z-prawdziwym-n8n
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x with ts-jest |
| **Config file** | `jest.config.integration.js` (new — Wave 0) |
| **Quick run command** | `npx jest --config jest.config.integration.js` |
| **Full suite command** | `bash scripts/integration-test.sh` |
| **Estimated runtime** | ~90 seconds |

---

## Sampling Rate

- **After every task commit:** N/A (integration tests run as full suite only)
- **After every plan wave:** `bash scripts/integration-test.sh`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 18-01-01 | 01 | 1 | INT-04 | integration | `docker compose -f docker-compose.test.yml up -d --wait` | No — W0 | ⬜ pending |
| 18-01-02 | 01 | 1 | INT-01 | integration | `bash scripts/integration-test.sh` | No — W0 | ⬜ pending |
| 18-01-03 | 01 | 1 | INT-02 | integration | `bash scripts/integration-test.sh` | No — W0 | ⬜ pending |
| 18-01-04 | 01 | 1 | INT-03 | integration | `bash scripts/integration-test.sh` | No — W0 | ⬜ pending |
| 18-02-01 | 02 | 2 | INT-05 | CI config | Manual verification of workflow YAML | No — W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `jest.config.integration.js` — integration test Jest config
- [ ] `__tests__/integration/integration.test.ts` — main test file
- [ ] `__tests__/integration/helpers.ts` — shared helpers
- [ ] `__tests__/integration/fixtures/*.json` — 12 smoke workflow fixtures
- [ ] `docker-compose.test.yml` — test-only Docker Compose
- [ ] `scripts/integration-test.sh` — orchestration script
- [ ] Root `package.json` needs `test:integration` script

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CI job gates publishing | INT-05 | Requires GitHub Actions YAML review | Inspect `.github/workflows/publish.yml` for integration test job dependency |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
