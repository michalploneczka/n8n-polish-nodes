---
phase: 12-linker-cloud
plan: 05
subsystem: api
tags: [linkercloud, inbound-order, order-return, order-lifecycle, fulfillment]
dependency_graph:
  requires: [12-02, 12-03, 12-04]
  provides: [inbound-order-resource, order-return-resource, tier3-order-ops]
  affects: [LinkerCloud.node.ts, resources/order.ts]
tech_stack:
  added: []
  patterns: [resource-split, json-string-parsing, flexible-identifier-pattern]
key_files:
  created:
    - packages/n8n-nodes-linkercloud/nodes/LinkerCloud/resources/inboundOrder.ts
    - packages/n8n-nodes-linkercloud/nodes/LinkerCloud/resources/orderReturn.ts
  modified:
    - packages/n8n-nodes-linkercloud/nodes/LinkerCloud/resources/order.ts
    - packages/n8n-nodes-linkercloud/nodes/LinkerCloud/LinkerCloud.node.ts
decisions:
  - "Confirm operation uses full SupplierOrderType body per Swagger spec (not batch confirm by IDs)"
  - "Payment status uses flexible identifier type (id/externalId/clientOrderNumber) for order matching"
  - "paymentTransactionIdForPayment field name avoids collision with existing create field"
metrics:
  duration: 4min
  completed: "2026-03-21T21:57:27Z"
  tasks: 3
  files: 4
---

# Phase 12 Plan 05: Inbound Order, Order Return, and Tier 3 Order Operations Summary

Inbound Order (supplier orders) and Order Return resources plus 4 Tier 3 order operations (tracking number, payment status, state transitions) completing full 6-resource API coverage with 28 operation handlers total.

## What Was Done

### Task 1: Inbound Order and Order Return resource files
- Created `inboundOrder.ts` with 5 operations (Confirm, Create, Get, List, Update)
- 7 required fields for create (orderDate, executionDate, priceGross, priceNet, supplier, supplierObject, items)
- Confirm operation uses full SupplierOrderType body per Swagger spec
- Created `orderReturn.ts` with 4 operations (Accept, Create, Get, List)
- Order Return create requires orderNumber and items; accept uses POST /orderreturns/{id}/accept
- **Commit:** 7c621f2

### Task 2: Wire Inbound Order and Order Return into node
- Imported and registered both resource operations/fields in LinkerCloud.node.ts
- Added full execute handlers for all 9 inbound order + order return operations
- JSON string fields (supplierObject, items, customProperties) parsed with proper error handling
- **Commit:** 2f96904

### Task 3: Tier 3 Order operations
- Added 4 new operations to Order resource: getTransitions, applyTransition, updateTrackingNumber, updatePaymentStatus
- Extended orderId displayOptions to include all 4 new operations
- updateTrackingNumber sends `{ tracking_number, operator, url? }` to PUT /orders/{id}/trackingnumber
- updatePaymentStatus builds PaymentItemRequest with flexible identifier (id/externalId/clientOrderNumber) and sends to PUT /payment-status with `{ items: [...] }` wrapper
- Order resource now has 9 total operations (5 core + 4 tier 3)
- **Commit:** da4e81e

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Force-add resource files past .gitignore**
- **Found during:** Task 1
- **Issue:** Root .gitignore excludes `resources/` globally, blocking git add
- **Fix:** Used `git add -f` (known pattern from Phase 02 and 12-02)
- **Files modified:** inboundOrder.ts, orderReturn.ts

**2. [Rule 1 - Bug] Renamed paymentTransactionId field for updatePaymentStatus**
- **Found during:** Task 3
- **Issue:** Order create already has a field named `paymentTransactionId`, which would cause n8n field name collision
- **Fix:** Named the payment status version `paymentTransactionIdForPayment` and referenced it correctly in execute handler
- **Files modified:** order.ts, LinkerCloud.node.ts

## Decisions Made

1. **Confirm uses SupplierOrderType body** -- Swagger spec shows POST /supplierorders/confirms takes the full order schema, not a batch confirm by IDs. The node mirrors this accurately.
2. **Flexible order identifier for payment status** -- The PUT /payment-status endpoint accepts id, externalId, or clientOrderNumber. Added orderIdentifier selector to let users choose which identifier to use.
3. **paymentTransactionIdForPayment field name** -- Avoids collision with existing paymentTransactionId field used in Order create operation.

## Known Stubs

None -- all operations are fully wired with correct API endpoints and field mappings.

## Verification

- `npx tsc --noEmit` passes clean
- All 6 resource handlers present in execute() (order, product, stock, shipment, inboundOrder, orderReturn)
- Order resource has 9 total operations
- 28 total operation handlers across all resources

## Self-Check: PASSED

All 4 created/modified files verified present on disk. All 3 task commits (7c621f2, 2f96904, da4e81e) verified in git log.
