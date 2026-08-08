# 02 — Inventory Tracking (Stock Movements)

## Feature

Every change to a product's stock quantity is recorded as an immutable
**stock movement** — an append-only log, separate from the product table.
The product's `stock_quantity` field is just a cached sum of its movements;
the movement log is the source of truth and the audit trail.

This separation matters because a shop needs to answer "why did this
product's count change?" months later — a single overwritten number can't
answer that, but a log can.

## Sources of Movement

| Source (`reason`) | Direction | Triggered by |
|---|---|---|
| `initial_stock` | + | Setting a starting quantity when a product is first created. |
| `manual_adjustment` | + or − | Staff manually correcting a count (e.g. after a physical stock count, or fixing a mistake). |
| `ocr_restock` | + | A confirmed OCR-scanned supplier receipt (see [03](./03-ocr-receipt-capture.md)). |
| `purchase_order_received` | + | Marking a purchase order (restock from supplier) as fulfilled/received (see [04](./04-purchase-order-invoice.md)). |
| `order_fulfillment` | − | Marking a sales order/invoice as fulfilled (parts leaving the shop). |
| `correction` | + or − | Reversing/fixing a previous erroneous movement, kept distinct from `manual_adjustment` so corrections are traceable. |

## How Stock Changes Are Logged

1. Any action that changes stock (manual entry, OCR confirmation, order
   fulfillment) goes through **one shared code path**: "create a stock
   movement for product X with quantity change Y and reason Z."
2. That code path, and only that code path, is allowed to update
   `products.stock_quantity`. It does so inside the same database
   transaction as inserting the movement row, so the log and the cached
   total can never drift apart.
3. Before applying a negative (outgoing) change, the code checks that
   `stock_quantity + quantity_change >= 0`. If not, the movement is
   rejected with an error (see [Edge Cases in 01](./01-product-crud.md#edge-cases)).
4. The movement row also stores `quantity_before` and `quantity_after` as a
   point-in-time snapshot, so historical reports don't need to replay the
   whole log to know what the stock level was at any given moment.

## Movement Record (Conceptual)

| Field | Purpose |
|---|---|
| Product | Which product changed. |
| Staff member | Who performed the action (nullable if unattended/system-generated). |
| Quantity change | Signed integer — positive for stock in, negative for stock out. |
| Reason/source | One of the values in the table above. |
| Reference | Optional pointer back to the originating purchase order or OCR receipt, so a movement can be traced to the document that caused it. |
| Quantity before / after | Snapshot of `stock_quantity` immediately before and after this movement. |
| Note | Optional free-text context (e.g. "shelf recount", "damaged in transit"). |
| Timestamp | When the movement happened. |

Full column types and constraints are defined in
[05-database-schema.md](./05-database-schema.md#stock_movements).

## Low-Stock Alerts / Reorder Logic

Low-stock status is **computed on read, not stored**:

```
is_low_stock = stock_quantity <= reorder_threshold
```

There is no separate "alerts" table. A low-stock list/dashboard is just a
query (`WHERE stock_quantity <= reorder_threshold AND is_active = true`).
Keeping this as a computed value — rather than a flag that gets set and
cleared — avoids a second source of truth that could fall out of sync with
the real stock count.

Where this shows up:
- A dashboard widget/list of currently low-stock products.
- Optionally, a warning badge on the product list/detail view.
- Reorder-threshold breaches don't block any action (staff can still sell
  down to 0) — they're informational, prompting a restock via a purchase
  order or OCR receipt capture.
