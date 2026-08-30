"""
Combines per-segment risk scores (already computed by app/risk/engine.py)
into one overall route score/level/explanation. Pure and deterministic -
weights toward the worst segment on purpose, since a route's danger is
dominated by its riskiest stretch, not diluted by averaging over many safe
ones.
"""
from typing import List

from app.config import Settings
from app.risk.engine import determine_risk_level
from app.models.risk import RiskLevel


def combine_segment_scores(segment_scores: List[int], settings: Settings) -> int:
    if not segment_scores:
        return 0

    avg_score = sum(segment_scores) / len(segment_scores)
    max_score = max(segment_scores)

    total_weight = settings.ROUTE_OVERALL_AVG_WEIGHT + settings.ROUTE_OVERALL_MAX_WEIGHT
    if total_weight <= 0:
        return 0

    combined = (
        avg_score * settings.ROUTE_OVERALL_AVG_WEIGHT + max_score * settings.ROUTE_OVERALL_MAX_WEIGHT
    ) / total_weight
    return max(0, min(100, round(combined)))


def build_route_explanation(
    segment_levels: List[RiskLevel], overall_level: RiskLevel
) -> str:
    total = len(segment_levels)
    elevated = sum(1 for lvl in segment_levels if lvl in ("moderate", "high"))

    if total == 0:
        return "No route data was available to assess."

    if elevated == 0:
        return (
            f"This route's {total} segments show no recurring reported safety "
            "concerns in the recent lookback window."
        )

    plural_segments = "segment" if elevated == 1 else "segments"
    return (
        f"{elevated} of {total} route {plural_segments} pass through areas with "
        f"reported safety concerns, giving this route an overall {overall_level} "
        "reported risk. Review the individual segments below for details."
    )