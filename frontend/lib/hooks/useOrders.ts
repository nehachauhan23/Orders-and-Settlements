"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ordersApi from "@/lib/api/orders";
import { queryKeys } from "@/lib/query/keys";
import { OrderStatus } from "@/lib/types";

export function useOrders(status?: OrderStatus) {
  return useQuery({
    queryKey: queryKeys.orders(status),
    queryFn: () => ordersApi.listOrders(status),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => ordersApi.getOrder(id),
    enabled: Boolean(id),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ordersApi.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateOrder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ordersApi.UpdateOrderInput) => ordersApi.updateOrder(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.order(id) });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ordersApi.deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
