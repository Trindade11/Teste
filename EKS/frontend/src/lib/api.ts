/**
 * API Client for Enterprise Hub Backend
 * Centralized API communication with auth token management
 * 
 * MODO SIMULAÇÃO: Use mock data para focar em UX/estética
 */

import mockApi from './mockApi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
// Use backend by default; enable mock only if explicitly set
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

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

interface OnboardingPrefillPayload {
  userId: string;
  prefill: {
    name: string | null;
    email: string | null;
    company: string | null;
    jobTitle: string | null;
    department: string | null;
    location: string | null;
    organizationType: string | null;
    status: string | null;
    relationshipType: string | null;
    accessTypes: string[];
  };
}

interface OnboardingDraftPayload {
  roleDescription: string;
  departmentDescription: string;
  profileDescription: string;
  competencies: string[];
  primaryObjective: string;
  topChallenges: string;
  orgChartValidated: boolean;
  defaultVisibility: 'corporate' | 'personal';
  memoryLevel: 'short' | 'medium' | 'long';
}

interface OnboardingDraftResponse {
  draft: Partial<OnboardingDraftPayload>;
  updatedAt: string;
}

interface OnboardingCompleteResponse {
  completedAt: string;
}

interface OrgChartUser {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  department: string;
}

interface OrgChartData {
  user: OrgChartUser;
  manager: OrgChartUser | null;
  peers: OrgChartUser[];
  subordinates: OrgChartUser[];
}

interface OrgChartNode {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  department: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private isAuthEndpoint(endpoint: string): boolean {
    return (
      endpoint.startsWith('/auth/login') ||
      endpoint.startsWith('/auth/refresh') ||
      endpoint.startsWith('/auth/logout')
    );
  }

