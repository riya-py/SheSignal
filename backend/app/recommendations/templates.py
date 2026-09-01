from typing import Dict, TypedDict


class FactorTemplate(TypedDict):
    route: str
    warning: str
    intervention: str
    infrastructure_action: str


FACTOR_RECOMMENDATIONS: Dict[str, FactorTemplate] = {
    "poor_lighting": {
        "route": "Where possible, choose a well-lit main road instead of this stretch, especially after dark.",
        "warning": "This area has reported poor lighting, which limits visibility, especially at night.",
        "intervention": "Prioritize this location for a lighting inspection based on recent reports.",
        "infrastructure_action": "Repair or replace non-functioning streetlights and add lighting at reported dark spots.",
    },
    "isolated_area": {
        "route": "Prefer routes through busier, populated streets rather than this isolated stretch.",
        "warning": "This area has been reported as isolated with low foot traffic.",
        "intervention": "Review options to increase footfall and visibility in this area.",
        "infrastructure_action": "Add lighting, signage, or encourage nearby activity to reduce isolation.",
    },
    "following": {
        "route": "Stick to populated routes and avoid shortcuts through quiet streets here.",
        "warning": "There are reports of people being followed in this area.",
        "intervention": "Review patrol routes and increase visible security presence near this location.",
        "infrastructure_action": "Deploy foot patrols or install visible CCTV coverage along this stretch.",
    },
    "harassment": {
        "route": "Consider an alternate route through this area, especially around the times mentioned in reports.",
        "warning": "Harassment has been reported in this area.",
        "intervention": "Prioritize this location for community safety outreach and monitoring.",
        "infrastructure_action": "Increase patrols and set up a visible, accessible reporting point in this area.",
    },
    "no_security_presence": {
        "route": "Where possible, route through areas with visible security or staff presence.",
        "warning": "This area has been reported as lacking visible security.",
        "intervention": "Assess this location for a security or patrol deployment.",
        "infrastructure_action": "Station security personnel or install a help point/CCTV at this location.",
    },
    "crowded_unsafe": {
        "route": "If you can, avoid peak-crowding times here or take a less congested alternate path.",
        "warning": "This area has been reported as unsafely crowded.",
        "intervention": "Review crowd management arrangements for this location.",
        "infrastructure_action": "Introduce crowd control measures or staff management during peak hours.",
    },
    "unsafe_transit_exit": {
        "route": "Use an alternate exit, or wait for a busier moment before leaving through this one.",
        "warning": "This transit exit has been reported as unsafe.",
        "intervention": "Review lighting, signage, and staffing near this transit exit.",
        "infrastructure_action": "Add lighting, clear signage, and staff coverage at this transit exit.",
    },
    "verbal_abuse": {
        "route": "Consider an alternate route through this area if one is available.",
        "warning": "Verbal abuse has been reported in this area.",
        "intervention": "Launch community awareness efforts and ensure reporting channels are visible here.",
        "infrastructure_action": "Set up visible reporting points and awareness signage in this area.",
    },
    "physical_contact": {
        "route": "Avoid this area when alone, especially during low-traffic hours - take a busier alternate route.",
        "warning": "Reports of unwanted physical contact have been logged in this area.",
        "intervention": "Increase security presence and ensure reporting channels are clear here.",
        "infrastructure_action": "Deploy visible security presence and install a help point in this area.",
    },
    "suspicious_vehicle": {
        "route": "Stay aware of vehicles when passing through, and avoid approaching unfamiliar ones.",
        "warning": "Suspicious vehicles have been reported in this area.",
        "intervention": "Review patrol or surveillance coverage for vehicle activity here.",
        "infrastructure_action": "Add CCTV coverage or checkpoints to monitor vehicle activity in this area.",
    },
}