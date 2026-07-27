import os
from typing import Optional
from pydantic_settings import BaseSettings

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, "..", ".env")

class Settings(BaseSettings):
    postgres_url: str = "postgresql://skincare_user:changeme@localhost:5432/skincare_db"
    mongo_url: str = "mongodb://localhost:27017"
    mongo_db_name: str = "skincare_catalog"
    jwt_secret_key: str = "replace-this-with-a-long-random-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    environment: str = "development"
    
    # SMTP Settings for forgot-password emails
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from_email: str = "noreply@skincareplanner.com"

    class Config:
        env_file = ENV_PATH

settings = Settings()
