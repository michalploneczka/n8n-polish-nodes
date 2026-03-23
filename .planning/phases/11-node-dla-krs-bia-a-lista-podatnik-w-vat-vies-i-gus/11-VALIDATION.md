---
phase: 11
slug: node-dla-krs-bia-a-lista-podatnik-w-vat-vies-i-gus
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | per-package jest.config.js (follows existing monorepo pattern) |
| **Quick run command** | `npx jest --testPathPattern={package}` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern={package}`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | TBD | unit | `npx jest --testPathPattern=krs` | ❌ W0 | ⬜ pending |
| 11-02-01 | 02 | 1 | TBD | unit | `npx jest --testPathPattern=biala-lista` | ❌ W0 | ⬜ pending |
| 11-03-01 | 03 | 1 | TBD | unit | `npx jest --testPathPattern=vies` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test stubs for KRS node
- [ ] Test stubs for Biala Lista VAT node
- [ ] Test stubs for VIES node
- [ ] Shared fixtures for API response mocking

*Existing jest infrastructure from prior phases covers framework setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Node visible in n8n | TBD | Requires running n8n instance | `npm link` + start n8n, search for node name |
| SVG icon renders | TBD | Visual verification | Open icon in browser, check 60x60 rendering |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
