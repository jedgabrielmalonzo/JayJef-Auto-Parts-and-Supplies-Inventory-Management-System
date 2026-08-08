# 05 — Database Schema

PostgreSQL. All primary keys are `SERIAL`/`BIGSERIAL` integers (simplest
option for a single local database with no distributed-ID requirement —
flagged as an assumption to confirm). All tables have `created_at`
(`timestamptz default now()`) unless noted; `updated_at` is included only on
tables that are actually edited after creation.

## `users`

Lightweight staff accounts — no passwords/auth, just enough to attribute
actions. See [assumptions](#assumptions--decisions-to-confirm).

| Column | Type | Constraints |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `name` | text | NOT NULL |
| `role` | text | NOT NULL, e.g. 'staff', 'manager' |
| `created_at` | timestamptz | NOT NULL, default now() |

## `suppliers`

| Column | Type | Constraints |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `name` | text | NOT NULL |
| `contact_person` | text | nullable |
| `phone` | text | nullable |
| `email` | text | nullable |
| `address` | text | nullable |
| `notes` | text | nullable |
| `created_at` | timestamptz | NOT NULL, default now() |

## `products`

| Column | Type | Constraints |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `sku` | text | NOT NULL, UNIQUE |
| `name` | text | NOT NULL |
| `brand` | text | nullable |
| `category` | text | NOT NULL, CHECK IN ('compressor','condenser','evaporator','expansion_valve','hose','seal_kit','refrigerant','dryer_accumulator','blower_motor','other') |
| `compatible_vehicles` | text | nullable |
| `unit` | text | NOT NULL, default 'pc' |
| `cost_price` | numeric(10,2) | NOT NULL, default 0, CHECK >= 0 |
| `selling_price` | numeric(10,2) | NOT NULL, default 0, CHECK >= 0 |
| `stock_quantity` | integer | NOT NULL, default 0, CHECK >= 0 — **only mutated via `stock_movements`, never updated directly** |
| `reorder_threshold` | integer | NOT NULL, default 0, CHECK >= 0 |
| `supplier_id` | BIGINT | FK → `suppliers.id`, nullable, ON DELETE SET NULL |
| `location_aisle` | text | nullable |
| `location_shelf` | text | nullable |
| `location_bin` | text | nullable |
| `location_x` | numeric(10,3) | nullable |
| `location_y` | numeric(10,3) | nullable |
| `location_z` | numeric(10,3) | nullable |
| `notes` | text | nullable |
| `is_active` | boolean | NOT NULL, default true |
| `created_at` | timestamptz | NOT NULL, default now() |
| `updated_at` | timestamptz | NOT NULL, default now() |

> Location columns live directly on `products` rather than a separate
> `locations` table — see
> [01-product-crud.md#location-field-structure](./01-product-crud.md#location-field-structure)
> for the reasoning. Used by the [3D navigation feature](./07-3d-navigation.md).

## `stock_movements`

Append-only log. Rows are never updated or deleted once written.

| Column | Type | Constraints |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `product_id` | BIGINT | FK → `products.id`, NOT NULL, ON DELETE RESTRICT |
| `user_id` | BIGINT | FK → `users.id`, nullable, ON DELETE SET NULL |
| `quantity_change` | integer | NOT NULL (signed: positive = in, negative = out) |
| `reason` | text | NOT NULL, CHECK IN ('initial_stock','manual_adjustment','ocr_restock','purchase_order_received','order_fulfillment','correction') |
| `reference_type` | text | nullable, CHECK IN ('purchase_order','ocr_receipt') — application-level pointer, see note below |
| `reference_id` | BIGINT | nullable — paired with `reference_type`; not a DB-level FK since it can point at different tables |
| `quantity_before` | integer | NOT NULL |
| `quantity_after` | integer | NOT NULL |
| `note` | text | nullable |
| `created_at` | timestamptz | NOT NULL, default now() |

> `ON DELETE RESTRICT` on `product_id` reinforces the soft-delete rule from
> [01](./01-product-crud.md#delete-strategy): a product with movement history
> can never be hard-deleted at the database level either.

> `reference_type`/`reference_id` is a polymorphic reference resolved in
> application code (look up `purchase_orders` or `ocr_receipts` depending on
> `reference_type`), since Postgres foreign keys can't point at "one of
> several tables." No DB-level referential integrity on this pair — it's
> for traceability/display, not correctness (correctness comes from the
> movement row itself being self-contained: quantity_change, before, after).

## `purchase_orders`

Represents both restock orders (→ supplier) and sales invoices (→ customer).

| Column | Type | Constraints |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `order_number` | text | NOT NULL, UNIQUE (e.g. 'PO-0001', 'INV-0001') |
| `type` | text | NOT NULL, CHECK IN ('purchase','sale') |
| `supplier_id` | BIGINT | FK → `suppliers.id`, nullable, ON DELETE SET NULL — used when `type = 'purchase'` |
| `party_name` | text | nullable — customer name when `type = 'sale'`, or free-text fallback for a purchase without a catalog supplier |
| `party_contact` | text | nullable |
| `status` | text | NOT NULL, default 'draft', CHECK IN ('draft','confirmed','fulfilled','cancelled') |
| `order_date` | date | NOT NULL, default current_date |
| `notes` | text | nullable |
| `subtotal` | numeric(10,2) | NOT NULL, default 0 |
| `total` | numeric(10,2) | NOT NULL, default 0 |
| `created_by` | BIGINT | FK → `users.id`, nullable, ON DELETE SET NULL |
| `created_at` | timestamptz | NOT NULL, default now() |
| `updated_at` | timestamptz | NOT NULL, default now() |

## `purchase_order_items`

| Column | Type | Constraints |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `purchase_order_id` | BIGINT | FK → `purchase_orders.id`, NOT NULL, ON DELETE CASCADE |
| `product_id` | BIGINT | FK → `products.id`, NOT NULL, ON DELETE RESTRICT |
| `quantity` | integer | NOT NULL, CHECK > 0 |
| `unit_price` | numeric(10,2) | NOT NULL, CHECK >= 0 |
| `line_total` | numeric(10,2) | NOT NULL, CHECK >= 0 (`quantity * unit_price`, computed at write time) |

## `ocr_receipts`

| Column | Type | Constraints |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `image_path` | text | NOT NULL — local filesystem path/reference |
| `raw_ocr_json` | jsonb | nullable — raw PaddleOCR output |
| `status` | text | NOT NULL, default 'pending_review', CHECK IN ('pending_review','confirmed','rejected') |
| `supplier_id` | BIGINT | FK → `suppliers.id`, nullable, ON DELETE SET NULL |
| `confirmed_by` | BIGINT | FK → `users.id`, nullable, ON DELETE SET NULL |
| `created_at` | timestamptz | NOT NULL, default now() |
| `confirmed_at` | timestamptz | nullable |

## `ocr_receipt_items`

| Column | Type | Constraints |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `ocr_receipt_id` | BIGINT | FK → `ocr_receipts.id`, NOT NULL, ON DELETE CASCADE |
| `raw_text` | text | nullable — original OCR-detected line text |
| `parsed_name` | text | nullable |
| `parsed_quantity` | integer | nullable |
| `parsed_price` | numeric(10,2) | nullable |
| `matched_product_id` | BIGINT | FK → `products.id`, nullable, ON DELETE SET NULL |
| `is_confirmed` | boolean | NOT NULL, default false |

## Entity Relationship Summary

```
suppliers ──┬──< products
            ├──< purchase_orders (type = purchase)
            └──< ocr_receipts

products ───┬──< stock_movements
            ├──< purchase_order_items
            └──< ocr_receipt_items (matched_product_id)

users ──────┬──< stock_movements (user_id)
            ├──< purchase_orders (created_by)
            └──< ocr_receipts (confirmed_by)

purchase_orders ──< purchase_order_items
ocr_receipts ──< ocr_receipt_items

stock_movements.reference_(type,id) --(app-level, not FK)--> purchase_orders | ocr_receipts
```

## Assumptions / Decisions to Confirm

- **Integer PKs (`SERIAL`), not UUIDs.** Simpler for a single local
  database with no sync/replication needs. Switch to UUIDs only if the
  system ever needs to merge data from multiple independent installs.
- **`users` has no real authentication.** It's an attribution list (a
  "who are you" picker), not a login system, since the app isn't
  internet-facing. If the shop later wants access control (e.g. only
  managers can hard-delete), that needs real auth added on top.
- **`compatible_vehicles` is free text**, not a normalized
  product↔make/model/year table. Faster to ship; revisit if "filter parts
  by exact vehicle" becomes a real, frequently-used feature.
- **Product location fields (`location_aisle/shelf/bin`, `location_x/y/z`)
  are plain columns, not a `locations` table**, and the 3D shop layout
  geometry itself (room/aisle/cabinet boxes) is **not stored in the database
  at all** — it's a static frontend config, since it's defined once and
  rarely changes. See [07-3d-navigation.md](./07-3d-navigation.md).
