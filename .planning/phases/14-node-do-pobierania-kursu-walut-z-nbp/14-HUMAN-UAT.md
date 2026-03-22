---
status: partial
phase: 14-node-do-pobierania-kursu-walut-z-nbp
source: [14-VERIFICATION.md]
started: 2026-03-22T15:00:00Z
updated: 2026-03-22T15:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. No-credential UI rendering
expected: Node opens with only Resource and Operation selectors, no credential configuration step. No "Credentials" field or authentication step appears.
result: [pending]

### 2. Live NBP API connectivity
expected: Execute "Get Current Rate" operation with Table=A, Currency Code=EUR against live api.nbp.pl. Returns JSON with table, currency, code, and rates array containing mid rate.
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
