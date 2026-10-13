export type OrderStatus = "paid" | "pending" | "refunded" | "failed";

export type Order = {
  id: string;
  customer: string;
  email: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  items: number;
  city: string;
  paymentMethod: string;
  notes: string;
};

const statuses: OrderStatus[] = ["paid", "pending", "refunded", "failed"];
const firstNames = ["Aarav", "Aditi", "Rohan", "Isha", "Kabir", "Meera", "Arjun", "Anaya", "Vivaan", "Sara"];
const lastNames = ["Sharma", "Verma", "Gupta", "Kapoor", "Singh", "Mehta", "Rao", "Malhotra", "Joshi", "Bansal"];
const cities = ["Delhi", "Mumbai", "Bengaluru", "Pune", "Hyderabad", "Chennai", "Jaipur", "Lucknow"];
const paymentMethods = ["UPI", "Card", "Net banking", "Wallet"];

// Stable generated data means a deep link returns the same order across invocations.
export const orders: Order[] = Array.from({ length: 12_000 }, (_, index) => {
  const first = firstNames[index % firstNames.length];
  const last = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
  const id = `ORD-${String(index + 1).padStart(6, "0")}`;

  return {
    id,
    customer: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${index}@example.com`,
    status: statuses[(index * 7 + Math.floor(index / 13)) % statuses.length],
    total: Math.round((249 + ((index * 173) % 98_000)) * 100) / 100,
    createdAt: new Date(Date.UTC(2024, 0, 1) + index * 53_000_000).toISOString(),
    items: (index % 7) + 1,
    city: cities[index % cities.length],
    paymentMethod: paymentMethods[index % paymentMethods.length],
    notes: `Generated mock order ${id}. Use this record to test detail deep links and list navigation.`,
  };
});

export async function simulateApiConditions() {
  const delay = 200 + Math.floor(Math.random() * 2801);
  await new Promise((resolve) => setTimeout(resolve, delay));

  if (Math.random() < 0.1) {
    const error = new Error("Mock API unavailable. Please retry the request.");
    Object.assign(error, { statusCode: 503 });
    throw error;
  }
}

export function getOrderList(query: Record<string, unknown>) {
  const q = String(query.q ?? "").trim().toLowerCase();
  const status = String(query.status ?? "");
  const city = String(query.city ?? "");
  const requestedSort = String(query.sort ?? "createdAt");
  const direction = String(query.order ?? "desc").toLowerCase() === "asc" ? 1 : -1;
  const page = Math.max(1, Number.parseInt(String(query.page ?? "1"), 10) || 1);
  const pageSize = Math.min(100, Math.max(10, Number.parseInt(String(query.pageSize ?? "50"), 10) || 50));
  const allowedSort = new Set(["id", "customer", "status", "total", "createdAt", "city"]);
  const sortKey = (allowedSort.has(requestedSort) ? requestedSort : "createdAt") as keyof Order;

  const filtered = orders.filter((order) => {
    const matchesSearch = !q || [order.id, order.customer, order.email, order.city, order.status]
      .some((value) => value.toLowerCase().includes(q));
    return matchesSearch && (!status || order.status === status) && (!city || order.city === city);
  });

  filtered.sort((a, b) => {
    const left = a[sortKey];
    const right = b[sortKey];
    const comparison = typeof left === "number" && typeof right === "number"
      ? left - right
      : String(left).localeCompare(String(right), undefined, { numeric: true });
    return comparison * direction || a.id.localeCompare(b.id);
  });

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pages);

  return {
    data: filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    total,
    page: safePage,
    pageSize,
    pages,
    generatedAt: new Date().toISOString(),
  };
}
