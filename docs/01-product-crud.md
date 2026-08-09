# 01 — Product CRUD (Aircon Parts Inventory)

## Feature

The core of the system: create, read, update, and delete records for the car
aircon parts the shop stocks (compressors, condensers, evaporators, hoses,
seals, refrigerant, etc.), including the current on-hand quantity.

## Product Fields

| Field | Type | Purpose |
|---|---|---|
| `id` | integer (PK) | Internal unique identifier. |
| `sku` | text, unique, required | Shop's own stock-keeping code. Used for fast lookup, labeling, and scanning. Must be unique — this is the primary way staff identify a part. |
| `name` | text, required | Human-readable part name, e.g. "AC Compressor". |
| `brand` | text | Manufacturer/brand of the part (e.g. Denso, Sanden, Valeo). Aircon parts vary a lot in quality/fit by brand, so this matters for both search and customer trust. |
| `category` | text (enum-like) | One of: compressor, condenser, evaporator, expansion_valve, hose, seal_kit, refrigerant, dryer_accumulator, blower_motor, other. Drives filtering/reporting. |
| `compatible_vehicles` | text (free-form) | e.g. "Toyota Vios 2013–2018, Honda City 2014–2020". A part's fitment is the #1 question customers ask, so this needs to be visible and searchable even in a simple form. *(MVP: free text — see assumptions.)* |
| `unit` | text | How the part is counted/sold: pc, set, box, liter, kg. Needed because refrigerant is sold by weight/volume, not piece count. |
| `cost_price` | numeric(10,2) | What the shop pays the supplier. Used for margin calculations and purchase order totals. |
| `selling_price` | numeric(10,2) | What the shop charges. Used on sales invoices. |
| `stock_quantity` | integer | Current on-hand count. **Denormalized** — always derived from the sum of `stock_movements` for this product, never edited directly (see [02](./02-inventory-tracking.md)). |
| `reorder_threshold` | integer | Minimum quantity before the product is flagged "low stock" and should be reordered. |
| `supplier_id` | integer (FK, nullable) | Default/primary supplier for this part. Nullable because not every part needs a fixed supplier. |
| `location_aisle` | text, nullable | Human-readable aisle label (e.g. "A2"). Shown to staff as text, and doubles as the search/filter key for "where is this part." |
| `location_shelf` | text, nullable | Shelf/cabinet label within the aisle (e.g. "S3"). |
| `location_bin` | text, nullable | Bin/slot label within the shelf, if the shop subdivides shelves that far (e.g. "B2"). |
| `image_path` | text, nullable | Local filesystem path to a product photo (e.g. `/uploads/products/product-...jpg`), shown in the catalog's card view and product detail. Same storage pattern as `ocr_receipts.image_path` — a static-served file path, not a binary blob in Postgres. Optional; products without a photo show a placeholder. |
| `notes` | text | Free-form notes (e.g. "check compressor clutch type before selling"). |
| `is_active` | boolean, default true | Soft-delete flag — see [Delete Strategy](#delete-strategy). |
| `created_at` | timestamp | Record creation time. |
| `updated_at` | timestamp | Last edit time. |

### Location Field Structure

Each product optionally stores where it physically sits in the shop, used by
the [shop map feature](./07-3d-navigation.md) to point staff to it:

- **`location_aisle` / `location_shelf` / `location_bin`** — human-readable
  codes, the same labels staff would use verbally ("aisle 2, shelf 3"). These
  are what's shown in the UI and what a staff member types when assigning a
  location.
- These are plain nullable columns directly on `products` (not a separate
  `locations` table) — a shop's shelf layout is small and mostly static, so
  a join adds indirection without real benefit.
- The product itself doesn't store map coordinates — `location_aisle` is
  matched against the `shop_layout_cabinets` table's own `location_aisle`
  column to find where that aisle sits on the map (see
  [05-database-schema.md#shop_layout_cabinets](./05-database-schema.md#shop_layout_cabinets)).
  A shop's shelf positions are edited once (by dragging on the map, see 07),
  and every product assigned to that aisle reuses the same on-map position —
  a shelf isn't going to have sub-cabinet precision per product.
- A product with no `location_aisle` set, or one that doesn't match any
  cabinet on the map, simply isn't highlighted — this is expected for
  new/unsorted stock, not an error state.

## User Flows

### Add a new product
1. Staff opens "Add Product" form.
2. Fills in fields above (SKU, name, category required at minimum; other
   fields optional but encouraged).
3. On submit, backend validates SKU uniqueness and required fields.
4. Product is created with `stock_quantity = 0` by default. If the staff
   enters an initial count, an `initial_stock` movement is created
   immediately after (see [02](./02-inventory-tracking.md)) — the product
   record itself is never created with a nonzero stock number directly.

### Edit a product
1. Staff opens an existing product and changes any field **except**
   `stock_quantity` (which is read-only in this form — stock changes only
   happen through movements).
2. SKU can be edited but must remain unique.
3. `updated_at` is refreshed on save.

### Delete a product

#### Delete strategy
**Soft delete is the default and recommended path.** Setting
`is_active = false` hides the product from normal product lists and "add to
order" pickers, but keeps the row (and its history) intact.

Hard delete (actually removing the row) is only permitted when the product
has **zero** related `stock_movements` and zero `purchase_order_items` —
i.e. it was created by mistake and never actually used. This is enforced at
the API layer, not left to the UI to decide.

| Scenario | Allowed action |
|---|---|
| Product has no movement/order history | Soft or hard delete |
| Product has movement/order history | Soft delete only |
| Product is `is_active = false` already | Can be reactivated (`is_active = true`) |

### Search / filter products
Supported filters: text search (matches SKU, name, brand), category,
supplier, active/inactive, low-stock only (`stock_quantity <= reorder_threshold`).
Results should be paginated once the catalog grows.

## Edge Cases

| Case | Handling |
|---|---|
| Duplicate SKU | Database unique constraint on `sku`; API returns a clear 409-style error so the UI can prompt "SKU already exists." |
| Negative stock | `stock_quantity` must never go below 0. This is enforced when a stock movement is created (reject an outgoing movement that would push quantity negative), not by validating the product row directly. |
| Deleting a product referenced in past orders/movements | Hard delete is blocked (see table above); soft delete instead, so historical purchase orders and movement logs still resolve to a real (if inactive) product record. |
| Reactivating a soft-deleted product that has a since-taken SKU | Not possible if another active product now has that SKU — reactivation must go through the same uniqueness check as create/edit. |
