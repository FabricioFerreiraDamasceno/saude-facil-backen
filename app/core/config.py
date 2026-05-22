from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    MONGO_URL: str
    DB_NAME: str
    JWT_SECRET: str
    
    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str

    ADMIN2_EMAIL: str
    ADMIN2_USERNAME: str | None = None
    ADMIN2_PASSWORD: str
    ADMIN2_NAME: str
    

    ASAAS_API_KEY: str = ""  # Valor padrão vazio
    ASAAS_ENVIRONMENT: str = "sandbox"  # Pode ser "sandbox" ou "production"
    class Config:
        env_file = ".env"
        case_sensitive = True
        case_sensitive = False

@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()