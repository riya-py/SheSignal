export const DEFAULT_CENTER = { longitude: 77.209, latitude: 28.6139 }; // India Gate, New Delhi

export const mockRiskZones = [
  {
    id: "zone-1",
    longitude: 77.2178,
    latitude: 28.6165,
    level: "high",
    reportCount: 12,
    label: "Frequent harassment reports, poor lighting",
  },
  {
    id: "zone-2",
    longitude: 77.2011,
    latitude: 28.6109,
    level: "moderate",
    reportCount: 5,
    label: "Isolated stretch after dark",
  },
  {
    id: "zone-3",
    longitude: 77.223,
    latitude: 28.6082,
    level: "high",
    reportCount: 9,
    label: "Unsafe metro/bus exit",
  },
  {
    id: "zone-4",
    longitude: 77.2098,
    latitude: 28.6201,
    level: "low",
    reportCount: 2,
    label: "Well-lit, regularly patrolled",
  },
  {
    id: "zone-5",
    longitude: 77.2141,
    latitude: 28.6045,
    level: "low",
    reportCount: 1,
    label: "Busy market area, generally safe",
  },
];

export const mockReportMarkers = [
  { id: "r1", longitude: 77.2178, latitude: 28.6165, level: "high" },
  { id: "r2", longitude: 77.2011, latitude: 28.6109, level: "moderate" },
  { id: "r3", longitude: 77.223, latitude: 28.6082, level: "high" },
];