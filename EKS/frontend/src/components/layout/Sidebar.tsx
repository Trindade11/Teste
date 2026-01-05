"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { ONBOARDING_STEPS, useOnboardingStore } from "@/store/onboarding-store";

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user } = useAuthStore();
  const { config } = useThemeStore();
  const { status: onboardingStatus, completedStepIds, open: openOnboarding } = useOnboardingStore();

  const onboardingTotal = ONBOARDING_STEPS.filter((s) => s.id !== "welcome" && s.id !== "done").length;
  const onboardingCompleted = completedStepIds.filter((id) => id !== "welcome" && id !== "done").length;
  const onboardingProgress = onboardingTotal === 0 ? 0 : Math.round((onboardingCompleted / onboardingTotal) * 100);

  return (
    <div className="flex flex-col h-full p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {config.logo ? (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
              <img src={config.logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">EH</span>
            </div>
          )}
          <span className="font-semibold text-lg">{user?.company ? `${user.company} Hub` : "Enterprise Hub"}</span>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Onboarding Card */}
      {onboardingStatus !== "completed" && (
        <div className="mb-4 p-3 rounded-lg border border-border bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium">🧭 Completar onboarding</span>
            <span className="ml-auto text-[10px] text-muted-foreground">{onboardingProgress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{ width: `${onboardingProgress}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {onboardingStatus === "not_started"
              ? "Primeira configuração do seu perfil e preferências."
              : "Continue de onde parou."}
          </div>
          <div className="mt-3">
            <Button size="sm" className="w-full" onClick={openOnboarding}>
              {onboardingStatus === "not_started" ? "Começar" : "Continuar"}
            </Button>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />
    </div>
  );
}
