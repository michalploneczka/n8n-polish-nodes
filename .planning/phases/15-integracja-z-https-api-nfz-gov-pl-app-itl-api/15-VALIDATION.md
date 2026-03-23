---
phase: 15
slug: integracja-z-https-api-nfz-gov-pl-app-itl-api
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | packages/n8n-nodes-nfz/jest.config.js |
| **Quick run command** | `cd packages/n8n-nodes-nfz && npm test` |
| **Full suite command** | `npm run test --workspace=packages/n8n-nodes-nfz` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd packages/n8n-nodes-nfz && npm test`
- **After every plan wave:** Run `npm run test --workspace=packages/n8n-nodes-nfz`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | NFZ-01 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 15-02-01 | 02 | 1 | NFZ-02 | unit+integration | `npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/n8n-nodes-nfz/test/Nfz.node.test.ts` — nock-based tests for all operations
- [ ] `packages/n8n-nodes-nfz/jest.config.js` — jest configuration
- [ ] Test infrastructure from shared monorepo utilities

*Existing test infrastructure (jest, nock, shared mock helpers) covers framework requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Node appears in n8n picker | NFZ-XX | Requires running n8n instance | `npm link` + open n8n, search "NFZ" |
| WAF compatibility | NFZ-XX | Requires live API call | Test against https://api.nfz.gov.pl with real n8n httpRequest |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
