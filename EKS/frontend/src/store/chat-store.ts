import { create } from "zustand";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  agentId?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: "file" | "audio" | "image";
  url?: string;
  size?: number;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  selectedAgent: Agent | null;
  agents: Agent[];
  
  // Actions
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  setLoading: (loading: boolean) => void;
  selectAgent: (agent: Agent | null) => void;
  clearMessages: () => void;
}

const defaultAgents: Agent[] = [
  {
    id: "knowledge",
    name: "Knowledge Agent",
    description: "Extração e gestão de conhecimento",
    icon: "📚",
    color: "bg-blue-500",
  },
  {
    id: "task",
    name: "Task Agent",
    description: "Geração de tarefas e planos de ação",
    icon: "✅",
    color: "bg-green-500",
  },
  {
    id: "curation",
    name: "Curation Agent",
    description: "Validação e curadoria de dados",
    icon: "🔍",
    color: "bg-purple-500",
  },
  {
    id: "onboarding",
    name: "Onboarding Agent",
    description: "Guia de primeira configuração",
    icon: "🧭",
    color: "bg-cyan-500",
  },
  {
    id: "router",
    name: "Router (Auto)",
    description: "Seleção automática do melhor agente",
    icon: "🔀",
    color: "bg-orange-500",
  },
];

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  selectedAgent: defaultAgents.find((a) => a.id === "router") ?? null,
  agents: defaultAgents,

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        },
      ],
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  selectAgent: (agent) => set({ selectedAgent: agent }),

  clearMessages: () => set({ messages: [] }),
}));
