import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export function useRecommendations({ latitude, longitude, radiusMeters } = {}) {
  return useQuery({
    queryKey: ["recommendations", { latitude, longitude, radiusMeters }],
    queryFn: () =>
      apiClient.get("/recommendations", {
        latitude,
        longitude,
        radius_meters: radiusMeters,
      }),
    enabled: latitude !== undefined && longitude !== undefined,
  });
}