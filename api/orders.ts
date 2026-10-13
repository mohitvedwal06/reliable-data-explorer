type VercelRequest = { method?: string; query: Record<string, string | string[] | undefined> };
type VercelResponse = {
  status(code: number): VercelResponse;
  json(body: unknown): VercelResponse;
  setHeader(name: string, value: string): void;
};
import { getOrderList, simulateApiConditions } from "./_lib/orders.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method not allowed." });
  }

  try {
    await simulateApiConditions();
    return res.status(200).json(getOrderList(req.query));
  } catch (error) {
    const status = Number((error as { statusCode?: number }).statusCode) || 500;
    return res.status(status).json({
      message: error instanceof Error ? error.message : "Unexpected API error.",
    });
  }
}
