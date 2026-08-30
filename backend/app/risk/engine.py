"""
Turns already-aggregated pattern data into recommendations. Reuses
app.risk.engine's factor aggregation (total_reports, top_contributing_factors)
rather than re-deriving it - same "grounded in actual database results"
guarantee the risk engine already provides.

Safeguards this module enforces by construction:
- recommendations only ever come from factors actually present in the
  aggregated data (FACTOR_RECOMMENDATIONS lookup keyed on real factor tags)
- no numbers are ever inserted into recommendation text except the real
  `reports` count already computed from the database
- language is calm and action-oriented, never alarmist (see templates.py)
- nothing here calls the AI layer - text is 100% deterministic templates
"""
from typing import Any, Dict, List, Tuple

from app.models.recommendation import Recommendation
from app.models.risk import ContributingFactor
from app.recommendations.templates import FACTOR_RECOMMENDATIONS
from app.risk.engine import top_contributing_factors, total_reports


def build_recommendations(
    patterns: List[Dict[str, Any]], max_factors: int
) -> Tuple[List[Recommendation], List[Recommendation], List[ContributingFactor], int, int]:
    reports = total_reports(patterns)
    pattern_count = len(patterns)
    factors = top_contributing_factors(patterns, max_factors=max_factors)

    user_recs: List[Recommendation] = []
    authority_recs: List[Recommendation] = []

    for cf in factors:
        template = FACTOR_RECOMMENDATIONS.get(cf.factor)
        if template is None:
            continue
        user_recs.append(Recommendation(text=template["user"], factor=cf.factor))
        authority_recs.append(Recommendation(text=template["authority"], factor=cf.factor))

    if reports > 0 and not user_recs:
        # Reports exist but no specific factor data survived (e.g. AI
        # analysis failed for all of them) - fall back to a generic,
        # count-grounded note rather than inventing specifics.
        plural = "report" if reports == 1 else "reports"
        user_recs.append(
            Recommendation(
                text=(
                    f"{reports} safety {plural} have been made in this area recently. "
                    "Stay aware of your surroundings and consider extra caution."
                ),
                factor=None,
            )
        )
        authority_recs.append(
            Recommendation(
                text=(
                    f"{reports} anonymous safety {plural} have been logged in this area "
                    "recently. Consider reviewing for potential intervention."
                ),
                factor=None,
            )
        )

    return user_recs, authority_recs, factors, reports, pattern_count