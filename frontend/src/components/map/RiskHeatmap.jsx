import { Source, Layer } from "react-map-gl/maplibre";

// Filled, labeled clusters rather than a blurred "glow" — this is meant to read
// as a report-density indicator on a map, not a decorative bokeh effect.
const RISK_COLOR = {
  high: "#e11d48",
  moderate: "#d97706",
  low: "#16a34a",
};

function toGeoJSON(zones) {
  return {
    type: "FeatureCollection",
    features: zones.map((z) => ({
      type: "Feature",
      properties: { level: z.level, reportCount: z.reportCount },
      geometry: { type: "Point", coordinates: [z.longitude, z.latitude] },
    })),
  };
}

export default function RiskHeatmap({ zones }) {
  const data = toGeoJSON(zones);

  return (
    <Source id="risk-zones" type="geojson" data={data}>
      <Layer
        id="risk-fill"
        type="circle"
        paint={{
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, ["+", 8, ["*", ["get", "reportCount"], 0.8]],
            16, ["+", 18, ["*", ["get", "reportCount"], 1.6]],
          ],
          "circle-color": [
            "match",
            ["get", "level"],
            "high", RISK_COLOR.high,
            "moderate", RISK_COLOR.moderate,
            "low", RISK_COLOR.low,
            "#94a3b8",
          ],
          "circle-opacity": 0.32,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": [
            "match",
            ["get", "level"],
            "high", RISK_COLOR.high,
            "moderate", RISK_COLOR.moderate,
            "low", RISK_COLOR.low,
            "#94a3b8",
          ],
          "circle-stroke-opacity": 0.8,
        }}
      />
      <Layer
        id="risk-count-label"
        type="symbol"
        layout={{
          "text-field": ["to-string", ["get", "reportCount"]],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 11,
          "text-allow-overlap": true,
        }}
        paint={{
          "text-color": "#ffffff",
          "text-halo-color": [
            "match",
            ["get", "level"],
            "high", RISK_COLOR.high,
            "moderate", RISK_COLOR.moderate,
            "low", RISK_COLOR.low,
            "#64748b",
          ],
          "text-halo-width": 1,
        }}
      />
    </Source>
  );
}