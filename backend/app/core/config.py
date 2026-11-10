import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Multi-Agent Market Research Platform (MARP) API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "marp-super-secret-key-production-fyp-2026-secure-token")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Defaults to SQLite for immediate local zero-dependency operation, easily overridden with PostgreSQL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./marp.db")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    # Admin seed configuration
    FIRST_SUPERUSER_EMAIL: str = os.getenv("FIRST_SUPERUSER_EMAIL", "admin@marp.io")
    FIRST_SUPERUSER_PASSWORD: str = os.getenv("FIRST_SUPERUSER_PASSWORD", "Admin12345!")
    FIRST_SUPERUSER_NAME: str = os.getenv("FIRST_SUPERUSER_NAME", "System Administrator")
    DEFAULT_COMPANY_NAME: str = os.getenv("DEFAULT_COMPANY_NAME", "SZABIST Research Labs")
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()
