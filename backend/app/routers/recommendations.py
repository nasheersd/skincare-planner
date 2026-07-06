from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db, get_mongo_db
from app import models, schemas
from app.services.recommendations import get_recommendations, parse_concerns

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])


@router.get("/", response_model=schemas.RecommendationsOut)
def get_my_recommendations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(models.SkinProfile).filter(models.SkinProfile.user_id == current_user.id).first()
    if not profile or not profile.skin_type:
        raise HTTPException(
            status_code=400,
            detail="Complete your skin profile with a skin type before viewing recommendations.",
        )

    mongo = get_mongo_db()
    products = list(mongo.products.find())
    ingredients = list(mongo.ingredients.find())

    if not products:
        raise HTTPException(
            status_code=503,
            detail="Product catalog is empty. Run: python -m seed.seed_db",
        )

    skin_type = profile.skin_type.value
    concerns = parse_concerns(profile.skin_concerns)

    recommendations = get_recommendations(
        skin_type=skin_type,
        skin_concerns=profile.skin_concerns,
        products=products,
        ingredients=ingredients,
    )

    return schemas.RecommendationsOut(
        skin_type=skin_type,
        skin_concerns=concerns,
        recommendations=recommendations,
    )
