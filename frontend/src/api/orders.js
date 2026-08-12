import { api, qs } from "./client.js";

export const ordersApi = {
  list: (params = {}) => api.get(`/orders${qs(params)}`),
  stats: (params = {}) => api.get(`/orders/stats${qs(params)}`),
  get: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post("/orders", data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  remove: (id) => api.delete(`/orders/${id}`),
  assign: (id, driverId, truckId) => api.post(`/orders/${id}/assign`, { driver_id: driverId, truck_id: truckId }),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  updateLocation: (id, data) => api.patch(`/orders/${id}/location`, data),
  listPhotos: (id) => api.get(`/orders/${id}/photos`),
  uploadPhoto: (id, file) => {
    const form = new FormData();
    form.append("file", file);
    return api.postForm(`/orders/${id}/photos`, form);
  },
  photoFileBlob: (id, photoId) => api.get(`/orders/${id}/photos/${photoId}/file`),
};
