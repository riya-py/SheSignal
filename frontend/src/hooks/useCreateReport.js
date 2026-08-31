import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export function useCreateReport(token) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ category, description, latitude, longitude, occurredAt }) =>
      apiClient.post(
        "/reports",
        {
          category,
          description,
          latitude,
          longitude,
          occurred_at: occurredAt,
        },
        token
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["patterns"] });
      queryClient.invalidateQueries({ queryKey: ["risk"] });
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });
}