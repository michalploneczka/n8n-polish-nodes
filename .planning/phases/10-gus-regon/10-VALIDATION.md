---
phase: 10
slug: gus-regon
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-22
---

# Phase 10 -- Validation Strategy

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

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Rationale | Status |
|---------|------|------|-------------|-----------|-------------------|-----------|--------|
| 10-01-01 | 01 | 1 | REGON-01, REGON-08 | compile | `npx tsc --noEmit --project packages/n8n-nodes-gus-regon/tsconfig.json` | TypeScript compilation validates package scaffold and credential types. Full unit tests arrive in Wave 3 (Plan 03). | pending |
| 10-01-02 | 01 | 1 | REGON-02, REGON-03 | compile | `npx tsc --noEmit --project packages/n8n-nodes-gus-regon/tsconfig.json` | TypeScript compilation validates SOAP templates, XML parser, and GenericFunctions. These are infrastructure modules -- their correctness is verified end-to-end by XmlParser.test.ts and GusRegon.node.test.ts in Wave 3. | pending |
| 10-02-01 | 02 | 2 | REGON-04, REGON-05, REGON-06, REGON-07 | compile | `npx tsc --noEmit --project packages/n8n-nodes-gus-regon/tsconfig.json` | TypeScript compilation validates company resource and node class. Full integration tests arrive in Wave 3. | pending |
| 10-02-02 | 02 | 2 | REGON-08 | compile | `npx tsc --noEmit --project packages/n8n-nodes-gus-regon/tsconfig.json` | Verifies programmatic execute() method compiles with all imports. | pending |
| 10-03-01 | 03 | 3 | REGON-03, REGON-07 | unit | `npx jest --testPathPattern XmlParser.test.ts --no-coverage` | XmlParser unit tests verify double-decode pipeline with SOAP XML fixtures. | pending |
| 10-03-02 | 03 | 3 | REGON-01 through REGON-09 | unit+build+lint | `npx jest --no-coverage && npm run build && npm run lint` | Full integration tests (nock-based), build, and lint. Covers all requirements end-to-end. | pending |

*Status: pending / green / red / flaky*

---

## Wave Feedback Rationale

**Waves 1-2 (Plans 01, 02):** These plans create infrastructure (SOAP templates, XML parser, GenericFunctions) and the node class. TypeScript compilation (`tsc --noEmit`) serves as the fast feedback mechanism for these waves:
- Catches type mismatches between SoapTemplates/XmlParser/GenericFunctions interfaces
- Validates imports and exports across modules
- Runs in <5 seconds
- Sufficient for infrastructure code where the shape matters more than runtime behavior

**Wave 3 (Plan 03):** Creates the full test suite (XmlParser.test.ts + GusRegon.node.test.ts) with SOAP XML fixtures. This is where runtime behavior is verified:
- XmlParser unit tests validate the double-decode pipeline with real SOAP response structures
- Node integration tests verify all 4 operations end-to-end using nock for HTTP contract verification
- Build and lint gates confirm publish-readiness

This wave structure means Wave 1-2 code gets its behavioral verification in Wave 3. This is an accepted pattern for this phase because:
1. The SOAP infrastructure is tightly coupled -- testing individual pieces in isolation would require duplicate fixtures
2. TypeScript's strict mode catches the most common errors (wrong types, missing imports) at compile time
3. The total phase is only 3 plans, so Wave 3 tests arrive quickly

---

## Wave 0 Requirements

Wave 0 test scaffolds are NOT required for this phase. Rationale:

- **Plans 01-02 (Waves 1-2)** use `tsc --noEmit` as their feedback mechanism. TypeScript compilation provides fast, deterministic validation that infrastructure modules have correct types, exports, and imports. This is sufficient for SOAP template functions and XML parsers where the contract (input types -> output types) matters more than runtime behavior at this stage.
- **Plan 03 (Wave 3)** creates the actual test files (`XmlParser.test.ts`, `GusRegon.node.test.ts`) and SOAP XML fixtures. These tests then retroactively validate all Wave 1-2 infrastructure.
- The `jest.config.js` is created in Plan 01 Task 1, so the test framework is available from Wave 1 onward.

*Existing monorepo jest patterns from other packages can be replicated.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Polish characters display correctly in n8n UI | REGON-07 | Requires visual inspection in n8n | Search for a company with Polish chars, verify output in n8n |
| Session transparency | REGON-04 | UX verification | Run search operation, confirm no login/logout fields visible to user |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands (tsc for Waves 1-2, jest for Wave 3)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 gap addressed (tsc as Wave 1-2 feedback, full tests in Wave 3)
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
