# API Endpoints — Milestone 1

Base URL (local dev): `http://localhost:8000/api`

## Authentication
| Method | Endpoint         | Auth Required | Description                          |
|--------|------------------|----------------|----------------------------------------|
| POST   | `/auth/register` | No             | Register a new user (any role)         |
| POST   | `/auth/login`    | No             | Login, returns JWT (`access_token`)    |

## Users
| Method | Endpoint      | Auth Required        | Description                       |
|--------|---------------|------------------------|-------------------------------------|
| GET    | `/users/me`   | Yes (any role)         | Get current logged-in user's info   |
| GET    | `/users/`     | Yes (administrator)    | List all users (admin only)         |

## Skin Profile
| Method | Endpoint          | Auth Required   | Description                              |
|--------|-------------------|-------------------|---------------------------------------------|
| GET    | `/skin-profile/`  | Yes (owner)       | Get the logged-in user's skin profile       |
| PUT    | `/skin-profile/`  | Yes (owner)       | Create or update the skin profile           |

## Lifestyle Tracking
| Method | Endpoint       | Auth Required | Description                                  |
|--------|----------------|------------------|--------------------------------------------------|
| GET    | `/lifestyle/`  | Yes (owner)      | List all lifestyle entries for logged-in user     |
| POST   | `/lifestyle/`  | Yes (owner)      | Create a new lifestyle entry for a given date     |

## Health
| Method | Endpoint       | Auth Required | Description             |
|--------|----------------|------------------|---------------------------|
| GET    | `/health`      | No               | Basic service health check |

---

## Authentication Flow
1. `POST /auth/register` → creates user with hashed password (bcrypt).
2. `POST /auth/login` → validates credentials, returns a JWT (`sub`=user id, `role`=user role).
3. Client stores JWT and sends it as `Authorization: Bearer <token>` on every subsequent request.
4. Backend decodes the JWT on each protected route via the `get_current_user` dependency.
5. RBAC dependency (`require_roles`) further restricts specific endpoints (e.g. `/users/` is administrator-only).

## Roles & Access
| Role                  | Access Level                                                |
|-----------------------|---------------------------------------------------------------|
| user                  | Own profile, own lifestyle data, own progress data             |
| skincare_consultant   | (Scaffolded) — will access assigned users' profiles in a later milestone |
| dermatologist         | (Scaffolded) — will access assigned users' profiles + clinical notes |
| administrator         | Full access, including `/users/` (list all users)              |

Note: consultant/dermatologist cross-user access endpoints are intentionally not built in Milestone 1 (no AI/consultation features yet) but the role enum and RBAC dependency already support them.
