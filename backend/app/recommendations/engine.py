from typing import Any, Dict, List, Optional, Tuple

from app.models.recommendation import Recommendation
from app.models.risk import ContributingFactor
from app.recommendations.templates import FACTOR_RECOMMENDATIONS
from app.risk.engine import top_contributing_factors, total_reports

# Maps the overall zone risk_level (from app.risk.engine) onto the
# authority-facing "priority" recommendation, so the badge shown here
# always agrees with the score shown on the risk screen.
PRIORITY_BY_RISK_LEVEL: Dict[str, str] = {"low": "low", "moderate": "medium", "high": "high"}
PRIORITY_LABEL: Dict[str, str] = {"low": "Low", "medium": "Medium", "high": "High"}


def _factor_label(factor: str) -> str:
    return factor.replace("_", " ")


def _personal_action_text(reports: int) -> str:
    if reports >= 5:
        return "Consider sharing your live location with a trusted contact while passing through here."
    return "Let a trusted contact know your route and expected arrival time."


def _report_action_text() -> str:
    return "Notice this again? Submit a new report so this area's safety picture stays current."


def _priority_text(priority: str, reports: int) -> str:
    plural = "report" if reports == 1 else "reports"
    return (
        f"Priority: {PRIORITY_LABEL[priority]} - based on {reports} recent {plural} "
        "and the area's current risk level."
    )


def _hotspot_insight_text(
    reports: int, pattern_count: int, top_factor: Optional[ContributingFactor]
) -> str:
    area = "pattern area" if pattern_count == 1 else "pattern areas"
    base = f"{reports} anonymous report(s) recorded across {pattern_count} {area} near this location."
    if top_factor is None:
        return base
    share_pct = round(top_factor.share * 100)
    return (
        f"{base} The most frequently reported issue is {_factor_label(top_factor.factor)}, "
        f"making up {share_pct}% of reports."
    )


def build_recommendations(
    patterns: List[Dict[str, Any]],
    max_factors: int,
    risk_level: str = "low",
) -> Tuple[List[Recommendation], List[Recommendation], List[ContributingFactor], int, int]:
    reports = total_reports(patterns)
    pattern_count = len(patterns)
    factors = top_contributing_factors(patterns, max_factors=max_factors)

    if reports == 0:
        return [], [], factors, reports, pattern_count

    priority = PRIORITY_BY_RISK_LEVEL.get(risk_level, "low")
    # Only the single most-reported factor drives the specific route/warning/
    # intervention text - this is what makes the tips read as generated from
    # what was actually reported, rather than a menu of every possible issue.
    top_factor = factors[0] if factors else None
    template = FACTOR_RECOMMENDATIONS.get(top_factor.factor) if top_factor else None

    if template is not None:
        user_recs = [
            Recommendation(text=template["route"], factor=top_factor.factor, type="route"),
            Recommendation(text=template["warning"], factor=top_factor.factor, type="warning"),
            Recommendation(text=_personal_action_text(reports), type="personal_action"),
            Recommendation(text=_report_action_text(), type="report_action"),
        ]
        authority_recs = [
            Recommendation(text=template["intervention"], factor=top_factor.factor, type="intervention"),
            Recommendation(
                text=_priority_text(priority, reports), type="priority", priority=priority
            ),
            Recommendation(
                text=_hotspot_insight_text(reports, pattern_count, top_factor),
                factor=top_factor.factor,
                type="hotspot_insight",
            ),
            Recommendation(
                text=template["infrastructure_action"], factor=top_factor.factor, type="infrastructure_action"
            ),
        ]
        return user_recs, authority_recs, factors, reports, pattern_count

    # Reports exist but no specific factor data survived (e.g. AI analysis
    # failed for all of them) - fall back to a generic, count-grounded note
    # rather than inventing specifics.
    plural = "report" if reports == 1 else "reports"
    user_recs = [
        Recommendation(
            text=(
                f"{reports} safety {plural} have been made in this area recently. "
                "Stay aware of your surroundings and consider extra caution."
            ),
            type="warning",
        ),
        Recommendation(text=_personal_action_text(reports), type="personal_action"),
        Recommendation(text=_report_action_text(), type="report_action"),
    ]
    authority_recs = [
        Recommendation(
            text=(
                f"{reports} anonymous safety {plural} have been logged in this area "
                "recently. Consider reviewing for potential intervention."
            ),
            type="intervention",
        ),
        Recommendation(text=_priority_text(priority, reports), type="priority", priority=priority),
        Recommendation(text=_hotspot_insight_text(reports, pattern_count, None), type="hotspot_insight"),
    ]
    return user_recs, authority_recs, factors, reports, pattern_count