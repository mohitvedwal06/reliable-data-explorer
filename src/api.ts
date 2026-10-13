import type { Order, OrdersResponse } from "./types";

export type ListParams = {
  q: string; status: string; city: string; sort: string; order: string; page: number; pageSize: number;
};

async function readJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try { const body = await response.json() as { message?: string }; message = body.message ?? message; } catch { /* non-JSON error */ }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export function fetchOrders(params: ListParams, signal?: AbortSignal) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== undefined && value !== null) search.set(key, String(value));
  });
  return readJson<OrdersResponse>(`/api/orders?${search.toString()}`, signal);
}
export function fetchOrder(id: string, signal?: AbortSignal) {
  return readJson<Order>(`/api/orders/${encodeURIComponent(id)}`, signal);
}