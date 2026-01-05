export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'user';
  organizationType: 'cocreate' | 'cvc' | 'startup';
  company: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface UserCreateInput {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  organizationType: 'cocreate' | 'cvc' | 'startup';
  company: string;
}

export interface UserUpdateInput {
  name?: string;
  email?: string;
  role?: 'admin' | 'user';
  organizationType?: 'cocreate' | 'cvc' | 'startup';
  company?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user' | 'Administrador';
  organizationType: 'cocreate' | 'cvc' | 'startup' | 'client';
}
