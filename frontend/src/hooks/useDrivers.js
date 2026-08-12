import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { driversApi } from "../api/drivers.js";

export function useDrivers(params = {}) {
  return useQuery({ queryKey: ["drivers", params], queryFn: () => driversApi.list(params) });
}

export function useCreateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: driversApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drivers"] }),
  });
}

export function useUpdateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => driversApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drivers"] }),
  });
}

export function useDeleteDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: driversApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drivers"] }),
  });
}
