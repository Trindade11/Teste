"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type OnboardingStatus = "not_started" | "in_progress" | "review" | "completed";

export type OnboardingStepId =
  | "welcome"
  | "profile"
  | "organization"
  | "org_chart"
  | "competencies"
  | "goals"
  | "review"
  | "done";

export type AiExperienceLevel = "iniciante" | "intermediário" | "técnico";

export interface OnboardingResponses {
  fullName: string;
  email: string;
  jobRole: string;

  company: string;
  department: string;
  
  // Org Chart validation
  orgChartValidated: boolean;

  // Descriptive Fields (insumo para PIA - Process Intelligence Analytics)
  roleDescription: string;          // Descrição da função do usuário na instituição
  departmentDescription: string;    // Descrição do papel da área na organização

  // Professional Profile
  profileDescription: string;
  competencies: string[];

  primaryObjective: string;
  topChallenges: string;

  
  defaultVisibility: "corporate" | "personal";
  memoryLevel: "short" | "medium" | "long";

  // Conversation Pipeline
  conversationPhase: "not_started" | "goals" | "challenges" | "preferences" | "validation" | "done";
  conversationSignals: string[];
  conversationStartedAt: string | null;
  conversationCompletedAt: string | null;
}

export const ONBOARDING_STEPS: Array<{ id: OnboardingStepId; title: string; }> = [
  { id: "welcome", title: "Início" },
  { id: "profile", title: "Perfil" },
  { id: "organization", title: "Organização" },
  { id: "org_chart", title: "Seu Organograma" },
  { id: "competencies", title: "Competências" },
  { id: "goals", title: "Objetivos" },
  { id: "review", title: "Revisão" },
  { id: "done", title: "Concluído" },
];

const stepOrder: OnboardingStepId[] = ONBOARDING_STEPS.map((s) => s.id);

const defaultResponses: OnboardingResponses = {
  fullName: "",
  email: "",
  jobRole: "",

  company: "",
  department: "",
  orgChartValidated: false,

  roleDescription: "",
  departmentDescription: "",

  profileDescription: "",
  competencies: [],

  primaryObjective: "",
  topChallenges: "",

  
  defaultVisibility: "corporate",
  memoryLevel: "long",
  conversationPhase: "not_started",
  conversationSignals: [],
  conversationStartedAt: null,
  conversationCompletedAt: null,
};

interface OnboardingState {
  isOpen: boolean;
  status: OnboardingStatus;
  currentStepId: OnboardingStepId;
  completedStepIds: OnboardingStepId[];
  responses: OnboardingResponses;
  startedAt: string | null;
  completedAt: string | null;

  open: () => void;
  close: () => void;

  start: (prefill?: Partial<OnboardingResponses>) => void;
  updateResponse: (key: keyof OnboardingResponses, value: OnboardingResponses[keyof OnboardingResponses]) => void;
  goTo: (stepId: OnboardingStepId) => void;
  markStepComplete: (stepId: OnboardingStepId) => void;
  
  startConversation: () => void;
  updateConversationPhase: (phase: OnboardingResponses["conversationPhase"]) => void;
  addConversationSignal: (signal: string) => void;
  
  next: () => void;
  prev: () => void;
  complete: () => void;
  reset: () => void;
  
  // Sync with backend
  syncStatus: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      status: "not_started",
      currentStepId: "welcome",
      completedStepIds: [],
      responses: defaultResponses,
      startedAt: null,
      completedAt: null,

      open: () =>
        set((state) => {
          if (state.status === "not_started") {
            return {
              isOpen: true,
              currentStepId: "welcome" as OnboardingStepId,
              completedStepIds: [],
            };
          }

          return { isOpen: true };
        }),
      close: () => set({ isOpen: false }),

      start: (prefill) => {
        set({
          isOpen: true,
          status: "in_progress",
          currentStepId: "profile",
          completedStepIds: ["welcome"],
          responses: { ...defaultResponses, ...prefill },
          startedAt: new Date().toISOString(),
          completedAt: null,
        });
      },

