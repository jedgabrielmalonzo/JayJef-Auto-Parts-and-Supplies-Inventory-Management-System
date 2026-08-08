# 04 — Purchase Order / Invoice Generation

## Feature

Create a printable order document by selecting products and quantities, then
generating a PDF. This single feature covers **two directions**, both using
the same underlying model (`purchase_orders`), distinguished by a `type`
field:

| Type | Direction | Counterparty | Stock effect on fulfillment |
|---|---|---|---|
| `purchase` | Shop → Supplier | Supplier (`supplier_id`, or free-text if not in the `suppliers` table) | Stock **increases** (restock) |
| `sale` | Shop → Customer | Customer (free-text name/contact) | Stock **decreases** (sold out) |

Using one model instead of two separate features avoids duplicating the
"select products, set quantities, preview, generate PDF" flow — the only
real difference is who the document is addressed to and which way stock
moves when it's fulfilled.

## Invoice Fields

| Section | Fields |
|---|---|
| Shop info | Shop name, address, contact — static/config values, not entered per-document. |
| Document meta | `order_number` (human-readable, e.g. `PO-0001` / `INV-0001`), `type` (purchase/sale), `order_date`, `status`. |
| Counterparty | If `type = purchase`: supplier name/contact (from `suppliers` table, or free text). If `type = sale`: customer name/contact (free text). |
| Line items | Product name/SKU, quantity, unit price, line total — one row per `purchase_order_items` record. |
| Totals | Subtotal, (tax if applicable — not in MVP scope unless required), total. |
| Notes | Optional free text (e.g. delivery instructions, payment terms). |

## Flow

1. **Select products** — staff searches/picks products from the active
   catalog (same product picker used elsewhere in the app).
2. **Input quantities** (and unit price, pre-filled from `cost_price` for
   purchases or `selling_price` for sales, but editable per line — prices
   can vary by negotiation).
3. **Preview** — a rendered view of the document exactly as it will print,
   so mistakes are caught before generating a PDF.
4. **Generate PDF** — server renders the final document to PDF (see
   [PDF Generation Approach](#pdf-generation-approach)).
5. **Print** — staff prints directly from the browser's PDF viewer, or
   saves the file.

Orders start as `draft` (editable freely), move to `confirmed` once
finalized, and to `fulfilled` once the goods have actually moved (which is
the point stock movements are created — see below). `cancelled` is available
from `draft` or `confirmed`.

## Stock Effect on Fulfillment

- Marking a `purchase` order **fulfilled** creates one `purchase_order_received`
  stock movement per line item (positive quantity change) — see
  [02](./02-inventory-tracking.md).
- Marking a `sale` order **fulfilled** creates one `order_fulfillment`
  stock movement per line item (negative quantity change). Before allowing
  this, the backend checks each line item's quantity against current
  `stock_quantity` and rejects fulfillment (with a clear error listing which
  items are short) if there isn't enough stock — consistent with the
  "stock can never go negative" rule from [01](./01-product-crud.md#edge-cases).
- Movements created this way store a reference back to the `purchase_orders`
  row they came from, so a movement can always be traced to the order that
  caused it.

## PDF Generation Approach

Two viable options, either is reasonable to start with — decide at
implementation time based on how the preview is built:

- **Puppeteer**: render the same HTML/CSS used for the on-screen preview,
  then print that page to PDF. Pro: preview and PDF are guaranteed to look
  identical, easiest to style with Tailwind. Con: heavier dependency
  (headless Chromium).
- **pdf-lib**: build the PDF programmatically (draw text/lines/boxes
  directly). Pro: lightweight, no browser dependency. Con: layout code is
  more manual and can drift from the on-screen preview if not careful.

Given the preview step in the flow above, **Puppeteer is the more natural
fit** (reuse the preview markup as the PDF source), but this is noted as an
implementation-time decision, not a hard requirement.
