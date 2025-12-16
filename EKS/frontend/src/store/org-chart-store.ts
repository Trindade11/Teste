"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface OrgChartPosition {
  user: {
    name: string;
    jobRole: string;
  };
  department: string;
  hierarchyLevel: string;
  manager: {
    userId: string;
    name: string;
    jobRole: string;
    hierarchyLevel: string;
  } | null;
  subordinates: Array<{
    userId: string;
    name: string;
    jobRole: string;
    hierarchyLevel: string;
  }>;
  validatedByUser: boolean;
  validatedAt: string | null;
}

interface OrgChartState {
  position: OrgChartPosition | null;
  isLoading: boolean;
  error: string | null;
  showValidationCard: boolean;
  showReportModal: boolean;

  // Actions
  loadPosition: () => Promise<void>;
  validatePosition: () => Promise<void>;
  reportIssue: (description: string) => Promise<void>;
  hideValidationCard: () => void;
  openReportModal: () => void;
  closeReportModal: () => void;
  clearError: () => void;
}

export const useOrgChartStore = create<OrgChartState>()(
  persist(
    (set, get) => ({
      position: null,
      isLoading: false,
      error: null,
      showValidationCard: true,
      showReportModal: false,

      loadPosition: async () => {
        set({ isLoading: true, error: null });

        try {
          // Dynamic import to avoid SSR issues
          const { api } = await import("@/lib/api");
          const mockApi = (api as any).mockApi || (await import("@/lib/mockApi")).mockApi;
          
          const response = await mockApi.getMyOrgChartPosition();

          if (response.success && response.data) {
            set({
              position: response.data,
              isLoading: false,
              showValidationCard: !response.data.validatedByUser,
            });
          } else if (response.success && response.data === null) {
            // User has no allocation yet
            set({
              position: null,
              isLoading: false,
              showValidationCard: false,
            });
          } else {
            set({
              error: response.error || "Failed to load org chart position",
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Unknown error",
            isLoading: false,
          });
        }
      },

      validatePosition: async () => {
        set({ isLoading: true, error: null });

        try {
          const { api } = await import("@/lib/api");
          const mockApi = (api as any).mockApi || (await import("@/lib/mockApi")).mockApi;
          
          const response = await mockApi.validateOrgChartPosition();

          if (response.success) {
            set((state) => ({
              position: state.position
                ? {
                    ...state.position,
                    validatedByUser: true,
                    validatedAt: new Date().toISOString(),
                  }
                : null,
              isLoading: false,
              showValidationCard: false,
            }));
          } else {
            set({
              error: response.error || "Failed to validate position",
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Unknown error",
            isLoading: false,
          });
        }
      },

      reportIssue: async (description: string) => {
        set({ isLoading: true, error: null });

        try {
          const { api } = await import("@/lib/api");
          const mockApi = (api as any).mockApi || (await import("@/lib/mockApi")).mockApi;
          
          const response = await mockApi.reportOrgChartIssue(description);

          if (response.success) {
            set({
              isLoading: false,
              showReportModal: false,
              showValidationCard: false,
            });
          } else {
            set({
              error: response.error || "Failed to report issue",
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Unknown error",
            isLoading: false,
          });
        }
      },

      hideValidationCard: () => set({ showValidationCard: false }),
      openReportModal: () => set({ showReportModal: true }),
      closeReportModal: () => set({ showReportModal: false, error: null }),
      clearError: () => set({ error: null }),
    }),
    {
      name: "org-chart-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist apenas showValidationCard (resto é carregado do servidor)
        showValidationCard: state.showValidationCard,
      }),
    }
  )
);
