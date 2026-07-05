# Folder Structure

```
skincare-planner/
│
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app entrypoint, router registration
│   │   ├── config.py                # Settings loaded from .env
│   │   ├── database.py              # PostgreSQL (SQLAlchemy) + MongoDB connections
│   │   ├── models.py                # SQLAlchemy ORM models (users, profiles, etc.)
│   │   ├── schemas.py               # Pydantic request/response schemas
│   │   ├── auth.py                  # Password hashing, JWT creation/validation
│   │   ├── rbac.py                  # Role-based access control dependencies
│   │   └── routers/
│   │       ├── auth.py              # /api/auth/register, /api/auth/login
│   │       ├── users.py             # /api/users/me, /api/users/
│   │       ├── skin_profile.py      # /api/skin-profile/
│   │       └── lifestyle.py         # /api/lifestyle/
│   ├── seed/
│   │   ├── products.json            # Initial product catalog
│   │   ├── ingredients.json         # Initial ingredient catalog
│   │   └── seed_db.py               # Script to load seed data into MongoDB
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx                 # React entrypoint
│   │   ├── App.jsx                  # Routing setup
│   │   ├── api/axios.js             # Axios instance with JWT interceptor
│   │   ├── context/AuthContext.jsx  # Auth state, login/register/logout logic
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       ├── Dashboard.jsx
│   │       ├── SkinProfile.jsx
│   │       ├── SkinAssessment.jsx
│   │       ├── ProductRecommendation.jsx
│   │       └── ProgressTracking.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── README.md
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_ENDPOINTS.md
│   ├── FOLDER_STRUCTURE.md
│   ├── SETUP_INSTRUCTIONS.md
│   └── WIREFRAMES.md
│
└── README.md
```
