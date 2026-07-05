# Deployment Guide — Free Demo Hosting

This gets Milestone 1 live on a public URL for demo purposes, using only free tiers:
- **Render** → FastAPI backend + PostgreSQL
- **MongoDB Atlas** → free Mongo cluster (product/ingredient catalog)
- **Vercel** → React frontend

Total time: ~20-30 minutes. No credit card required for any of these tiers.

---

## Step 1: Push your code to GitHub
If you haven't already:
```bash
cd skincare-planner
git init
git add .
git commit -m "Milestone 1: Foundation"
git branch -M main
git remote add origin https://github.com/nasheersd/skincare-planner.git
git push -u origin main
```

---

## Step 2: MongoDB Atlas (free Mongo database)
1. Go to https://www.mongodb.com/cloud/atlas/register and sign up (free, no card).
2. Create a free **M0 cluster** (pick any nearby region, e.g. Mumbai).
3. Under **Database Access**, create a DB user + password.
4. Under **Network Access**, click "Allow Access from Anywhere" (0.0.0.0/0) — fine for a demo.
5. Click **Connect → Drivers**, copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/
   ```
6. Save this — you'll paste it into Render's environment variables as `MONGO_URL`.

---

## Step 3: Render (backend + PostgreSQL)

### 3a. Create the PostgreSQL database
1. Go to https://render.com and sign up (free, GitHub login works).
2. Dashboard → **New → PostgreSQL**. Name it `skincare-db`, free tier.
3. Once created, copy the **Internal Database URL** (starts with `postgresql://`).

### 3b. Create the backend web service
1. Dashboard → **New → Web Service** → connect your GitHub repo `skincare-planner`.
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** Free
3. Add environment variables (Environment tab):
   | Key | Value |
   |---|---|
   | `POSTGRES_URL` | (the Internal Database URL from step 3a) |
   | `MONGO_URL` | (the Atlas connection string from step 2) |
   | `MONGO_DB_NAME` | `skincare_catalog` |
   | `JWT_SECRET_KEY` | any long random string |
   | `JWT_ALGORITHM` | `HS256` |
   | `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` |
4. Click **Create Web Service**. Render will build and deploy automatically.
5. Once live, note your backend URL, e.g. `https://skincare-backend.onrender.com`.
6. Update CORS: in `backend/app/main.py`, change `allow_origins` to include your future Vercel URL (see Step 5), then commit + push (Render auto-redeploys).

### 3c. Seed the MongoDB catalog
From your local machine, with `MONGO_URL` pointed at Atlas in your `.env`:
```bash
cd backend
python -m seed.seed_db
```

> **Free tier note:** Render's free web services spin down after 15 min of inactivity and take ~30-60 seconds to wake up on the next request. Fine for a demo, just give it a moment on first load.

---

## Step 4: Vercel (frontend)
1. Go to https://vercel.com and sign up (GitHub login).
2. **Add New → Project** → import `skincare-planner`.
3. Settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Before deploying, update `frontend/src/api/axios.js` to point at your live backend instead of localhost:
   ```js
   const api = axios.create({
     baseURL: "https://skincare-backend.onrender.com/api",
   });
   ```
   Commit and push this change — Vercel will redeploy automatically on push.
5. Click **Deploy**. You'll get a URL like `https://skincare-planner.vercel.app`.

---

## Step 5: Final CORS fix
Back in `backend/app/main.py`, update:
```python
allow_origins=["https://skincare-planner.vercel.app", "http://localhost:5173"],
```
Commit + push → Render redeploys automatically.

---

## Step 6: Verify
1. Visit `https://skincare-backend.onrender.com/api/health` → `{"status": "ok", ...}`
2. Visit your Vercel URL → Register → Login → fill Skin Profile → log a Lifestyle entry.

---

## Quick reference — what lives where
| Piece | Platform | Free tier limits |
|---|---|---|
| React frontend | Vercel | Generous free tier, no sleep |
| FastAPI backend | Render | Sleeps after 15 min idle, wakes in ~30-60s |
| PostgreSQL | Render | Free for 90 days, then needs upgrade/migration |
| MongoDB | Atlas | Free M0 cluster, permanent (512MB storage) |

**Note on Render's free Postgres:** it expires after 90 days on the free plan. Fine for a demo/evaluation window, but flag this if the project continues past that.
