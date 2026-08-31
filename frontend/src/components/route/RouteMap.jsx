import { useRef, useEffect } from "react";
import Map, { Source, Layer, Marker, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { getMapStyle } from "@/lib/mapStyle";
import { RISK_LEVEL_COPY } from "@/lib/riskCopy";

const RISK_COLOR = { high: "#f43f5e", moderate: "#f59e0b", low: "#22c55e" };

function toGeoJSON(segments) {
  return {
    type: "FeatureCollection",
    features: segments.map((s) => ({
      type: "Feature",
      properties: { risk: s.risk_level, color: RISK_COLOR[s.risk_level] ?? "#94a3b8" },
      geometry: {
        type: "LineString",
        coordinates: [
          [s.start.longitude, s.start.latitude],
          [s.end.longitude, s.end.latitude],
        ],
      },
    })),
  };
}

// origin/destination: {latitude, longitude}. segments: RouteRiskResponse.segments.
export default function RouteMap({ origin, destination, segments, className = "" }) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const data = toGeoJSON(segments);

  const highRiskSegment = segments.find((s) => s.risk_level === "high");

  const bounds = [
    [Math.min(origin.longitude, destination.longitude), Math.min(origin.latitude, destination.latitude)],
    [Math.max(origin.longitude, destination.longitude), Math.max(origin.latitude, destination.latitude)],
  ];

  useEffect(() => {
    if (segments.length) mapRef.current?.fitBounds(bounds, { padding: 64, duration: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments.length]);

  return (
    <div className={`relative h-full w-full ${className}`}>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: (origin.longitude + destination.longitude) / 2,
          latitude: (origin.latitude + destination.latitude) / 2,
          zoom: 13.5,
        }}
        mapStyle={getMapStyle(theme)}
        style={{ width: "100%", height: "100%" }}
        attributionControl={{ compact: true }}
      >
        <NavigationControl position="bottom-right" showCompass={false} />
        <Source id="route" type="geojson" data={data}>
          <Layer
            id="route-casing"
            type="line"
            layout={{ "line-cap": "round", "line-join": "round" }}
            paint={{ "line-color": "#ffffff", "line-width": 8 }}
          />
          <Layer
            id="route-line"
            type="line"
            layout={{ "line-cap": "round", "line-join": "round" }}
            paint={{ "line-color": ["get", "color"], "line-width": 5 }}
          />
        </Source>

        <Marker longitude={origin.longitude} latitude={origin.latitude} anchor="center">
          <span className="relative flex h-4 w-4 items-center justify-center">
            <span className="absolute h-4 w-4 rounded-full bg-primary/60 animate-pulse-ring" />
            <span className="relative h-3 w-3 rounded-full border-2 border-white bg-primary shadow-card" />
          </span>
        </Marker>

        <Marker longitude={destination.longitude} latitude={destination.latitude} anchor="bottom">
          <MapPin className="h-8 w-8 fill-risk-high text-risk-high drop-shadow" />
        </Marker>

        {highRiskSegment && (
          <Marker
            longitude={highRiskSegment.end.longitude}
            latitude={highRiskSegment.end.latitude}
            anchor="bottom"
            offset={[0, -14]}
          >
            <button
              type="button"
              onClick={() =>
                navigate("/zone-details", {
                  state: {
                    latitude: highRiskSegment.end.latitude,
                    longitude: highRiskSegment.end.longitude,
                  },
                })
              }
              className="whitespace-nowrap rounded-full bg-risk-high px-3 py-1 text-xs font-bold text-white shadow-card"
            >
              {RISK_LEVEL_COPY.high.mapLabel}
            </button>
          </Marker>
        )}
      </Map>
    </div>
  );
}