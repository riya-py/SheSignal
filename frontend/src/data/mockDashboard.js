// Placeholder only — backend has no daily time-series endpoint yet.
export const reportsOverTime24h = [
  { date: "12am", reports: 0 },
  { date: "4am", reports: 1 },
  { date: "8am", reports: 2 },
  { date: "12pm", reports: 3 },
  { date: "4pm", reports: 2 },
  { date: "8pm", reports: 4 },
  { date: "11pm", reports: 1 },
];

export const reportsOverTime7d = [
  { date: "Mon", reports: 2 },
  { date: "Tue", reports: 3 },
  { date: "Wed", reports: 1 },
  { date: "Thu", reports: 4 },
  { date: "Fri", reports: 6 },
  { date: "Sat", reports: 5 },
  { date: "Sun", reports: 3 },
];

export const reportsOverTime30d = [
  { date: "Jul 31", reports: 1 },
  { date: "Aug 3", reports: 2 },
  { date: "Aug 6", reports: 1 },
  { date: "Aug 9", reports: 3 },
  { date: "Aug 12", reports: 2 },
  { date: "Aug 15", reports: 4 },
  { date: "Aug 18", reports: 3 },
  { date: "Aug 21", reports: 5 },
  { date: "Aug 24", reports: 4 },
  { date: "Aug 27", reports: 6 },
  { date: "Aug 30", reports: 5 },
];

export const REPORTS_OVER_TIME_BY_RANGE = {
  "24h": reportsOverTime24h,
  "7d": reportsOverTime7d,
  "30d": reportsOverTime30d,
};

export const RANGE_LABEL = {
  "24h": "Last 24 Hours",
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
};