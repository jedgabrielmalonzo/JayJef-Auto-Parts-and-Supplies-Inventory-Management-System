-- Schema per docs/05-database-schema.md

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE suppliers (
  id BIGSERIAL PRIMARY KEY,
  name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  brand text,
  category text NOT NULL CHECK (category IN (
    'compressor','condenser','evaporator','expansion_valve','hose',
    'seal_kit','refrigerant','dryer_accumulator','blower_motor','other'
  )),
  compatible_vehicles text,
  unit text NOT NULL DEFAULT 'pc',
  cost_price numeric(10,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  selling_price numeric(10,2) NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  reorder_threshold integer NOT NULL DEFAULT 0 CHECK (reorder_threshold >= 0),
  supplier_id bigint REFERENCES suppliers(id) ON DELETE SET NULL,
  location_aisle text,
  location_shelf text,
  location_bin text,
  location_x numeric(10,3),
  location_y numeric(10,3),
  location_z numeric(10,3),
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_supplier_id ON products(supplier_id);
CREATE INDEX idx_products_is_active ON products(is_active);

CREATE TABLE stock_movements (
  id BIGSERIAL PRIMARY KEY,
  product_id bigint NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  user_id bigint REFERENCES users(id) ON DELETE SET NULL,
  quantity_change integer NOT NULL,
  reason text NOT NULL CHECK (reason IN (
    'initial_stock','manual_adjustment','ocr_restock',
    'purchase_order_received','order_fulfillment','correction'
  )),
  reference_type text CHECK (reference_type IN ('purchase_order','ocr_receipt')),
  reference_id bigint,
  quantity_before integer NOT NULL,
  quantity_after integer NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);

CREATE TABLE purchase_orders (
  id BIGSERIAL PRIMARY KEY,
  order_number text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('purchase','sale')),
  supplier_id bigint REFERENCES suppliers(id) ON DELETE SET NULL,
  party_name text,
  party_contact text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','confirmed','fulfilled','cancelled')),
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  created_by bigint REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE purchase_order_items (
  id BIGSERIAL PRIMARY KEY,
  purchase_order_id bigint NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id bigint NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  line_total numeric(10,2) NOT NULL CHECK (line_total >= 0)
);

CREATE INDEX idx_purchase_order_items_order_id ON purchase_order_items(purchase_order_id);

CREATE TABLE ocr_receipts (
  id BIGSERIAL PRIMARY KEY,
  image_path text NOT NULL,
  raw_ocr_json jsonb,
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review','confirmed','rejected')),
  supplier_id bigint REFERENCES suppliers(id) ON DELETE SET NULL,
  confirmed_by bigint REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz
);

CREATE TABLE ocr_receipt_items (
  id BIGSERIAL PRIMARY KEY,
  ocr_receipt_id bigint NOT NULL REFERENCES ocr_receipts(id) ON DELETE CASCADE,
  raw_text text,
  parsed_name text,
  parsed_quantity integer,
  parsed_price numeric(10,2),
  matched_product_id bigint REFERENCES products(id) ON DELETE SET NULL,
  is_confirmed boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_ocr_receipt_items_receipt_id ON ocr_receipt_items(ocr_receipt_id);
