export type OrderStatus = "paid" | "pending" | "refunded" | "failed";
export type Order = {
  id: string; customer: string; email: string; status: OrderStatus; total: number;
  createdAt: string; items: number; city: string; paymentMethod: string; notes: string;
};
export type OrdersResponse = {
  data: Order[]; total: number; page: number; pageSize: number; pages: number; generatedAt: string;
};