---
phase: 1
slug: monorepo-bootstrap-smsapi-ceidg
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.base.js (root) + jest.config.js per package |
| **Quick run command** | `npm run test -- --testPathPattern=<changed-package>` |
| **Full suite command** | `npm run test` (root, runs all workspaces) |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --testPathPattern=<changed-package>`
- **After every plan wave:** Run `npm run test && npm run lint && npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01-monorepo-scaffold | 1 | INFRA-01 | build | `npm run build` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01-monorepo-scaffold | 1 | INFRA-02 | lint | `npm run lint` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02-shared-test-utils | 1 | INFRA-03 | unit | `npm run test -w shared` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03-ci-workflow | 1 | INFRA-04 | manual | verify CI runs on PR | ❌ W0 | ⬜ pending |
| 1-04-01 | 04-publish-workflow | 1 | INFRA-05 | manual | dry-run publish tag | ❌ W0 | ⬜ pending |
| 1-05-01 | 05-verify-packages | 1 | INFRA-06 | unit | `node scripts/verify-packages.js` | ❌ W0 | ⬜ pending |
| 1-06-01 | 06-ceidg-node | 2 | CEIDG-01 | unit | `npm run test -w n8n-nodes-ceidg` | ❌ W0 | ⬜ pending |
| 1-07-01 | 07-ceidg-tests | 2 | CEIDG-06 | unit | `npm run test -w n8n-nodes-ceidg` | ❌ W0 | ⬜ pending |
| 1-08-01 | 08-smsapi-node | 2 | SMSAPI-01 | unit | `npm run test -w n8n-nodes-smsapi` | ❌ W0 | ⬜ pending |
| 1-09-01 | 09-smsapi-tests | 2 | SMSAPI-10 | unit | `npm run test -w n8n-nodes-smsapi` | ❌ W0 | ⬜ pending |
| 1-10-01 | 10-pipeline-validation | 3 | INFRA-07 | manual | npm link + n8n node picker | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/n8n-nodes-ceidg/jest.config.js` — jest config per package
- [ ] `packages/n8n-nodes-smsapi/jest.config.js` — jest config per package
- [ ] `shared/test-utils/src/index.ts` — mock IExecuteFunctions stubs
- [ ] `jest.config.base.js` — root shared jest config
- [ ] Install jest + nock + ts-jest as devDependencies in root workspace

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CEIDG node appears in n8n node picker | CEIDG-01 | Requires running n8n instance | `npm link` + start n8n, search "CEIDG" in editor |
| SMSAPI node appears in n8n node picker | SMSAPI-01 | Requires running n8n instance | `npm link` + start n8n, search "SMSAPI" in editor |
| Publish with provenance badge on npmjs.com | INFRA-07 | Requires real npm publish | Push tag, check npmjs.com package page for provenance |
| SMS test mode returns valid JSON | SMSAPI-11 | Requires SMSAPI test account | Execute SMSAPI node in n8n with `test=1` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
