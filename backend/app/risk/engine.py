from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple

from app.config import Settings
from app.models.risk import ContributingFactor


def total_reports(patterns: List[Dict[str, Any]]) -> int:
    return sum(int(pattern.get("report_count", 0) or 0) for pattern in patterns)


def density_score(report_count: int, saturation_reports: int) -> float:
    if saturation_reports <= 0:
        return 0.0
    return min(100.0, report_count / saturation_reports * 100.0)


def severity_score(patterns: List[Dict[str, Any]]) -> float:
    weights = {"low": 1.0, "medium": 2.0, "high": 3.0}
    weighted_total = 0.0
    report_total = 0

    for pattern in patterns:
        for severity, count in (pattern.get("severity_breakdown") or {}).items():
            count = int(count or 0)
            weighted_total += count * weights.get(str(severity).lower(), 0.0)
            report_total += count

    if report_total == 0:
        return 0.0

    return min(100.0, weighted_total / (report_total * 3.0) * 100.0)


def _parse_datetime(value: Any) -> datetime | None:
    if value is None:
        return None

    try:
        dt = value if isinstance(value, datetime) else datetime.fromisoformat(
            str(value).replace("Z", "+00:00")
        )
    except (TypeError, ValueError):
        return None

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)

    return dt.astimezone(timezone.utc)


def recency_score(
    patterns: List[Dict[str, Any]],
    now: datetime | None = None,
    half_life_days: int = 30,
) -> float:
    if not patterns or half_life_days <= 0:
        return 0.0

    now = now or datetime.now(timezone.utc)
    latest = max(
        (
            dt
            for pattern in patterns
            if (dt := _parse_datetime(pattern.get("last_report_at"))) is not None
        ),
        default=None,
    )

    if latest is None:
        return 0.0

    age_days = max(0.0, (now - latest).total_seconds()) / 86400.0
    return 100.0 * 0.5 ** (age_days / half_life_days)


def diversity_score(patterns: List[Dict[str, Any]]) -> float:
    factors = {
        str(factor)
        for pattern in patterns
        for factor, count in (pattern.get("factor_breakdown") or {}).items()
        if int(count or 0) > 0
    }
    return min(100.0, len(factors) / 4.0 * 100.0) if factors else 0.0


TIME_BUCKET_ORDER = ["morning", "afternoon", "evening", "night"]


def time_bucket_breakdown(patterns: List[Dict[str, Any]]) -> Dict[str, int]:
    """Report counts per time-of-day bucket, straight from the patterns
    table's own `time_bucket` column (see 0003_patterns.sql) - the same
    AI-derived/occurred_at-derived bucketing already used for clustering,
    just re-summed here instead of invented client-side."""
    breakdown = {bucket: 0 for bucket in TIME_BUCKET_ORDER}
    for pattern in patterns:
        bucket = pattern.get("time_bucket")
        if bucket in breakdown:
            breakdown[bucket] += int(pattern.get("report_count", 0) or 0)
    return breakdown


def combine_scores(
    density: float,
    severity: float,
    recency: float,
    diversity: float,
    settings: Settings,
) -> int:
    weights = {
        "density": settings.RISK_WEIGHT_DENSITY,
        "severity": settings.RISK_WEIGHT_SEVERITY,
        "recency": settings.RISK_WEIGHT_RECENCY,
        "diversity": settings.RISK_WEIGHT_DIVERSITY,
    }
    total_weight = sum(weights.values())

    if total_weight <= 0:
        return 0

    score = (
        density * weights["density"]
        + severity * weights["severity"]
        + recency * weights["recency"]
        + diversity * weights["diversity"]
    ) / total_weight

    return round(max(0.0, min(100.0, score)))


def determine_risk_level(score: float, settings: Settings) -> str:
    if score <= settings.RISK_LEVEL_LOW_MAX:
        return "low"
    if score <= settings.RISK_LEVEL_MODERATE_MAX:
        return "moderate"
    return "high"


def top_contributing_factors(
    patterns: List[Dict[str, Any]], max_factors: int = 5
) -> List[ContributingFactor]:
    if max_factors <= 0:
        return []

    counts: Dict[str, int] = {}
    for pattern in patterns:
        for factor, count in (pattern.get("factor_breakdown") or {}).items():
            count = int(count or 0)
            if count > 0:
                counts[str(factor)] = counts.get(str(factor), 0) + count

    total = sum(counts.values())
    if total == 0:
        return []

    return [
        ContributingFactor(factor=factor, count=count, share=count / total)
        for factor, count in sorted(counts.items(), key=lambda item: (-item[1], item[0]))[
            :max_factors
        ]
    ]


def build_explanation(
    risk_score: float,
    report_count: int,
    risk_level: str,
    factors: List[ContributingFactor],
) -> str:
    if report_count == 0:
        return (
            "There are no recurring safety concerns reported in this area "
            "within the available pattern data."
        )

    names = [factor.factor.replace("_", " ") for factor in factors[:3]]
    if len(names) == 1:
        suffix = f" The main reported factor is {names[0]}."
    elif len(names) == 2:
        suffix = f" The main reported factors are {names[0]} and {names[1]}."
    elif names:
        suffix = f" The main reported factors include {', '.join(names[:-1])}, and {names[-1]}."
    else:
        suffix = ""

    return (
        f"This area has a {risk_level} reported risk level based on "
        f"{report_count} report(s) represented by the available patterns.{suffix}"
    )


def compute_risk(
    patterns: List[Dict[str, Any]],
    settings: Settings,
    now: datetime | None = None,
) -> Tuple[int, str, List[ContributingFactor], str, int, int]:
    reports = total_reports(patterns)
    pattern_count = len(patterns)

    if not patterns or reports == 0:
        return 0, "low", [], build_explanation(0, 0, "low", []), 0, pattern_count

    score = combine_scores(
        density_score(reports, settings.RISK_DENSITY_SATURATION_REPORTS),
        severity_score(patterns),
        recency_score(patterns, now, settings.RISK_RECENCY_HALF_LIFE_DAYS),
        diversity_score(patterns),
        settings,
    )
    level = determine_risk_level(score, settings)
    factors = top_contributing_factors(patterns)

    return (
        score,
        level,
        factors,
        build_explanation(score, reports, level, factors),
        reports,
        pattern_count,
    )