  private clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
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
    return this.requestWithRetry<T>(endpoint, options, true);
  }

  private async requestWithRetry<T>(
    endpoint: string,
    options: RequestInit,
    allowRetry: boolean
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

      if (response.status === 401 && allowRetry && !this.isAuthEndpoint(endpoint)) {
        const refreshToken = typeof window === 'undefined' ? null : localStorage.getItem('refreshToken');

        if (!refreshToken) {
          this.clearTokens();
          return { success: false, error: 'Authentication required' };
        }

        const refreshResponse = await this.refreshToken();
        if (!refreshResponse.success) {
          this.clearTokens();
          return { success: false, error: 'Authentication required' };
        }

        return this.requestWithRetry<T>(endpoint, options, false);
      }

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
    this.clearTokens();
  }

  async refreshToken(): Promise<ApiResponse<AuthTokens>> {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    
    if (!refreshTokenValue) {
      return { success: false, error: 'No refresh token available' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Refresh failed' };
      }

      if (data.success && data.data) {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
      }

      return data;
    } catch (error) {
      return { success: false, error: 'Refresh request failed' };
    }
  }

  async getCurrentUser(): Promise<ApiResponse<UserProfile>> {
    if (USE_MOCK) {
      return mockApi.getProfile();
    }
    return this.request<UserProfile>('/auth/me');
  }

  // ===== Onboarding =====

  async getOrgChart(email: string): Promise<ApiResponse<OrgChartData>> {
    return this.request<OrgChartData>(`/orgchart/${encodeURIComponent(email)}`);
  }

  async getOrgChartNodes(): Promise<ApiResponse<OrgChartNode[]>> {
    if (USE_MOCK) {
      return (mockApi as any).getAllOrgChartNodes();
    }
    return this.request<OrgChartNode[]>('/orgchart/nodes');
  }

  async getOnboardingDraft(): Promise<ApiResponse<OnboardingDraftResponse | null>> {
    return this.request<OnboardingDraftResponse | null>('/onboarding/draft');
  }

  async saveOnboardingDraft(draft: Partial<OnboardingDraftPayload>): Promise<ApiResponse<{ updatedAt: string }>> {
    return this.request<{ updatedAt: string }>('/onboarding/draft', {
      method: 'POST',
      body: JSON.stringify({ draft }),
    });
  }

  async completeOnboarding(payload: Partial<OnboardingDraftPayload>): Promise<ApiResponse<OnboardingCompleteResponse>> {
    return this.request<OnboardingCompleteResponse>('/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify({ payload }),
    });
  }

  async getOnboardingStatus(): Promise<ApiResponse<{ status: string; completedAt: string | null }>> {
    return this.request<{ status: string; completedAt: string | null }>('/onboarding/status');
  }

  async getOnboardingPrefill(): Promise<ApiResponse<OnboardingPrefillPayload>> {
    if (USE_MOCK) {
      return { success: true, data: { userId: 'mock', prefill: {
        name: null,
        email: null,
        company: null,
        jobTitle: null,
        department: null,
        location: null,
        organizationType: null,
        status: null,
        relationshipType: null,
        accessTypes: [],
      } } };
    }

    return this.request<OnboardingPrefillPayload>('/onboarding/prefill');
  }

  // ===== User Profile Data (Neo4j) =====

  async getUserProfileData(): Promise<ApiResponse<{
    user: {
      userId: string;
      email: string;
      name: string;
      role: string;
      company: string;
      organizationType: string | null;
      jobTitle: string | null;
      relationshipType: string | null;
      accessTypes: string[];
      status: string | null;
      createdAt: any;
      updatedAt: any;
    };
    onboardingResponse: {
      roleDescription?: string;
      departmentDescription?: string;
      profileDescription?: string;
      competencies?: string[];
      primaryObjective?: string;
      topChallenges?: string;
      orgChartValidated?: boolean;
      createdAt?: string;
      updatedAt?: string;
      defaultVisibility?: string;
      memoryLevel?: string;
    } | null;
    department: string | null;
    organization: string | null;
    location: string | null;
  }>> {
    if (USE_MOCK) {
      return mockApi.getUserProfileData();
    }
    return this.request<any>('/user/profile-data');
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

  // ===== Data Ingestion =====

  async getIngestStatus(): Promise<ApiResponse<{
    nodeCounts: Record<string, number>;
    relationshipCounts: Record<string, number>;
    sampleUsers: Array<{
      email: string;
      name: string;
      status: string;
      department: string;
      organization: string;
      accessTypes: string[];
    }>;
    isEmpty: boolean;
  }>> {
    const raw = await this.request<any>('/admin/ingest/status');
    if (!raw.success) return raw;

    // Normalize: backend should return {success, data} but we accept either data-wrapped or raw.
    const candidate = (raw as any).data ?? raw;
    const payload = {
      nodeCounts: candidate.nodeCounts ?? {},
      relationshipCounts: candidate.relationshipCounts ?? {},
      sampleUsers: candidate.sampleUsers ?? [],
      isEmpty: Boolean(candidate.isEmpty),
    };

    return { success: true, data: payload };
  }

  async uploadOrgChart(file: File): Promise<ApiResponse<{
    summary: {
      totalRows: number;
      usersCreated: number;
      usersUpdated: number;
      departmentsCreated: number;
      locationsCreated: number;
      organizationsCreated: number;
      relationshipsCreated: number;
      errors: Array<{ row: number; email: string; error: string }>;
    };
    users: Array<{
      email: string;
      name: string;
      action: 'created' | 'updated';
      department: string;
      accessAreas: string[];
      accessTypes: string[];
    }>;
  }>> {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/admin/ingest/orgchart`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Upload failed' };
    }

    return { success: true, data };
  }

  // ===== Projects CRUD =====

  async getProjects(filters?: { status?: string; department?: string; ownerId?: string; includeArchived?: boolean }): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.ownerId) params.append('ownerId', filters.ownerId);
    if (filters?.includeArchived) params.append('includeArchived', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/projects${query}`);
  }

  async getProject(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/projects/${id}`);
  }

  async createProject(project: any): Promise<ApiResponse<any>> {
    return this.request<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async createProjectNewVersion(id: string, updates: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/projects/${id}/new-version`, {
      method: 'POST',
      body: JSON.stringify(updates),
    });
  }

  async updateProject(id: string, project: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    });
  }

  async deleteProject(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async getProjectHistory(id: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/projects/${id}/history`);
  }

  // ===== OKRs & Objectives =====

  async getOkrsList(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/projects/okrs/list');
  }

  async getObjectivesList(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/projects/objectives/list');
  }

  async createOkr(okr: any): Promise<ApiResponse<any>> {
    return this.request<any>('/projects/okrs', {
      method: 'POST',
      body: JSON.stringify(okr),
    });
  }

  async createObjective(objective: any): Promise<ApiResponse<any>> {
    return this.request<any>('/projects/objectives', {
      method: 'POST',
      body: JSON.stringify(objective),
    });
  }

  async archiveOkr(id: string, reason?: string, supersededById?: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/projects/okrs/${id}/archive`, {
      method: 'POST',
      body: JSON.stringify({ reason, supersededById }),
    });
  }

  async deleteOkr(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/projects/okrs/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteObjective(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/projects/objectives/${id}`, {
      method: 'DELETE',
    });
  }

  async updateObjective(id: string, objective: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/projects/objectives/${id}`, {
      method: 'PUT',
      body: JSON.stringify(objective),
    });
  }

  // ===== Ontology =====

  async getOntologyStats(): Promise<ApiResponse<any>> {
    return this.request<any>('/ontology/stats');
  }

  async getOntologySchema(): Promise<ApiResponse<any>> {
    return this.request<any>('/ontology/schema');
  }

  async getOntologyTaxonomy(): Promise<ApiResponse<any>> {
    return this.request<any>('/ontology/taxonomy');
  }

  async getOntologyThesaurus(): Promise<ApiResponse<any>> {
    return this.request<any>('/ontology/thesaurus');
  }

  async getOntologyIngestionSources(): Promise<ApiResponse<any>> {
    return this.request<any>('/ontology/ingestion-sources');
  }

  async getOntologyGraph(limit?: number, nodeTypes?: string[]): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (nodeTypes?.length) params.append('nodeTypes', nodeTypes.join(','));
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<any>(`/ontology/graph${query}`);
  }

  // ===== External Participants =====

  async getExternalParticipants(filters?: {
    status?: string;
    partnerType?: string;
    organization?: string;
    search?: string;
  }): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.partnerType) params.append('partnerType', filters.partnerType);
    if (filters?.organization) params.append('organization', filters.organization);
    if (filters?.search) params.append('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/external-participants${query}`);
  }

  async getExternalParticipant(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/external-participants/${id}`);
  }

  async createExternalParticipant(data: {
    name: string;
    email?: string;
    organization: string;
    partnerType: 'strategic' | 'operational' | 'tactical';
    role?: string;
    notes?: string;
  }): Promise<ApiResponse<any>> {
    return this.request<any>('/external-participants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateExternalParticipant(id: string, data: {
    name?: string;
    email?: string;
    organization?: string;
    partnerType?: 'strategic' | 'operational' | 'tactical';
    role?: string;
    notes?: string;
    status?: 'active' | 'inactive';
  }): Promise<ApiResponse<any>> {
    return this.request<any>(`/external-participants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteExternalParticipant(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/external-participants/${id}`, {
      method: 'DELETE',
    });
  }

  async reactivateExternalParticipant(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/external-participants/${id}/reactivate`, {
      method: 'POST',
    });
  }

  async getExternalParticipantsStats(): Promise<ApiResponse<any>> {
    return this.request<any>('/external-participants/stats');
  }

  // ===== Meetings =====

  async getPartnerOrganizations(): Promise<ApiResponse<Array<{ name: string; participantCount: number }>>> {
    return this.request<Array<{ name: string; participantCount: number }>>('/meetings/organizations');
  }

  async ingestMeeting(payload: {
    meetingNode: {
      title: string;
      date?: string;
      time?: string;
      duration?: string;
      organizer?: string;
      topic?: string;
      meetingType?: string;
      confidentiality?: string;
      recurrence?: string;
      sourceFile?: string;
      processedAt?: string;
    };
    entities: Array<{
      type: string;
      value: string;
      confidence?: number;
      visibility?: string;
      memoryLevel?: string;
      classification?: string;
      sourceRef?: string;
      linkedNodeId?: string;
      context?: string;
    }>;
    relationships?: Array<{
      from: string;
      to: string;
      type: string;
      properties?: Record<string, any>;
    }>;
    ingestionItem?: {
      sourceType: string;
      sourceRef: string;
      meetingMetadata?: Record<string, any>;
    };
    curationJob?: {
      sourceType: string;
      sourceRef: string;
      status: string;
      priority?: string;
      summary?: string;
    };
  }): Promise<ApiResponse<{ meetingId: string; title: string; entitiesLinked: number }>> {
    return this.request<{ meetingId: string; title: string; entitiesLinked: number }>('/meetings/ingest', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getMeetings(filters?: { limit?: number; projectId?: string }): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.projectId) params.append('projectId', filters.projectId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/meetings${query}`);
  }

  async extractFromTranscript(payload: {
    transcript: string;
    meetingContext?: {
      title?: string;
      project?: string;
      participants?: string[];
    };
  }): Promise<ApiResponse<{
    entities: Array<{
      type: 'task' | 'decision' | 'risk' | 'insight' | 'action_item';
      value: string;
      confidence: number;
      context?: string;
      assignee?: string;
      deadline?: string;
      priority?: 'high' | 'medium' | 'low';
    }>;
    summary: string;
    keyTopics: string[];
    processingTime: number;
  }>> {
    return this.request('/meetings/extract', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ========================================
  // Entity Matching (Agents API - port 8000)
  // ========================================
  
  async matchEntities(terms: string[]): Promise<ApiResponse<Array<{
    input_term: string;
    found: boolean;
    candidates: Array<{
      node: { id: string; label: string; name: string; aliases: string[] };
      score: number;
      match_type: string;
      matched_term: string;
    }>;
    best_match: {
      node: { id: string; label: string; name: string; aliases: string[] };
      score: number;
      match_type: string;
      matched_term: string;
    } | null;
    suggested_action: 'link' | 'review' | 'create';
  }>>> {
    const AGENTS_URL = process.env.NEXT_PUBLIC_AGENTS_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${AGENTS_URL}/ingestion/match-entities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terms }),
      });
      const data = await response.json();
      return { success: data.success, data: data.data, error: data.error };
    } catch (error) {
      console.error('[API] matchEntities error:', error);
      return { success: false, error: 'Failed to connect to agents API' };
    }
  }

  async matchEntity(term: string): Promise<ApiResponse<{
    input_term: string;
    found: boolean;
    candidates: Array<{
      node: { id: string; label: string; name: string; aliases: string[] };
      score: number;
      match_type: string;
      matched_term: string;
    }>;
    best_match: {
      node: { id: string; label: string; name: string; aliases: string[] };
      score: number;
      match_type: string;
      matched_term: string;
    } | null;
    suggested_action: 'link' | 'review' | 'create';
  }>> {
    const AGENTS_URL = process.env.NEXT_PUBLIC_AGENTS_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${AGENTS_URL}/ingestion/match-entity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term }),
      });
      const data = await response.json();
      return { success: data.success, data: data.data, error: data.error };
    } catch (error) {
      console.error('[API] matchEntity error:', error);
      return { success: false, error: 'Failed to connect to agents API' };
    }
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);

// Export types
export type { ApiResponse, AuthTokens, UserProfile };
