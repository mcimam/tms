import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { trucksApi } from "../api/trucks.js";

export function useTrucks(params = {}) {
  return useQuery({ queryKey: ["trucks", params], queryFn: () => trucksApi.list(params) });
}

export function useCreateTruck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: trucksApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trucks"] }),
  });
}
