import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Search, Crosshair, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePlaceSearch } from "@/hooks/usePlaceSearch";

const GAP = 6;
const PREFERRED_HEIGHT = 288; // matches the old max-h-72

// onSelect(place) fires with { id, label, fullLabel, latitude, longitude }.
// onUseCurrentLocation, if passed, shows a crosshair button that hands back
// the browser's geolocation instead of a searched place.
export default function DestinationSearch({
  onSelect,
  onUseCurrentLocation,
  placeholder = "Where are you going?",
  initialValue = "",
  autoFocus = false,
}) {
  const [value, setValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState(null);
  const containerRef = useRef(null);
  const { results, loading, error } = usePlaceSearch(value);

  // Fixed positioning (computed from the field's own screen position) instead of
  // absolute — the app shell is `overflow-hidden` at 100dvh, so an absolutely
  // positioned dropdown near the bottom of the screen gets clipped and can't
  // scroll. Fixed positioning escapes that and we flip it above the field when
  // there isn't enough room below.
  const positionDropdown = () => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow >= 160 || spaceBelow >= spaceAbove) {
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + GAP,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(120, Math.min(PREFERRED_HEIGHT, spaceBelow - GAP - 8)),
      });
    } else {
      setDropdownStyle({
        position: "fixed",
        bottom: window.innerHeight - rect.top + GAP,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(120, Math.min(PREFERRED_HEIGHT, spaceAbove - GAP - 8)),
      });
    }
  };

  const showDropdown = open && value.trim().length >= 3;

  useLayoutEffect(() => {
    if (!showDropdown) return;
    positionDropdown();
    window.addEventListener("resize", positionDropdown);
    window.addEventListener("scroll", positionDropdown, true);
    return () => {
      window.removeEventListener("resize", positionDropdown);
      window.removeEventListener("scroll", positionDropdown, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDropdown, results.length, loading]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (place) => {
    setValue(place.label);
    setOpen(false);
    onSelect?.(place);
  };

  return (
    <div ref={containerRef} className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => value.trim().length >= 3 && setOpen(true)}
        placeholder={placeholder}
        className="h-12 pl-11 pr-11 shadow-card"
      />
      {onUseCurrentLocation && (
        <button
          type="button"
          aria-label="Use current location"
          onClick={() => {
            setOpen(false);
            onUseCurrentLocation();
          }}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-primary hover:bg-muted"
        >
          <Crosshair className="h-4 w-4" />
        </button>
      )}

      {showDropdown && dropdownStyle && (
        <div
          style={dropdownStyle}
          className="z-[100] overflow-y-auto rounded-2xl border border-border bg-card shadow-card"
        >
          {loading && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching…
            </div>
          )}

          {!loading && error && (
            <p className="px-4 py-3 text-sm text-destructive">Couldn't search locations. Try again.</p>
          )}

          {!loading && !error && results.length === 0 && (
            <p className="px-4 py-3 text-sm text-muted-foreground">No matches found</p>
          )}

          {!loading &&
            results.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => handleSelect(place)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted"
              >
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{place.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{place.fullLabel}</span>
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}