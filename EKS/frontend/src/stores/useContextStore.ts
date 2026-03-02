import { create } from 'zustand';
import { api } from '@/lib/api';

export interface ContextItem {
  id: string;
  type: 'project' | 'person' | 'process' | 'document' | 'knowledge' | 'website';
  title: string;
  preview: string;
  content?: string;
  relevance?: number;
  metadata?: Record<string, any>;
}

interface ContextState {
  activeContext: ContextItem[];
  searchResults: ContextItem[];
  searchQuery: string;
  searchType: 'deterministic' | 'semantic';
  isSearching: boolean;

  // Actions
  addToContext: (item: ContextItem) => void;
  removeFromContext: (id: string) => void;
  clearContext: () => void;
  setSearchQuery: (query: string) => void;
  setSearchType: (type: 'deterministic' | 'semantic') => void;
  performSearch: () => Promise<void>;
  estimateTokens: () => number;
}

export const useContextStore = create<ContextState>((set, get) => ({
  activeContext: [],
  searchResults: [],
  searchQuery: '',
  searchType: 'deterministic',
  isSearching: false,

  addToContext: (item) => set((state) => {
    // Avoid duplicates
    if (state.activeContext.find(i => i.id === item.id)) {
      return state;
    }
    return {
      activeContext: [...state.activeContext, item],
    };
  }),

  removeFromContext: (id) => set((state) => ({
    activeContext: state.activeContext.filter(i => i.id !== id),
  })),

  clearContext: () => set({
    activeContext: [],
  }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSearchType: (type) => set({ searchType: type }),

  performSearch: async () => {
    const { searchQuery, searchType } = get();
    
    if (!searchQuery.trim()) {
      set({ searchResults: [] });
      return;
    }

    set({ isSearching: true });

    try {
      const mockResults: ContextItem[] = [];
      const normalize = (value: string) =>
        value
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
      const normalizedQuery = normalize(searchQuery.trim());

      if (searchType === 'deterministic') {
        const [projectsResult, peopleResult, processesResult, documentsResult] = await Promise.allSettled([
          api.getProjects({ includeArchived: true }),
          api.getOrgChartNodes(),
          api.getLinkableEntities('process'),
          api.getDocuments({ limit: 100, offset: 0 }),
        ]);

        const matchesQuery = (value: unknown): boolean => {
          if (value === null || value === undefined) return false;
          return normalize(String(value)).includes(normalizedQuery);
        };

        // Projetos
        if (projectsResult.status === 'fulfilled' && projectsResult.value.success) {
          const projects = Array.isArray(projectsResult.value.data) ? projectsResult.value.data : [];
          const projectItems: ContextItem[] = projects
            .filter((p: any) =>
              matchesQuery(p?.name) ||
              matchesQuery(p?.description) ||
              matchesQuery(p?.department) ||
              matchesQuery(p?.ownerName)
            )
            .slice(0, 8)
            .map((p: any) => ({
              id: String(p?.id || `project-${Math.random()}`),
              type: 'project',
              title: String(p?.name || 'Projeto sem nome'),
              preview: String(p?.description || `Projeto (${p?.department || 'sem departamento'})`),
              metadata: {
                status: p?.status,
                department: p?.department,
                ownerName: p?.ownerName,
              },
            }));
          mockResults.push(...projectItems);
        }

        // Pessoas (organograma)
        if (peopleResult.status === 'fulfilled' && peopleResult.value.success) {
          const people = Array.isArray(peopleResult.value.data) ? peopleResult.value.data : [];
          const peopleItems: ContextItem[] = people
            .filter((u: any) =>
              matchesQuery(u?.name) ||
              matchesQuery(u?.email) ||
              matchesQuery(u?.role) ||
              matchesQuery(u?.department)
            )
            .slice(0, 8)
            .map((u: any) => ({
              id: `person-${String(u?.id || Math.random())}`,
              type: 'person',
              title: String(u?.name || u?.email || 'Pessoa sem nome'),
              preview: [u?.role, u?.department, u?.email].filter(Boolean).join(' • ') || 'Pessoa da organização',
              metadata: {
                email: u?.email,
                role: u?.role,
                department: u?.department,
              },
            }));
          mockResults.push(...peopleItems);
        }

        // Processos (entities linkáveis)
        if (processesResult.status === 'fulfilled' && processesResult.value.success) {
          const processEntities = Array.isArray(processesResult.value.data) ? processesResult.value.data : [];
          const processItems: ContextItem[] = processEntities
            .filter((proc: any) => matchesQuery(proc?.name) || matchesQuery(proc?.department) || matchesQuery(proc?.status))
            .slice(0, 8)
            .map((proc: any) => ({
              id: `process-${String(proc?.id || Math.random())}`,
              type: 'process',
              title: String(proc?.name || 'Processo sem nome'),
              preview: [proc?.department, proc?.status].filter(Boolean).join(' • ') || 'Processo da organização',
              metadata: {
                status: proc?.status,
                department: proc?.department,
              },
            }));
          mockResults.push(...processItems);
        }

        // Documentos
        if (documentsResult.status === 'fulfilled' && documentsResult.value.success) {
          const docsPayload = (documentsResult.value as any).data;
          const docs = Array.isArray(docsPayload)
            ? docsPayload
            : Array.isArray((documentsResult.value as any).documents)
              ? (documentsResult.value as any).documents
              : [];

          const docItems: ContextItem[] = docs
            .filter((d: any) => matchesQuery(d?.title) || matchesQuery(d?.summary) || matchesQuery(d?.type))
            .slice(0, 8)
            .map((d: any) => ({
              id: `document-${String(d?.id || Math.random())}`,
              type: 'document',
              title: String(d?.title || 'Documento sem título'),
              preview: String(d?.summary || d?.type || 'Documento do acervo'),
              metadata: {
                type: d?.type,
                status: d?.status,
              },
            }));
          mockResults.push(...docItems);
        }

        // Dedupe por id + type
        const deduped = new Map<string, ContextItem>();
        mockResults.forEach((item) => {
          deduped.set(`${item.type}:${item.id}`, item);
        });
        mockResults.length = 0;
        mockResults.push(...Array.from(deduped.values()).slice(0, 20));

        // Fallback mínimo somente se nenhuma fonte retornou match
        if (mockResults.length === 0) {
          if (normalizedQuery.startsWith('pro') || normalizedQuery.includes('eks')) {
            mockResults.push({
              id: 'fallback-proj-eks',
              type: 'project',
              title: 'Projeto EKS',
              preview: 'Projeto sugerido por fallback local.',
              metadata: { source: 'fallback' },
            });
          } else if (normalizedQuery.includes('pes')) {
            mockResults.push({
              id: 'fallback-person',
              type: 'person',
              title: 'Pessoa (fallback)',
              preview: 'Nenhuma pessoa encontrada para este termo.',
              metadata: { source: 'fallback' },
            });
          } else if (normalizedQuery.includes('proc')) {
            mockResults.push({
              id: 'fallback-process',
              type: 'process',
              title: 'Processo (fallback)',
              preview: 'Nenhum processo encontrado para este termo.',
              metadata: { source: 'fallback' },
            });
          }
        }
      } else {
        // Simular busca semântica
        mockResults.push(
          {
            id: 'doc-1',
            type: 'document',
            title: 'Proposta Comercial CoCreateAI',
            preview: 'Proposta para implementação do EKS na Move Studio...',
            relevance: 0.92,
          },
          {
            id: 'know-1',
            type: 'knowledge',
            title: 'Metodologia de Onboarding',
            preview: 'Processo de integração de novos colaboradores...',
            relevance: 0.85,
          }
        );
      }

      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 500));

      set({
        searchResults: mockResults,
        isSearching: false,
      });
    } catch (error) {
      console.error('Context search error:', error);
      set({
        searchResults: [],
        isSearching: false,
      });
    }
  },

  estimateTokens: () => {
    const { activeContext } = get();
    return activeContext.reduce((sum, item) => {
      const contentLength = (item.content || item.preview).length;
      return sum + Math.ceil(contentLength / 4); // ~4 chars per token
    }, 0);
  },
}));
