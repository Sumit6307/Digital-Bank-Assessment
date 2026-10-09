import os
from typing import Optional

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
    class Settings(BaseSettings):
        GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "")
        OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", "")
        GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY", "")
        ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY", "")
        DEFAULT_PROVIDER: str = "gemini"  # gemini, openai, groq, local
        DEFAULT_MODEL: str = "gemini-2.5-flash"
        HOST: str = "0.0.0.0"
        PORT: int = 8000
        CORS_ORIGINS: list = ["*"]
        model_config = SettingsConfigDict(env_file=".env", extra="ignore")
except Exception:
    class Settings:
        GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "")
        OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", "")
        GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY", "")
        ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY", "")
        DEFAULT_PROVIDER: str = "gemini"
        DEFAULT_MODEL: str = "gemini-2.5-flash"
        HOST: str = "0.0.0.0"
        PORT: int = 8000
        CORS_ORIGINS: list = ["*"]

settings = Settings()

# Dynamic runtime config store
runtime_config = {
    "provider": settings.DEFAULT_PROVIDER,
    "model": settings.DEFAULT_MODEL,
    "gemini_api_key": settings.GEMINI_API_KEY,
    "openai_api_key": settings.OPENAI_API_KEY,
    "groq_api_key": settings.GROQ_API_KEY,
    "anthropic_api_key": settings.ANTHROPIC_API_KEY,
    "custom_endpoint": "",
    "enable_self_healing": True,
    "max_repair_attempts": 3
}
