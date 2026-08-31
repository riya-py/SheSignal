import { Crosshair } from "lucide-react";

export default function LocationButton({ onLocate, className = "" }) {
  const handleClick = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => onLocate({ longitude: pos.coords.longitude, latitude: pos.coords.latitude }),
      () => {
        /* permission denied or unavailable — silently keep current map view */
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Center on my location"
      className={`flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-card backdrop-blur hover:bg-muted ${className}`}
    >
      <Crosshair className="h-5 w-5" />
    </button>
  );
}