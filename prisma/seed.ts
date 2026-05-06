import { PrismaClient, Product, Material } from "@prisma/client";

const prisma = new PrismaClient();

const PO_SEED = [
  {
    poNumber: "PO-2026-001",
    customer: "AquaPure Beverages",
    product: Product.ONE_LITER,
    quantity: 50000,
    notes: null,
    orderDate: new Date("2026-01-05T00:00:00Z"),
    expectedEta: new Date("2026-01-08T00:00:00Z"),
    completedAt: new Date("2026-01-08T00:00:00Z"),
  },
  {
    poNumber: "PO-2026-002",
    customer: "GreenLeaf Naturals",
    product: Product.ONE_LITER,
    quantity: 30000,
    notes: null,
    orderDate: new Date("2026-01-12T00:00:00Z"),
    expectedEta: new Date("2026-01-14T00:00:00Z"),
    completedAt: new Date("2026-01-14T00:00:00Z"),
  },
  {
    poNumber: "PO-2026-003",
    customer: "FreshFlow Dairy",
    product: Product.ONE_LITER,
    quantity: 75000,
    notes: "250ml Milk Bottle equivalent",
    orderDate: new Date("2026-01-20T00:00:00Z"),
    expectedEta: new Date("2026-02-06T00:00:00Z"),
    completedAt: null,
  },
  {
    poNumber: "PO-2026-004",
    customer: "SunSip Beverages",
    product: Product.ONE_GALLON,
    quantity: 20000,
    notes: "2L Carbonated Drink Bottle equivalent",
    orderDate: new Date("2026-02-01T00:00:00Z"),
    expectedEta: new Date("2026-02-14T00:00:00Z"),
    completedAt: null,
  },
  {
    poNumber: "PO-2026-005",
    customer: "ClearSpring Water Co.",
    product: Product.ONE_LITER,
    quantity: 60000,
    notes: "330ml Sparkling Water Bottle equivalent",
    orderDate: new Date("2026-02-10T00:00:00Z"),
    expectedEta: new Date("2026-02-25T00:00:00Z"),
    completedAt: null,
  },
  {
    poNumber: "PO-2026-006",
    customer: "MountainBrew Co.",
    product: Product.ONE_GALLON,
    quantity: 25000,
    notes: null,
    orderDate: new Date("2026-02-14T00:00:00Z"),
    expectedEta: new Date("2026-02-22T00:00:00Z"),
    completedAt: null,
  },
  {
    poNumber: "PO-2026-007",
    customer: "ValleyMart Distribution",
    product: Product.ONE_GALLON,
    quantity: 5000,
    notes: "Small trial run",
    orderDate: new Date("2026-02-16T00:00:00Z"),
    expectedEta: new Date("2026-02-26T00:00:00Z"),
    completedAt: null,
  },
];

const SUPPLY_SEED = [
  { material: Material.PET_RESIN, quantityKg: 5000, supplier: "Global Resin Co", trackingNumber: "TRK-00321", orderDate: "2026-01-01", eta: "2026-01-03" },
  { material: Material.PTA, quantityKg: 3000, supplier: "ChemCo Industries", trackingNumber: "TRK-00322", orderDate: "2026-01-01", eta: "2026-01-03" },
  { material: Material.EG, quantityKg: 2000, supplier: "EthGlyc Ltd", trackingNumber: "TRK-00323", orderDate: "2026-01-01", eta: "2026-01-03" },
  { material: Material.PET_RESIN, quantityKg: 8000, supplier: "Global Resin Co", trackingNumber: "TRK-00451", orderDate: "2026-01-15", eta: "2026-01-18" },
  { material: Material.PTA, quantityKg: 2500, supplier: "ChemCo Industries", trackingNumber: "TRK-00452", orderDate: "2026-01-22", eta: "2026-01-25" },
  { material: Material.PET_RESIN, quantityKg: 6000, supplier: "Global Resin Co", trackingNumber: "TRK-00501", orderDate: "2026-02-08", eta: "2026-02-22" },
  { material: Material.EG, quantityKg: 700, supplier: "EthGlyc Ltd", trackingNumber: "TRK-00502", orderDate: "2026-02-08", eta: "2026-02-25" },
];

async function main() {
  console.log("Seeding database…");
  await prisma.purchaseOrder.deleteMany({});
  await prisma.supplyOrder.deleteMany({});

  for (const po of PO_SEED) {
    await prisma.purchaseOrder.create({ data: po });
  }
  for (const s of SUPPLY_SEED) {
    await prisma.supplyOrder.create({
      data: {
        material: s.material,
        quantityKg: s.quantityKg,
        supplier: s.supplier,
        trackingNumber: s.trackingNumber,
        orderDate: new Date(`${s.orderDate}T00:00:00Z`),
        eta: new Date(`${s.eta}T00:00:00Z`),
      },
    });
  }
  console.log(`Seeded ${PO_SEED.length} POs and ${SUPPLY_SEED.length} supply orders.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
