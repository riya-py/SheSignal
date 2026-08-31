import { Marker } from "react-map-gl/maplibre";
import { reportCategories } from "@/lib/reportSchema";

// Deliberately neutral, not risk-colored — a single report is never itself
// a risk claim; only aggregated patterns (RiskHeatmap) carry a risk level.
export default function SafetyMarker({ longitude, latitude, category, onClick }) {
  const meta = reportCategories.find((c) => c.value === category);
  const Icon = meta?.icon ?? reportCategories[reportCategories.length - 1].icon;

  return (
    <Marker longitude={longitude} latitude={latitude} anchor="bottom">
      <button
        type="button"
        onClick={onClick}
        aria-label={`Reported: ${meta?.label ?? "safety concern"}`}
        className="flex h-7 w-7 -translate-y-1 items-center justify-center rounded-full border-2 border-white bg-foreground/80 text-white shadow-card"
      >
        <Icon className="h-3.5 w-3.5" />
      </button>
    </Marker>
  );
}