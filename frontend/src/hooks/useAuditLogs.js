import { useQuery } from "@tanstack/react-query";

import { auditLogsApi } from "../api/auditLogs.js";

export function useAuditLogs(params = {}, options = {}) {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => auditLogsApi.list(params),
    ...options,
  });
}
