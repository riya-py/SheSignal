"""
Splits a route polyline into a target number of segments, by cumulative
arc-length rather than raw point count (a route can have very unevenly
spaced vertices). Pure function - no network, no DB - so it's fully
unit-testable on its own.
"""
import bisect
from typing import Dict, List, Tuple

from app.routing.geo import haversine_meters

Coordinate = Tuple[float, float]  # (latitude, longitude)


def compute_segments(coordinates: List[Coordinate], target_count: int) -> List[Dict]:
    if len(coordinates) < 2:
        raise ValueError("A route needs at least two coordinates to segment")

    cumulative = [0.0]
    for i in range(1, len(coordinates)):
        lat1, lon1 = coordinates[i - 1]
        lat2, lon2 = coordinates[i]
        cumulative.append(cumulative[-1] + haversine_meters(lat1, lon1, lat2, lon2))

    total_distance = cumulative[-1]
    max_possible_segments = len(coordinates) - 1
    segment_count = max(1, min(target_count, max_possible_segments))

    if total_distance == 0:
        lat, lon = coordinates[0]
        return [
            {
                "start": (lat, lon),
                "end": (lat, lon),
                "midpoint": (lat, lon),
                "distance_meters": 0.0,
            }
        ]

    # Target cumulative-distance boundaries, snapped to the nearest actual
    # vertex (keeps segment endpoints as real points on the route).
    boundary_targets = [i * total_distance / segment_count for i in range(segment_count + 1)]
    boundary_indices = []
    for target in boundary_targets:
        idx = bisect.bisect_left(cumulative, target)
        if idx >= len(cumulative):
            idx = len(cumulative) - 1
        elif idx > 0 and abs(cumulative[idx - 1] - target) < abs(cumulative[idx] - target):
            idx -= 1
        boundary_indices.append(idx)

    # De-duplicate consecutive identical indices (can happen when many
    # segments are requested for a short/sparse polyline).
    deduped = [boundary_indices[0]]
    for idx in boundary_indices[1:]:
        if idx != deduped[-1]:
            deduped.append(idx)
    if len(deduped) < 2:
        deduped.append(min(len(coordinates) - 1, deduped[0] + 1))

    segments = []
    for start_idx, end_idx in zip(deduped, deduped[1:]):
        start = coordinates[start_idx]
        end = coordinates[end_idx]
        midpoint = ((start[0] + end[0]) / 2, (start[1] + end[1]) / 2)
        distance = cumulative[end_idx] - cumulative[start_idx]
        segments.append(
            {"start": start, "end": end, "midpoint": midpoint, "distance_meters": distance}
        )

    return segments