"""
Seeds a demo dermatologist account with contact profile.
Run with: python -m seed.seed_users   (from the backend/ directory, with venv activated)
"""
from app.auth import hash_password
from app.database import SessionLocal, Base, engine
from app.models import User, DermatologistProfile, RoleEnum

DEMO_DERMATOLOGIST = {
    "full_name": "Dr. Sarah Chen",
    "email": "dr.sarah.chen@skincareplanner.com",
    "password": "Dermatologist1",
    "phone": "+1 (555) 234-7890",
    "clinic_name": "Radiance Dermatology Clinic",
    "specialty": "Clinical & cosmetic dermatology",
    "bio": "Board-certified dermatologist with 12 years of experience in acne, eczema, and personalized skincare plans.",
}


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == DEMO_DERMATOLOGIST["email"]).first()
        if existing:
            print(f"Dermatologist already exists: {DEMO_DERMATOLOGIST['email']}")
            return

        user = User(
            full_name=DEMO_DERMATOLOGIST["full_name"],
            email=DEMO_DERMATOLOGIST["email"],
            hashed_password=hash_password(DEMO_DERMATOLOGIST["password"]),
            role=RoleEnum.dermatologist,
        )
        db.add(user)
        db.flush()

        profile = DermatologistProfile(
            user_id=user.id,
            phone=DEMO_DERMATOLOGIST["phone"],
            clinic_name=DEMO_DERMATOLOGIST["clinic_name"],
            specialty=DEMO_DERMATOLOGIST["specialty"],
            bio=DEMO_DERMATOLOGIST["bio"],
        )
        db.add(profile)
        db.commit()
        print(f"Seeded dermatologist: {DEMO_DERMATOLOGIST['full_name']} ({DEMO_DERMATOLOGIST['email']})")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
