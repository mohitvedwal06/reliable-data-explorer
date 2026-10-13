type VercelRequest = { method?: string; query: Record<string, string | string[] | undefined> };
type VercelResponse = {
  status(code: number): VercelResponse;
  json(body: unknown): VercelResponse;
  setHeader(name: string, value: string): void;
};
import { orders } from "./_lib/orders.js";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({ ok: true, records: orders.length });
}
