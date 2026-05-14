// src/types/auth.ts

export type Role = 'ADMIN' | 'MANAGER' | 'ANALYST' | 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_ANALYST';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  username: string;
  role: Role;
}

export interface User {
  username: string;
  role: Role;
}