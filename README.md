# JayJef Auto Parts & Supplies — Inventory Management System

Internal inventory system for a car aircon parts shop. Runs on the shop's
local network. See [`docs/`](./docs) for the full specification — read
those before adding a feature.

## Structure

- `backend/` — Node.js + Express API + PostgreSQL
- `frontend/` — React + Tailwind CSS
- `ocr-service/` — Python + PaddleOCR microservice (receipt scanning)

## Running the Project (Single Terminal)

You can run both the **Backend** and **Frontend** simultaneously with a **single command** from the root folder:

```bash
npm run dev
```

If you also want to start the **OCR receipt microservice** alongside the frontend & backend:

```bash
npm run dev:all
```

---

## Service Breakdown

### Database

Requires a local PostgreSQL instance (not included/managed by this repo).

```bash
cd backend
cp .env.example .env    # set DATABASE_URL to your local Postgres
npm install
npm run migrate         # applies migrations/*.sql in order
```

### Backend (Express API)

```bash
cd backend
npm install
npm run dev              # http://localhost:4000
```

### Frontend (React SPA)

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

### OCR Service (Python microservice)

```bash
cd ocr-service
python -m venv .venv
.venv\Scripts\activate     # Windows
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

