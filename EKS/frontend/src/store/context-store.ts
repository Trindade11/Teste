import { create } from "zustand";

export interface Client {
  id: string;
  name: string;
  type: "startup" | "investor" | "mentor";
  avatar?: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  status: "active" | "paused" | "completed";
}

export interface ContextState {
  selectedClient: Client | null;
  selectedProject: Project | null;
  clients: Client[];
  projects: Project[];
  memoryType: "personal" | "corporate";
  
  // Actions
  selectClient: (client: Client | null) => void;
  selectProject: (project: Project | null) => void;
  setMemoryType: (type: "personal" | "corporate") => void;
  setClients: (clients: Client[]) => void;
  setProjects: (projects: Project[]) => void;
}

export const useContextStore = create<ContextState>((set) => ({
  selectedClient: null,
  selectedProject: null,
  clients: [],
  projects: [],
  memoryType: "corporate",

  selectClient: (client) => set({ selectedClient: client, selectedProject: null }),
  selectProject: (project) => set({ selectedProject: project }),
  setMemoryType: (type) => set({ memoryType: type }),
  setClients: (clients) => set({ clients }),
  setProjects: (projects) => set({ projects }),
}));
