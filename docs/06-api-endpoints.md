# 06 — API Endpoints

REST API served by the Express backend. All requests/responses are JSON
unless noted (OCR image upload is `multipart/form-data`; PDF generation
returns a binary stream). Base path: `/api`.

## Products

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/products` | Query params: `search`, `category`, `supplier_id`, `is_active`, `low_stock` (bool), `page`, `page_size` | `{ items: Product[], total, page, page_size }` |
| GET | `/products/:id` | — | `Product` |
| POST | `/products` | `{ sku, name, brand?, category, compatible_vehicles?, unit, cost_price, selling_price, reorder_threshold, supplier_id?, location_aisle?, location_shelf?, location_bin?, location_x?, location_y?, location_z?, notes? }` | `Product` (201) |
| PUT | `/products/:id` | Same shape as POST, partial allowed | `Product` |
| DELETE | `/products/:id` | Query param `hard=true` for hard delete attempt (default soft) | `204`, or `409` if hard delete blocked by existing history |
| POST | `/products/:id/reactivate` | — | `Product` — sets `is_active = true` |
| GET | `/products/locations` | Query params: `search?` (filter by SKU/name, for the 3D map's product picker) | `{ id, sku, name, location_aisle, location_shelf, location_bin, location_x, location_y, location_z }[]` — lightweight bulk list (only located, active products) for populating pins in the [3D navigation view](./07-3d-navigation.md) without fetching full product records |

`Product` shape includes all columns from
[05-database-schema.md#products](./05-database-schema.md#products),
including the read-only `stock_quantity` and the `location_*` fields.

## Inventory / Stock Movements

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/inventory/movements` | Query params: `product_id`, `reason`, `date_from`, `date_to`, `page`, `page_size` | `{ items: StockMovement[], total, page, page_size }` |
| POST | `/inventory/movements` | `{ product_id, quantity_change, reason: 'manual_adjustment' \| 'correction', note? }` | `StockMovement` (201) — used for manual adjustments only; other reasons are created internally by the OCR-confirm and order-fulfill endpoints below |
| GET | `/inventory/low-stock` | Query params: `category?` | `Product[]` — products where `stock_quantity <= reorder_threshold` |

## OCR

| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/ocr/receipts` | `multipart/form-data`: `image` file, `supplier_id?` | `OcrReceipt` (201, `status: 'pending_review'`) with `items: OcrReceiptItem[]` populated from OCR parsing |
| GET | `/ocr/receipts` | Query params: `status`, `page`, `page_size` | `{ items: OcrReceipt[], total, page, page_size }` |
| GET | `/ocr/receipts/:id` | — | `OcrReceipt` with `items: OcrReceiptItem[]` |
| PUT | `/ocr/receipts/:id/items` | `{ items: [{ id, matched_product_id?, parsed_name?, parsed_quantity?, parsed_price?, is_confirmed }] }` | Updated `OcrReceiptItem[]` — used while staff edits the review screen, before final confirm |
| POST | `/ocr/receipts/:id/confirm` | — | `OcrReceipt` (`status: 'confirmed'`) — commits one `stock_movements` row (`reason: 'ocr_restock'`) per confirmed item, in a transaction |
| POST | `/ocr/receipts/:id/reject` | — | `OcrReceipt` (`status: 'rejected'`) — no stock movements created |

## Orders (Purchase & Sale)

Both directions share one resource, distinguished by `type` (see
[04](./04-purchase-order-invoice.md)).

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/orders` | Query params: `type` (`purchase`\|`sale`), `status`, `page`, `page_size` | `{ items: PurchaseOrder[], total, page, page_size }` |
| GET | `/orders/:id` | — | `PurchaseOrder` with `items: PurchaseOrderItem[]` |
| POST | `/orders` | `{ type, supplier_id?, party_name?, party_contact?, order_date?, notes?, items: [{ product_id, quantity, unit_price }] }` | `PurchaseOrder` (201, `status: 'draft'`) |
| PUT | `/orders/:id` | Same shape as POST, partial allowed; only permitted while `status = 'draft'` | `PurchaseOrder` |
| POST | `/orders/:id/confirm` | — | `PurchaseOrder` (`status: 'confirmed'`) — locks items from further editing |
| POST | `/orders/:id/fulfill` | — | `PurchaseOrder` (`status: 'fulfilled'`) — creates one `stock_movements` row per item (`purchase_order_received` or `order_fulfillment` depending on `type`); for `type: 'sale'`, returns `409` with a list of insufficient-stock items if fulfillment would take any product negative |
| POST | `/orders/:id/cancel` | — | `PurchaseOrder` (`status: 'cancelled'`) — only from `draft` or `confirmed` |
| GET | `/orders/:id/pdf` | — | `application/pdf` binary stream of the generated document |

## Suppliers

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/suppliers` | Query params: `search`, `page`, `page_size` | `{ items: Supplier[], total, page, page_size }` |
| GET | `/suppliers/:id` | — | `Supplier` |
| POST | `/suppliers` | `{ name, contact_person?, phone?, email?, address?, notes? }` | `Supplier` (201) |
| PUT | `/suppliers/:id` | Partial | `Supplier` |
| DELETE | `/suppliers/:id` | — | `204`, or `409` if referenced by products/orders |

## Users

Minimal — for the staff-attribution picker, not an auth system (see
[05](./05-database-schema.md#assumptions--decisions-to-confirm)).

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/users` | — | `User[]` |
| POST | `/users` | `{ name, role }` | `User` (201) |
| PUT | `/users/:id` | Partial | `User` |

## Conventions

- All list endpoints are paginated (`page`, `page_size` query params;
  default `page_size` e.g. 25) and return `{ items, total, page, page_size }`.
- Validation errors return `400` with `{ error, fields?: { field: message } }`.
- Not-found returns `404` with `{ error }`.
- Conflict (duplicate SKU, blocked hard delete, insufficient stock on
  fulfillment) returns `409` with `{ error, details? }`.
- All mutating endpoints that touch `stock_quantity` do so inside a single
  database transaction that also writes the corresponding `stock_movements`
  row(s), per the rule in [02](./02-inventory-tracking.md#how-stock-changes-are-logged).
