import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ordersApi } from "../api/orders.js";

function invalidateOrderRelated(qc) {
  qc.invalidateQueries({ queryKey: ["orders"] });
  qc.invalidateQueries({ queryKey: ["order-stats"] });
  qc.invalidateQueries({ queryKey: ["drivers"] });
  qc.invalidateQueries({ queryKey: ["trucks"] });
}

export function useOrders(params = {}, options = {}) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => ordersApi.list(params),
    ...options,
  });
}

export function useOrderStats(params = {}, options = {}) {
  return useQuery({
    queryKey: ["order-stats", params],
    queryFn: () => ordersApi.stats(params),
    ...options,
  });
}

export function useOrder(id, options = {}) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () => ordersApi.get(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ordersApi.create,
    onSuccess: () => invalidateOrderRelated(qc),
  });
}

export function useAssignOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, driverId, truckId }) => ordersApi.assign(id, driverId, truckId),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["order", id] });
      invalidateOrderRelated(qc);
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => ordersApi.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["order", id] });
      invalidateOrderRelated(qc);
    },
  });
}

export function useUpdateOrderLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => ordersApi.updateLocation(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["order", id] });
      invalidateOrderRelated(qc);
    },
  });
}

export function useOrderPhotos(orderId, options = {}) {
  return useQuery({
    queryKey: ["order-photos", orderId],
    queryFn: () => ordersApi.listPhotos(orderId),
    enabled: !!orderId,
    ...options,
  });
}

export function useUploadPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }) => ordersApi.uploadPhoto(id, file),
    onSuccess: (_, { id }) => qc.invalidateQueries({ queryKey: ["order-photos", id] }),
  });
}
