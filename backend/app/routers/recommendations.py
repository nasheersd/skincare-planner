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
        import json
        import os
        prod_path = os.path.join("seed", "products.json")
        ing_path = os.path.join("seed", "ingredients.json")
        if os.path.exists(prod_path) and os.path.exists(ing_path):
            with open(prod_path, "r", encoding="utf-8") as f:
                seeded_products = json.load(f)
            with open(ing_path, "r", encoding="utf-8") as f:
                seeded_ingredients = json.load(f)
            
            if seeded_products:
                mongo.products.insert_many(seeded_products)
            if seeded_ingredients:
                mongo.ingredients.insert_many(seeded_ingredients)
                
            products = list(mongo.products.find())
            ingredients = list(mongo.ingredients.find())
        else:
            raise HTTPException(
                status_code=503,
                detail="Product catalog is empty and seed files could not be found.",
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


@router.post("/", status_code=201)
def create_product(
    payload: schemas.ProductCreateIn,
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role not in [models.RoleEnum.administrator, models.RoleEnum.skincare_consultant]:
        raise HTTPException(
            status_code=403,
            detail="Only skincare consultants or administrators can add products to the catalog."
        )

    mongo = get_mongo_db()
    product_dict = payload.model_dump()
    result = mongo.products.insert_one(product_dict)
    product_dict["id"] = str(result.inserted_id)
    del product_dict["_id"]
    return product_dict
