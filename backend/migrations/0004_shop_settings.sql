-- Shop info shown on the Manage Store / Settings page. Single-row-by-
-- constraint table (docs/07's "no multi-branch" decision) — the
-- CHECK (id = 1) is the standard Postgres pattern for "exactly one row".
CREATE TABLE shop_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name text NOT NULL,
  address text,
  phone text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO shop_settings (id, name) VALUES (1, 'JayJef Auto Parts & Supplies');
