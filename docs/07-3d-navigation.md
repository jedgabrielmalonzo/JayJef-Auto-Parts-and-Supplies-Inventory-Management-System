# 07 — Shop Map

## Feature

A simple top-down map of the shop that helps staff physically locate a
product on a wide or complex shop floor. This is a **visual lookup tool, not
a simulation** — it answers "where do I walk to find this part," nothing
more.

Unlike almost every other feature in this app, the map's own layout is
**edited by shop staff directly through the app** — dragging cabinets into
place — not by a developer. Nobody outside the shop knows the real floor
plan, so it can't be a fixed config a developer hand-authors.

## Visual Style: Simple, Not Photorealistic

The map is a flat 2D top-down view — plain colored rectangles for cabinets,
labeled, on a light grid background. No textures, no perspective, no
lighting effort beyond making shapes readable and distinguishable
(color-coded per cabinet). This keeps it cheap to build, cheap to render on
modest shop hardware, and — the whole point of this feature — trivial for a
non-developer to rearrange when the shop actually rearranges a shelf.

## Data Model

The map's geometry lives in the `shop_layout_cabinets` table (see
[05-database-schema.md#shop_layout_cabinets](./05-database-schema.md#shop_layout_cabinets)),
**not** a static frontend file — a deliberate reversal of the usual "static
config, developer edits it" pattern used elsewhere (e.g. the product
category list), because this specific piece of data is something only shop
staff know and need to change themselves.

Each cabinet row has a `location_aisle` code, matched against the same
`location_aisle` code stored on products (see
[01-product-crud.md#location-field-structure](./01-product-crud.md#location-field-structure)),
so the frontend can map "product's stored aisle" → "which cabinet to
highlight" with a simple lookup, no join needed (both come from separate
API calls, matched client-side).

## Flow

### Viewing (default mode)

1. Staff opens the Shop Map and searches for a product (reusing the same
   product search used elsewhere in the app).
2. Frontend fetches matching products' locations via
   `GET /products/locations` (see
   [06-api-endpoints.md](./06-api-endpoints.md#products)) and the full
   cabinet list via `GET /shop-layout`.
3. Selecting a product looks up the cabinet whose `location_aisle` matches
   the product's — if found, that cabinet is highlighted (red, the map's
   single reserved "you're looking for this one" signal) and an info card
   shows the product's SKU/name/aisle-shelf-bin.
4. If the product has no `location_aisle` set, or it doesn't match any
   cabinet currently on the map, a plain "not on the map yet" message shows
   instead — expected for new/unsorted stock or an out-of-date layout, not
   an error state.

### Editing the layout

1. Staff toggles "Edit Layout". Cabinets become draggable; an "Add Cabinet"
   button appears.
2. **Reposition**: drag a cabinet anywhere on the canvas. Position saves on
   release (`PUT /shop-layout/:id` with the new `x`/`y`) — no separate
   "Save" step, matching how the rest of the app gives immediate feedback
   rather than batching changes.
3. **Add**: opens a small form (label, aisle code, size, color) →
   `POST /shop-layout`. The aisle code must be unique — attempting to reuse
   one already on the map returns a field-level error, same convention as
   duplicate SKUs on products.
4. **Edit details**: the same form, prefilled, for changing a cabinet's
   label/aisle/size/color without moving it.
5. **Delete**: behind a confirmation dialog (same pattern as deleting a
   product or supplier). Products keep their `location_aisle` value even
   after the cabinet is deleted — they just stop being highlightable until
   a cabinet with that aisle code exists again.

## Scope Boundaries

Deliberately out of scope:
- No real-time sensors, beacons, or indoor positioning — the map is a
  static reference, not a live tracking system.
- No per-bin-level geometry — bins are represented as data
  (`location_bin`) shown in a label/tooltip, not as individually modeled
  shapes; modeling every bin would add a lot of layout complexity for very
  little navigational benefit over "go to this cabinet, then look for the
  bin label."
- No real image/photo sprites for cabinets — flat colored rectangles are
  enough to convey "which cabinet," consistent with the "simple, not
  photorealistic" rule above. Could be revisited later if the shop wants a
  more literal look.
- No access control on editing — anyone using the app can toggle edit mode
  and rearrange the map, same as every other feature (see
  [05-database-schema.md#assumptions--decisions-to-confirm](./05-database-schema.md#assumptions--decisions-to-confirm)
  on `users` having no real authentication).
