/**
 * API Client for Enterprise Hub Backend
 * Centralized API communication with auth token management
 * 
 * MODO SIMULAÇÃO: Use mock data para focar em UX/estética
 */

import mockApi from './mockApi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true' || true; // SEMPRE MOCK para focar em UX

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

interface UserProfile {
  userId: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  company: string;
  department?: string;
  jobRole?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get access token from localStorage
   */
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  /**
   * Make authenticated request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
  
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // Return full error response including details
        return {
          success: false,
          error: data.error || 'Request failed',
          details: data.details,
        };
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ===== Auth Endpoints =====

  async login(email: string, password: string): Promise<ApiResponse<AuthTokens>> {
    // MODO SIMULAÇÃO: Usar mock para focar em UX
    if (USE_MOCK) {
      const response = await mockApi.login(email, password);
      
      // Save tokens to localStorage
      if (response.success && response.data) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
      
      return response;
    }
    
    const response = await this.request<AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Save tokens to localStorage
    if (response.success && response.data) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }

    return response;
  }

  async logout(): Promise<void> {
    if (USE_MOCK) {
      await mockApi.logout();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return;
    }
    
    await this.request('/auth/logout', { method: 'POST' });
    
    // Clear tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async refreshToken(): Promise<ApiResponse<AuthTokens>> {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      return { success: false, error: 'No refresh token available' };
    }

    const response = await this.request<AuthTokens>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    if (response.success && response.data) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }

    return response;
  }

  async getCurrentUser(): Promise<ApiResponse<UserProfile>> {
    if (USE_MOCK) {
      return mockApi.getProfile();
    }
    return this.request<UserProfile>('/auth/me');
  }

  // ===== Admin Endpoints =====

  async listUsers(): Promise<ApiResponse<any[]>> {
    if (USE_MOCK) {
      return mockApi.getUsers();
    }
    return this.request<any[]>('/admin/users');
  }

  async createUser(userData: {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
    organizationType: 'cocreate' | 'cvc' | 'startup';
    company: string;
  }): Promise<ApiResponse<any>> {
    if (USE_MOCK) {
      return mockApi.createUser(userData);
    }
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: string, updates: any): Promise<ApiResponse<any>> {
    if (USE_MOCK) {
      return mockApi.updateUser(userId, updates);
    }
    return this.request(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async resetPassword(userId: string, newPassword: string): Promise<ApiResponse<any>> {
    return this.request(`/admin/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  }

  async deleteUser(userId: string): Promise<ApiResponse<any>> {
    if (USE_MOCK) {
      return mockApi.deleteUser(userId);
    }
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // ===== Health Check =====

  async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>('/health');
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);

// Export types
export type { ApiResponse, AuthTokens, UserProfile };
