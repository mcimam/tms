import { api, qs } from "./client.js";

export const driversApi = {
  list: (params = {}) => api.get(`/drivers${qs(params)}`),
  get: (id) => api.get(`/drivers/${id}`),
  create: (data) => api.post("/drivers", data),
  update: (id, data) => api.put(`/drivers/${id}`, data),
  remove: (id) => api.delete(`/drivers/${id}`),
};
