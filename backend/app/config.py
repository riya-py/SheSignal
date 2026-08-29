"""
Centralized environment/settings loading.
Never hardcode secrets or limits elsewhere in the codebase — read them from here.
"""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ENV: str = "dev"
    LOG_LEVEL: str = "INFO"

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""

    # CORS - comma separated list of allowed origins
    CORS_ALLOWED_ORIGINS: str = "http://localhost:5173"

    # Rate limits (requests per minute). Configurable, never hardcoded inline.
    RATE_LIMIT_REPORTS: int = 5
    RATE_LIMIT_PUBLIC_API: int = 60
    RATE_LIMIT_AUTH: int = 20
    RATE_LIMIT_AI: int = 10

    # AI report-analysis provider. Any OpenAI-compatible chat/completions
    # endpoint works (Google Gemini's OpenAI-compat layer, Groq, OpenAI,
    # OpenRouter, etc.) - see README for a free key source.
    AI_API_KEY: str = ""
    AI_API_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/openai"
    AI_MODEL: str = "gemini-2.0-flash"
    AI_TIMEOUT_SECONDS: float = 10.0
    AI_MAX_RETRIES: int = 2
    AI_MAX_INPUT_CHARS: int = 600

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ALLOWED_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()