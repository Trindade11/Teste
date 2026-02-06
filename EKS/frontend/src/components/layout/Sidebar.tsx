"use client";

import { X, GitBranch, ClipboardList, BookOpen, Network, CheckCircle, Star, TrendingUp, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/store/themeStore";
import { ONBOARDING_STEPS, useOnboardingStore } from "@/store/onboarding-store";
import { useInstitutionConfig } from "@/hooks/useInstitutionConfig";
import { cn } from "@/lib/utils";

export type ViewType = "onboarding" | "processes" | "knowledge" | "navigator" | "validation";

interface SidebarProps {
  onClose?: () => void;
  currentView?: ViewType;
  onViewChange?: (view: ViewType) => void;
}

const MENU_ITEMS: { id: ViewType; label: string; icon: React.ReactNode; badge?: number }[] = [
  { id: "navigator", label: "Visão Estratégica", icon: <Network className="w-4 h-4" /> },
  { id: "knowledge", label: "Conhecimento", icon: <BookOpen className="w-4 h-4" /> },
  { id: "validation", label: "Validação", icon: <CheckCircle className="w-4 h-4" />, badge: 6 },
];

export function Sidebar({ onClose, currentView = "processes", onViewChange }: SidebarProps) {
  const { config } = useThemeStore();
  const { status: onboardingStatus, completedStepIds, open: openOnboarding } = useOnboardingStore();
  const { hubName } = useInstitutionConfig();

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
          <span className="font-semibold text-lg">{hubName}</span>
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
            <div className="h-full bg-primary" style={{ width: `${onboardingProgress}%` }} />
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {onboardingStatus === "not_started" ? "Primeira configuração do seu perfil e preferências." : "Continue de onde parou."}
          </div>
          <div className="mt-3">
            <Button size="sm" className="w-full" onClick={openOnboarding}>
              {onboardingStatus === "not_started" ? "Começar" : "Continuar"}
            </Button>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="space-y-1 mt-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">
          Navegação
        </div>

        {/* Onboarding (apenas se não completou) */}
        {onboardingStatus !== "completed" && (
          <button
            onClick={() => {
              onViewChange?.("onboarding");
              openOnboarding();
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
              currentView === "onboarding"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "p-1.5 rounded-md",
                currentView === "onboarding" ? "bg-primary/20" : "bg-muted"
              )}
            >
              <ClipboardList className="w-4 h-4" />
            </span>
            <div className="flex-1 min-w-0">
              <div className={cn("text-sm font-medium", currentView === "onboarding" ? "text-primary" : "")}>
                Onboarding
              </div>
              <div className="text-[10px] text-muted-foreground truncate">First‑run onboarding</div>
            </div>
          </button>
        )}

        {MENU_ITEMS.map((item) => {
          const isDisabled = onboardingStatus !== "completed";

          return (
            <button
              key={item.id}
              onClick={() => {
                if (isDisabled) return;
                onViewChange?.(item.id);
              }}
              disabled={isDisabled}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                currentView === item.id
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
                isDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
              )}
            >
              <span className={cn(
                "p-1.5 rounded-md",
                currentView === item.id ? "bg-primary/20" : "bg-muted"
              )}>
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="ml-auto px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-medium">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User Recognition */}
      <div className="pt-3 mt-3 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <div className="p-1.5 rounded-full bg-amber-500/20">
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium flex items-center gap-1">
              <span>42 pontos</span>
              <TrendingUp className="w-3 h-3 text-green-500" />
            </div>
            <div className="text-[10px] text-muted-foreground">
              12 validações esta semana
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
