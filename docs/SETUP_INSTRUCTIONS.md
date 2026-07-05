# Project Setup Instructions

## Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- MongoDB 6+
- Git

## 1. Clone the Repository
```bash
git clone https://github.com/nasheersd/skincare-planner.git
cd skincare-planner
```

## 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env with your actual PostgreSQL/MongoDB credentials and a strong JWT secret
```

### Create the PostgreSQL database
```sql
CREATE DATABASE skincare_db;
CREATE USER skincare_user WITH PASSWORD 'changeme';
GRANT ALL PRIVILEGES ON DATABASE skincare_db TO skincare_user;
```

### Start the backend
```bash
uvicorn app.main:app --reload --port 8000
```
Tables are auto-created on first run via `Base.metadata.create_all`. API docs available at `http://localhost:8000/docs`.

### Seed the product/ingredient catalog (MongoDB)
```bash
python -m seed.seed_db
```

## 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173` and expects the backend at `http://localhost:8000`.

## 4. Git & Team Collaboration Setup
```bash
git init
git remote add origin https://github.com/nasheersd/skincare-planner.git
git add .
git commit -m "Milestone 1: Foundation - auth, RBAC, profiles, lifestyle tracking"
git branch -M main
git push -u origin main
```

### Branching convention for the team
- `main` — stable, always deployable
- `develop` — integration branch
- `feature/<name>` — individual feature branches, merged into `develop` via PR

## 5. Verify Everything Works
1. Visit `http://localhost:8000/api/health` → should return `{"status": "ok", ...}`
2. Visit `http://localhost:5173` → should redirect to Login
3. Register a new user → Login → Dashboard should load
4. Fill in Skin Profile → Save → refresh page → data persists
5. Log a lifestyle entry under Skin Assessment
