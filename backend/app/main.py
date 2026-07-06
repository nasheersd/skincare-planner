from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth, users, skin_profile, lifestyle, dermatologists

# Creates tables if they don't exist. In production, use Alembic migrations instead.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Skin Intelligence & Personalized Skincare Planner API",
    description="Milestone 1: Core foundation - auth, RBAC, user & skin profile, lifestyle tracking.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://skincare-planner.vercel.app", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(dermatologists.router)
app.include_router(skin_profile.router)
app.include_router(lifestyle.router)


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "milestone": "1 - Foundation"}
