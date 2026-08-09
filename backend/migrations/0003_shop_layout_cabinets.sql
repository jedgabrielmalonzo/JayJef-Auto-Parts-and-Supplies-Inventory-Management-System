-- 2D shop map, editable by staff (docs/07-3d-navigation.md). Replaces the
-- static frontend layout.js — cabinet positions now live in the database so
-- non-developers can drag them into place from the app.

CREATE TABLE shop_layout_cabinets (
  id BIGSERIAL PRIMARY KEY,
  location_aisle text NOT NULL UNIQUE,
  label text NOT NULL,
  x numeric(10,2) NOT NULL,
  y numeric(10,2) NOT NULL,
  width numeric(10,2) NOT NULL DEFAULT 120,
  height numeric(10,2) NOT NULL DEFAULT 80,
  color text NOT NULL DEFAULT '#3A6EA5',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- location_x/y/z on products were never actually set by any UI (the map
-- has always positioned by looking up a cabinet via location_aisle) —
-- confirmed dead by a full-repo grep. Dropping them; the map's product
-- search filter moves to location_aisle in the same change (productModel.js).
ALTER TABLE products DROP COLUMN location_x;
ALTER TABLE products DROP COLUMN location_y;
ALTER TABLE products DROP COLUMN location_z;

-- Seed with today's static layout so the map isn't empty after migrating —
-- exact positions don't matter, the user repositions them to match reality.
INSERT INTO shop_layout_cabinets (location_aisle, label, x, y, width, height, color) VALUES
  ('A1', 'Aisle A1', 150, 150, 100, 60, '#3A6EA5'),
  ('A2', 'Aisle A2', 325, 150, 100, 60, '#3A6EA5'),
  ('A3', 'Aisle A3', 500, 150, 100, 60, '#3A6EA5'),
  ('B1', 'Aisle B1', 150, 300, 100, 60, '#1E7B34'),
  ('B2', 'Aisle B2', 325, 300, 100, 60, '#1E7B34'),
  ('B3', 'Aisle B3', 500, 300, 100, 60, '#1E7B34'),
  ('C1', 'Aisle C1', 237, 450, 100, 60, '#946200'),
  ('C2', 'Aisle C2', 425, 450, 100, 60, '#946200');
