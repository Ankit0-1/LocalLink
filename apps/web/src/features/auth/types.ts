export type Role = 'CUSTOMER' | 'VENDOR' | 'DELIVERY_PARTNER' | 'ADMIN';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  profileImage: string | null;
  isActive: boolean;
  verificationStatus: VerificationStatus;
  createdAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: Role;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface MeResponse {
  user: User;
}
