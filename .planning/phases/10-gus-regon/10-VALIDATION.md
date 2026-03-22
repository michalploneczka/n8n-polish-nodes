---
phase: 10
slug: gus-regon
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | packages/n8n-nodes-gus-regon/jest.config.js |
| **Quick run command** | `cd packages/n8n-nodes-gus-regon && npx jest --testPathPattern` |
| **Full suite command** | `cd packages/n8n-nodes-gus-regon && npx jest` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd packages/n8n-nodes-gus-regon && npx jest`
- **After every plan wave:** Run `cd packages/n8n-nodes-gus-regon && npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | REGON-01 | unit | `npx jest --testPathPattern credentials` | ❌ W0 | ⬜ pending |
| 10-02-01 | 02 | 1 | REGON-06 | unit | `npx jest --testPathPattern soap` | ❌ W0 | ⬜ pending |
| 10-03-01 | 03 | 2 | REGON-04 | unit | `npx jest --testPathPattern session` | ❌ W0 | ⬜ pending |
| 10-04-01 | 04 | 3 | REGON-02, REGON-03 | unit | `npx jest --testPathPattern search` | ❌ W0 | ⬜ pending |
| 10-05-01 | 05 | 3 | REGON-05 | unit | `npx jest --testPathPattern fullData` | ❌ W0 | ⬜ pending |
| 10-06-01 | 06 | 2 | REGON-06, REGON-07 | unit | `npx jest --testPathPattern parse` | ❌ W0 | ⬜ pending |
| 10-07-01 | 07 | 4 | REGON-08, REGON-09 | unit | `npx jest --testPathPattern GusRegon` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/GusRegon.test.ts` — test stubs for SOAP operations
- [ ] `tests/fixtures/` — SOAP XML response fixtures (login, search, full report)
- [ ] jest.config.js — jest configuration for the package

*Existing monorepo jest patterns from other packages can be replicated.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Polish characters display correctly in n8n UI | REGON-07 | Requires visual inspection in n8n | Search for a company with Polish chars (e.g., "Żółta Łódź"), verify output in n8n |
| Session transparency | REGON-04 | UX verification | Run search operation, confirm no login/logout fields visible to user |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
