/**
 * Mock API para desenvolvimento sem backend
 * Simula latência e comportamento real da API
 */

import type { OrgNode } from './orgChartData';
import {
  getNodeByEmail,
  getNodeById,
  getManager,
  getPeers,
  getSubordinates,
  orgChartNodes,
} from './orgChartData';
import { getTenantConfig } from './tenant-config';

// Simular latência de rede
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
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
  jobRole?: string; // Cargo específico (ex: "Investment Associate", "CEO")
}

interface Department {
  id: string;
  name: string;
  parentDepartmentId: string | null;
  level: number;
}

interface HierarchyLevel {
  id: string;
  name: string;
  order: number;
}

interface UserAllocation {
  userId: string;
  departmentId: string;
  hierarchyLevelId: string;
  reportsToUserId: string | null;
  validatedByUser: boolean;
  validatedAt: string | null;
}

interface OrgChartReport {
  id: string;
  userId: string;
  description: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}

// Mock users database (invite-only, pré-registrados)
// Mock de dados de perfil profissional para pré-preenchimento (insumo para PIA)
interface ProfileData {
  competencies: string[];
  profileDescription: string;
  roleDescription: string;
  departmentDescription: string;
}

const mockProfileData: Record<string, ProfileData> = {
  'usr_001': { // Rodrigo Trindade
    competencies: [
      'Gestão de Processos',
      'Transformação Digital',
      'Business Process Management (BPM)',
      'Metodologias Ágeis',
      'Análise de Dados',
      'Power BI',
      'SQL',
      'Gestão de Projetos',
      'Mapeamento de Processos',
      'Automação de Processos',
      'Liderança de Equipes',
      'Melhoria Contínua'
    ],
    profileDescription: 'Atuo como Gerente de Processos há 4 anos na Alocc, liderando iniciativas de transformação digital e mapeamento de processos. Sou responsável por identificar gargalos operacionais e implementar melhorias contínuas usando metodologias ágeis e BPM. Tenho experiência em automação de processos, análise de dados com Power BI e SQL, e gestão de equipes multidisciplinares.',
    roleDescription: 'Sou responsável por liderar a área de processos da Alocc, gerenciando iniciativas de melhoria contínua, automação e transformação digital. Coordeno uma equipe de analistas de processos e atuo como ponto focal entre a área de TI e as áreas de negócio, traduzindo necessidades operacionais em soluções tecnológicas. Também sou responsável por garantir a governança de processos e disseminar boas práticas de BPM na organização.',
    departmentDescription: 'A Gerência de Processos é responsável por identificar oportunidades de otimização operacional, mapear e documentar processos críticos da organização, e garantir a governança de processos corporativos. Atuamos como facilitadores da transformação digital, apoiando as áreas de negócio na automação e melhoria de seus processos. Nossa área tem impacto direto na eficiência operacional e na capacidade da empresa de se adaptar rapidamente às mudanças do mercado.'
  }
};

const mockUsers: UserProfile[] = [
  {
    userId: 'usr_001',
    email: 'rodrigo.trindade@alocc.com.br',
    name: 'Rodrigo Trindade',
    role: 'user',
    company: getTenantConfig().institutionShortName || 'Alocc',
    department: 'Gerência de Processos',
    jobRole: 'Gerente de Processos'
  },
  {
    userId: 'usr_admin_001',
    email: 'admin@company.com',
    name: 'Admin System',
    role: 'admin',
    company: 'System Administration',
    jobRole: 'System Administrator'
  },
  {
    userId: 'usr_002',
    email: 'ana.silva@alocc.com.br',
    name: 'Ana Silva',
    role: 'user',
    company: getTenantConfig().institutionShortName || 'Alocc',
    department: 'RH',
    jobRole: 'Analista de RH'
  },
  {
    userId: 'usr_003',
    email: 'carlos.oliveira@alocc.com.br',
    name: 'Carlos Oliveira',
    role: 'user',
    company: getTenantConfig().institutionShortName || 'Alocc',
    department: 'Risco',
    jobRole: 'Diretor de Risco'
  }
];

