import { useEffect, useRef, useState } from "react";
import { searchPlaces } from "@/lib/geocode";

// Debounces `query` and returns live search suggestions as the user types.
export function usePlaceSearch(query, { debounceMs = 400 } = {}) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 3) {
      setResults([]);
      setLoading(false);
      setError(null);
      return undefined;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const places = await searchPlaces(trimmed, { signal: controller.signal });
        setResults(places);
        setError(null);
      } catch (err) {
        if (err.name !== "AbortError") setError(err);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return { results, loading, error };
}