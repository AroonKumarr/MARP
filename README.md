# Multi-Agent Market Research Platform (MARP)

**Final Year Project — SZABIST Islamabad Campus**  
**Course:** Bachelor of Computer Science (BSCS) Final Year Project  
**Authors:** Aroon Kumar (2312466), Mudasir Ali (2312465), Abdullah Zafar Khan (2312467)  
**Supervisor:** Mr. Zubair Ahmed  

---

## 1. Project Overview

The **Multi-Agent Market Research Platform (MARP)** is an enterprise software platform designed to streamline and automate out-of-home (OOH) advertising audit, billboard monitoring, and retail market research.

This repository contains the complete, production-grade full-stack delivery of the **First Three Modules**:
1. **Module 01 — User Management & Workspace Isolation:** Multi-tenant companies, secure authentication (JWT), Role-Based Access Control (5 enterprise roles), Android device registration, and audit activity logging.
2. **Module 02 — Questionnaire Management & Visual Builder:** Multi-category survey library (Billboard, Retail, Competitor, Field), drag-and-drop question builder (10 question types), deterministic conditional branching logic engine, bilingual localization (English & Urdu RTL), eligibility & OTP controls, and immutable versioning.
3. **Module 03 — Campaign Management & Asset Registry:** Campaign lifecycle governance, billboard & advertisement registry with physical dimensions and illumination specs, 5-tier hierarchical location management (Pakistan → Province → City → Area → Site), competitor intelligence comparison, field staff assignment, and field evidence verification.

The visual design reproduces the approved SaaS dashboard design language: warm taupe canvas (`#E6E2D8`), rounded ivory workspace (`#F7F5EC`), narrow black sidebar (`#111111`), white cards with soft shadows, and live database-driven analytics.

---

## 2. Technology Stack

- **Frontend:** Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS, Lucide React, Recharts.
- **Backend:** Python 3.11, FastAPI, Pydantic v2, SQLAlchemy 2.0 (Declarative Base), Alembic Migrations.
- **Database:** PostgreSQL 15+ (with native local SQLite development support).
- **Security:** Cryptographic password hashing (bcrypt), Bearer JWT tokens, role/permission enforcement dependencies.
- **Testing & QA:** pytest, pytest-asyncio, Playwright browser automation.
- **Containerization:** Docker, Docker Compose.

---

## 3. Project Structure

```text
MARP/
│
├── frontend/                     # Next.js App Router Web Application
│   ├── app/                      # Pages: Dashboard, Users, Questionnaires, Campaigns, Settings, Login
│   ├── components/               # Reusable UI & Layout Components (Sidebar, Header, Kanban, Donut)
│   ├── lib/                      # API client, Auth state, utility functions
│   └── public/                   # Static assets
│
├── backend/                      # FastAPI Modular Monolith Backend
│   ├── app/
│   │   ├── core/                 # Config, Security, RBAC Dependencies
│   │   ├── database/             # SQLAlchemy Engine, Session, TimestampedUUIDModel Base
│   │   ├── modules/
│   │   │   ├── users/            # Module 01: Workspaces, Users, Roles, Devices, Audit Logs
│   │   │   ├── questionnaires/   # Module 02: Questionnaires, Builder, Branching, Translations
│   │   │   ├── campaigns/        # Module 03: Campaigns, Advertisements, Locations, Assignments
│   │   │   └── dashboard/        # Live Database Operational Metrics & Workflow Board
│   │   └── cli/
│   │       └── bootstrap.py      # System bootstrap & initial administrator provisioning
│   ├── alembic/                  # Schema migrations
│   ├── requirements.txt
│   └── tests/                    # 20 automated pytest tests
│
├── design-system/
│   ├── tokens.css                # CSS Design Tokens (colors, spacing, shadows, border radii)
│   └── components.md             # Component visual guidelines
│
├── docs/
│   ├── requirements-analysis.md  # Comprehensive requirements baseline
│   ├── requirements-traceability.md # IEEE 830 Traceability matrix
│   ├── architecture-decisions.md # Architecture Decision Records (ADRs)
│   ├── ui-qa-report.md           # Visual QA report with screenshots
│   ├── database/
│   │   ├── erd.mmd               # Mermaid ERD diagram
│   │   ├── erd.svg               # Vector SVG ERD
│   │   ├── erd.png               # High-res PNG ERD
│   │   └── data-dictionary.md    # Detailed database data dictionary
│   └── screenshots/              # 18 Playwright Visual QA screenshots
│
├── docker-compose.yml            # Multi-container orchestration (PostgreSQL + Backend + Frontend)
├── .env.example                  # Environment configuration template
└── README.md
```

---

## 4. Quick Start & Execution Instructions

### Option A: Local Development (Fastest, zero external dependencies)

#### 1. Setup Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run migrations and bootstrap system data with demo baseline
alembic upgrade head
python -m app.cli.bootstrap --seed-demo

# Start FastAPI server on port 8000
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

#### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

Open your browser at [http://localhost:3000](http://localhost:3000).

#### Initial Administrator Credentials:
- **Email:** `admin@marp.io`
- **Password:** `Admin12345!`

---

### Option B: Docker Compose (PostgreSQL Production Setup)

```bash
docker compose up --build
```
This automatically boots:
- PostgreSQL on `localhost:5432`
- FastAPI backend on `http://localhost:8000` (runs migrations and bootstrap automatically)
- Next.js frontend on `http://localhost:3000`

---

## 5. Running Automated Tests

### Backend Test Suite (pytest)
```bash
cd backend
source venv/bin/activate
PYTHONPATH=. pytest -v
```
*Executes 20 automated tests covering Authentication, RBAC, User CRUD, Devices, Audit Logs, Questionnaire Branching, Versioning, Hierarchical Locations, Advertisements, Competitors, and Operational Dashboard queries.*

### Browser Visual QA (Playwright)
```bash
python3 -c "
import asyncio
from playwright.async_api import async_playwright
# runs visual QA scripts and generates full screenshot catalog
"
```

---

## 6. API Documentation

Interactive Swagger and ReDoc documentation is generated automatically by FastAPI:
- **Swagger UI:** [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- **ReDoc:** [http://localhost:8000/api/v1/redoc](http://localhost:8000/api/v1/redoc)
- **Health Check:** `GET /api/v1/health`

---

## 7. Deliverables Index

- **Requirements Baseline:** [`docs/requirements-analysis.md`](docs/requirements-analysis.md)
- **Traceability Matrix:** [`docs/requirements-traceability.md`](docs/requirements-traceability.md)
- **Architecture Decisions (ADRs):** [`docs/architecture-decisions.md`](docs/architecture-decisions.md)
- **Database ERD Diagram:** [`docs/database/erd.mmd`](docs/database/erd.mmd) • [`docs/database/erd.svg`](docs/database/erd.svg) • [`docs/database/erd.png`](docs/database/erd.png)
- **Data Dictionary:** [`docs/database/data-dictionary.md`](docs/database/data-dictionary.md)
- **Design Tokens:** [`design-system/tokens.css`](design-system/tokens.css)
- **Visual QA Report:** [`docs/ui-qa-report.md`](docs/ui-qa-report.md)
- **Screenshots Gallery:** [`docs/screenshots/`](docs/screenshots/)

---
*Built for SZABIST Final Year Project (FYP) Evaluation.*
