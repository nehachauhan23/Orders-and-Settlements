"use client";

import { useQuery } from "@tanstack/react-query";
import * as paymentsApi from "@/lib/api/payments";
import { queryKeys } from "@/lib/query/keys";
import { OrderStatus } from "@/lib/types";

export function useDashboard(status?: OrderStatus) {
  return useQuery({
    queryKey: queryKeys.dashboard(status),
    queryFn: () => paymentsApi.getDashboard(status),
  });
}
