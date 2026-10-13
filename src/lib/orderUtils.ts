import type { ListParams } from "../api";

export const DEFAULTS: ListParams = { q: "", status: "", city: "", sort: "createdAt", order: "desc", page: 1, pageSize: 50 };
export const cities = ["Delhi", "Mumbai", "Bengaluru", "Pune", "Hyderabad", "Chennai", "Jaipur", "Lucknow"];
export function parseParams(search: URLSearchParams): ListParams {
  const page = Number(search.get("page") ?? 1);
  const pageSize = Number(search.get("pageSize") ?? 50);
  return {
    q: search.get("q") ?? "",
    status: ["paid", "pending", "refunded", "failed"].includes(search.get("status") ?? "") ? search.get("status")! : "",
    city: cities.includes(search.get("city") ?? "") ? search.get("city")! : "",
    sort: ["id", "customer", "status", "total", "createdAt", "city"].includes(search.get("sort") ?? "") ? search.get("sort")! : DEFAULTS.sort,
    order: search.get("order") === "asc" ? "asc" : "desc",
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
    pageSize: [25, 50, 100].includes(pageSize) ? pageSize : 50
  };
}
export function paramsToString(p: ListParams) {
  const s = new URLSearchParams();
  if (p.q) s.set("q", p.q);
  if (p.status) s.set("status", p.status);
  if (p.city) s.set("city", p.city);
  if (p.sort !== DEFAULTS.sort) s.set("sort", p.sort);
  if (p.order !== DEFAULTS.order) s.set("order", p.order);
  if (p.page !== 1) s.set("page", String(p.page));
  if (p.pageSize !== 50) s.set("pageSize", String(p.pageSize));
  return s;
}
export const money = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
export const formatDate = (s: string) => new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

