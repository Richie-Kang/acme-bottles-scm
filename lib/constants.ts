import { Product, Material } from "@prisma/client";

export const CAPACITY_PER_HOUR: Record<Product, number> = {
  ONE_LITER: 2000,
  ONE_GALLON: 1500,
};

export const MATERIAL_PER_UNIT_GRAMS: Record<Product, Record<Material, number>> = {
  ONE_LITER: { PET_RESIN: 20, PTA: 15, EG: 10 },
  ONE_GALLON: { PET_RESIN: 65, PTA: 45, EG: 20 },
};

export const PRODUCT_LABEL: Record<Product, string> = {
  ONE_LITER: "1L Bottle",
  ONE_GALLON: "1-Gallon Bottle",
};

export const MATERIAL_LABEL: Record<Material, string> = {
  PET_RESIN: "PET Resin",
  PTA: "PTA",
  EG: "EG",
};

export const MATERIALS: Material[] = ["PET_RESIN", "PTA", "EG"];
export const PRODUCTS: Product[] = ["ONE_LITER", "ONE_GALLON"];
