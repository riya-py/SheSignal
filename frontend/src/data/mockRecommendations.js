import { Users, Eye, Phone, Lightbulb, ShieldOff, AlertCircle, ShieldCheck } from "lucide-react";
import { mockZoneRisk } from "@/data/mockRisk";

// Shaped to match app/models/recommendation.py::RecommendationResponse —
// Phase 8 replaces this with a GET /recommendations call.
export const mockRecommendations = {
  latitude: mockZoneRisk.latitude,
  longitude: mockZoneRisk.longitude,
  radius_meters: mockZoneRisk.radius_meters,
  based_on_reports: mockZoneRisk.based_on_reports,
  based_on_patterns: mockZoneRisk.based_on_patterns,
  based_on_factors: mockZoneRisk.contributing_factors,
  user_recommendations: [
    { text: "Prefer well-lit roads and avoid isolated areas.", factor: "poor_lighting" },
    { text: "Try to travel with someone, especially at night.", factor: null },
    { text: "Stay aware of your surroundings.", factor: null },
    { text: "Use emergency contacts if needed.", factor: null },
  ],
  authority_recommendations: [
    { text: "Improve lighting in this zone.", factor: "poor_lighting" },
    { text: "Increase security presence in this area.", factor: "lack_of_security" },
    { text: "Investigate repeated harassment reports.", factor: "harassment" },
  ],
  computed_at: "2026-08-24T20:00:00Z",
};

const FACTOR_ICON = {
  harassment: AlertCircle,
  poor_lighting: Lightbulb,
  lack_of_security: ShieldOff,
};

// No factor tag on user-facing tips (e.g. "travel with someone") — fall back to keyword matching.
export function iconForRecommendation(rec) {
  if (rec.factor && FACTOR_ICON[rec.factor]) return FACTOR_ICON[rec.factor];
  const text = rec.text.toLowerCase();
  if (text.includes("someone") || text.includes("together")) return Users;
  if (text.includes("aware") || text.includes("surroundings")) return Eye;
  if (text.includes("emergency") || text.includes("contact")) return Phone;
  return ShieldCheck;
}