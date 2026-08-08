# 07 — 3D Shop Navigation

## Feature

A simple 3D map of the shop that helps staff physically locate a product on
a wide or complex shop floor. This is a **visual lookup tool, not a
simulation** — it answers "where do I walk to find this part," nothing more.

## Visual Style: Simple, Not Photorealistic

The scene is built from basic primitives — boxes for cabinets/shelves/walls,
planes for the floor — roughly positioned and sized to match the real shop
layout. No textures, materials, or lighting effort beyond making shapes
readable and distinguishable (e.g. color-coding cabinets by category). This
keeps the scene cheap to build, cheap to render on modest shop hardware, and
cheap to update when the shop rearranges a shelf.

## Library Choice

- **react-three-fiber** — React renderer for Three.js; lets the 3D scene be
  built declaratively as React components, consistent with the rest of the
  frontend.
- **@react-three/drei** — helper components on top of r3f, used here
  specifically for:
  - `OrbitControls` — lets staff rotate, pan, and zoom the view with mouse/
    touch, so they can orient themselves relative to the real shop.
  - Basic helpers (e.g. `Text` for aisle/shelf labels floating in the scene,
    `Html` for a tooltip on the highlighted product) as needed.

No physics engine, no lighting/shadow library, no asset pipeline (GLTF
models, textures) — boxes and planes with flat colors are enough to convey
"which cabinet."

## Static Shop Layout

The room/aisle/cabinet geometry (the walls, floor, and shelf boxes that make
up the scene) is **manually defined once** as a static frontend config —
e.g. `frontend/src/features/shop-map/layout.ts`, an array of simple objects
like `{ id, type: 'cabinet' | 'wall' | 'floor', position: [x,y,z], size: [w,h,d], color, label }`.

This is intentionally **not** a database table or an admin-editable feature:
- The physical shop layout changes rarely (renovation-level changes, not
  day-to-day).
- It has no relational structure to speak of — it's scene-graph data, not
  business data.
- Editing a hardcoded config when the shop is rearranged is a trivial,
  occasional dev task; building a layout editor UI would be effort spent on
  something used maybe once a year.

Each cabinet/shelf entry in this static layout has a `location_aisle` /
`location_shelf` code, matching the codes stored on products (see
[01-product-crud.md#location-field-structure](./01-product-crud.md#location-field-structure)),
so the frontend can map "product's stored location" → "which box in the
scene to highlight" without a database join.

## Product Location Data

Each product optionally has a stored physical location — see the fields
added in [01-product-crud.md](./01-product-crud.md#location-field-structure)
and [05-database-schema.md](./05-database-schema.md#products):
`location_aisle`, `location_shelf`, `location_bin` (human-readable codes)
and `location_x`/`location_y`/`location_z` (the coordinates used to place a
pin in the 3D scene, matching the shelf's position in the static layout
above).

## Flow

1. Staff opens the 3D map view and searches for a product (reusing the same
   product search used elsewhere in the app), or arrives here from a
   product's detail page via a "show on map" action.
2. Frontend fetches the product's location via `GET /products/locations`
   (or already has it from the product detail response — see
   [06-api-endpoints.md](./06-api-endpoints.md#products)).
3. If the product has no location set, show a plain "location not set for
   this product" message instead of the 3D view — nothing to highlight.
4. If it does, the 3D scene renders with:
   - A highlighted/pinned marker at the product's `location_x/y/z`,
     typically the relevant cabinet box changing color or gaining an
     outline, plus a floating label (aisle/shelf/bin text).
   - Optionally, the camera animates ("fly-to") from its current position
     to frame that marker, rather than jump-cutting — makes the spatial
     relationship ("it's over there, past the middle aisle") easier to
     read than an instant cut.
5. Staff can freely rotate/pan/zoom via `OrbitControls` at any time to get
   oriented, independent of the highlighted product.

## Scope Boundaries

Deliberately out of scope for this feature:
- No real-time sensors, beacons, or indoor positioning — the map is a static
  reference, not a live tracking system.
- No physics (collision, gravity) — nothing moves in the scene except the
  camera and the highlight state.
- No per-bin-level 3D geometry — bins are represented as data
  (`location_bin`) shown in a label/tooltip, not as individually modeled 3D
  objects; modeling every bin would add a lot of scene complexity for very
  little navigational benefit over "go to this shelf, then look for the bin
  label."
- No mobile AR / camera overlay — this is a top-down/orbit 3D view on a
  screen, not an augmented-reality feature.
