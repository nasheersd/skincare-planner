# Database Schema

Two databases are used deliberately:
- **PostgreSQL** — relational, constraint-heavy data (users, profiles, tracking).
- **MongoDB** — flexible, catalog-style data (products, ingredients) that will expand with AI-driven attributes later.

---

## PostgreSQL — Entity Relationship Diagram (textual)

```
users (1) ──────< (1) skin_profiles
   │
   ├──────< (many) lifestyle_entries
   │
   └──────< (many) progress_entries
```

## Table: `users`
| Column          | Type      | Constraints                          |
|-----------------|-----------|---------------------------------------|
| id              | UUID      | PK                                    |
| full_name       | VARCHAR   | NOT NULL                              |
| email           | VARCHAR   | UNIQUE, NOT NULL, indexed             |
| hashed_password | VARCHAR   | NOT NULL                              |
| role            | ENUM      | NOT NULL — user/skincare_consultant/dermatologist/administrator |
| is_active       | BOOLEAN   | DEFAULT TRUE                          |
| created_at      | TIMESTAMP | DEFAULT now()                         |
| updated_at      | TIMESTAMP | auto-updated                          |

## Table: `skin_profiles`
| Column               | Type      | Constraints                       |
|----------------------|-----------|------------------------------------|
| id                   | UUID      | PK                                  |
| user_id              | UUID      | FK → users.id, UNIQUE, ON DELETE CASCADE |
| age                  | INTEGER   | nullable                            |
| gender               | VARCHAR   | nullable                            |
| skin_type            | ENUM      | oily/dry/combination/normal/sensitive |
| skin_concerns        | TEXT      | comma-separated (e.g. acne, dullness) |
| allergies            | TEXT      | comma-separated                     |
| skin_sensitivities   | TEXT      | comma-separated                     |
| created_at           | TIMESTAMP | DEFAULT now()                       |
| updated_at           | TIMESTAMP | auto-updated                        |

## Table: `lifestyle_entries`
| Column                  | Type    | Constraints                             |
|-------------------------|---------|-------------------------------------------|
| id                      | UUID    | PK                                        |
| user_id                 | UUID    | FK → users.id, ON DELETE CASCADE          |
| entry_date              | DATE    | NOT NULL                                  |
| sleep_hours             | FLOAT   | nullable                                  |
| water_intake_liters     | FLOAT   | nullable                                  |
| exercise_minutes        | INTEGER | nullable                                  |
| stress_level            | INTEGER | 1 (low) – 5 (high)                        |
| environmental_exposure  | VARCHAR | free text (e.g. "high pollution")         |
| created_at              | TIMESTAMP | DEFAULT now()                           |
| **Constraint**          |         | UNIQUE(user_id, entry_date)               |

## Table: `progress_entries`
| Column           | Type    | Constraints                    |
|------------------|---------|----------------------------------|
| id               | UUID    | PK                               |
| user_id          | UUID    | FK → users.id, ON DELETE CASCADE |
| entry_date       | DATE    | NOT NULL                         |
| notes            | TEXT    | nullable                         |
| photo_url        | VARCHAR | nullable                         |
| hydration_score  | INTEGER | nullable                         |
| breakout_count   | INTEGER | nullable                         |
| created_at       | TIMESTAMP | DEFAULT now()                  |

---

## MongoDB — Collections

### `products`
```json
{
  "name": "10% Niacinamide Serum",
  "brand": "ClearSkin Labs",
  "category": "Serum",
  "suitable_skin_types": ["oily", "combination"],
  "key_ingredients": ["Niacinamide"],
  "price_inr": 599,
  "description": "..."
}
```

### `ingredients`
```json
{
  "name": "Niacinamide",
  "category": "Active",
  "benefits": ["Reduces oil production", "Minimizes pores"],
  "suitable_skin_types": ["oily", "combination", "normal"],
  "common_concerns_addressed": ["acne", "dullness"],
  "typical_concentration_range": "2-10%"
}
```

Products reference ingredients by name (`key_ingredients`), which is joined in application logic. This is intentional for Milestone 1 — a normalized relational mapping can be introduced once AI-driven matching logic (Milestone 2+) defines its exact query patterns.
