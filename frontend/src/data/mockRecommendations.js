import {
  Route,
  AlertTriangle,
  Users,
  Megaphone,
  Target,
  Siren,
  BarChart3,
  Wrench,
  ShieldCheck,
} from "lucide-react";
import { mockZoneRisk } from "@/data/mockRisk";

export const mockRecommendations = {
  latitude: mockZoneRisk.latitude,
  longitude: mockZoneRisk.longitude,
  radius_meters: mockZoneRisk.radius_meters,
  based_on_reports: mockZoneRisk.based_on_reports,
  based_on_patterns: mockZoneRisk.based_on_patterns,
  based_on_factors: mockZoneRisk.contributing_factors,
  risk_level: "moderate",
  user_recommendations: [
    {
      type: "route",
      factor: "poor_lighting",
      text: "Where possible, choose a well-lit main road instead of this stretch, especially after dark.",
    },
    {
      type: "warning",
      factor: "poor_lighting",
      text: "This area has reported poor lighting, which limits visibility, especially at night.",
    },
    {
      type: "personal_action",
      text: "Let a trusted contact know your route and expected arrival time.",
    },
    {
      type: "report_action",
      text: "Notice this again? Submit a new report so this area's safety picture stays current.",
    },
  ],
  authority_recommendations: [
    {
      type: "intervention",
      factor: "poor_lighting",
      text: "Prioritize this location for a lighting inspection based on recent reports.",
    },
    {
      type: "priority",
      priority: "medium",
      text: "Priority: Medium - based on 9 recent reports and the area's current risk level.",
    },
    {
      type: "hotspot_insight",
      factor: "poor_lighting",
      text:
        "9 anonymous report(s) recorded across 2 pattern areas near this location. The most " +
        "frequently reported issue is poor lighting, making up 78% of reports.",
    },
    {
      type: "infrastructure_action",
      factor: "poor_lighting",
      text: "Repair or replace non-functioning streetlights and add lighting at reported dark spots.",
    },
  ],
  computed_at: "2026-08-24T20:00:00Z",
};

// Every recommendation now carries a `type` set by the backend (see
// app/recommendations/engine.py), so icon choice is a direct lookup instead
// of guessing from keywords in the text.
const RECOMMENDATION_ICON = {
  route: Route,
  warning: AlertTriangle,
  personal_action: Users,
  report_action: Megaphone,
  intervention: Target,
  priority: Siren,
  hotspot_insight: BarChart3,
  infrastructure_action: Wrench,
};

export function iconForRecommendation(rec) {
  return RECOMMENDATION_ICON[rec.type] ?? ShieldCheck;
}