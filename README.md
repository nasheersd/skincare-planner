# AI Skin Intelligence & Personalized Skincare Planner

A full-stack platform that generates personalized skincare routines, evaluates ingredient safety, tracks user progress, and gives consultants and dermatologists dedicated tools to monitor and adjust patient care — all built around role-based access for four distinct user types.

---

## Overview

The platform combines a skin-profile assessment, an ingredient safety engine, and a product recommendation system into a single guided experience. Users complete a skin assessment, receive a personalized routine and product recommendations, log daily adherence, upload progress photos, and track their Skin Health Score over time. Consultants and dermatologists get dedicated dashboards to review patient progress and adjust routines directly.

---

## Video of the project

https://github.com/user-attachments/assets/3c5f119f-7a5d-44d3-8942-a31ed43cf8a6

## Features

### For Users
- **Skin Profile & Assessment** — captures skin type, concerns, allergies/sensitivities, lifestyle, and budget after registration.
- **Ingredient Intelligence Engine** — analyzes product ingredient lists for chemical conflicts (e.g. Retinoids + AHAs/BHAs) and cross-references against the user's known allergens, returning a safety score and status (Safe / Warning / Unsafe).
- **Product Recommendation Engine** — scores and ranks catalog products against skin type, target concerns, and budget, with a hard safety gate that excludes flagged allergens before scoring.
- **Interactive Dashboard** — Skin Health Score gauge, daily AM/PM routine checklist, progress charts, and a personalized recommendations shelf.
- **Progress Tracking** — logs routine adherence (7/30/90-day compliance) and progress photo uploads for visual before/after comparison.

### For Consultants & Dermatologists
- **Patient Roster** — searchable list of assigned clients with primary concerns, health scores, and compliance metrics.
- **Patient Inspection View** — adherence history, survey details, and side-by-side progress photo comparison.
- **Routine Overwrite Tools** — update a patient's routine directly, reflected live on their dashboard.

### For Admins
- User management and role-based access control.
- System health and API performance metrics.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | FastAPI |
| Relational Database | PostgreSQL — users, skin profiles, lifestyle & progress entries |
| Document Database | MongoDB — ingredient catalog, product catalog, routine check-ins |
| Authentication | JWT-based auth with role-based access control (4 roles: User, Consultant, Dermatologist, Admin) |
| Charts | Chart.js |

---

## Project Structure

```
skincare-planner/
├── backend/
│   ├── app/
│   │   ├── routers/          # API route handlers
│   │   ├── services/         # Business logic (safety scoring, adherence, storage)
│   │   ├── models.py         # SQLAlchemy models
│   │   └── main.py           # FastAPI app entrypoint
│   ├── db/                   # Seed scripts, migrations
│   └── tests/                # Backend test suite
├── frontend/
│   └── src/
│       ├── api/               # API client wrappers
│       ├── pages/              # Dashboard and route-level components
│       └── components/         # Shared UI components
└── README.md
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL
- MongoDB

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS/Linux

pip install -r requirements.txt

# Configure environment variables (see below), then:
python app/db/seed_ingredients.py   # seed ingredient & conflict data
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Create a `.env` file in `backend/` with:

```
DATABASE_URL=postgresql://user:password@localhost:5432/skincare_planner
MONGODB_URI=mongodb://localhost:27017/skincare_planner
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
```

---

## API Documentation

Once the backend is running, interactive API docs are available at:
```
http://localhost:8000/docs
```

Key endpoints:

| Endpoint | Description |
|---|---|
| `POST /api/ingredients/safety-score` | Evaluate ingredient list for conflicts and allergy matches |
| `GET /api/recommendations` | Get personalized, safety-filtered product recommendations |
| `POST /api/checkins` | Log AM/PM routine step completion |
| `GET /api/analytics` | Retrieve score timeline, adherence rates, and progress photos |
| `POST /api/photos/upload` | Upload a progress photo |

---

## Testing

```bash
cd backend
pytest

cd ../frontend
npm run build
```

---

## Roles & Access

| Role | Access |
|---|---|
| User | Own dashboard, assessments, recommendations, progress tracking |
| Consultant | Assigned patient roster, adherence review, routine adjustments |
| Dermatologist | Clinical view of assigned patients, photo comparisons, treatment notes |
| Admin | User management, system metrics |

---

## Roadmap

- [x] Milestone 1 — Core architecture, auth, skin profile & assessment
- [x] Milestone 2 — Routine generation
- [x] Milestone 3 — Ingredient intelligence, product recommendations, progress tracking, dashboards *(in progress)*
- [x] Milestone 4 — Notifications, admin & reporting, testing, Docker, CI/CD, production deployment

---

## Contributing

This project follows an individual-branch workflow — each contributor works on a branch named `nasheer-skincare-planner` and does not push directly to `main`. See internal contribution guidelines for details.

---
