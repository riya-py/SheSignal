"""
Caches a full route-risk result by (origin, destination) so a repeated or
near-repeated request (e.g. a user re-checking the same commute) doesn't
re-hit the route provider and re-run every segment's pattern lookup.
"""
import time
from threading import Lock
from typing import Any, Optional, Tuple

CacheKey = Tuple[float, float, float, float]


class RouteCache:
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
        """Test helper only."""
        with self._lock:
            self._store.clear()


def build_cache_key(
    origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float, precision: int
) -> CacheKey:
    return (
        round(origin_lat, precision),
        round(origin_lng, precision),
        round(dest_lat, precision),
        round(dest_lng, precision),
    )


route_cache = RouteCache()