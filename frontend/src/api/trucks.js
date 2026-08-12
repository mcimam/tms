import { api, qs } from "./client.js";

export const trucksApi = {
  list: (params = {}) => api.get(`/trucks${qs(params)}`),
  get: (id) => api.get(`/trucks/${id}`),
  create: (data) => api.post("/trucks", data),
  update: (id, data) => api.put(`/trucks/${id}`, data),
  remove: (id) => api.delete(`/trucks/${id}`),
};
