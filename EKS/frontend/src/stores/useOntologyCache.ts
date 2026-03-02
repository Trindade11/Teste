import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SchemaLabel {
  name: string;
  category: string;
  description: string;
  count: number;
  properties: Array<{ name: string; types: string[] }>;
}

interface SchemaRelationship {
  type: string;
  count: number;
  properties: Array<{ name: string; types: string[] }>;
}

interface ThesaurusEntry {
  term: string;
  synonyms: string[];
  category: string;
}

interface OntologyMetadata {
  labels: SchemaLabel[];
  relationships: SchemaRelationship[];
  thesaurus: ThesaurusEntry[];
  totalNodes: number;
  totalRelationships: number;
  lastUpdated: string;
  categories: {
    organization: string[];
    person: string[];
    content: string[];
    strategy: string[];
    process: string[];
    memory: string[];
  };
}

interface OntologyCacheState {
  metadata: OntologyMetadata | null;
  isLoaded: boolean;
  isLoading: boolean;
  lastFetchedAt: Date | null;

  // Actions
  loadOntologyMetadata: () => Promise<void>;
  refreshCache: () => Promise<void>;
  getLabelsForCategory: (category: string) => SchemaLabel[];
  findSynonyms: (term: string) => string[];
  clearCache: () => void;
}

export const useOntologyCache = create<OntologyCacheState>()(
  persist(
    (set, get) => ({
      metadata: null,
      isLoaded: false,
      isLoading: false,
      lastFetchedAt: null,

      loadOntologyMetadata: async () => {
        const state = get();
        
        // Se já carregou recentemente (< 5 min), não recarrega
        if (state.lastFetchedAt) {
          const timeSinceLastFetch = Date.now() - new Date(state.lastFetchedAt).getTime();
          if (timeSinceLastFetch < 5 * 60 * 1000) {
            console.log('Ontology cache still fresh, skipping reload');
            return;
          }
        }

        set({ isLoading: true });

        try {
          // Buscar metadados completos via endpoint PLA
          const metadataResponse = await fetch('http://localhost:3002/api/pla/ontology-metadata');
          const metadataData = await metadataResponse.json();

          if (!metadataData.success) {
            throw new Error('Failed to fetch ontology metadata');
          }

          const ontologyData = metadataData.data;

          // Dados já vêm formatados do backend
          const allLabels: SchemaLabel[] = ontologyData.labels || [];
          const relationships: SchemaRelationship[] = ontologyData.relationships || [];
          const categories = ontologyData.categories || {
            organization: [],
            person: [],
            content: [],
            strategy: [],
            process: [],
            memory: [],
          };

          // TODO: Buscar tesauros quando endpoint existir
          const thesaurus: ThesaurusEntry[] = [
            // Mock por enquanto - será substituído por endpoint real
            { term: 'objetivo', synonyms: ['meta', 'alvo', 'propósito'], category: 'strategy' },
            { term: 'processo', synonyms: ['fluxo', 'workflow', 'procedimento'], category: 'process' },
            { term: 'projeto', synonyms: ['iniciativa', 'empreendimento'], category: 'strategy' },
          ];

          const metadata: OntologyMetadata = {
            labels: allLabels,
            relationships,
            thesaurus,
            totalNodes: ontologyData.totalNodes || 0,
            totalRelationships: ontologyData.totalRelationships || 0,
            lastUpdated: new Date().toISOString(),
            categories,
          };

          set({
            metadata,
            isLoaded: true,
            isLoading: false,
            lastFetchedAt: new Date(),
          });

          console.log('✅ Ontology cache loaded:', {
            labels: allLabels.length,
            relationships: relationships.length,
            nodes: metadata.totalNodes,
          });
        } catch (error) {
          console.error('Failed to load ontology metadata:', error);
          set({ isLoading: false });
        }
      },

      refreshCache: async () => {
        set({ lastFetchedAt: null }); // Force reload
        await get().loadOntologyMetadata();
      },

      getLabelsForCategory: (category: string) => {
        const state = get();
        if (!state.metadata) return [];
        return state.metadata.labels.filter(l => l.category === category);
      },

      findSynonyms: (term: string) => {
        const state = get();
        if (!state.metadata) return [];
        
        const termLower = term.toLowerCase();
        const entry = state.metadata.thesaurus.find(
          t => t.term.toLowerCase() === termLower || 
               t.synonyms.some(s => s.toLowerCase() === termLower)
        );
        
        if (!entry) return [];
        return [entry.term, ...entry.synonyms];
      },

      clearCache: () => {
        set({
          metadata: null,
          isLoaded: false,
          isLoading: false,
          lastFetchedAt: null,
        });
      },
    }),
    {
      name: 'ontology-cache-storage',
      partialize: (state) => ({
        metadata: state.metadata,
        lastFetchedAt: state.lastFetchedAt,
      }),
    }
  )
);
