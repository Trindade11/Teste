"use client";

import { useOnboardingStore } from "@/store/onboarding-store";
import { OnboardingWizard } from "@/components/canvas/OnboardingWizard";
import { OrgChartValidationCard } from "@/components/org-chart/OrgChartValidationCard";

export function Canvas() {
  const { isOpen } = useOnboardingStore();

  if (isOpen) {
    return <OnboardingWizard />;
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-muted/30">
      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Org Chart Validation Card */}
      <div className="absolute top-4 left-4 right-4 z-20 max-w-2xl">
        <OrgChartValidationCard />
      </div>

      {/* Canvas vazio - pronto para uso futuro */}
      <div className="absolute inset-0" />
    </div>
  );
}
