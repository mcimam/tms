import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { customersApi } from "../api/customers.js";

export function useCustomers() {
  return useQuery({ queryKey: ["customers"], queryFn: customersApi.list });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => customersApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: customersApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}
