from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    postgres_url: str = "postgresql://skincare_user:changeme@localhost:5432/skincare_db"
    mongo_url: str = "mongodb://localhost:27017"
    mongo_db_name: str = "skincare_catalog"

    jwt_secret_key: str = "replace-this-with-a-long-random-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    environment: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()
