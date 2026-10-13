type VercelRequest = { method?: string; query: Record<string, string | string[] | undefined> };
type VercelResponse = {
  status(code: number): VercelResponse;
  json(body: unknown): VercelResponse;
  setHeader(name: string, value: string): void;
};
import { orders, simulateApiConditions } from "../_lib/orders.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method not allowed." });
  }

  try {
    await simulateApiConditions();
    const id = String(req.query.id ?? "");
    const order = orders.find((item) => item.id === id);
    if (!order) return res.status(404).json({ message: "Order not found." });
    return res.status(200).json(order);
  } catch (error) {
    const status = Number((error as { statusCode?: number }).statusCode) || 500;
    return res.status(status).json({
      message: error instanceof Error ? error.message : "Unexpected API error.",
    });
  }
}
