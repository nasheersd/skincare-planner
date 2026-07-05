# System Architecture — AI Skin Intelligence & Personalized Skincare Planner

## Overview
Milestone 1 establishes the foundational 3-tier architecture that later AI features (Milestone 2+) will plug into without requiring structural rework.

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                            │
│   React SPA (Vite) — Login, Register, Dashboard, Skin Profile,   │
│   Skin Assessment, Product Recommendation, Progress Tracking     │
└───────────────────────────┬───────────────────────────────────--┘
                             │ REST/JSON over HTTPS (JWT in header)
┌───────────────────────────▼──────────────────────────────────---┐
│                        BACKEND LAYER (FastAPI)                   │
│  ┌───────────────┐ ┌────────────────┐ ┌─────────────────────---┐│
│  │ Auth &  RBAC  │ │  User/Profile  │ │  Lifestyle Tracking     ││
│  │ (JWT, bcrypt) │ │    Module      │ │       Module            ││
│  └───────────────┘ └────────────────┘ └─────────────────────---┘│
│  ┌──────────────────────────────────────────────────────────---┐│
│  │  [Future: AI Recommendation Engine — Milestone 2+]           ││
│  └──────────────────────────────────────────────────────────---┘│
└───────────────┬───────────────────────────────┬─────────────---─┘
                 │                               │
     ┌───────────▼───────────┐       ┌───────────▼────────────┐
     │   PostgreSQL           │       │   MongoDB               │
     │ (relational core data) │       │ (flexible catalog data) │
     │  users, roles,         │       │  products, ingredients, │
     │  skin_profiles,        │       │  product-ingredient     │
     │  lifestyle_entries,    │       │  mappings               │
     │  progress_entries      │       │                         │
     └────────────────────────┘       └─────────────────────────┘
```

## Layer Responsibilities

### 1. Frontend (React + Vite)
- Handles all user-facing interaction.
- Stores JWT in `localStorage`; attaches it to every API call via an Axios interceptor.
- Route-guards protected pages via `ProtectedRoute`.

### 2. Backend (Python + FastAPI)
- Exposes REST endpoints under `/api/*`.
- Auth module issues JWTs on login/registration and verifies them on every protected request.
- RBAC module gates endpoints by role (`user`, `skincare_consultant`, `dermatologist`, `administrator`).
- Structured so the future AI Recommendation Engine can be added as an additional router/service without touching existing modules.

### 3. Data Layer
- **PostgreSQL** holds all relational, transactional data — users, roles, skin profiles, lifestyle entries, progress entries — where referential integrity and constraints matter.
- **MongoDB** holds the skincare product & ingredient catalog, which is naturally document-shaped (varying attributes per product) and will grow substantially when AI recommendation logic is added.

## Future AI Integration Points (Milestone 2+)
- A new `ai_engine` service will read from `skin_profiles`, `lifestyle_entries`, and the MongoDB product/ingredient catalog to generate recommendations.
- The `ProductRecommendation` page is already scaffolded on the frontend and will call a future `/api/recommendations` endpoint.
- The `progress_entries` table will feed a future analytics/trend module.
