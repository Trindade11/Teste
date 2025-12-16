"use client";

import { create } from "zustand";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "active" | "completed" | "archived";
  memoryType: "corporate" | "personal";
  createdAt: Date;
  updatedAt: Date;
}

interface TaskState {
  tasks: Task[];
  activeTask: Task | null;
  
  // Actions
  setActiveTask: (task: Task | null) => void;
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleTaskMemory: (id: string) => void;
}

// Mock initial task for demo
const initialTask: Task = {
  id: "task-1",
  title: "Preparar pitch para investidor",
  description: "Criar apresentação e materiais de apoio",
  status: "active",
  memoryType: "corporate",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [initialTask],
  activeTask: initialTask,
  
  setActiveTask: (task) => set({ activeTask: task }),
  
  addTask: (taskData) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({
      tasks: [...state.tasks, newTask],
      activeTask: newTask,
    }));
  },
  
  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
      ),
      activeTask:
        state.activeTask?.id === id
          ? { ...state.activeTask, ...updates, updatedAt: new Date() }
          : state.activeTask,
    }));
  },
  
  toggleTaskMemory: (id) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              memoryType: t.memoryType === "corporate" ? "personal" : "corporate",
              updatedAt: new Date(),
            }
          : t
      ),
      activeTask:
        state.activeTask?.id === id
          ? {
              ...state.activeTask,
              memoryType:
                state.activeTask.memoryType === "corporate"
                  ? "personal"
                  : "corporate",
              updatedAt: new Date(),
            }
          : state.activeTask,
    }));
  },
}));
