"use client";

import { useEffect, useState } from "react";
import { useOrgChartStore } from "@/store/org-chart-store";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function OrgChartValidationCard() {
  const {
    position,
    isLoading,
    error,
    showValidationCard,
    showReportModal,
    loadPosition,
    validatePosition,
    reportIssue,
    hideValidationCard,
    openReportModal,
    closeReportModal,
    clearError,
  } = useOrgChartStore();

  const [reportDescription, setReportDescription] = useState("");

  useEffect(() => {
    loadPosition();
  }, [loadPosition]);

  // Não exibe se não há posição, se já foi validado, ou se card está oculto
  if (!position || position.validatedByUser || !showValidationCard) {
    return null;
  }

  const handleValidate = async () => {
    await validatePosition();
  };

  const handleSubmitReport = async () => {
    if (!reportDescription.trim()) return;
    await reportIssue(reportDescription);
    setReportDescription("");
  };

  return (
    <>
      {/* Main Validation Card */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-6 shadow-lg max-w-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Sua Posição no Organograma</h3>
          </div>
          <button
            onClick={hideValidationCard}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
            <button onClick={clearError} className="ml-2 underline">
              Fechar
            </button>
          </div>
        )}

        {/* Org Chart Visualization */}
        <div className="mb-6 space-y-3">
          {/* Manager */}
          {position.manager && (
            <div className="flex items-center justify-center">
              <div className="rounded-lg border border-border bg-background/50 px-4 py-2 text-center">
                <div className="text-sm font-medium">{position.manager.name}</div>
                <div className="text-xs text-muted-foreground">
                  {position.manager.jobRole}
                </div>
                <div className="text-xs text-muted-foreground">
                  ({position.manager.hierarchyLevel})
                </div>
              </div>
            </div>
          )}

          {/* Arrow Down */}
          {position.manager && (
            <div className="flex items-center justify-center">
              <div className="text-muted-foreground">↓</div>
            </div>
          )}

          {/* Current User (Highlighted) */}
          <div className="flex items-center justify-center">
            <div className="rounded-lg border-2 border-primary bg-primary/10 px-6 py-3 text-center shadow-md">
              <div className="text-sm font-bold text-primary">► VOCÊ</div>
              <div className="text-base font-semibold mt-1">
                {position.user.name}
              </div>
              <div className="text-sm text-muted-foreground">
                {position.user.jobRole}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Dept: {position.department}
              </div>
              <div className="text-xs text-muted-foreground">
                Nível: {position.hierarchyLevel}
              </div>
            </div>
          </div>

          {/* Arrow Down */}
          {position.subordinates.length > 0 && (
            <div className="flex items-center justify-center">
              <div className="text-muted-foreground">↓</div>
            </div>
          )}

          {/* Subordinates */}
          {position.subordinates.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {position.subordinates.map((sub) => (
                <div
                  key={sub.userId}
                  className="rounded-lg border border-border bg-background/50 px-3 py-2 text-center"
                >
                  <div className="text-sm font-medium">{sub.name}</div>
                  <div className="text-xs text-muted-foreground">{sub.jobRole}</div>
                  <div className="text-xs text-muted-foreground">
                    ({sub.hierarchyLevel})
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Validation Question */}
        <div className="mb-4 rounded-lg bg-background/70 border border-border p-4">
          <p className="text-sm font-medium mb-2">
            As informações acima estão corretas?
          </p>
          <p className="text-xs text-muted-foreground">
            Confirme sua posição no organograma ou relate se há algum erro.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={handleValidate}
            disabled={isLoading}
            className="flex-1 min-w-[140px]"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Confirmar
          </Button>
          <Button
            onClick={openReportModal}
            disabled={isLoading}
            variant="outline"
            className="flex-1 min-w-[140px]"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Relatar Problema
          </Button>
        </div>
      </div>

      {/* Report Issue Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background rounded-xl shadow-2xl border border-border max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-semibold">Relatar Problema</h3>
              </div>
              <button
                onClick={closeReportModal}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <p className="text-sm text-muted-foreground mb-4">
              Descreva o problema encontrado no seu organograma. O administrador
              será notificado e você receberá uma resposta em breve.
            </p>

            <textarea
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="Ex: Meu gestor direto não é João, é Maria. Trabalho no departamento de Produto, não Inovação."
              className="w-full min-h-[120px] rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
            />

            <div className="flex gap-3 mt-4">
              <Button
                onClick={closeReportModal}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitReport}
                disabled={!reportDescription.trim() || isLoading}
                className="flex-1"
              >
                Enviar Relato
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
