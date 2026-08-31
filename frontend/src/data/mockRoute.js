import { Car, Bike, PersonStanding, TrainFront } from "lucide-react";

// India Gate -> Connaught Place / Rajiv Chowk, New Delhi (~2.3km)
export const routeOrigin = { longitude: 77.2295, latitude: 28.6129, label: "My Location" };
export const routeDestination = {
  longitude: 77.2167,
  latitude: 28.6328,
  label: "Rajiv Chowk Metro Station",
};

// Ordered low -> high risk along the path, mirrors the screenshot's green-to-red gradient.
export const routeSegments = [
  { id: "s1", risk: "low", coords: [[77.2295, 28.6129], [77.2255, 28.6185]] },
  { id: "s2", risk: "low", coords: [[77.2255, 28.6185], [77.222, 28.6235]] },
  { id: "s3", risk: "moderate", coords: [[77.222, 28.6235], [77.2195, 28.6275]] },
  { id: "s4", risk: "high", coords: [[77.2195, 28.6275], [77.2178, 28.6305]] },
  { id: "s5", risk: "high", coords: [[77.2178, 28.6305], [77.2167, 28.6328]] },
];

export const highRiskLabelPosition = { longitude: 77.2178, latitude: 28.6305 };

export const transportOptions = [
  { mode: "car", label: "Soon", icon: Car },
  { mode: "bike", label: "Soon", icon: Bike },
  { mode: "walk", label: "—", icon: PersonStanding },
  { mode: "transit", label: "Soon", icon: TrainFront },
];

export const routeRiskSummary = {
  overall_risk_score: 68,
  overall_risk_level: "high",
  zones: { high: 3, moderate: 1, low: 2 },
};