// Mock passwords (em produção seria hash bcrypt)
const mockPasswords: Record<string, string> = {
  'ceo@alocc.com.br': '1234',
  'diretor.ti@alocc.com.br': '1234',
  'rodrigo.trindade@alocc.com.br': '1234',
  'ana.silva@alocc.com.br': '1234',
  'carlos.oliveira@alocc.com.br': '1234',
  'ceo@alok.com.br': '1234',
  'diretor.ti@alok.com.br': '1234'
};

// Mock organizational structure - Estrutura Alok completa
const mockDepartments: Department[] = [
  { id: 'dept_rh', name: 'RH', parentDepartmentId: null, level: 0 },
  { id: 'dept_estruturado', name: 'Estruturado', parentDepartmentId: null, level: 0 },
  { id: 'dept_risco', name: 'Risco', parentDepartmentId: null, level: 0 },
  { id: 'dept_investimentos', name: 'Investimentos', parentDepartmentId: null, level: 0 },
  { id: 'dept_operacional', name: 'Operacional', parentDepartmentId: null, level: 0 },
  { id: 'dept_cadastro', name: 'Cadastro', parentDepartmentId: null, level: 0 },
  { id: 'dept_apoio', name: 'Apoio', parentDepartmentId: null, level: 0 },
  { id: 'dept_legal', name: 'Legal', parentDepartmentId: null, level: 0 },
  { id: 'dept_ti', name: 'TI', parentDepartmentId: null, level: 0 },
  { id: 'dept_atendimento', name: 'Atendimento à Alok', parentDepartmentId: null, level: 0 },
];

const mockHierarchyLevels: HierarchyLevel[] = [
  { id: 'lvl_001', name: 'CEO', order: 1 },
  { id: 'lvl_002', name: 'Diretoria', order: 2 },
  { id: 'lvl_003', name: 'Gerência', order: 3 },
  { id: 'lvl_004', name: 'Coordenação', order: 4 },
  { id: 'lvl_005', name: 'Analista', order: 5 },
];

// Mock CEO e Diretor para hierarquia
const mockCEO: UserProfile = {
  userId: 'usr_ceo',
  email: 'ceo@alocc.com.br',
  name: 'Paulo Andrade',
  role: 'user',
  company: getTenantConfig().institutionShortName || 'Alocc',
  department: 'CEO',
  jobRole: 'CEO'
};

const mockDiretor: UserProfile = {
  userId: 'usr_dir_ti',
  email: 'diretor.ti@alocc.com.br',
  name: 'Mariana Costa',
  role: 'user',
  company: getTenantConfig().institutionShortName || 'Alocc',
  department: 'TI',
  jobRole: 'Diretora de TI'
};

// Adicionar CEO e Diretor aos users
mockUsers.push(mockCEO, mockDiretor);

const mockAllocations: UserAllocation[] = [
  {
    userId: 'usr_ceo',
    departmentId: 'dept_ti',
    hierarchyLevelId: 'lvl_001', // CEO
    reportsToUserId: null,
    validatedByUser: true,
    validatedAt: '2024-12-01T10:00:00Z',
  },
  {
    userId: 'usr_dir_ti',
    departmentId: 'dept_ti',
    hierarchyLevelId: 'lvl_002', // Diretoria
    reportsToUserId: 'usr_ceo',
    validatedByUser: true,
    validatedAt: '2024-12-01T10:00:00Z',
  },
  {
    userId: 'usr_001', // Rodrigo Trindade - Gerente de Processos
    departmentId: 'dept_ti',
    hierarchyLevelId: 'lvl_003', // Gerência
    reportsToUserId: 'usr_dir_ti', // Reports to Diretora de TI
    validatedByUser: false,
    validatedAt: null,
  },
  {
    userId: 'usr_002', // Ana Silva
    departmentId: 'dept_rh',
    hierarchyLevelId: 'lvl_005', // Analista
    reportsToUserId: 'usr_003', // Reports to Diretor de Risco (simulando)
    validatedByUser: true,
    validatedAt: '2024-12-10T10:00:00Z',
  },
  {
    userId: 'usr_003', // Carlos Oliveira - Diretor de Risco
    departmentId: 'dept_risco',
    hierarchyLevelId: 'lvl_002', // Diretoria
    reportsToUserId: 'usr_ceo',
    validatedByUser: true,
    validatedAt: '2024-12-08T10:00:00Z',
  },
];

