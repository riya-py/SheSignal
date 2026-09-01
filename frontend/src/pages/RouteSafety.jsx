import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  MoreVertical,
  Circle,
  MapPin,
  LogIn,
  ArrowUpDown,
  RotateCcw,
  Flag,
  RefreshCw,
} from "lucide-react";
import RouteMap from "@/components/route/RouteMap";
import TransportSelector from "@/components/route/TransportSelector";
import RouteRiskCard from "@/components/route/RouteRiskCard";
import DestinationSearch from "@/components/map/DestinationSearch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouteRisk } from "@/hooks/useRouteRisk";
import { transportOptions } from "@/data/mockRoute";

// Reverse-geocodes so "use current location" shows a readable label instead of raw coords.
async function labelForCoords(latitude, longitude) {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", latitude);
    url.searchParams.set("lon", longitude);
    url.searchParams.set("format", "jsonv2");
    const res = await fetch(url.toString());
    const data = await res.json();
    return data.display_name?.split(",").slice(0, 2).join(",").trim() ?? "Current location";
  } catch {
    return "Current location";
  }
}

function LocationRow({ dot, point, placeholder, editing, onStartEdit, onSelect, onUseCurrentLocation }) {
  if (editing) {
    return (
      <DestinationSearch
        placeholder={placeholder}
        initialValue={point?.label ?? ""}
        autoFocus
        onSelect={onSelect}
        onUseCurrentLocation={onUseCurrentLocation}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={onStartEdit}
      className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1 text-left text-sm font-medium text-foreground hover:bg-muted"
    >
      {dot}
      <span className={point ? "truncate" : "truncate text-muted-foreground"}>
        {point?.label ?? placeholder}
      </span>
    </button>
  );
}

// Simple dropdown menu for the "more options" (⋮) button — no portal, closes on
// outside click / Escape. Kept local to this page since nothing else needs it yet.
function RouteOptionsMenu({ onClearRoute, onReportHere, onRefresh, canRefresh }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    const handleEscape = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const items = [
    { label: "Refresh risk data", icon: RefreshCw, onClick: onRefresh, disabled: !canRefresh },
    { label: "Clear route", icon: RotateCcw, onClick: onClearRoute },
    { label: "Report an issue here", icon: Flag, onClick: onReportHere },
  ];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
        className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-foreground hover:bg-muted"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-20 w-56 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-card"
        >
          {items.map(({ label, icon: Icon, onClick, disabled }) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              disabled={disabled}
              onClick={() => {
                setOpen(false);
                onClick?.();
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RouteSafety() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const [mode, setMode] = useState("walk");
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(location.state?.destination ?? null);
  const [editingField, setEditingField] = useState(destination ? "origin" : "destination");
  const [cardDismissed, setCardDismissed] = useState(false);
  const [showingAlternative, setShowingAlternative] = useState(false);

  const { mutate: calculateRoute, data: routeRisk, isPending, isError, error } = useRouteRisk(
    session?.access_token
  );

  const handleUseCurrentLocation = (setter) => () => {
    if (!navigator.geolocation) {
      toast.error("Location isn't available on this device/browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const label = await labelForCoords(latitude, longitude);
        setter({ label, latitude, longitude });
        setEditingField(null);
      },
      () => toast.error("Couldn't get your location", { description: "Check location permissions and try again." }),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSwap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const handleClearRoute = () => {
    setOrigin(null);
    setDestination(null);
    setCardDismissed(false);
    setShowingAlternative(false);
    setEditingField("origin");
  };

  const handleReportHere = () => {
    // Report flow starts fresh; destination (if set) is the most useful
    // starting point since it's usually where the issue was noticed.
    navigate("/report", { state: { location: destination ?? origin } });
  };

  const handleRefresh = () => {
    if (!origin || !destination) return;
    setCardDismissed(false);
    setShowingAlternative(false);
    calculateRoute({
      origin: { latitude: origin.latitude, longitude: origin.longitude },
      destination: { latitude: destination.latitude, longitude: destination.longitude },
    });
  };

  useEffect(() => {
    if (!session || !origin || !destination) return;
    setCardDismissed(false);
    setShowingAlternative(false);
    calculateRoute({
      origin: { latitude: origin.latitude, longitude: origin.longitude },
      destination: { latitude: destination.latitude, longitude: destination.longitude },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, origin?.latitude, origin?.longitude, destination?.latitude, destination?.longitude]);

  const bothSet = Boolean(origin && destination);

  const minutesLabel = (seconds) => `${Math.max(1, Math.round(seconds / 60))} min`;

  // The backend only computes a real route for one profile (foot-walking) right
  // now — car/bike/transit have no real data source yet, so they're disabled
  // rather than showing another made-up number.
  const displayOptions = transportOptions.map((opt) =>
    opt.mode === "walk" && routeRisk
      ? { ...opt, label: minutesLabel(routeRisk.total_duration_seconds) }
      : opt
  );

  return (
    <div className="flex h-[calc(100dvh-65px)] w-full flex-col md:h-[calc(100dvh-73px)]">
      {/* header */}
      <div className="flex items-start gap-3 border-b border-border bg-background px-4 py-3 md:px-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex flex-1 flex-col gap-1.5 py-0.5">
          <LocationRow
            dot={<Circle className="h-2.5 w-2.5 flex-shrink-0 fill-primary text-primary" />}
            point={origin}
            placeholder="Choose starting point"
            editing={editingField === "origin"}
            onStartEdit={() => setEditingField("origin")}
            onSelect={(place) => {
              setOrigin(place);
              setEditingField(null);
            }}
            onUseCurrentLocation={handleUseCurrentLocation(setOrigin)}
          />
          {editingField !== "origin" && <div className="ml-[5px] h-3 w-px border-l border-dashed border-border" />}
          <LocationRow
            dot={<MapPin className="h-3.5 w-3.5 flex-shrink-0 fill-risk-high text-risk-high" />}
            point={destination}
            placeholder="Choose destination"
            editing={editingField === "destination"}
            onStartEdit={() => setEditingField("destination")}
            onSelect={(place) => {
              setDestination(place);
              setEditingField(null);
            }}
            onUseCurrentLocation={handleUseCurrentLocation(setDestination)}
          />
        </div>

        {bothSet && !editingField && (
          <button
            type="button"
            onClick={handleSwap}
            aria-label="Swap origin and destination"
            className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-foreground hover:bg-muted"
          >
            <ArrowUpDown className="h-5 w-5" />
          </button>
        )}
        <RouteOptionsMenu
          onClearRoute={handleClearRoute}
          onReportHere={handleReportHere}
          onRefresh={handleRefresh}
          canRefresh={bothSet}
        />
      </div>

      <TransportSelector
        options={displayOptions}
        value={mode}
        onChange={setMode}
        disabledModes={["car", "bike", "transit"]}
      />

      {/* map fills the remaining space, risk card overlays its bottom edge */}
      <div className="relative min-h-0 flex-1">
        {!bothSet && (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <MapPin className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Set a starting point and destination</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Tap either field above to search, or use the crosshair icon for your current location.
            </p>
          </div>
        )}

        {bothSet && !session && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <LogIn className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold text-foreground">Sign in to calculate route risk</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Route calculations are rate-limited per account to prevent abuse — browsing the map
              stays open to everyone, this step just needs a session.
            </p>
            <Button variant="accent" onClick={() => navigate("/login", { state: { from: { pathname: "/route-safety" } } })}>
              Sign In
            </Button>
          </div>
        )}

        {bothSet && session && isPending && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Calculating reported risk along this route…
          </div>
        )}

        {bothSet && session && isError && (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-destructive">
            {error?.message ?? "Couldn't calculate this route."}
          </div>
        )}

        {bothSet && session && routeRisk && (
          <>
            <RouteMap
              origin={routeRisk.origin}
              destination={routeRisk.destination}
              segments={
                showingAlternative && routeRisk.alternative
                  ? routeRisk.alternative.segments
                  : routeRisk.segments
              }
            />
            {cardDismissed ? (
              <button
                type="button"
                onClick={() => setCardDismissed(false)}
                className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full border border-border bg-card/95 px-4 py-2 text-sm font-semibold text-foreground shadow-card backdrop-blur hover:bg-muted sm:bottom-4"
              >
                Show risk summary
              </button>
            ) : (
              <div className="absolute inset-x-0 bottom-0 z-10 mx-auto w-full max-w-xl px-3 pb-3 sm:px-4 sm:pb-4">
                <RouteRiskCard
                  summary={showingAlternative && routeRisk.alternative ? routeRisk.alternative : routeRisk}
                  alternative={routeRisk.alternative}
                  isShowingAlternative={showingAlternative}
                  onToggleAlternative={() => {
                    if (!routeRisk.alternative) {
                      toast.info("No safer alternative found for this route right now");
                      return;
                    }
                    setShowingAlternative((v) => !v);
                  }}
                  onClose={() => setCardDismissed(true)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}