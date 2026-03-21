---
status: partial
phase: 02-fakturownia
source: [02-VERIFICATION.md]
started: 2026-03-21T00:00:00Z
updated: 2026-03-21T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Node picker appearance
expected: Run `npx n8n start` with the package linked and confirm Fakturownia node appears with all 3 resources (Invoices, Clients, Products) in the n8n UI. PDF download should output binary data.
result: [pending]

### 2. Live API connectivity
expected: Configure a real Fakturownia trial account credentials and execute List Invoices. Confirm pagination works, real data is returned, and error messages are readable in n8n UI.
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
