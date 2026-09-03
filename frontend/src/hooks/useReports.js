import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export function usePatterns({ limit = 20, offset = 0 } = {}) {
  return useQuery({
    queryKey: ["patterns", { limit, offset }],
    queryFn: () => apiClient.get("/patterns", { limit, offset }),
  });
}

export function riskFromReportCount(reportCount) {
  if (reportCount >= 8) return "high";
  if (reportCount >= 3) return "moderate";
  return "low";
}
