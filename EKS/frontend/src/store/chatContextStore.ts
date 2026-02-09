import { create } from "zustand";

export interface ChatContextItem {
  id: string;
  type: "decision" | "risk" | "insight" | "task" | "project" | "okr";
  title: string;
  description: string;
  metadata?: Record<string, any>;
  addedAt: string;
}

interface ChatContextState {
  contextItems: ChatContextItem[];
  
  // Actions
  addContextItem: (item: Omit<ChatContextItem, "addedAt">) => void;
  removeContextItem: (id: string) => void;
  clearContext: () => void;
  getContextForLLM: () => string; // Retorna contexto formatado para o LLM
}

export const useChatContextStore = create<ChatContextState>((set, get) => ({
  contextItems: [],

  addContextItem: (item) => {
    const newItem: ChatContextItem = {
      ...item,
      addedAt: new Date().toISOString(),
    };
    set((state) => ({
      contextItems: [...state.contextItems, newItem],
    }));
  },

  removeContextItem: (id) => {
    set((state) => ({
      contextItems: state.contextItems.filter((item) => item.id !== id),
    }));
  },

  clearContext: () => {
    set({ contextItems: [] });
  },

  getContextForLLM: () => {
    const { contextItems } = get();
    if (contextItems.length === 0) return "";

    return contextItems
      .map((item) => {
        const typeLabel = {
          decision: "Decisão",
          risk: "Risco",
          insight: "Insight",
          task: "Tarefa",
          project: "Projeto",
          okr: "OKR",
        }[item.type];

        let context = `[${typeLabel}] ${item.title}\n${item.description}`;
        
        if (item.metadata) {
          const metaEntries = Object.entries(item.metadata)
            .filter(([_, value]) => value != null)
            .map(([key, value]) => `${key}: ${value}`)
            .join(" | ");
          if (metaEntries) {
            context += `\n${metaEntries}`;
          }
        }

        return context;
      })
      .join("\n\n---\n\n");
  },
}));

