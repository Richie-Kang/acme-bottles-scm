import type { Material, Product } from "@prisma/client";

export type ScheduleStatus =
  | "Completed"
  | "In Production"
  | "Pending"
  | "Delay expected"
  | "Unable to fulfill";

export type ScheduledPO = {
  id: string;
  poNumber: string;
  customer: string;
  product: Product;
  quantity: number;
  notes: string | null;
  orderDate: string;
  createdAt: string;
  expectedEta: string;
  completedAt: string | null;
  status: ScheduleStatus;
  expectedStart: string | null;
  eta: string | null;
  lateDays: number;
  isCurrent: boolean;
};

export type ProductionResponse = {
  now: string;
  currentLines: ScheduledPO[];
  allOrders: ScheduledPO[];
};

export type SupplyOrderDTO = {
  id: string;
  material: Material;
  quantityKg: number;
  supplier: string;
  trackingNumber: string | null;
  orderDate: string;
  eta: string;
  received: boolean;
};

export type SuppliesResponse = {
  totals: Record<Material, { receivedKg: number; inTransitKg: number; inTransitCount: number }>;
  orders: SupplyOrderDTO[];
};
