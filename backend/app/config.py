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
    RATE_LIMIT_RISK: int = 30
    RATE_LIMIT_ROUTE_ANALYSIS: int = 5
    RATE_LIMIT_RECOMMENDATIONS: int = 30

    # AI report-analysis provider. Any OpenAI-compatible chat/completions
    # endpoint works (Google Gemini's OpenAI-compat layer, Groq, OpenAI,
    # OpenRouter, etc.) - see README for a free key source.
    AI_API_KEY: str = ""
    AI_API_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/openai"
    AI_MODEL: str = "gemini-2.0-flash"
    AI_TIMEOUT_SECONDS: float = 10.0
    AI_MAX_RETRIES: int = 2
    AI_MAX_INPUT_CHARS: int = 600

    # Pattern detection (clustering). All thresholds configurable, never
    # hardcoded - see SheSignal Phase 0 doc, section 3/9.
    CLUSTER_MIN_REPORTS: int = 3
    CLUSTER_LOOKBACK_DAYS: int = 90
    CLUSTER_GEOHASH_PRECISION: int = 7
    PATTERN_RECOMPUTE_INTERVAL_SECONDS: int = 300

    # Deterministic risk engine. Weights don't need to sum to 1 - they're
    # normalized at scoring time - but keeping them proportionate to 1.0
    # makes them easier to reason about.
    RISK_WEIGHT_DENSITY: float = 0.35
    RISK_WEIGHT_SEVERITY: float = 0.35
    RISK_WEIGHT_RECENCY: float = 0.20
    RISK_WEIGHT_DIVERSITY: float = 0.10

    RISK_LEVEL_LOW_MAX: int = 33
    RISK_LEVEL_MODERATE_MAX: int = 66

    RISK_DEFAULT_RADIUS_METERS: float = 500
    RISK_MAX_RADIUS_METERS: float = 3000
    RISK_DENSITY_SATURATION_REPORTS: int = 20
    RISK_RECENCY_HALF_LIFE_DAYS: int = 30

    RISK_CACHE_TTL_SECONDS: int = 120
    RISK_CACHE_COORD_PRECISION: int = 3

    # Route safety (Phase 5). Any provider speaking the OpenRouteService
    # Directions/geojson wire format works - see README for a free key source.
    ROUTE_PROVIDER_API_KEY: str = ""
    ROUTE_PROVIDER_BASE_URL: str = "https://api.openrouteservice.org/v2/directions"
    ROUTE_PROFILE: str = "foot-walking"
    ROUTE_TIMEOUT_SECONDS: float = 10.0
    ROUTE_MAX_RETRIES: int = 2

    ROUTE_MAX_DISTANCE_METERS: float = 15000
    ROUTE_MAX_SEGMENTS: int = 30
    ROUTE_SEGMENT_TARGET_LENGTH_METERS: float = 250
    ROUTE_SEGMENT_RISK_RADIUS_METERS: float = 150

    ROUTE_OVERALL_AVG_WEIGHT: float = 0.5
    ROUTE_OVERALL_MAX_WEIGHT: float = 0.5

    ROUTE_CACHE_TTL_SECONDS: int = 300
    ROUTE_CACHE_COORD_PRECISION: int = 4

    # Recommendations (Phase 6). Reuses RISK_DEFAULT_RADIUS_METERS /
    # RISK_MAX_RADIUS_METERS / RISK_CACHE_COORD_PRECISION rather than
    # duplicating radius/precision config - same "nearby patterns" lookup.
    RECOMMENDATIONS_MAX_FACTORS: int = 5
    RECOMMENDATIONS_CACHE_TTL_SECONDS: int = 120

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ALLOWED_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()