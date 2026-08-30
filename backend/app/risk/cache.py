"""Small in-memory cache for deterministic risk assessments."""
import time
from threading import Lock
from typing import Any, Optional, Tuple

CacheKey = Tuple[float, float, float]


class RiskCache:
    def __init__(self) -> None:
        self._store: dict[CacheKey, Tuple[Any, float]] = {}
        self._lock = Lock()

    def get(self, key: CacheKey) -> Optional[Any]:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            value, expires_at = entry
            if time.time() > expires_at:
                del self._store[key]
                return None
            return value

    def set(self, key: CacheKey, value: Any, ttl_seconds: float) -> None:
        with self._lock:
            self._store[key] = (value, time.time() + ttl_seconds)

    def reset(self) -> None:
        with self._lock:
            self._store.clear()


def build_cache_key(
    latitude: float, longitude: float, radius_meters: float, precision: int
) -> CacheKey:
    return (
        round(latitude, precision),
        round(longitude, precision),
        round(radius_meters),
    )


risk_cache = RiskCache()