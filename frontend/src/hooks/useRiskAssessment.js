import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export function useRiskAssessment({ latitude, longitude, radiusMeters } = {}) {
  return useQuery({
    queryKey: ["risk", { latitude, longitude, radiusMeters }],
    queryFn: () =>
      apiClient.get("/risk", {
        latitude,
        longitude,
        radius_meters: radiusMeters,
      }),
    enabled: latitude !== undefined && longitude !== undefined,
  });
}