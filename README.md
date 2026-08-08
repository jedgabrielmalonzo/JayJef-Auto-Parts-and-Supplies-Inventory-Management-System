# JayJef Auto Parts & Supplies — Inventory Management System

Internal inventory system for a car aircon parts shop. Runs on the shop's
local network. See [`docs/`](./docs) for the full specification — read
those before adding a feature.

## Structure

- `backend/` — Node.js + Express API + PostgreSQL
- `frontend/` — React + Tailwind CSS
- `ocr-service/` — Python + PaddleOCR microservice (receipt scanning)

## Setup

### Database

Requires a local PostgreSQL instance (not included/managed by this repo).

```
cd backend
cp .env.example .env    # set DATABASE_URL to your local Postgres
npm install
npm run migrate         # applies migrations/*.sql in order
```

### Backend

```
cd backend
npm install
npm run dev              # http://localhost:4000
```

### Frontend

```
cd frontend
npm install
npm run dev               # http://localhost:5173
```

### OCR service

```
cd ocr-service
python -m venv .venv
.venv\Scripts\activate     # Windows
pip install -r requirements.txt
uvicorn app:app --reload --port 8001
```
