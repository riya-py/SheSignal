import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert, ChevronRight, Plus } from "lucide-react";
import SafetyMap from "@/components/map/SafetyMap";
import MapLegend from "@/components/map/MapLegend";
import LocationButton from "@/components/map/LocationButton";
import DestinationSearch from "@/components/map/DestinationSearch";
import { usePatterns, riskFromReportCount } from "@/hooks/useReports";

export default function Home() {
  const mapRef = useRef(null);
  const navigate = useNavigate();

  const { data: patternsData } = usePatterns({ limit: 50 });

  const riskZones = (patternsData?.items ?? []).map((p) => ({
    id: p.id,
    longitude: p.centroid_longitude,
    latitude: p.centroid_latitude,
    level: riskFromReportCount(p.report_count),
    reportCount: p.report_count,
  }));

  return (
    // 100dvh minus the sticky navbar height (h-[65px] on mobile / h-[73px] desktop match Navbar padding)
    <div className="relative h-[calc(100dvh-65px)] w-full overflow-hidden md:h-[calc(100dvh-73px)]">
      <SafetyMap ref={mapRef} zones={riskZones} />

      <MapLegend />

      <LocationButton
        onLocate={(coords) => mapRef.current?.centerOn(coords)}
        className="absolute bottom-40 right-3 z-10 sm:bottom-44"
      />

      <Link
        to="/report"
        aria-label="Report a safety issue"
        className="absolute bottom-56 right-3 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-card sm:bottom-60"
      >
        <Plus className="h-6 w-6" />
      </Link>

      {/* bottom overlay: search + route-concerns card, centered and width-capped for tablet/laptop */}
      <div className="absolute inset-x-0 bottom-4 z-10 mx-auto flex w-full max-w-xl flex-col gap-3 px-3 sm:px-4">
        <DestinationSearch
          onSelect={(place) => navigate("/route-safety", { state: { destination: place } })}
        />

        <button
          type="button"
          onClick={() => navigate("/route-safety")}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card/95 p-4 text-left shadow-card backdrop-blur transition-colors hover:bg-muted"
        >
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-risk-high-bg text-risk-high">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-bold text-foreground">
              {riskZones.filter((z) => z.level === "high").length} Safety Concerns Near You
            </span>
            <span className="block text-xs text-muted-foreground">Tap to view details and safer alternatives</span>
          </span>
          <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
