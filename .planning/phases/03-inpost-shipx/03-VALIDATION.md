---
phase: 3
slug: inpost-shipx
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (via @n8n/node-cli) |
| **Config file** | packages/n8n-nodes-inpost/jest.config.js |
| **Quick run command** | `cd packages/n8n-nodes-inpost && npm test` |
| **Full suite command** | `cd packages/n8n-nodes-inpost && npm test -- --coverage` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd packages/n8n-nodes-inpost && npm test`
- **After every plan wave:** Run `cd packages/n8n-nodes-inpost && npm test -- --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | INPOST-01 | unit | `npm test -- --testPathPattern=credentials` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | INPOST-02, INPOST-03 | unit | `npm test -- --testPathPattern=shipment` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 2 | INPOST-04 | unit | `npm test -- --testPathPattern=shipment` | ❌ W0 | ⬜ pending |
| 03-04-01 | 04 | 2 | INPOST-05 | unit | `npm test -- --testPathPattern=label` | ❌ W0 | ⬜ pending |
| 03-05-01 | 05 | 2 | INPOST-06, INPOST-07 | unit | `npm test -- --testPathPattern=points\|tracking` | ❌ W0 | ⬜ pending |
| 03-06-01 | 06 | 3 | INPOST-08 | unit | `npm test -- --testPathPattern=error` | ❌ W0 | ⬜ pending |
| 03-07-01 | 07 | 3 | INPOST-09 | integration | `npm test -- --coverage` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `jest.config.js` — Jest configuration for InPost package
- [ ] `tests/InPost.node.test.ts` — test stubs for all operations
- [ ] `tests/InPostApi.credentials.test.ts` — credential test stubs

*Test infrastructure scaffolded in plan 03-07 (Wave 3).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sandbox/Production toggle | INPOST-01 | Requires real InPost sandbox account | Toggle environment in credentials, verify base URL changes in request |
| PDF label opens correctly | INPOST-05 | Binary output verification | Download label via n8n, open PDF, verify content |
| Paczkomaty search | INPOST-06 | Requires live API for location data | Search for known Paczkomat code (e.g., KRA010) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
