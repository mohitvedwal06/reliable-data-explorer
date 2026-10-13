import express, { type Request, type Response } from "express";

const app = express();
app.use(express.json());

type Status = "paid" | "pending" | "refunded" | "failed";
type Order = {
    id: string; customer: string; email: string; status: Status; total: number;
    createdAt: string; items: number; city: string; paymentMethod: string; notes: string;
};

const statuses: Status[] = ["paid", "pending", "refunded", "failed"];
const firstNames = ["Aarav", "Aditi", "Rohan", "Isha", "Kabir", "Meera", "Arjun", "Anaya", "Vivaan", "Sara"];
const lastNames = ["Sharma", "Verma", "Gupta", "Kapoor", "Singh", "Mehta", "Rao", "Malhotra", "Joshi", "Bansal"];
const cities = ["Delhi", "Mumbai", "Bengaluru", "Pune", "Hyderabad", "Chennai", "Jaipur", "Lucknow"];
const payments = ["UPI", "Card", "Net banking", "Wallet"];

const orders: Order[] = Array.from({ length: 12_000 }, (_, i) => {
    const first = firstNames[i % firstNames.length];
    const last = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
    const id = `ORD-${String(i + 1).padStart(6, "0")}`;
    return {
        id, customer: `${first} ${last}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
        status: statuses[(i * 7 + Math.floor(i / 13)) % statuses.length],
        total: Math.round((249 + ((i * 173) % 98_000)) * 100) / 100,
        createdAt: new Date(Date.UTC(2024, 0, 1) + i * 53_000_000).toISOString(),
        items: (i % 7) + 1, city: cities[i % cities.length],
        paymentMethod: payments[i % payments.length],
        notes: `Generated mock order ${id}. Use this record to test detail deep links and list navigation.`
    };
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
app.use(async (_req, res, next) => {
    const delay = 200 + Math.floor(Math.random() * 2801);
    await sleep(delay);
    if (Math.random() < 0.1) {
        res.setHeader("Retry-After", "1");
        res.status(503).json({ message: "Mock API unavailable. Please retry the request." });
        return;
    }
    next();
});

app.get("/api/health", (_req, res) => res.json({ ok: true, records: orders.length }));

app.get("/api/orders", (req: Request, res: Response) => {
    const q = String(req.query.q ?? "").trim().toLowerCase();
    const status = String(req.query.status ?? "");
    const city = String(req.query.city ?? "");
    const sort = String(req.query.sort ?? "createdAt");
    const direction = String(req.query.order ?? "desc").toLowerCase() === "asc" ? 1 : -1;
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
    const pageSize = Math.min(100, Math.max(10, Number.parseInt(String(req.query.pageSize ?? "50"), 10) || 50));
    const allowedSort = new Set(["id", "customer", "status", "total", "createdAt", "city"]);
    const sortKey = (allowedSort.has(sort) ? sort : "createdAt") as keyof Order;

    let result = orders.filter((o) => {
        const matchesQ = !q || [o.id, o.customer, o.email, o.city, o.status].some((v) => v.toLowerCase().includes(q));
        return matchesQ && (!status || o.status === status) && (!city || o.city === city);
    });
    result.sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey];
        const cmp = typeof av === "number" && typeof bv === "number"
            ? av - bv : String(av).localeCompare(String(bv), undefined, { numeric: true });
        return cmp * direction || a.id.localeCompare(b.id);
    });
    const total = result.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, pages);
    const data = result.slice((safePage - 1) * pageSize, safePage * pageSize);
    res.json({ data, total, page: safePage, pageSize, pages, generatedAt: new Date().toISOString() });
});

app.get("/api/orders/:id", (req, res) => {
    const order = orders.find((o) => o.id === req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found." });
    return res.json(order);
});

const port = Number(process.env.API_PORT ?? 3001);
app.listen(port, () => console.log(`Mock Orders API listening on http://localhost:${port} (${orders.length} records)`));