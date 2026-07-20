export interface Order {
  id: string;
  status: string;
  total: string;
  createdAt: string;
  updatedAt: string;
  store: {
    id: string;
    name: string;
    address: string | null;
  };
  customer: {
    id: string;
    name: string;
    phone: string | null;
  };
}

export interface Job {
  id: string;
  status: string;
  createdAt: string;
  order: Order;
}
