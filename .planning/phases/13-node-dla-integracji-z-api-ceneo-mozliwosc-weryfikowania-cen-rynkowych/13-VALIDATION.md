---
phase: 13
slug: node-dla-integracji-z-api-ceneo-mozliwosc-weryfikowania-cen-rynkowych
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x + ts-jest |
| **Config file** | `packages/n8n-nodes-ceneo/jest.config.js` (Wave 0 creates) |
| **Quick run command** | `cd packages/n8n-nodes-ceneo && npm test` |
| **Full suite command** | `npm run test:all` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd packages/n8n-nodes-ceneo && npm test`
- **After every plan wave:** Run `npm run test:all`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | CENEO-01 | unit | `npm test -- --testNamePattern="credentials"` | ❌ W0 | ⬜ pending |
| 13-01-02 | 01 | 1 | CENEO-07 | unit+nock | `npm test -- --testNamePattern="token"` | ❌ W0 | ⬜ pending |
| 13-02-01 | 02 | 1 | CENEO-02 | unit+nock | `npm test -- --testNamePattern="GetTopCategory"` | ❌ W0 | ⬜ pending |
| 13-02-02 | 02 | 1 | CENEO-03 | unit+nock | `npm test -- --testNamePattern="GetAllOffers"` | ❌ W0 | ⬜ pending |
| 13-02-03 | 02 | 1 | CENEO-04 | unit+nock | `npm test -- --testNamePattern="Top10"` | ❌ W0 | ⬜ pending |
| 13-02-04 | 02 | 1 | CENEO-05 | unit+nock | `npm test -- --testNamePattern="categories"` | ❌ W0 | ⬜ pending |
| 13-03-01 | 03 | 2 | CENEO-06 | unit | `npm test -- --testNamePattern="error"` | ❌ W0 | ⬜ pending |
| 13-03-02 | 03 | 2 | CENEO-08 | unit | `npm test -- --testNamePattern="metadata"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/n8n-nodes-ceneo/__tests__/Ceneo.node.test.ts` — test stubs for all CENEO-XX requirements
- [ ] `packages/n8n-nodes-ceneo/jest.config.js` — copy from LinkerCloud pattern
- [ ] `packages/n8n-nodes-ceneo/tsconfig.json` — copy from LinkerCloud pattern

*Existing infrastructure covers shared test-utils.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Node visible in n8n UI | CENEO-08 | Requires running n8n instance | `npm link` + `npx n8n start`, search "Ceneo" in nodes panel |
| Real API token flow | CENEO-07 | Requires Ceneo partner account | Configure real API key, execute GetCategories |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
