import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.scoring_engine import (
    calculate_skin_health_score,
    calculate_s_cond,
    calculate_l_habits,
    calculate_s_sleep,
    calculate_h_hydro,
    calculate_r_consist
)
from app.routers.assessment import generate_default_routine
from app import models

# In-memory SQLite for self-contained testing of database operations
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def test_math_and_score_precision():
    """
    Test 1: Math & Score Precision
    Ensure perfect metrics (no concerns, 8 hours sleep, perfect environment) yields exactly 100.0.
    """
    s_cond = calculate_s_cond([])  # No concerns
    l_habits = calculate_l_habits("clean air, indoor")
    s_sleep = calculate_s_sleep(8.0)  # 8 hours sleep
    h_hydro = calculate_h_hydro(2.0)  # 2.0L water
    r_consist = calculate_r_consist([], 0)  # No routine logs / empty steps = 100% consistency

    # Verify component scores
    assert s_cond == 100.0
    assert l_habits == 100.0
    assert s_sleep == 100.0
    assert h_hydro == 100.0
    assert r_consist == 100.0

    # Verify overall score is exactly 100.0
    overall = calculate_skin_health_score(s_cond, l_habits, s_sleep, r_consist, h_hydro)
    assert overall == 100.0


def test_routine_safety_boundaries():
    """
    Test 2: Routine Safety Boundaries
    Ensure that when skin is sensitive, harsh chemical exfoliants and treatments are dropped or swapped.
    """
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    import uuid

    try:
        # Create a mock user in SQLite database with a valid UUID
        user = models.User(
            id=str(uuid.uuid4()),
            full_name="Sensitive Test User",
            email="sensitive@example.com",
            hashed_password="bcrypt_hash_placeholder",
            role=models.RoleEnum.user
        )
        db.add(user)
        db.commit()


        # Generate routine for oily skin but flagged as sensitive
        # (Oily baseline AM steps: [Cleansing, Treatment, Sun Protection], PM: [Cleansing, Treatment, Night Care])
        # Sensitive override should swap "Treatment" and weekly "Exfoliation" with safe alternatives.
        steps = generate_default_routine(
            user_id=user.id,
            skin_type="oily",
            primary_concern="Acne",
            is_sensitive=True,
            db=db
        )

        categories = [s.step_category for s in steps]
        
        # Assert harsh categories are excluded
        assert "Treatment" not in categories
        assert "Exfoliation" not in categories

        # Assert moisturizing/gentle mask alternatives are added
        assert "Moisturizing" in categories
        assert "Gentle Mask" in categories

    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
