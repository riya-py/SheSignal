import time
from collections import defaultdict
from threading import Lock

from fastapi import HTTPException, status

class InMemoryRateLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def check(self, key: str, limit_per_minute: int) -> None:
        now = time.time()
        window_start = now - 60

        with self._lock:
            hits = [t for t in self._hits[key] if t > window_start]
            if len(hits) >= limit_per_minute:
                self._hits[key] = hits
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded. Please slow down and try again shortly.",
                )
            hits.append(now)
            self._hits[key] = hits

    def reset(self) -> None:
        """Test helper only."""
        with self._lock:
            self._hits.clear()


limiter = InMemoryRateLimiter()