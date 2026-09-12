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
| Frontend | React + Tailwind CSS + Shadcn UI + Framer Motion | Modern, responsive SPA with accessible Shadcn UI primitives, custom date pickers (`react-day-picker`/`date-fns`), smooth Framer Motion micro-animations, and Lucide iconography. |
| Backend | Node.js + Express | Simple REST API layer, business logic rules (stock math, PDF generation, AI chatbot search logic). |
| Database | PostgreSQL | Relational storage (products, movements, orders, suppliers, ocr_receipts) with strict foreign keys and atomic transactions. |
| AI Assistant | Node.js + PostgreSQL Query Engine | Strictly grounded natural language AI assistant (`/api/chat`) with anti-hallucination guardrails, accessible globally via `<AiChatbot />` modal. |
| OCR | Python + PaddleOCR, run as a **separate local microservice** | Isolates Python models/dependencies; accepts receipt uploads, extracts text & dates, and streams results to Express parser. |
| Cloud Storage | Supabase Storage (with Data URI & local fallback) | Stores uploaded receipt images in Supabase Storage (`receipts` bucket) with automatic Base64 Data URI fallback for cross-device visibility. |
| Hardware / Printing | ESC/POS Thermal Printer + Browser PDF | Enables thermal receipt printing for scanned stock receipts and printable invoice PDFs. |

## High-Level Architecture

```
┌────────────────────────────────────────────────────────┐
│                   React Frontend                       │
│ (Tailwind CSS, Shadcn UI, Framer Motion, AiChatbot)    │
└───────────────────────────┬────────────────────────────┘
                            │
              HTTP (REST/JSON API & /api/chat)
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                 Express API Server                     │
│    (Node.js, Stock Math, AI Assistant Engine)          │
└─────────────┬─────────────┬──────────────┬─────────────┘
              │             │              │
              │ SQL Queries │ HTTP Upload  │ Cloud Upload / Data URI
              ▼             ▼              ▼
┌───────────────────────────┐┌───────────────────────────┐┌───────────────────────────┐
│       PostgreSQL DB       ││    Python OCR Service     ││  Supabase Cloud Storage   │
│ products, movements,      ││   (PaddleOCR, FastAPI)    ││ (receipts bucket, cloud & │
│ orders, ocr_receipts,     │└───────────────────────────┘│ Data URI image fallback)  │
│ shop_layout_cabinets      │                             └───────────────────────────┘
└───────────────────────────┘
```

- The **React frontend** talks exclusively to the **Express backend** (including AI search via `/api/chat`).
- The **Express backend** is the single source of truth: it manages transactions, stock calculation, AI database queries, and receipt parsing.
- The **AI Assistant Service** acts as an anti-hallucination query engine, parsing natural language search queries and filtering results directly against live PostgreSQL product and supplier records.
- The **OCR microservice** is an isolated Python service running PaddleOCR that receives receipt photos and returns detected text lines to the Express backend.

## Folder Structure Plan

```
JayJef-Auto-Parts-and-Supplies-Inventory-Management-System/
├── docs/                        # Specifications (00-overview to 09-design-system)
│   ├── 00-overview.md
│   ├── 01-product-crud.md
│   ├── 02-inventory-tracking.md
│   ├── 03-ocr-receipt-capture.md
│   ├── 04-purchase-order-invoice.md
│   ├── 05-database-schema.md
│   ├── 06-api-endpoints.md
│   ├── 07-3d-navigation.md
│   ├── 08-ai-assistant.md       # AI Assistant & Guardrails spec
│   └── 09-design-system.md
│
├── frontend/                    # React + Tailwind + Shadcn UI app
│   ├── src/
│   │   ├── components/          # UI components (AiChatbot, StatCard, ProductThumb, ui/*)
│   │   ├── pages/               # Route pages (Dashboard, Lookup, Products, ProductDetail, Inventory, Reports, Orders, Ocr, Suppliers, Map, Assistant, Settings)
│   │   ├── features/            # Shop map and domain features
│   │   ├── api/                 # API client helpers (products, inventory, ocr, orders, chat, reports)
│   │   ├── App.jsx / main.jsx
│   │   └── index.css            # Tailwind + Shadcn design tokens
│   └── package.json
│
├── backend/                     # Node.js + Express API
│   ├── src/
│   │   ├── routes/              # Route handlers (products, inventory, chat, ocr, orders, reports, dashboard, shopLayout, shopSettings)
│   │   ├── controllers/         # Request handling logic
│   │   ├── services/            # Business logic (aiAssistant, stock math, ocrParser)
│   │   ├── db/                  # DB pool connection, migrations
│   │   └── app.js / server.js
│   ├── migrations/              # SQL migrations
│   └── package.json
│
├── ocr-service/                 # Python + PaddleOCR microservice
│   ├── app.py                   # FastAPI entrypoint
│   └── requirements.txt
│
└── README.md
```
