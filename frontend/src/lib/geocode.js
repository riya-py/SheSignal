// Free place search via OpenStreetMap's Nominatim — no API key, no signup.
// Usage policy (nominatim.org/release-docs/latest/api/Search): max ~1 request/sec,
// which the 400ms debounce in usePlaceSearch respects. Fine for dev/demo traffic;
// if this ever goes to production, proxy it through the backend instead so requests
// come from one server IP with a proper User-Agent rather than every visitor's browser.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export async function searchPlaces(query, { signal } = {}) {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "6");

  const response = await fetch(url.toString(), {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Location search failed");

  const results = await response.json();

  return results.map((r) => ({
    id: String(r.place_id),
    // short label first (name/street), like the top line Uber/Rapido show
    label: r.display_name.split(",").slice(0, 2).join(",").trim(),
    fullLabel: r.display_name,
    latitude: parseFloat(r.lat),
    longitude: parseFloat(r.lon),
  }));
}