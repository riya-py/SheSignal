import { useState } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Crosshair, MapPin } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { getMapStyle } from "@/lib/mapStyle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEFAULT_CENTER } from "@/data/mockReports";

export default function LocationStep({ defaultValues, onNext, onBack }) {
  const { theme } = useTheme();
  const [mode, setMode] = useState(defaultValues?.mode ?? null);
  const [coords, setCoords] = useState(defaultValues?.coords ?? null);
  const [viewState, setViewState] = useState({ ...DEFAULT_CENTER, zoom: 13 });

  const useCurrentLocation = () => {
    setMode("current");
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { longitude: pos.coords.longitude, latitude: pos.coords.latitude };
        setCoords(next);
        setViewState((v) => ({ ...v, ...next, zoom: 15 }));
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const pickOnMap = () => {
    setMode("map");
    if (!coords) setCoords(DEFAULT_CENTER);
  };

  const canContinue = mode && coords;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <button
          type="button"
          onClick={useCurrentLocation}
          aria-pressed={mode === "current"}
          className={cn(
            "flex items-center gap-2.5 rounded-2xl border p-4 text-left text-sm font-semibold transition-colors",
            mode === "current"
              ? "border-accent bg-accent/10 text-accent"
              : "border-border bg-card text-foreground hover:bg-muted"
          )}
        >
          <Crosshair className="h-5 w-5 flex-shrink-0" />
          Use current location
        </button>
        <button
          type="button"
          onClick={pickOnMap}
          aria-pressed={mode === "map"}
          className={cn(
            "flex items-center gap-2.5 rounded-2xl border p-4 text-left text-sm font-semibold transition-colors",
            mode === "map"
              ? "border-accent bg-accent/10 text-accent"
              : "border-border bg-card text-foreground hover:bg-muted"
          )}
        >
          <MapPin className="h-5 w-5 flex-shrink-0" />
          Select location on map
        </button>
      </div>

      {mode && (
        <div className="h-56 w-full overflow-hidden rounded-2xl border border-border sm:h-72">
          <Map
            {...viewState}
            onMove={(evt) => setViewState(evt.viewState)}
            mapStyle={getMapStyle(theme)}
            style={{ width: "100%", height: "100%" }}
            attributionControl={{ compact: true }}
            onClick={
              mode === "map"
                ? (e) => setCoords({ longitude: e.lngLat.lng, latitude: e.lngLat.lat })
                : undefined
            }
            cursor={mode === "map" ? "crosshair" : "grab"}
          >
            <NavigationControl position="bottom-right" showCompass={false} />
            {coords && (
              <Marker longitude={coords.longitude} latitude={coords.latitude} anchor="bottom">
                <MapPin className="h-8 w-8 fill-accent text-accent drop-shadow" />
              </Marker>
            )}
          </Map>
        </div>
      )}
      {mode === "map" && (
        <p className="text-xs text-muted-foreground">Tap anywhere on the map to drop a pin.</p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" size="lg" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          variant="accent"
          size="lg"
          className="flex-1"
          disabled={!canContinue}
          onClick={() => onNext({ mode, coords })}
        >
          Next
        </Button>
      </div>
    </div>
  );
}