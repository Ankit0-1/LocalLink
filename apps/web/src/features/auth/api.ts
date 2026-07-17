import { apiClient } from '../../lib/apiClient';
import type { AuthResponse, LoginPayload, MeResponse, RegisterPayload } from './types';

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/api/auth/login', payload);
}

export function register(payload: RegisterPayload): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/api/auth/register', payload);
}

export function fetchMe(): Promise<MeResponse> {
  return apiClient.get<MeResponse>('/api/auth/me');
}
