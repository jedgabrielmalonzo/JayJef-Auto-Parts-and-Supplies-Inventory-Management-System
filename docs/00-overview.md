# 00 — Project Overview

## Project Summary

**JayJef Auto Parts and Supplies** is building an internal Inventory Management
System (IMS) to replace manual/paper tracking of car air-conditioning parts
(compressors, condensers, evaporators, hoses, seals, refrigerant, etc.).

The system runs entirely on the shop's **local network** — it is not exposed to
the public internet. It is used by shop staff on multiple devices (desktop at
the counter, tablet/phone in the stockroom) to:

- Track what parts are in stock and how many
- Know when to reorder before running out
- Speed up restocking by photographing supplier receipts instead of typing
  every line item by hand
- Generate professional purchase order / invoice PDFs for printing

## Goals

1. **Accuracy** — stock counts reflect reality; every change is logged, not just
   overwritten.
2. **Speed** — restocking via a receipt photo should be faster than manual entry,
   with a human confirmation step so OCR mistakes don't silently corrupt inventory.
3. **Simplicity of operation** — runs on local hardware the shop already has, no
   cloud dependency, no complex deployment.
4. **Auditability** — every stock change has a reason and a timestamp (manual
   adjustment, OCR restock, order fulfillment, correction).

## Tech Stack and Why

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Tailwind CSS | Fast to build forms/tables/dashboards; Tailwind keeps styling consistent without a heavy design system. |
| Backend | Node.js + Express | Simple REST API layer, same language as frontend (JS/TS), minimal ceremony for a small team/local app. |
| Database | PostgreSQL | Relational data (products, orders, movements) with real foreign keys and transactions — important for keeping stock counts consistent. |
| OCR | Python + PaddleOCR, run as a **separate local microservice** | PaddleOCR is Python-only and has real dependencies (models, image libs); isolating it as its own service keeps the Node backend simple and lets OCR be restarted/scaled independently. |
| PDF generation | pdf-lib or Puppeteer | Generates printable purchase order / invoice documents server-side. Puppeteer is easier if the invoice is laid out as HTML/CSS first; pdf-lib is lighter-weight if building the PDF programmatically. Decide per-implementation (see [04](./04-purchase-order-invoice.md)). |

## High-Level Architecture

```
┌─────────────────────┐        HTTP (REST/JSON)        ┌──────────────────────┐
│   React Frontend     │ ───────────────────────────►  │   Express API Server │
│ (Tailwind CSS, SPA)  │ ◄───────────────────────────  │      (Node.js)       │
└─────────────────────┘                                 └──────────┬───────────┘
        ▲  served to any device                                    │
        │  on the shop's local network                              │ SQL
        │                                                           ▼
        │                                                ┌──────────────────────┐
        │                                                │   PostgreSQL DB      │
        │                                                │ products, movements, │
        │                                                │ orders, ocr_receipts │
        │                                                └──────────────────────┘
        │                                                           ▲
        │                          HTTP (image upload / JSON)       │
        │                                                           │
        │                                                ┌──────────┴───────────┐
        └────────── receipt photo ─────────────────────► │  Python OCR Service   │
                                                            │  (PaddleOCR, local)   │
                                                            └───────────────────────┘
```

- The **React frontend** talks only to the **Express backend** (never directly
  to Postgres or the OCR service).
- The **Express backend** is the single source of truth: it owns the database
  connection, business rules (stock math, reorder alerts), and PDF generation.
- The **OCR microservice** is a small Python HTTP API (e.g. FastAPI/Flask) that
  accepts an image and returns extracted text/line items. It has no direct
  access to the database — the Express backend calls it, then decides what to
  do with the result.
- All services run on machines within the shop's LAN. The backend and OCR
  service can run on the same machine or different machines on the same
  network; the frontend is built once and served as static files (or run in
  dev mode) accessible to any device on the network.

## Folder Structure Plan

```
JayJef-Auto-Parts-and-Supplies-Inventory-Management-System/
├── docs/                        # This documentation (specs, planning)
│
├── frontend/                    # React + Tailwind app
│   ├── src/
│   │   ├── components/          # Shared UI components (buttons, tables, modals)
│   │   ├── pages/                # Route-level pages (Dashboard, Quick Lookup, Products, Inventory, Reports, Orders, OCR Capture, Suppliers, Shop Map, Manage Store)
│   │   ├── features/             # Feature-specific logic/hooks (products, inventory, ocr, orders)
│   │   ├── api/                  # API client functions (fetch wrappers per resource)
│   │   ├── App.jsx / main.jsx
│   │   └── ...
│   ├── public/
│   └── package.json
│
├── backend/                     # Node.js + Express API
│   ├── src/
│   │   ├── routes/               # Express route definitions per resource
│   │   ├── controllers/          # Request handlers
│   │   ├── services/              # Business logic (stock math, PDF generation, OCR client)
│   │   ├── db/                    # DB connection, query helpers, migrations
│   │   ├── models/                 # Data access per table/entity
│   │   └── app.js / server.js
│   ├── migrations/                # SQL migration files
│   └── package.json
│
├── ocr-service/                 # Python + PaddleOCR microservice
│   ├── app.py                    # HTTP API entrypoint
│   ├── ocr/                       # OCR + parsing logic (image -> text -> line items)
│   ├── requirements.txt
│   └── storage/                   # Local storage for uploaded receipt images (dev only)
│
└── README.md
```

This structure is a starting point — see later docs for how each feature maps
into these folders once implementation begins.
