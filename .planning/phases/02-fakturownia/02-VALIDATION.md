---
phase: 2
slug: fakturownia
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x + nock |
| **Config file** | `packages/n8n-nodes-fakturownia/jest.config.js` |
| **Quick run command** | `cd packages/n8n-nodes-fakturownia && npm test` |
| **Full suite command** | `cd packages/n8n-nodes-fakturownia && npm test -- --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd packages/n8n-nodes-fakturownia && npm test`
- **After every plan wave:** Run `cd packages/n8n-nodes-fakturownia && npm test -- --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | FAKT-01 | unit | `npm test -- --testNamePattern="credentials"` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | FAKT-02 | unit | `npm test -- --testNamePattern="invoices list"` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | FAKT-03 | unit | `npm test -- --testNamePattern="invoices create"` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | FAKT-04 | unit | `npm test -- --testNamePattern="pdf download"` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 2 | FAKT-05 | unit | `npm test -- --testNamePattern="send by email"` | ❌ W0 | ⬜ pending |
| 02-04-01 | 04 | 2 | FAKT-06 | unit | `npm test -- --testNamePattern="clients"` | ❌ W0 | ⬜ pending |
| 02-04-02 | 04 | 2 | FAKT-07 | unit | `npm test -- --testNamePattern="products"` | ❌ W0 | ⬜ pending |
| 02-05-01 | 05 | 2 | FAKT-08 | unit | `npm test -- --testNamePattern="pagination"` | ❌ W0 | ⬜ pending |
| 02-06-01 | 06 | 3 | FAKT-09 | unit | `npm test -- --testNamePattern="error handling"` | ❌ W0 | ⬜ pending |
| 02-07-01 | 07 | 3 | FAKT-10 | manual | N/A | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/n8n-nodes-fakturownia/tests/Fakturownia.node.test.ts` — stubs for all FAKT-* requirements
- [ ] `packages/n8n-nodes-fakturownia/jest.config.js` — jest configuration with nock
- [ ] `packages/n8n-nodes-fakturownia/package.json` — devDependencies: jest, @types/jest, nock, ts-jest

*Wave 0 must install test infrastructure before any other tasks touch implementation code.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SVG icon renders correctly at 60x60 | FAKT-10 | Visual verification required | Open SVG in browser, verify aspect ratio and rendering |
| Node visible in n8n UI after npm link | FAKT-10 | Requires running n8n instance | `npm run dev`, open http://localhost:5678, search "Fakturownia" |
| PDF opens as valid PDF | FAKT-04 | Binary content verification | Download PDF via node, open in PDF viewer |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