      updateResponse: (key, value) =>
        set((state) => ({
          responses: {
            ...state.responses,
            [key]: value,
          },
        })),

      
      goTo: (stepId) => set({ currentStepId: stepId }),

      markStepComplete: (stepId) =>
        set((state) => ({
          completedStepIds: state.completedStepIds.includes(stepId)
            ? state.completedStepIds
            : [...state.completedStepIds, stepId],
        })),

      startConversation: () =>
        set((state) => ({
          responses: {
            ...state.responses,
            conversationPhase: "goals",
            conversationStartedAt: new Date().toISOString(),
          },
        })),

      updateConversationPhase: (phase) =>
        set((state) => ({
          responses: {
            ...state.responses,
            conversationPhase: phase,
            conversationCompletedAt: phase === "done" ? new Date().toISOString() : state.responses.conversationCompletedAt,
          },
        })),

      addConversationSignal: (signal) =>
        set((state) => ({
          responses: {
            ...state.responses,
            conversationSignals: [...state.responses.conversationSignals, signal],
          },
        })),

      next: () => {
        const { currentStepId } = get();
        const idx = stepOrder.indexOf(currentStepId);
        const nextId = stepOrder[Math.min(stepOrder.length - 1, idx + 1)];

        set({
          currentStepId: nextId,
          status: nextId === "review" ? "review" : get().status,
        });
      },

      prev: () => {
        const { currentStepId } = get();
        const idx = stepOrder.indexOf(currentStepId);
        const prevId = stepOrder[Math.max(0, idx - 1)];
        set({ currentStepId: prevId });
      },

      complete: () => {
        set((state) => ({
          status: "completed",
          currentStepId: "done",
          completedStepIds: Array.from(new Set([...state.completedStepIds, ...stepOrder])),
          completedAt: new Date().toISOString(),
        }));
      },

      reset: () =>
        set({
          isOpen: false,
          status: "not_started",
          currentStepId: "welcome",
          completedStepIds: [],
          responses: defaultResponses,
          startedAt: null,
          completedAt: null,
        }),

      syncStatus: async () => {
        try {
          const { api } = await import('@/lib/api');
          const response = await api.getOnboardingStatus();
          
          if (response.success && response.data) {
            const backendStatus = response.data.status as OnboardingStatus;
            const backendCompletedAt = response.data.completedAt;
            
            set((state) => ({
              status: backendStatus,
              completedAt: backendCompletedAt,
              // Se o backend diz que está completed, atualiza o estado local
              ...(backendStatus === 'completed' && {
                currentStepId: 'done' as OnboardingStepId,
                completedStepIds: Array.from(new Set([...state.completedStepIds, ...stepOrder])),
              }),
              // Se o backend diz que está in_progress e local está not_started, abre o onboarding
              ...(backendStatus === 'in_progress' && state.status === 'not_started' && {
                isOpen: true,
                currentStepId: 'review' as OnboardingStepId, // Continua da fase de revisão
              }),
            }));
          }
        } catch (error) {
          console.error('Failed to sync onboarding status:', error);
        }
      },
    }),
    {
      name: "onboarding-store",
      storage: createJSONStorage(() => localStorage),
      version: 5,
      migrate: (persistedState) => {
        const state = ((persistedState as any)?.state ?? persistedState ?? {}) as any;

        const nextStepId =
          state.currentStepId === "memory"
            ? "review"
            : stepOrder.includes(state.currentStepId)
              ? state.currentStepId
              : "welcome";

        return {
          ...state,
          currentStepId: nextStepId,
          completedStepIds: Array.isArray(state.completedStepIds)
            ? state.completedStepIds.filter((id: any) => stepOrder.includes(id))
            : [],
          responses: {
            ...defaultResponses,
            ...(state.responses || {}),
            // Garantir que todos os campos descritivos sempre existam
            competencies: Array.isArray(state.responses?.competencies) ? state.responses.competencies : [],
            profileDescription: state.responses?.profileDescription || "",
            roleDescription: state.responses?.roleDescription || "",
            departmentDescription: state.responses?.departmentDescription || "",
          },
        };
      },
    }
  )
);
