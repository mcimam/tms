import { api, qs } from "./client.js";

export const auditLogsApi = {
  list: (params = {}) => api.get(`/audit-logs${qs(params)}`),
};
