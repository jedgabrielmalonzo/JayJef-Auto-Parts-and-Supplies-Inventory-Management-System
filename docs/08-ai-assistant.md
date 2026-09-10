# 08 — AI Inventory Assistant & Anti-Hallucination Guardrails

## Feature Summary

The **JayJef AI Inventory Assistant** is a **lightweight, deterministic SQL-based query engine** (not an external neural LLM like OpenAI or Gemini). It provides natural language keyword search, stock verification, price lookup, and low-stock alerts grounded strictly in live PostgreSQL database records without relying on external AI API dependencies.

Staff can query the assistant via the dedicated **Assistant Page** (`/assistant`) or the floating **AI Chatbot widget** (`<AiChatbot />`) available across all app screens.

```
┌───────────────────────────┐
│ Staff User Query          │  e.g. "Do we have Denso compressors under ₱5000?"
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│ Out-of-Domain Guardrail   │ ──(Non-inventory question?)──► Reject & explain shop scope
└─────────────┬─────────────┘
              │ (Valid inventory query)
              ▼
┌───────────────────────────┐
│ Natural Language Parser   │ ── Strip stopwords ("do", "we", "have", "under")
└─────────────┬─────────────┘    Extract price threshold / low-stock intent
              │
              ▼
┌───────────────────────────┐
│ Live PostgreSQL Query     │ ── SELECT from products LEFT JOIN suppliers
└─────────────┬─────────────┘    Strict AND search -> Fallback to OR search
              │
              ▼
┌───────────────────────────┐
│ Strict DB Grounding       │ ──(0 rows found?)──► Return explicit "Not Found" response
└─────────────┬─────────────┘
              │ (Rows returned)
              ▼
┌───────────────────────────┐
│ Structured AI Response    │ ── Bulleted stock summary + interactive product cards
└───────────────────────────┘
```

## Key Capabilities

1. **Natural Language Product Lookup**
   - Resolves requests by part name, SKU, brand, category, or notes.
   - Strips filler/conversational words (stopwords) before constructing SQL statements.

2. **Low Stock & Reorder Alerts**
   - Triggered by queries containing keywords like `"low stock"`, `"reorder"`, `"running low"`, `"out of stock"`.
   - Returns all active products where `stock_quantity <= reorder_threshold`.

3. **Budget & Price Threshold Queries**
   - Automatically detects price constraints (e.g., `"under ₱1500"`, `"below 3000"`, `"cheapest"`).
   - Filters product results by `selling_price` ordered by lowest price.

4. **Single-Item Status Summary**
   - When a query uniquely resolves to one product, the assistant returns a comprehensive status breakdown including SKU, current stock count, availability badge, unit price, reorder threshold, and assigned supplier.

## Anti-Hallucination Guardrails

To ensure operational accuracy in a live automotive parts inventory system, the AI assistant enforces **two strict guardrails**:

### Guardrail 1: Out-of-Domain Filter
The assistant intercepts queries unrelated to inventory management (such as general knowledge, recipes, weather, or media queries) and politely redirects the user to auto parts inquiries:
> *"I am the JayJef Inventory Assistant. I am specialized only in auto parts inventory, stock levels, pricing, SKUs, and suppliers."*

### Guardrail 2: Strict Database Grounding (Zero Hallucination)
The assistant **never fabricates** part numbers, prices, or stock availability:
- If a query produces no database matches, the assistant explicitly reports that no matching item exists in the live catalog.
- All product data returned in responses is mapped directly from actual SQL query results (`products` table joined with `suppliers`).

## Natural Language Search Architecture

```javascript
// backend/src/services/aiAssistant.js

// 1. Filter out common English & inventory filler words
const STOP_WORDS = new Set([
  'status', 'details', 'check', 'count', 'inventory', 'quantity', 'qty',
  'where', 'is', 'are', 'in', 'stock', 'available', 'price', 'how', 'much',
  'what', 'show', 'me', 'find', 'parts', 'part', 'product', 'please', ...
]);

// 2. Query strategy: Strict AND -> Fallback to OR
let rows = await executeProductSearch(searchTerms, 'AND');
if (rows.length === 0 && searchTerms.length > 1) {
  rows = await executeProductSearch(searchTerms, 'OR');
}
```

## User Interface Integration

- **Assistant Page (`/assistant`)**: Dedicated interface featuring quick prompt suggestion chips, conversation history, and interactive product result cards.
- **Floating Chatbot Widget (`AiChatbot.jsx`)**: Available in the bottom right corner of all pages for quick stock checks without navigating away from active forms or orders.
- **Interactive Result Cards**: Product cards displayed within chat messages include 1-click links to view part details or jump to the shop location map.

## API Reference

- **`POST /api/chat`**
  - **Request Body**: `{ "message": "string" }`
  - **Response Payload**:
    ```json
    {
      "reply": "Found 2 product(s) matching your query in the inventory database:",
      "products": [
        {
          "id": 12,
          "sku": "COMP-DENSO-10PA",
          "name": "Denso 10PA17C Compressor",
          "brand": "Denso",
          "category": "compressor",
          "cost_price": 4200.00,
          "selling_price": 5500.00,
          "stock_quantity": 4,
          "reorder_threshold": 2,
          "unit": "pc",
          "location": "Aisle A1",
          "supplier_name": "Denso Phils",
          "is_low_stock": false
        }
      ]
    }
    ```
