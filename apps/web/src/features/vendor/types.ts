export interface Store {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  image: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  price: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StorePayload {
  name: string;
  description: string;
  address: string;
  image: string;
}

export interface ProductPayload {
  name: string;
  price: number;
  description: string;
  image: string;
}
