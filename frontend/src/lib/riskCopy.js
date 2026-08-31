// Single source of truth for how risk_level ("low" | "moderate" | "high") is worded
// on screen. Keeps every screen aligned with the product principle: report density,
// never an absolute safety claim ("elevated reported risk", not "unsafe area").
export const RISK_LEVEL_COPY = {
  high: {
    badge: "Elevated Reports",
    zoneHeading: "Elevated Reported Risk",
    legend: "More reports",
    mapLabel: "Elevated reports here",
  },
  moderate: {
    badge: "Some Reports",
    zoneHeading: "Some Reported Concerns",
    legend: "Some reports",
    mapLabel: "Some reports here",
  },
  low: {
    badge: "Fewer Reports",
    zoneHeading: "Fewer Reports Here",
    legend: "Fewer reports",
    mapLabel: "Fewer reports here",
  },
};