const mockOrgChartReports: OrgChartReport[] = [];

export const mockApi = {
  /**
   * Mock Login
   */
  async login(email: string, password: string): Promise<ApiResponse<AuthTokens>> {
    await delay(800); // Simula latência
    
    const user = mockUsers.find(u => u.email === email);
    
    if (!user) {
      return {
        success: false,
        error: 'Usuário não encontrado'
      };
    }
    
    if (mockPasswords[email] !== password) {
      return {
        success: false,
        error: 'Senha incorreta'
      };
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('mockUserId', user.userId);
    }
    
    // Sucesso - retorna tokens mockados
    return {
      success: true,
      data: {
        accessToken: `mock-jwt-token-${user.userId}-${Date.now()}`,
        refreshToken: `mock-refresh-token-${user.userId}-${Date.now()}`,
        expiresIn: '7d'
      }
    };
  },

  /**
   * Mock Get Profile
   */
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    await delay(300);

    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('mockUserId') : null;
    const currentUser = storedUserId
      ? mockUsers.find((u) => u.userId === storedUserId) || mockUsers[0]
      : mockUsers[0];
    
    return {
      success: true,
      data: currentUser
    };
  },

  /**
   * Mock Get Profile Data (Neo4j)
   */
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
      createdAt: string;
      updatedAt: string;
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
    await delay(500);
    
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('mockUserId') : null;
    const userId = storedUserId || '327e6c71-99d8-4604-a02e-042b0a86c88c';
    
    // Dados mock baseados no usuário real (para dev)
    const tenantConfig = getTenantConfig();
    return {
      success: true,
      data: {
        user: {
          userId,
          email: 'rodrigo.trindade@alocc.com.br',
          name: 'Rodrigo Trindade',
          role: 'Administrador',
          company: tenantConfig.institutionName || 'Alocc Gestão Patrimonial',
          organizationType: 'client',
          jobTitle: 'Analista de Processos',
          relationshipType: 'Colaborador',
          accessTypes: ['Operacional', 'Financeiro'],
          status: 'Ativo',
          createdAt: '2025-12-29T21:15:00.560000000+00:00',
          updatedAt: '2026-01-05T21:25:35.131000000+00:00',
        },
        onboardingResponse: {
          profileDescription: 'Sou analítico, prefiro de respostas estruturadas em tópicos, sou multifunção aqui na empresa. sou criados de sistemas de agentes de IA. Gosto de usar IA generativa para tudo.',
          departmentDescription: 'Minha área tem como função dar suporte a empresa e aos usuários em novas demandas e projetos. Somos o canal entre as áreas de negócios e os fornecedores de tecnologia, principalmente o fornecedor Ability, que tem como objetivo ser o CRM da empresa.',
          competencies: ['Agentes de IA', 'Gestão de Processos', 'Grafos de Conhecimentos', 'Ontologias', 'Microsoft Azure'],
          primaryObjective: 'Recuperar conhecimento de forma facilitada.',
          topChallenges: 'Gestão de informação.',
          roleDescription: 'Sou responsável por manter os processos da empresa alinhados. Confecciono o relatório de patrimônio, e trabalho sobre demanda com melhorias de processos e novos projetos.',
          orgChartValidated: true,
          defaultVisibility: 'corporate',
          memoryLevel: 'long',
          createdAt: '2026-01-06T17:04:29.591Z',
          updatedAt: '2026-01-06T17:04:29.591Z',
        },
        department: 'Sistemas',
        organization: tenantConfig.institutionName || 'Alocc Gestão Patrimonial',
        location: 'Alocc Serviços',
      }
    };
  },

  /**
   * Mock Get Profile Data (para pré-preenchimento no onboarding)
   */
  async getProfileData(userId: string): Promise<ApiResponse<ProfileData | null>> {
    await delay(300);
    
    const data = mockProfileData[userId] || null;
    
    return {
      success: true,
      data
    };
  },

  /**
   * Mock Logout
   */
  async logout(): Promise<ApiResponse<void>> {
    await delay(200);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mockUserId');
    }
    return { success: true };
  },

  /**
   * Mock Get Users (admin only)
   */
  async getUsers(): Promise<ApiResponse<UserProfile[]>> {
    await delay(500);
    
    return {
      success: true,
      data: mockUsers
    };
  },

  /**
   * Mock Get Org Chart Data (baseado no CSV)
   */
  async getOrgChartForUser(idOrEmail: string): Promise<ApiResponse<{
    user: OrgNode;
    manager?: OrgNode;
    peers: OrgNode[];
    subordinates: OrgNode[];
  } | null>> {
    await delay(300);

    const userNode = getNodeById(idOrEmail) || getNodeByEmail(idOrEmail);
    if (!userNode) {
      return {
        success: false,
        error: 'Usuário não encontrado no organograma'
      };
    }

    const nodeId = userNode.id;
    
    return {
      success: true,
      data: {
        user: userNode,
        manager: getManager(nodeId),
        peers: getPeers(nodeId),
        subordinates: getSubordinates(nodeId)
      }
    };
  },

  /**
   * Mock Get All Org Chart Nodes (admin only)
   */
  async getAllOrgChartNodes(): Promise<ApiResponse<OrgNode[]>> {
    await delay(500);

    return {
      success: true,
      data: orgChartNodes
    };
  },

  /**
   * Mock Create User
   */
  async createUser(userData: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    await delay(700);
    
    const newUser: UserProfile = {
      userId: `usr_${Date.now()}`,
      email: userData.email || '',
      name: userData.name || '',
      role: userData.role || 'user',
      company: userData.company || '',
      department: userData.department,
      jobRole: userData.jobRole
    };
    
    mockUsers.push(newUser);
    
    return {
      success: true,
      data: newUser
    };
  },

  /**
   * Mock Update User
   */
  async updateUser(userId: string, updates: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    await delay(500);
    
    const userIndex = mockUsers.findIndex(u => u.userId === userId);
    
    if (userIndex === -1) {
      return {
        success: false,
        error: 'Usuário não encontrado'
      };
    }
    
    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      ...updates
    };
    
    return {
      success: true,
      data: mockUsers[userIndex]
    };
  },

  /**
   * Mock Delete User
   */
  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    await delay(400);
    
    const userIndex = mockUsers.findIndex(u => u.userId === userId);
    
    if (userIndex === -1) {
      return {
        success: false,
        error: 'Usuário não encontrado'
      };
    }
    
    mockUsers.splice(userIndex, 1);
    
    return { success: true };
  },

  /**
   * Mock Get Companies
   */
  async getCompanies(): Promise<ApiResponse<any[]>> {
    await delay(400);
    
    return {
      success: true,
      data: [
        {
          company_id: 'cmp_001',
          name: 'Alok Corporation',
          type: 'enterprise',
          description: 'Corporate Innovation Platform'
        },
        {
          company_id: 'cmp_002',
          name: 'CVC Capital Partners',
          type: 'cvc',
          description: 'Venture Capital Firm'
        }
      ]
    };
  },

  /**
   * Mock Get Startups
   */
  async getStartups(): Promise<ApiResponse<any[]>> {
    await delay(500);
    
    return {
      success: true,
      data: [
        {
          startup_id: 'str_001',
          name: 'TechCorp AI',
          stage: 'series-a',
          sector: 'AI/ML',
          burn_rate_monthly: 200000,
          runway_months: 18
        },
        {
          startup_id: 'str_002',
          name: 'FinTech Solutions',
          stage: 'seed',
          sector: 'Fintech',
          burn_rate_monthly: 80000,
          runway_months: 24
        }
      ]
    };
  },

  /**
   * Mock Get Org Chart Position (current user)
   */
  async getMyOrgChartPosition(): Promise<ApiResponse<any>> {
    await delay(400);
    
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('mockUserId') : null;
    if (!storedUserId) {
      return { success: false, error: 'Not authenticated' };
    }

    const allocation = mockAllocations.find(a => a.userId === storedUserId);
    if (!allocation) {
      return { success: true, data: null }; // User has no allocation yet
    }

    const user = mockUsers.find(u => u.userId === storedUserId);
    const department = mockDepartments.find(d => d.id === allocation.departmentId);
    const hierarchyLevel = mockHierarchyLevels.find(h => h.id === allocation.hierarchyLevelId);
    const manager = allocation.reportsToUserId ? mockUsers.find(u => u.userId === allocation.reportsToUserId) : null;
    const managerAllocation = manager ? mockAllocations.find(a => a.userId === manager.userId) : null;
    const managerLevel = managerAllocation ? mockHierarchyLevels.find(h => h.id === managerAllocation.hierarchyLevelId) : null;
    
    // Find subordinates
    const subordinates = mockAllocations
      .filter(a => a.reportsToUserId === storedUserId)
      .map(a => {
        const subUser = mockUsers.find(u => u.userId === a.userId);
        const subLevel = mockHierarchyLevels.find(h => h.id === a.hierarchyLevelId);
        return {
          userId: subUser?.userId,
          name: subUser?.name,
          jobRole: subUser?.jobRole,
          hierarchyLevel: subLevel?.name,
        };
      });

    return {
      success: true,
      data: {
        user: {
          name: user?.name,
          jobRole: user?.jobRole,
        },
        department: department?.name,
        hierarchyLevel: hierarchyLevel?.name,
        manager: manager ? {
          userId: manager.userId,
          name: manager.name,
          jobRole: manager.jobRole,
          hierarchyLevel: managerLevel?.name,
        } : null,
        subordinates,
        validatedByUser: allocation.validatedByUser,
        validatedAt: allocation.validatedAt,
      },
    };
  },

  /**
   * Mock Validate Org Chart Position
   */
  async validateOrgChartPosition(): Promise<ApiResponse<void>> {
    await delay(300);
    
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('mockUserId') : null;
    if (!storedUserId) {
      return { success: false, error: 'Not authenticated' };
    }

    const allocation = mockAllocations.find(a => a.userId === storedUserId);
    if (allocation) {
      allocation.validatedByUser = true;
      allocation.validatedAt = new Date().toISOString();
    }

    return { success: true };
  },

  /**
   * Mock Report Org Chart Issue
   */
  async reportOrgChartIssue(description: string): Promise<ApiResponse<void>> {
    await delay(400);
    
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('mockUserId') : null;
    if (!storedUserId) {
      return { success: false, error: 'Not authenticated' };
    }

    const report: OrgChartReport = {
      id: `rpt_${Date.now()}`,
      userId: storedUserId,
      description,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    mockOrgChartReports.push(report);

    return { success: true };
  },

  /**
   * Mock Chat Send Message
   */
  async sendMessage(conversationId: string, message: string, depth: number = 2): Promise<ApiResponse<any>> {
    await delay(1500); // Simula processamento IA
    
    let responseText = '';
    
    // Respostas baseadas em keywords
    if (message.toLowerCase().includes('startup')) {
      responseText = 'Com base nos dados disponíveis, temos 2 startups no portfólio:\n\n- **TechCorp AI** (Series A): AI/ML, burn rate 200k/mês\n- **FinTech Solutions** (Seed): Fintech, burn rate 80k/mês';
    } else if (message.toLowerCase().includes('análise') || message.toLowerCase().includes('risco')) {
      responseText = 'Para fazer uma análise completa de risco, preciso acessar:\n- Métricas financeiras atualizadas\n- Histórico de burn rate\n- Projeções de runway\n\n[SIMULAÇÃO] Aumentando profundidade de busca...';
    } else {
      responseText = `Esta é uma resposta simulada para: "${message}"\n\nEm produção, o LLM processaria sua query e retornaria insights baseados no grafo de conhecimento.`;
    }
    
    return {
      success: true,
      data: {
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString(),
        metadata: {
          model: 'mock-gpt-4o',
          latency_ms: 1500,
          cost_usd: 0.02,
          depth_used: depth,
          confidence: 0.85
        }
      }
    };
  }
};

// Flag para controlar uso de mock
export const USE_MOCK = true; // Sempre usar mock para focar em UX

// Export como API padrão
export default mockApi;
