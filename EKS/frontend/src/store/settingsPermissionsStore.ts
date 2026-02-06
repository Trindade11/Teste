import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Settings Menu Permissions Store
 * 
 * Controla quais itens de menu são visíveis para cada role.
 * - Admin: vê todos os itens
 * - User: vê apenas os itens permitidos pelo admin
 * 
 * TODO: Migrar para backend (Neo4j) quando pronto
 */

export type SettingsMenuItem = 
  | 'theme'
  | 'company'
  | 'strategy'
  | 'projects'
  | 'ontology'
  | 'ingest'
  | 'meetings'
  | 'profile'
  | 'agents';

export interface MenuItemConfig {
  id: SettingsMenuItem;
  label: string;
  description: string;
  category: 'data' | 'curator' | 'personal' | 'admin';
  adminOnly: boolean;
  visibleToUsers: boolean;
}

// Configuração padrão dos menus
export const DEFAULT_MENU_CONFIG: MenuItemConfig[] = [
  // Categoria: Gestão de Dados (Ingestão)
  { id: 'company', label: 'Descrição da Empresa', description: 'Informações da organização', category: 'data', adminOnly: false, visibleToUsers: true },
  { id: 'ingest', label: 'Importação de Dados', description: 'Importar CSV e documentos', category: 'data', adminOnly: true, visibleToUsers: false },
  { id: 'meetings', label: 'Transcrições de Reunião', description: 'Processar reuniões Teams/Zoom', category: 'data', adminOnly: true, visibleToUsers: false },
  
  // Categoria: Curadoria Ontológica
  { id: 'strategy', label: 'Objetivos Estratégicos', description: 'OKRs e metas organizacionais', category: 'curator', adminOnly: true, visibleToUsers: false },
  { id: 'projects', label: 'Injeção de Projetos', description: 'Cadastrar projetos vinculados aos OKRs', category: 'curator', adminOnly: true, visibleToUsers: false },
  { id: 'ontology', label: 'Ontologia do Projeto', description: 'Taxonomia, tesauro e visão geral do grafo', category: 'curator', adminOnly: true, visibleToUsers: false },
  
  // Categoria: Pessoal
  { id: 'profile', label: 'Dados do Perfil', description: 'Editar informações do onboarding', category: 'personal', adminOnly: false, visibleToUsers: true },
  { id: 'agents', label: 'Meus Agentes', description: 'Gerenciar agentes de IA personalizados', category: 'personal', adminOnly: false, visibleToUsers: true },
  
  // Categoria: Admin
  { id: 'theme', label: 'Tema e Aparência', description: 'Personalizar cores e logo', category: 'admin', adminOnly: true, visibleToUsers: false },
];

interface SettingsPermissionsState {
  menuConfig: MenuItemConfig[];
  
  // Variável de controle para migração futura
  // Quando true, aplica as restrições de role
  // Quando false, todos veem tudo (para testes)
  enforceRoleRestrictions: boolean;
  
  // Actions
  setMenuVisibility: (menuId: SettingsMenuItem, visibleToUsers: boolean) => void;
  setEnforceRoleRestrictions: (enforce: boolean) => void;
  resetToDefaults: () => void;
  
  // Helpers
  getVisibleMenus: (userRole: 'admin' | 'user') => MenuItemConfig[];
  isMenuVisibleForRole: (menuId: SettingsMenuItem, userRole: 'admin' | 'user') => boolean;
}

export const useSettingsPermissionsStore = create<SettingsPermissionsState>()(
  persist(
    (set, get) => ({
      menuConfig: [...DEFAULT_MENU_CONFIG],
      enforceRoleRestrictions: false, // Desabilitado por padrão para testes
      
      setMenuVisibility: (menuId, visibleToUsers) => {
        set((state) => ({
          menuConfig: state.menuConfig.map((item) =>
            item.id === menuId ? { ...item, visibleToUsers } : item
          ),
        }));
      },
      
      setEnforceRoleRestrictions: (enforce) => {
        set({ enforceRoleRestrictions: enforce });
      },
      
      resetToDefaults: () => {
        set({ menuConfig: [...DEFAULT_MENU_CONFIG] });
      },
      
      getVisibleMenus: (userRole) => {
        const { menuConfig, enforceRoleRestrictions } = get();
        
        // Se não estiver aplicando restrições, retorna todos
        if (!enforceRoleRestrictions) {
          return menuConfig;
        }
        
        // Admin vê tudo
        if (userRole === 'admin') {
          return menuConfig;
        }
        
        // User só vê os permitidos
        return menuConfig.filter((item) => item.visibleToUsers && !item.adminOnly);
      },
      
      isMenuVisibleForRole: (menuId, userRole) => {
        const visibleMenus = get().getVisibleMenus(userRole);
        return visibleMenus.some((item) => item.id === menuId);
      },
    }),
    {
      name: 'settings-permissions',
    }
  )
);
