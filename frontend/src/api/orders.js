import { api, qs } from "./client.js";

// Must match the backend's page_size upper bound (Query(..., le=200) in routers/orders.py).
const MAX_PAGE_SIZE = 200;

export const ordersApi = {
  list: (params = {}) => api.get(`/orders${qs(params)}`),
  stats: (params = {}) => api.get(`/orders/stats${qs(params)}`),
  // Loops through every page so callers (e.g. Excel export) never silently
  // truncate once the result set grows past a single page.
  listAll: async (params = {}) => {
    let page = 1;
    let items = [];
    let total = Infinity;
    while (items.length < total) {
      const res = await ordersApi.list({ ...params, page, page_size: MAX_PAGE_SIZE });
      total = res.total;
      items = items.concat(res.items);
      if (res.items.length === 0) break;
      page += 1;
    }
    return items;
  },
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
