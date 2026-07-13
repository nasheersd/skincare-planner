from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine
from app.routers import auth, users, skin_profile, lifestyle, dermatologists, recommendations, appointments, progress, workspace, assessment, routine

# Creates tables if they don't exist. In production, use Alembic migrations instead.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Skin Intelligence & Personalized Skincare Planner API",
    description="Milestone 2: Brain - scoring, routines, and assessments.",
    version="0.2.0",
)

app.mount("/static", StaticFiles(directory="static"), name="static")

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
app.include_router(appointments.router)
app.include_router(progress.router)
app.include_router(workspace.router)
app.include_router(recommendations.router)
app.include_router(skin_profile.router)
app.include_router(lifestyle.router)
app.include_router(assessment.router)
app.include_router(routine.router)



@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "milestone": "1 - Foundation"}
