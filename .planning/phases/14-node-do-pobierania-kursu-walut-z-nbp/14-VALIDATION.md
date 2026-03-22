---
phase: 14
slug: node-do-pobierania-kursu-walut-z-nbp
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (via @n8n/node-cli) |
| **Config file** | packages/n8n-nodes-nbp/jest.config.js |
| **Quick run command** | `cd packages/n8n-nodes-nbp && npm test` |
| **Full suite command** | `cd packages/n8n-nodes-nbp && npm test -- --coverage` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd packages/n8n-nodes-nbp && npm test`
- **After every plan wave:** Run `cd packages/n8n-nodes-nbp && npm test -- --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | scaffold | unit | `npm test` | ❌ W0 | ⬜ pending |
| 14-01-02 | 01 | 1 | exchange-rates | unit | `npm test` | ❌ W0 | ⬜ pending |
| 14-01-03 | 01 | 1 | gold-prices | unit | `npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/n8n-nodes-nbp/tests/Nbp.node.test.ts` — stubs for all operations
- [ ] `packages/n8n-nodes-nbp/jest.config.js` — jest configuration
- [ ] nock dependency — HTTP mocking for NBP API calls

*Existing infrastructure pattern from other nodes (CEIDG, LinkerCloud) covers framework setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Node visible in n8n | scaffold | Requires running n8n instance | `npm link` + check n8n node panel |
| Weekend/holiday 404 handling | edge-case | Requires specific calendar dates | Test on a weekend with "today" endpoint |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
