"""Rule-based product recommendations from skin profile + MongoDB catalog."""

from __future__ import annotations

from typing import Any

CONCERN_SYNONYMS: dict[str, str] = {
    "redness": "sensitivity",
    "rosacea": "sensitivity",
    "irritation": "sensitivity",
    "wrinkles": "aging",
    "anti-aging": "aging",
    "anti aging": "aging",
    "dark spots": "hyperpigmentation",
    "dark spot": "hyperpigmentation",
    "pigmentation": "hyperpigmentation",
    "uneven tone": "hyperpigmentation",
    "melasma": "hyperpigmentation",
    "pimples": "acne",
    "breakouts": "acne",
    "blemishes": "acne",
    "spots": "acne",
    "pores": "enlarged pores",
    "large pores": "enlarged pores",
    "flaky skin": "dryness",
    "dehydrated": "dehydration",
    "rough skin": "texture",
    "uneven texture": "texture",
    "whiteheads": "blackheads",
}


def parse_concerns(raw: str | None) -> list[str]:
    if not raw:
        return []
    concerns: list[str] = []
    for part in raw.split(","):
        normalized = part.strip().lower()
        if not normalized:
            continue
        concerns.append(CONCERN_SYNONYMS.get(normalized, normalized))
    return concerns


def _ingredient_concerns(ingredient: dict[str, Any]) -> set[str]:
    return {c.lower() for c in ingredient.get("common_concerns_addressed", [])}


def score_product(
    product: dict[str, Any],
    skin_type: str,
    user_concerns: list[str],
    ingredient_map: dict[str, dict[str, Any]],
) -> tuple[int, list[str]] | None:
    suitable = product.get("suitable_skin_types", [])
    if skin_type not in suitable:
        return None

    score = 2  # base score for skin type match
    matched: set[str] = set()
    product_concerns: set[str] = set()

    for ing_name in product.get("key_ingredients", []):
        ingredient = ingredient_map.get(ing_name)
        if not ingredient:
            continue
        product_concerns |= _ingredient_concerns(ingredient)

    if user_concerns:
        for concern in user_concerns:
            for product_concern in product_concerns:
                if concern == product_concern or concern in product_concern or product_concern in concern:
                    score += 2
                    matched.add(product_concern)
        if not matched:
            score = 1  # skin type only — lower priority when concerns are specified
    else:
        matched = product_concerns

    return score, sorted(matched)


def get_recommendations(
    skin_type: str,
    skin_concerns: str | None,
    products: list[dict[str, Any]],
    ingredients: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    user_concerns = parse_concerns(skin_concerns)
    ingredient_map = {i["name"]: i for i in ingredients}

    results: list[dict[str, Any]] = []
    for product in products:
        scored = score_product(product, skin_type, user_concerns, ingredient_map)
        if scored is None:
            continue
        score, matched_concerns = scored
        if user_concerns and score < 2:
            continue

        results.append({
            "id": str(product["_id"]),
            "name": product["name"],
            "brand": product["brand"],
            "category": product["category"],
            "suitable_skin_types": product["suitable_skin_types"],
            "key_ingredients": product["key_ingredients"],
            "price_inr": product["price_inr"],
            "description": product["description"],
            "match_score": score,
            "matched_concerns": matched_concerns,
        })

    results.sort(key=lambda r: (-r["match_score"], r["category"], r["name"]))
    return results
