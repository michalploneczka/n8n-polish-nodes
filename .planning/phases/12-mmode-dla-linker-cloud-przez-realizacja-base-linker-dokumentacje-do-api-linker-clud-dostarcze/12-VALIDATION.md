---
phase: 12
slug: mmode-dla-linker-cloud-przez-realizacja-base-linker-dokumentacje-do-api-linker-clud-dostarcze
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | `packages/n8n-nodes-linkercloud/jest.config.js` |
| **Quick run command** | `cd packages/n8n-nodes-linkercloud && npm test` |
| **Full suite command** | `cd packages/n8n-nodes-linkercloud && npm test -- --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd packages/n8n-nodes-linkercloud && npm test`
- **After every plan wave:** Run `cd packages/n8n-nodes-linkercloud && npm test -- --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | scaffold | unit | `cd packages/n8n-nodes-linkercloud && npm run build` | ❌ W0 | ⬜ pending |
| 12-01-02 | 01 | 1 | credentials | unit | `cd packages/n8n-nodes-linkercloud && npm run build` | ❌ W0 | ⬜ pending |
| 12-02-01 | 02 | 2 | orders | unit | `cd packages/n8n-nodes-linkercloud && npm test` | ❌ W0 | ⬜ pending |
| 12-03-01 | 03 | 2 | products/stock | unit | `cd packages/n8n-nodes-linkercloud && npm test` | ❌ W0 | ⬜ pending |
| 12-04-01 | 04 | 2 | shipments/returns | unit | `cd packages/n8n-nodes-linkercloud && npm test` | ❌ W0 | ⬜ pending |
| 12-05-01 | 05 | 3 | inbound | unit | `cd packages/n8n-nodes-linkercloud && npm test` | ❌ W0 | ⬜ pending |
| 12-06-01 | 06 | 4 | finalization | unit | `npm run lint && npm run build && npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/n8n-nodes-linkercloud/__tests__/LinkerCloud.node.test.ts` — stubs for all operations
- [ ] `packages/n8n-nodes-linkercloud/jest.config.js` — jest configuration
- [ ] `packages/n8n-nodes-linkercloud/package.json` — includes test script and jest/nock deps

*Wave 0 is satisfied by Plan 01 (package scaffold task).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Node appears in n8n picker | scaffold | Requires running n8n instance | `npm run build && npm link` then search "LinkerCloud" in n8n node picker |
| Auth with real API key works | credentials | Live API needed | Create workflow with LinkerCloud node, configure credentials, run Orders > List |
| Shipment label base64 decode | label binary | Requires real order with label | Download label in n8n, verify binary output opens as valid PDF |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
