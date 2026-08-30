import time

from app import database
from app.config import get_settings


_last_recompute_at = 0.0


def reset_recompute_state() -> None:
    """Clear the local recomputation throttle (used by tests)."""
    global _last_recompute_at
    _last_recompute_at = 0.0


def maybe_recompute_patterns() -> None:
    """Recompute patterns when the configured interval has elapsed."""
    global _last_recompute_at

    settings = get_settings()
    now = time.time()

    if (
        _last_recompute_at != 0.0
        and now - _last_recompute_at < settings.PATTERN_RECOMPUTE_INTERVAL_SECONDS
    ):
        return

    try:
        database.recompute_patterns(
            min_reports=settings.CLUSTER_MIN_REPORTS,
            lookback_days=settings.CLUSTER_LOOKBACK_DAYS,
            geohash_precision=settings.CLUSTER_GEOHASH_PRECISION,
        )
        _last_recompute_at = now
    except Exception:
        return