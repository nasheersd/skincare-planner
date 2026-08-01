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


from bson import ObjectId
from datetime import datetime

@router.post("/user/{user_id}", status_code=201)
def recommend_products_to_user(
    user_id: str,
    payload: dict,  # {"product_ids": ["..."], "notes": "..."}
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [models.RoleEnum.administrator, models.RoleEnum.skincare_consultant, models.RoleEnum.dermatologist]:
        raise HTTPException(
            status_code=403,
            detail="Only consultants, dermatologists, or administrators can recommend products."
        )
    
    # Verify patient exists
    patient = db.query(models.User).filter(models.User.id == user_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient/user not found")
        
    mongo = get_mongo_db()
    recommendation = {
        "user_id": user_id,
        "consultant_id": current_user.id,
        "consultant_name": current_user.full_name,
        "product_ids": payload.get("product_ids", []),
        "notes": payload.get("notes", ""),
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Upsert recommendation
    mongo.consultant_recommendations.update_one(
        {"user_id": user_id},
        {"$set": recommendation},
        upsert=True
    )
    return {"status": "success", "message": "Recommendations saved successfully."}


@router.get("/user/{user_id}")
def get_user_recommendations(
    user_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_id == "me":
        user_id = current_user.id
    # Retrieve from MongoDB
    mongo = get_mongo_db()
    rec = mongo.consultant_recommendations.find_one({"user_id": user_id})
    if not rec:
        return {"product_ids": [], "notes": "", "products": []}
        
    product_ids = rec.get("product_ids", [])
    products_details = []
    
    # Retrieve each product detail from products collection
    for pid in product_ids:
        try:
            prod = mongo.products.find_one({"_id": ObjectId(pid)})
            if not prod:
                # Try finding by string ID just in case
                prod = mongo.products.find_one({"id": pid})
            if prod:
                prod["id"] = str(prod["_id"])
                del prod["_id"]
                products_details.append(prod)
        except Exception:
            # Fallback for non-ObjectId string matches
            prod = mongo.products.find_one({"id": pid})
            if prod:
                prod["id"] = str(prod["_id"])
                del prod["_id"]
                products_details.append(prod)
                
    return {
        "user_id": user_id,
        "consultant_name": rec.get("consultant_name", "Your Consultant"),
        "notes": rec.get("notes", ""),
        "products": products_details,
        "created_at": rec.get("created_at")
    }
