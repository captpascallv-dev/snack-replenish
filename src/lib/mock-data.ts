// 模拟数据 —— 数据库接入前占位用

export type Role = "OWNER" | "STORE_MANAGER";
export type RequestStatus = "PENDING" | "ORDERED" | "RECEIVED";

export interface Store {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  storeId: string | null;
}

export interface ReplenishmentRequest {
  id: string;
  storeId: string;
  productName: string;
  quantityNeeded: number;
  unit: string;
  notes: string;
  status: RequestStatus;
  requestedBy: string;
  createdAt: string;
  fulfillment?: {
    orderDate: string;
    supplier: string;
    kg?: number;
    caseSpec?: string;
    caseCount?: number;
    orderNotes?: string;
  };
  receipt?: {
    arrivalDate: string;
    actualQuantity: number;
    feedback: string;
  };
}

export const stores: Store[] = [
  { id: "store-1", name: "中洲湾旗舰店" },
  { id: "store-2", name: "科技园分店（筹备中）" },
];

export const currentUser: User = {
  id: "user-1",
  name: "Pascal",
  role: "OWNER",
  storeId: null,
};

export const requests: ReplenishmentRequest[] = [
  {
    id: "req-1",
    storeId: "store-1",
    productName: "原味坚果混合装",
    quantityNeeded: 10,
    unit: "盒",
    notes: "周末促销活动备货，请尽快",
    status: "PENDING",
    requestedBy: "小王",
    createdAt: "2026-05-07T09:30:00",
  },
  {
    id: "req-2",
    storeId: "store-1",
    productName: "海苔肉松卷",
    quantityNeeded: 20,
    unit: "袋",
    notes: "",
    status: "ORDERED",
    requestedBy: "小王",
    createdAt: "2026-05-06T15:20:00",
    fulfillment: {
      orderDate: "2026-05-07",
      supplier: "天虹食品批发",
      kg: 15,
      caseSpec: "24袋/箱",
      caseCount: 3,
      orderNotes: "供应商说周三前到",
    },
  },
  {
    id: "req-3",
    storeId: "store-1",
    productName: "冻干草莓脆",
    quantityNeeded: 5,
    unit: "公斤",
    notes: "最近卖得很快",
    status: "RECEIVED",
    requestedBy: "小李",
    createdAt: "2026-05-04T11:00:00",
    fulfillment: {
      orderDate: "2026-05-04",
      supplier: "广州果干厂家",
      kg: 5,
      caseSpec: "1公斤/袋",
      caseCount: 5,
    },
    receipt: {
      arrivalDate: "2026-05-06",
      actualQuantity: 5,
      feedback: "品质OK，包装完好",
    },
  },
  {
    id: "req-4",
    storeId: "store-1",
    productName: "低脂鸡胸肉干",
    quantityNeeded: 8,
    unit: "盒",
    notes: "",
    status: "PENDING",
    requestedBy: "小李",
    createdAt: "2026-05-07T08:15:00",
  },
  {
    id: "req-5",
    storeId: "store-2",
    productName: "原味坚果混合装",
    quantityNeeded: 15,
    unit: "盒",
    notes: "新店首批备货",
    status: "PENDING",
    requestedBy: "小张",
    createdAt: "2026-05-07T07:45:00",
  },
];

export function getRequestsByStore(storeId: string) {
  return requests.filter((r) => r.storeId === storeId);
}

export function getRequestById(id: string) {
  return requests.find((r) => r.id === id);
}
