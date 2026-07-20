export interface Store {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  image: string | null;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  storeId: string;
  store: {
    id: string;
    name: string;
    isActive: boolean;
  } | null;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: string | null;
  items: CartItem[];
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: string;
  product: {
    id: string;
    name: string;
  };
}

export interface Order {
  id: string;
  status: string;
  total: string;
  createdAt: string;
  updatedAt: string;
  store: {
    id: string;
    name: string;
  };
  items: OrderItem[];
}

export interface StoreDetail extends Store {
  products: Product[];
}

export interface OrderTracking {
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
  deliveryPartner: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  deliveryStatus: string | null;
  items: OrderItem[];
}
