import { AlertCircle, Lightbulb, ShieldOff, MoonStar, CircleEllipsis } from "lucide-react";

export const mockZoneRisk = {
  latitude: 28.6165,
  longitude: 77.2178,
  radius_meters: 300,
  risk_score: 78,
  risk_level: "high",
  based_on_patterns: 4,
  based_on_reports: 23,
  contributing_factors: [
    { factor: "harassment", count: 12, share: 0.52 },
    { factor: "poor_lighting", count: 6, share: 0.26 },
    { factor: "lack_of_security", count: 3, share: 0.13 },
    { factor: "other", count: 2, share: 0.09 },
  ],
  explanation: "Most incidents reported after 8 PM.",
  computed_at: "2026-08-24T20:00:00Z",
};

export const FACTOR_META = {
  harassment: {
    shortLabel: "Harassment",
    reasonLabel: (count) => `${count} reports mention harassment`,
    icon: AlertCircle,
    tone: "high",
  },
  poor_lighting: {
    shortLabel: "Poor Lighting",
    reasonLabel: () => "Poor lighting reported repeatedly",
    icon: Lightbulb,
    tone: "muted",
  },
  lack_of_security: {
    shortLabel: "Lack of Security",
    reasonLabel: () => "Low security presence",
    icon: ShieldOff,
    tone: "muted",
  },
  other: {
    shortLabel: "Others",
    reasonLabel: () => "Other factors reported",
    icon: CircleEllipsis,
    tone: "muted",
  },
};

export const timeOfDayNote = { icon: MoonStar, label: "Most incidents reported after 8 PM" };

export const mockReportTrend = [
  { hour: "12 AM", reports: 2 },
  { hour: "4 AM", reports: 1 },
  { hour: "8 AM", reports: 3 },
  { hour: "12 PM", reports: 4 },
  { hour: "4 PM", reports: 5 },
  { hour: "8 PM", reports: 9 },
  { hour: "12 AM", reports: 6 },
];

export const DONUT_COLORS = ["#ec4899", "#8b5cf6", "#c4b5fd", "#cbd5e1"];