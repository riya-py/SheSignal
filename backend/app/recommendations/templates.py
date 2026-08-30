"""
Static, hand-written recommendation text keyed by the same factor tags the
AI extraction layer already uses (app.ai.schemas.ALLOWED_FACTORS). This is
deliberately NOT AI-generated free text: every recommendation is a fixed
template, so there is no way for a hallucinated statistic or alarming
phrasing to enter the response. Language is calm and action-oriented
("consider", "stay aware") and never claims an area is definitively unsafe,
consistent with the product's "reported risk" framing used everywhere else.

Adding a new factor here requires it to also exist in ALLOWED_FACTORS -
see the assertion in the test suite that keeps the two in sync.
"""
from typing import Dict, TypedDict


class FactorTemplate(TypedDict):
    user: str
    authority: str


FACTOR_RECOMMENDATIONS: Dict[str, FactorTemplate] = {
    "poor_lighting": {
        "user": "This area has reported poor lighting - consider a well-lit alternate path, especially after dark.",
        "authority": "Multiple reports cite poor lighting in this area - consider inspecting and improving street lighting.",
    },
    "isolated_area": {
        "user": "This area has been reported as isolated - consider traveling with a companion or during busier hours.",
        "authority": "This area has been reported as isolated with low foot traffic - consider measures to increase visibility and activity.",
    },
    "following": {
        "user": "There are reports of people being followed here - stay on populated routes and consider sharing your location with someone you trust.",
        "authority": "Multiple reports describe being followed in this area - consider increasing visible security presence.",
    },
    "harassment": {
        "user": "Harassment has been reported in this area - consider an alternate route or traveling with others.",
        "authority": "Recurring harassment reports have been logged here - consider community safety outreach or monitoring.",
    },
    "no_security_presence": {
        "user": "This area has been reported as lacking visible security - stay alert and avoid lingering alone.",
        "authority": "Reports indicate a lack of visible security in this area - consider deploying patrols or security personnel.",
    },
    "crowded_unsafe": {
        "user": "This area has been reported as unsafely crowded - stay aware of your surroundings and keep belongings secure.",
        "authority": "Reports describe unsafe crowding in this area - consider crowd management measures.",
    },
    "unsafe_transit_exit": {
        "user": "This transit exit has been reported as unsafe - consider an alternate exit or waiting for a busier moment to leave.",
        "authority": "This transit exit has multiple safety reports - consider improving lighting, signage, or staffing near the exit.",
    },
    "verbal_abuse": {
        "user": "Verbal abuse has been reported in this area - trust your instincts and remove yourself from uncomfortable situations quickly.",
        "authority": "Reports of verbal abuse have been logged here - consider community awareness programs and clear reporting channels.",
    },
    "physical_contact": {
        "user": "Reports of unwanted physical contact have been logged here - consider avoiding this area when alone, especially during low-traffic hours.",
        "authority": "This area has reports of unwanted physical contact - consider increased security presence and clear reporting channels.",
    },
    "suspicious_vehicle": {
        "user": "Suspicious vehicles have been reported in this area - avoid approaching unfamiliar vehicles and stay aware when passing through.",
        "authority": "Reports describe suspicious vehicle activity in this area - consider increased patrol or surveillance coverage.",
    },
}