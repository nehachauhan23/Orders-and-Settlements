"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as paymentsApi from "@/lib/api/payments";
import { queryKeys } from "@/lib/query/keys";

export function usePayments(orderId: string) {
  return useQuery({
    queryKey: queryKeys.payments(orderId),
    queryFn: () => paymentsApi.listPayments(orderId),
    enabled: Boolean(orderId),
  });
}

export function useCreatePayment(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      input,
      idempotencyKey,
    }: {
      input: paymentsApi.CreatePaymentInput;
      idempotencyKey: string;
    }) => paymentsApi.createPayment(orderId, input, idempotencyKey),
    onSuccess: () => {
      // Refresh the order (new balance/status), its payment history, and
      // the dashboard so every view reflects the new payment immediately.
      queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments(orderId) });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useCreateRefund(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      input,
      idempotencyKey,
    }: {
      input: paymentsApi.CreateRefundInput;
      idempotencyKey: string;
    }) => paymentsApi.createRefund(orderId, input, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments(orderId) });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
