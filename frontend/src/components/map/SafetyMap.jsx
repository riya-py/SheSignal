import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import Map, { NavigationControl, Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "@/contexts/ThemeContext";
import { getMapStyle } from "@/lib/mapStyle";
import RiskHeatmap from "@/components/map/RiskHeatmap";
import { DEFAULT_CENTER } from "@/data/mockReports";

const SafetyMap = forwardRef(function SafetyMap(
  { zones, className = "" },
  ref
) {
  const { theme } = useTheme();
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [viewState, setViewState] = useState({ ...DEFAULT_CENTER, zoom: 13.5 });

  useImperativeHandle(ref, () => ({
    centerOn(coords) {
      setUserLocation(coords);
      mapRef.current?.flyTo({ center: [coords.longitude, coords.latitude], zoom: 15, duration: 900 });
    },
  }));

  return (
    <div className={`relative h-full w-full ${className}`}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle={getMapStyle(theme)}
        style={{ width: "100%", height: "100%" }}
        attributionControl={{ compact: true }}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        <RiskHeatmap zones={zones} />

        {userLocation && (
          <Marker longitude={userLocation.longitude} latitude={userLocation.latitude} anchor="center">
            <span className="relative flex h-4 w-4 items-center justify-center">
              <span className="absolute h-4 w-4 rounded-full bg-primary/60 animate-pulse-ring" />
              <span className="relative h-3 w-3 rounded-full border-2 border-white bg-primary shadow-card" />
            </span>
          </Marker>
        )}
      </Map>
    </div>
  );
});

export default SafetyMap;
