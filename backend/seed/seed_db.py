"""
Populates MongoDB with the initial skincare product & ingredient catalog.
Run with: python -m seed.seed_db   (from the backend/ directory, with venv activated)
"""
import json
from pathlib import Path

from app.database import get_mongo_db

SEED_DIR = Path(__file__).parent


def seed():
    db = get_mongo_db()

    with open(SEED_DIR / "ingredients.json") as f:
        ingredients = json.load(f)
    with open(SEED_DIR / "products.json") as f:
        products = json.load(f)

    db.ingredients.delete_many({})
    db.products.delete_many({})

    db.ingredients.insert_many(ingredients)
    db.products.insert_many(products)

    print(f"Seeded {len(ingredients)} ingredients and {len(products)} products into MongoDB.")


if __name__ == "__main__":
    seed()
