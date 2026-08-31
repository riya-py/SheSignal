import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export function useRouteRisk(token) {
  return useMutation({
    mutationFn: ({ origin, destination }) =>
      apiClient.post("/route-risk", { origin, destination }, token),
  });
}