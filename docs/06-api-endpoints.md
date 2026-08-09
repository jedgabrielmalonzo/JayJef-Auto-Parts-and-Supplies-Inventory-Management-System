# 06 — API Endpoints

REST API served by the Express backend. All requests/responses are JSON
unless noted (OCR image upload is `multipart/form-data`; PDF generation
returns a binary stream). Base path: `/api`.

## Products

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/products` | Query params: `search` (matches SKU/name/brand/compatible_vehicles), `category`, `supplier_id`, `is_active`, `low_stock` (bool), `page`, `page_size` | `{ items: Product[], total, page, page_size }` |
| GET | `/products/:id` | — | `Product` |
| POST | `/products` | `multipart/form-data`: `{ sku, name, brand?, category, compatible_vehicles?, unit, cost_price, selling_price, reorder_threshold, supplier_id?, location_aisle?, location_shelf?, location_bin?, notes?, image? }` — `image` is an optional file field (same upload pattern as OCR receipts, see [03](./03-ocr-receipt-capture.md)); plain JSON without a file also still works | `Product` (201) |
| PUT | `/products/:id` | Same shape as POST (multipart or JSON), partial allowed | `Product` |
| DELETE | `/products/:id` | Query param `hard=true` for hard delete attempt (default soft) | `204`, or `409` if hard delete blocked by existing history |
| POST | `/products/:id/reactivate` | — | `Product` — sets `is_active = true` |
| GET | `/products/locations` | Query params: `search?` (filter by SKU/name, for the shop map's product picker) | `{ id, sku, name, location_aisle, location_shelf, location_bin }[]` — lightweight bulk list (only products with `location_aisle` set, active only) for the [shop map](./07-3d-navigation.md) to match against `shop_layout_cabinets` without fetching full product records |
| GET | `/products/:id/purchases` | — | `{ order_id, order_number, type, status, order_date, quantity, unit_price, line_total, supplier_name, party_name }[]` — every purchase/sale order line that includes this product, for the product detail page's Purchases tab |

`Product` shape includes all columns from
[05-database-schema.md#products](./05-database-schema.md#products),
including the read-only `stock_quantity` and the `location_*` fields.

## Shop Layout

The [shop map's](./07-3d-navigation.md) cabinet geometry — edited by staff
directly through the app (drag-and-drop), not by a developer, so unlike most
resources here there's no soft-delete or history protection.

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/shop-layout` | — | `ShopLayoutCabinet[]` — full list, no pagination (a shop floor has a handful of cabinets, not thousands) |
| POST | `/shop-layout` | `{ location_aisle, label, x, y, width?, height?, color? }` | `ShopLayoutCabinet` (201) |
| PUT | `/shop-layout/:id` | Partial | `ShopLayoutCabinet` — used both for drag-to-reposition (`{ x, y }`) and editing details (label/aisle/size/color) |
| DELETE | `/shop-layout/:id` | — | `204` |

`ShopLayoutCabinet` shape includes all columns from
[05-database-schema.md#shop_layout_cabinets](./05-database-schema.md#shop_layout_cabinets).

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

## Dashboard

Read-only aggregation endpoints backing the Dashboard landing page. All
numbers are computed live from `purchase_orders`/`purchase_order_items`/
`products`/`suppliers`/`stock_movements` — nothing is pre-aggregated or
cached. "Profit" is a simple period P&L (fulfilled sale revenue minus
fulfilled purchase cost), not full COGS accounting.

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/dashboard/overview` | — | `{ sales: {count,revenue,profit,cost}, inventory: {quantityInHand,toBeReceived}, purchases: {count,cost,cancelled}, products: {supplierCount,categoryCount} }` |
| GET | `/dashboard/sales-purchase-chart` | Query params: `period?` (`week` default \| `month`) | `{ label, purchase, sales }[]` — order totals bucketed by period, last 8 weeks or 6 months |
| GET | `/dashboard/order-summary-chart` | — | `{ label, ordered, delivered }[]` — order counts by month, created vs. fulfilled |
| GET | `/dashboard/top-selling` | — | `{ id, sku, name, stock_quantity, selling_price, sold_quantity }[]` — top 5 products by fulfilled sale quantity |

## Reports

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/reports/overview` | — | `{ totalProfit, revenue, sales, netPurchaseValue, netSalesValue, momProfitPct, yoyProfitPct }` — `momProfitPct`/`yoyProfitPct` compare this month's profit to last month's / this month last year's |
| GET | `/reports/best-selling-categories` | — | `{ category, turnover, increaseByPct }[]` — this month's fulfilled-sale revenue per category vs. last month |
| GET | `/reports/profit-revenue-chart` | — | `{ label, revenue, profit }[]` — monthly, last 6 months |
| GET | `/reports/best-selling-products` | — | `{ id, sku, name, category, remainingQuantity, turnover, increaseByPct }[]` |

## Shop Settings

Single-row resource (see
[05-database-schema.md#shop_settings](./05-database-schema.md#shop_settings))
backing the Manage Store page — no create/delete, just read and update the
one row.

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/shop-settings` | — | `{ id, name, address, phone, updated_at }` |
| PUT | `/shop-settings` | `{ name?, address?, phone? }`, partial | Updated settings row |

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
