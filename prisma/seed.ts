import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const libsql = createClient({ url: "file:C:/Users/Pascal/Desktop/snack-replenish/prisma/dev.db" });
const adapter = new PrismaLibSql(libsql);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean existing
  await prisma.receipt.deleteMany();
  await prisma.fulfillment.deleteMany();
  await prisma.replenishmentRequest.deleteMany();
  await prisma.user.deleteMany();
  await prisma.store.deleteMany();

  // Stores
  const s1 = await prisma.store.create({ data: { id: "store-1", name: "中洲湾旗舰店" } });
  const s2 = await prisma.store.create({ data: { id: "store-2", name: "科技园分店（筹备中）" } });

  // Users
  await prisma.user.create({ data: { id: "user-1", name: "Pascal", role: "OWNER" } });
  await prisma.user.create({ data: { id: "user-2", name: "小王", role: "STORE_MANAGER", storeId: s1.id } });
  await prisma.user.create({ data: { id: "user-3", name: "小李", role: "STORE_MANAGER", storeId: s1.id } });
  await prisma.user.create({ data: { id: "user-4", name: "小张", role: "STORE_MANAGER", storeId: s2.id } });

  // Requests
  await prisma.replenishmentRequest.create({
    data: {
      id: "req-1", storeId: s1.id, productName: "原味坚果混合装",
      quantityNeeded: 10, unit: "盒", notes: "周末促销活动备货，请尽快",
      status: "PENDING", requestedBy: "小王", userId: "user-2",
      createdAt: new Date("2026-05-07T09:30:00"),
    },
  });

  await prisma.replenishmentRequest.create({
    data: {
      id: "req-2", storeId: s1.id, productName: "海苔肉松卷",
      quantityNeeded: 20, unit: "袋", notes: "", status: "ORDERED",
      requestedBy: "小王", userId: "user-2",
      createdAt: new Date("2026-05-06T15:20:00"),
      fulfillment: { create: { orderDate: "2026-05-07", supplier: "天虹食品批发", kg: 15, caseSpec: "24袋/箱", caseCount: 3, orderNotes: "供应商说周三前到" } },
    },
  });

  await prisma.replenishmentRequest.create({
    data: {
      id: "req-3", storeId: s1.id, productName: "冻干草莓脆",
      quantityNeeded: 5, unit: "公斤", notes: "最近卖得很快", status: "RECEIVED",
      requestedBy: "小李", userId: "user-3",
      createdAt: new Date("2026-05-04T11:00:00"),
      fulfillment: { create: { orderDate: "2026-05-04", supplier: "广州果干厂家", kg: 5, caseSpec: "1公斤/袋", caseCount: 5 } },
      receipt: { create: { arrivalDate: "2026-05-06", actualQuantity: 5, feedback: "品质OK，包装完好" } },
    },
  });

  await prisma.replenishmentRequest.create({
    data: {
      id: "req-4", storeId: s1.id, productName: "低脂鸡胸肉干",
      quantityNeeded: 8, unit: "盒", notes: "", status: "PENDING",
      requestedBy: "小李", userId: "user-3",
      createdAt: new Date("2026-05-07T08:15:00"),
    },
  });

  await prisma.replenishmentRequest.create({
    data: {
      id: "req-5", storeId: s2.id, productName: "原味坚果混合装",
      quantityNeeded: 15, unit: "盒", notes: "新店首批备货", status: "PENDING",
      requestedBy: "小张", userId: "user-4",
      createdAt: new Date("2026-05-07T07:45:00"),
    },
  });

  console.log("Seed complete: 2 stores, 4 users, 5 requests");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
