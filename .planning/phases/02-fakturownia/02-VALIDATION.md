---
phase: 2
slug: fakturownia
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-21
---

# Phase 2 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x + nock |
| **Config file** | `packages/n8n-nodes-fakturownia/jest.config.js` |
| **Test directory** | `packages/n8n-nodes-fakturownia/__tests__/` |
| **Test match pattern** | `**/__tests__/**/*.test.ts` (from jest.config.base.js) |
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

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 02-01-T1 | 01 | 1 | FAKT-01 | compile | `tsc --noEmit` | Wave 0 |
| 02-01-T2 | 01 | 1 | FAKT-07, FAKT-08 | compile | `tsc --noEmit` | Wave 0 |
| 02-01-T3 | 01 | 1 | FAKT-01 | unit | `npm test -- --testNamePattern="Credentials"` | Wave 0 (creates stubs) |
| 02-02-T1 | 02 | 2 | FAKT-02, FAKT-09 | compile + jest | `tsc --noEmit && npm test` | uses Wave 0 stubs |
| 02-02-T2 | 02 | 2 | FAKT-03, FAKT-04 | compile + jest | `tsc --noEmit && npm test` | uses Wave 0 stubs |
| 02-03-T1 | 03 | 3 | FAKT-05, FAKT-06 | compile + jest | `tsc --noEmit && npm test` | uses Wave 0 stubs |
| 02-03-T2 | 03 | 3 | FAKT-05, FAKT-06 | compile + jest | `tsc --noEmit && npm test` | uses Wave 0 stubs |
| 02-04-T1 | 04 | 4 | FAKT-10 | unit + nock | `npm test` | replaces stubs with full tests |
| 02-04-T2 | 04 | 4 | FAKT-10 | build | `npm run build` | full build verification |
| 02-04-T3 | 04 | 4 | FAKT-10 | manual | N/A | human verification checkpoint |

*Status: Wave 0 = test stub exists, uses Wave 0 stubs = Wave 0 tests run alongside implementation*

---

## Wave 0 Requirements

- [x] `packages/n8n-nodes-fakturownia/jest.config.js` -- jest configuration (Plan 01, Task 1)
- [x] `packages/n8n-nodes-fakturownia/__tests__/Fakturownia.node.test.ts` -- credential tests + todo stubs (Plan 01, Task 3)
- [x] `packages/n8n-nodes-fakturownia/package.json` -- devDependencies: jest, @types/jest, nock, ts-jest (Plan 01, Task 1)

*Wave 0 installs test infrastructure in Plan 01 before any implementation code is written in Plans 02/03.*

---

## Nyquist Compliance

Plans 01 through 03 now include jest verification in their verify steps:
- Plan 01 Task 3: Creates Wave 0 test stub with 3 passing credential tests
- Plan 02 Tasks 1-2: Verify with `tsc --noEmit && npm test` (Wave 0 tests still pass)
- Plan 03 Tasks 1-2: Verify with `tsc --noEmit && npm test` (Wave 0 tests still pass)
- Plan 04 Task 1: Replaces stubs with comprehensive tests

No 3 consecutive tasks go without behavioral test verification.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SVG icon renders correctly at 60x60 | FAKT-10 | Visual verification required | Open SVG in browser, verify aspect ratio and rendering |
| Node visible in n8n UI after npm link | FAKT-10 | Requires running n8n instance | `npm run dev`, open http://localhost:5678, search "Fakturownia" |
| PDF opens as valid PDF | FAKT-04 | Binary content verification | Download PDF via node, open in PDF viewer |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
