export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  isActive: boolean;
  verificationStatus: string;
  createdAt: string;
}

export interface AdminStore {
  id: string;
  name: string;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  vendor: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AdminOrder {
  id: string;
  status: string;
  total: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  store: {
    id: string;
    name: string;
    vendor: {
      id: string;
      name: string;
    };
  };
  deliveryPartner: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
}
