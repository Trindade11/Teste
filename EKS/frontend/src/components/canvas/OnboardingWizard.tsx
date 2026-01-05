"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ONBOARDING_STEPS,
  type OnboardingStepId,
  type OnboardingResponses,
  useOnboardingStore,
} from "@/store/onboarding-store";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  X,
} from "lucide-react";

const NEED_OPTIONS = [
  "Mapear conhecimento",
  "Criar tarefas e planos",
  "Organizar personas",
  "RAG / fontes",
  "Governança (corporate)",
];

function getStepTitle(stepId: OnboardingStepId) {
  return ONBOARDING_STEPS.find((s) => s.id === stepId)?.title || stepId;
}

export function OnboardingWizard() {
  const {
    isOpen,
    close,
    status,
    currentStepId,
    completedStepIds,
    responses,
    start,
    updateResponse,
    toggleNeed,
    goTo,
    markStepComplete,
    next,
    prev,
    complete,
    reset,
  } = useOnboardingStore();

  const { user } = useAuthStore();

  const [competencyDraft, setCompetencyDraft] = useState("");
  const [orgChartData, setOrgChartData] = useState<{
    user: { id: string; name: string; email: string; company: string; role: string; department: string };
    manager: { id: string; name: string; email: string; company: string; role: string; department: string } | null;
    peers: Array<{ id: string; name: string; email: string; company: string; role: string; department: string }>;
    subordinates: Array<{ id: string; name: string; email: string; company: string; role: string; department: string }>;
  } | null>(null);
  const [orgChartLoading, setOrgChartLoading] = useState(false);
  const [orgChartError, setOrgChartError] = useState<string | null>(null);

  const totalSteps = useMemo(
    () =>
      ONBOARDING_STEPS.map((s) => s.id).filter(
        (id) => id !== "welcome" && id !== "done"
      ).length,
    []
  );

  const completedCount = useMemo(
    () =>
      completedStepIds.filter((id) => id !== "welcome" && id !== "done").length,
    [completedStepIds]
  );

  const progressPct = totalSteps === 0 ? 0 : Math.round((completedCount / totalSteps) * 100);

  const nodePreview = useMemo(() => {
    const now = new Date().toISOString();
    const ownerId = user?.userId || "unknown";
    const visibility = responses.defaultVisibility;

    const base = {
      created_at: now,
      updated_at: now,
      source_type: "form",
      source_ref: "onboarding",
      owner_id: ownerId,
      visibility,
      confidence: 1,
      expires_at: null,
    };

    return [
      {
        label: "User",
        data: {
          id: `user:${ownerId}`,
          ...base,
          email: responses.email,
          name: responses.fullName,
        },
      },
      {
        label: "AIProfile",
        data: {
          id: `ai_profile:${ownerId}`,
          ...base,
          ai_experience_level: responses.aiExperienceLevel,
          technical_path: responses.technicalPath,
          preferred_language: responses.preferredLanguage,
          needs: responses.needs,
        },
      },
      {
        label: "PersonaVersion",
        data: {
          id: `persona_version:${ownerId}`,
          ...base,
          job_role: responses.jobRole,
          company: responses.company,
          department: responses.department,
        },
      },
      {
        label: "Preferences",
        data: {
          id: `preferences:${ownerId}`,
          ...base,
          default_visibility: responses.defaultVisibility,
        },
      },
      {
        label: "OnboardingResponses",
        data: {
          id: `onboarding:${ownerId}`,
          ...base,
          ...responses,
        },
      },
    ];
  }, [responses, user?.userId]);

  if (!isOpen) return null;

  const canGoNext = () => {
    if (currentStepId === "profile") {
      return (
        responses.fullName.trim().length > 0 && responses.email.trim().length > 0
      );
    }
    if (currentStepId === "organization") {
      return responses.company.trim().length > 0;
    }
    if (currentStepId === "goals") {
      return responses.primaryObjective.trim().length > 0;
    }
    return true;
  };

  useEffect(() => {
    if (currentStepId !== "org_chart") return;

    const identifier = user?.email || responses.email;
    if (!identifier) return;

    let cancelled = false;

    const load = async () => {
      setOrgChartLoading(true);
      setOrgChartError(null);

      const result = await api.getOrgChart(identifier);

      if (cancelled) return;

      if (result.success && result.data) {
        setOrgChartData(result.data);
        setOrgChartError(null);
      } else {
        setOrgChartData(null);
        setOrgChartError(result.error || "Usuário não encontrado no organograma");
      }

      setOrgChartLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [currentStepId, responses.email, user?.email]);

  const handleStart = async () => {
    const prefillResponse = await api.getOnboardingPrefill();

    const backendPrefill = prefillResponse.success && prefillResponse.data
      ? prefillResponse.data.prefill
      : null;

    const prefillData: Partial<OnboardingResponses> = {
      fullName: responses.fullName || user?.name || backendPrefill?.name || "",
      email: responses.email || user?.email || backendPrefill?.email || "",
      company: responses.company || user?.company || backendPrefill?.company || "",
      department: responses.department || (user as any)?.department || backendPrefill?.department || "",
      jobRole: responses.jobRole || (user as any)?.jobRole || backendPrefill?.jobTitle || "",
    };

    start(prefillData);
  };

  const handleNext = () => {
    markStepComplete(currentStepId);
    next();
  };

  const addCompetency = () => {
    const value = competencyDraft.trim();
    if (!value) return;
    setCompetencyDraft("");
    updateResponse("competencies", [
      ...(responses.competencies || []),
      value,
    ]);
  };

  const updateCompetencyAt = (index: number, value: string) => {
    const nextCompetencies = [...(responses.competencies || [])];
    nextCompetencies[index] = value;
    updateResponse("competencies", nextCompetencies);
  };

  const removeCompetencyAt = (index: number) => {
    updateResponse(
      "competencies",
      (responses.competencies || []).filter((_, i) => i !== index)
    );
  };

  const showFooter =
    currentStepId !== "welcome" &&
    currentStepId !== "review" &&
    currentStepId !== "done";

  return (
    <div className="relative h-full w-full overflow-hidden bg-muted/30">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative h-full w-full p-4">
        <div className="h-full w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold truncate">
                  First‑Run Onboarding
                </span>
                <span className="text-xs text-muted-foreground">
                  {progressPct}%
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {status.replace("_", " ")}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Etapa atual: {getStepTitle(currentStepId)}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={close}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-hidden flex">
            <div className="w-72 border-r border-border bg-muted/30 p-4 overflow-y-auto">
              <div className="text-xs font-medium text-muted-foreground mb-3">
                Roadmap
              </div>
              <div className="space-y-1">
                {ONBOARDING_STEPS.map((step) => {
                  const isDone =
                    completedStepIds.includes(step.id) || status === "completed";
                  const isActive = step.id === currentStepId;
                  const isDisabled =
                    status === "not_started" && step.id !== "welcome";

                  return (
                    <button
                      key={step.id}
                      onClick={() => {
                        if (!isDisabled) goTo(step.id);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-colors",
                        isDisabled
                          ? "opacity-40 cursor-not-allowed"
                          : "cursor-pointer",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span className="text-sm truncate">{step.title}</span>
                    </button>
                  );
                })}
              </div>

              {status !== "completed" && (
                <div className="mt-4 rounded-lg border border-border bg-card p-3">
                  <div className="text-xs font-medium mb-1">Dica</div>
                  <div className="text-xs text-muted-foreground">
                    Você pode fechar e continuar depois. A tarefa continuará
                    pendente no sidebar.
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {currentStepId === "welcome" && (
                <div className="max-w-2xl">
                  <h2 className="text-xl font-semibold mb-2">Bem-vindo</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Vamos criar seu perfil inicial, contexto organizacional e competências.
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={handleStart}>Start</Button>
                    <Button variant="outline" onClick={close}>
                      Agora não
                    </Button>
                  </div>
                </div>
              )}

              {currentStepId === "profile" && (
                <div className="max-w-2xl space-y-6">
                  <h2 className="text-xl font-semibold">Perfil</h2>
                  <p className="text-sm text-muted-foreground">
                    Essas informações ajudam seu agente a entender seu contexto e adaptar o tom das respostas.
                  </p>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-sm font-medium">Nome completo</label>
                      <input
                        value={responses.fullName}
                        onChange={(e) =>
                          updateResponse("fullName", e.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Seu nome"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <input
                        value={responses.email}
                        onChange={(e) => updateResponse("email", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        placeholder="seuemail@empresa.com"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Função</label>
                      <input
                        value={responses.jobRole}
                        onChange={(e) =>
                          updateResponse("jobRole", e.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Ex.: Analista de Processos, Gestor de TI, CEO"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Sobre você</label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Conte brevemente sobre seu perfil e estilo de trabalho
                      </p>
                      <textarea
                        value={responses.profileDescription}
                        onChange={(e) => updateResponse("profileDescription", e.target.value)}
                        className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[110px]"
                        placeholder="Ex: Sou orientado a dados, gosto de clareza e execução. Trabalho bem com múltiplas áreas e foco em melhoria contínua..."
                        maxLength={800}
                      />
                      <div className="text-xs text-muted-foreground text-right">
                        {responses.profileDescription.length}/800 caracteres
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStepId === "organization" && (
                <div className="max-w-2xl space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold">Organização</h2>
                    <p className="text-sm text-muted-foreground">
                      Confirme suas informações organizacionais e descreva o contexto da sua área
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-sm font-medium">Empresa</label>
                      <input
                        value={responses.company}
                        onChange={(e) =>
                          updateResponse("company", e.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Nome da empresa"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Pré-preenchido do seu cadastro. Edite se necessário.
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Departamento</label>
                      <input
                        value={responses.department}
                        onChange={(e) =>
                          updateResponse("department", e.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Ex.: Gerência de Processos, TI, RH"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Pré-preenchido do seu cadastro. Edite se necessário.
                      </p>
                    </div>
                  </div>

                  {/* Campos Descritivos - Insumo para PIA */}
                  <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                    <div>
                      <div className="text-sm font-medium text-primary mb-1">📋 Contexto Organizacional</div>
                      <p className="text-xs text-muted-foreground">
                        Estas informações serão usadas como insumo para mapeamento de processos
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Descrição da sua função na instituição</label>
                      <p className="text-xs text-muted-foreground mt-1 mb-2">
                        Descreva qual é o seu papel e responsabilidades dentro da organização
                      </p>
                      <textarea
                        value={responses.roleDescription}
                        onChange={(e) => updateResponse("roleDescription", e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[100px]"
                        placeholder="Ex: Sou responsável por liderar a área de processos, gerenciando iniciativas de melhoria contínua, automação e transformação digital. Coordeno uma equipe de analistas e atuo como ponto focal entre TI e as áreas de negócio..."
                        maxLength={600}
                      />
                      <div className="text-xs text-muted-foreground text-right mt-1">
                        {responses.roleDescription.length}/600 caracteres
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Descrição do papel da sua área na organização</label>
                      <p className="text-xs text-muted-foreground mt-1 mb-2">
                        O que a sua área representa e qual o impacto dela na organização
                      </p>
                      <textarea
                        value={responses.departmentDescription}
                        onChange={(e) => updateResponse("departmentDescription", e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[100px]"
                        placeholder="Ex: A Gerência de Processos é responsável por identificar oportunidades de otimização, mapear e documentar processos críticos, e garantir a governança de processos corporativos. Atuamos como facilitadores da transformação digital..."
                        maxLength={600}
                      />
                      <div className="text-xs text-muted-foreground text-right mt-1">
                        {responses.departmentDescription.length}/600 caracteres
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStepId === "org_chart" && (
                <div className="max-w-4xl space-y-6">
                  <h2 className="text-xl font-semibold">Sua Posição no Organograma</h2>
                  <p className="text-sm text-muted-foreground">
                    Confirme se sua posição está correta na estrutura organizacional
                  </p>

                  <div
                    className={cn(
                      "rounded-lg border p-3",
                      orgChartError
                        ? "border-destructive/40 bg-destructive/5"
                        : "border-border bg-muted/20"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-muted-foreground">
                        {orgChartLoading
                          ? "Carregando seu organograma..."
                          : orgChartError
                            ? "Não foi possível carregar o organograma para este usuário."
                            : "Organograma carregado com sucesso."}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[50%]">
                        {(user?.email || responses.email) ? `Base: ${user?.email || responses.email}` : ""}
                      </div>
                    </div>
                    {orgChartError && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Dica: revise seu email no step Perfil ou use “Relatar Problema”.
                      </div>
                    )}
                  </div>

                  {/* Visualização tipo organograma com pares */}
                  <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background p-6 space-y-6">
                    
                    {/* Nível Superior - Gestor */}
                    <div className="flex flex-col items-center">
                      <div className="text-xs text-muted-foreground mb-2">↑ Reporta para</div>
                      <div className="bg-card border-2 border-border rounded-lg p-3 w-64 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                            {orgChartLoading
                              ? "…"
                              : (orgChartData?.manager?.name || "")
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase() || "—"}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {orgChartLoading
                                ? "Carregando..."
                                : orgChartData?.manager?.name || "Sem gestor cadastrado"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {orgChartLoading ? "" : orgChartData?.manager?.role || ""}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Conectores */}
                    <div className="flex justify-center">
                      <div className="w-px h-6 bg-border"></div>
                    </div>

                    {/* Seu Nível - Você + Pares (com scroll horizontal) */}
                    <div className="overflow-x-auto pb-2">
                      <div className="flex items-center justify-center gap-3 min-w-max px-4">
                        {/* Pares à esquerda */}
                        {orgChartData?.peers && orgChartData.peers.length > 0 ? (
                          orgChartData.peers.map((peer, idx) => (
                            <div key={peer.id || idx} className="bg-muted/50 border border-border rounded-lg p-3 w-44 flex-shrink-0 opacity-80 hover:opacity-100 transition-opacity">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                  {peer.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium truncate">{peer.name}</div>
                                  <div className="text-xs text-muted-foreground truncate">{peer.role}</div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="bg-muted/30 border border-dashed border-border rounded-lg p-3 w-44 flex-shrink-0">
                            <div className="text-xs text-muted-foreground text-center italic">Sem pares</div>
                          </div>
                        )}

                        {/* Você (Destaque Central) */}
                        <div className="relative flex-shrink-0">
                          <div className="absolute -inset-1 bg-primary/20 rounded-lg blur-sm"></div>
                          <div className="relative bg-primary border-2 border-primary rounded-lg p-4 w-56 shadow-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary-foreground flex items-center justify-center text-primary font-bold">
                                {(orgChartData?.user?.name || responses.fullName || user?.name || "")
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase() || "—"}
                              </div>
                              <div className="flex-1 text-primary-foreground min-w-0">
                                <div className="font-semibold truncate">{orgChartData?.user?.name || responses.fullName}</div>
                                <div className="text-xs opacity-90 truncate">{orgChartData?.user?.role || responses.jobRole}</div>
                                <div className="text-xs opacity-75 truncate">{orgChartData?.user?.department || responses.department}</div>
                              </div>
                            </div>
                            <div className="absolute -top-2 -right-2 bg-yellow-500 text-yellow-950 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                              VOCÊ
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center text-xs text-muted-foreground italic">
                      {orgChartError ? orgChartError : `${orgChartData?.peers?.length || 0} par(es) do mesmo nível hierárquico`}
                    </div>

                    {/* Conectores */}
                    <div className="flex justify-center">
                      <div className="w-px h-6 bg-border"></div>
                    </div>

                    {/* Nível Inferior - Subordinados (com scroll horizontal) */}
                    <div className="flex flex-col items-center">
                      <div className="text-xs text-muted-foreground mb-2">↓ Subordinados diretos</div>
                      {orgChartData?.subordinates && orgChartData.subordinates.length > 0 ? (
                        <div className="overflow-x-auto w-full pb-2">
                          <div className="flex items-center justify-center gap-2 min-w-max px-4">
                            {orgChartData.subordinates.map((sub, idx) => (
                              <div key={sub.id || idx} className="bg-muted/40 border border-border rounded-lg p-2 w-40 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                    {sub.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium truncate">{sub.name}</div>
                                    <div className="text-xs text-muted-foreground truncate">{sub.role}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-muted/30 border border-dashed border-border rounded-lg p-4 w-64">
                          <div className="text-sm text-muted-foreground text-center italic">
                            Nenhum subordinado cadastrado
                          </div>
                        </div>
                      )}
                      {(orgChartData?.subordinates?.length || 0) > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {orgChartData?.subordinates?.length} subordinado(s)
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        updateResponse("orgChartValidated", true);
                        handleNext();
                      }}
                      className="flex-1"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Confirmar Posição
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const description = prompt('Descreva o problema com sua alocação:');
                        if (description) {
                          alert('Relato enviado ao administrador. Você será notificado quando for corrigido.');
                          updateResponse("orgChartValidated", false);
                        }
                      }}
                    >
                      Relatar Problema
                    </Button>
                  </div>
                </div>
              )}

              {currentStepId === "competencies" && (
                <div className="max-w-3xl space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold">Competências</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Adicione habilidades técnicas e comportamentais que fazem parte do seu perfil
                    </p>
                  </div>

                  {/* Campo Descritivo - Perfil Profissional */}
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <div className="text-xs text-muted-foreground">
                      Dica: escreva competências de forma objetiva (ex.: “BPM”, “SQL”, “Gestão de stakeholders”,
                      “Mapeamento de processos”, “Power BI”, “Comunicação executiva”).
                    </div>
                  </div>

                  {/* Competências */}
                  <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-1">Suas Competências</div>
                      <div className="text-xs text-muted-foreground">
                        Adicione habilidades técnicas e comportamentais que fazem parte do seu perfil
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        value={competencyDraft}
                        onChange={(e) => setCompetencyDraft(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addCompetency()}
                        placeholder="Ex: Gestão de Processos, SQL, Power BI, Liderança..."
                        className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                      <Button onClick={addCompetency}>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>

                    {(responses.competencies || []).length === 0 ? (
                      <div className="text-xs text-muted-foreground italic">
                        Nenhuma competência adicionada ainda. Use o campo acima para adicionar.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(responses.competencies || []).map((skill, index) => (
                          <div key={`${skill}-${index}`} className="flex gap-2">
                            <input
                              value={skill}
                              onChange={(e) =>
                                updateCompetencyAt(index, e.target.value)
                              }
                              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => removeCompetencyAt(index)}
                              aria-label="Remover competência"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentStepId === "goals" && (
                <div className="max-w-2xl space-y-4">
                  <h2 className="text-xl font-semibold">Objetivos e Desafios</h2>
                  <p className="text-sm text-muted-foreground">
                    Conte um pouco sobre o que você busca com o sistema
                  </p>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-sm font-medium">
                        {responses.jobRole 
                          ? `Como ${responses.jobRole}, qual seu objetivo principal ao usar este sistema?`
                          : 'Qual seu objetivo principal ao usar este sistema?'}
                      </label>
                      <textarea
                        value={responses.primaryObjective}
                        onChange={(e) =>
                          updateResponse("primaryObjective", e.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[90px]"
                        placeholder="Ex: Organizar conhecimento, facilitar colaboração, mapear processos..."
                        maxLength={500}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Quais são os maiores desafios do seu dia-a-dia?</label>
                      <textarea
                        value={responses.topChallenges}
                        onChange={(e) =>
                          updateResponse("topChallenges", e.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[90px]"
                        placeholder="Ex: Falta de visibilidade, dificuldade em organizar informações, pouco tempo..."
                        maxLength={500}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStepId === "ai_profile" && (
                <div className="max-w-2xl space-y-4">
                  <h2 className="text-xl font-semibold">AI Profile</h2>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-sm font-medium">Nível de experiência</label>
                      <select
                        value={responses.aiExperienceLevel}
                        onChange={(e) =>
                          updateResponse(
                            "aiExperienceLevel",
                            e.target.value as
                              | "iniciante"
                              | "intermediário"
                              | "técnico"
                          )
                        }
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="iniciante">Iniciante</option>
                        <option value="intermediário">Intermediário</option>
                        <option value="técnico">Técnico</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={responses.technicalPath}
                        onChange={(e) =>
                          updateResponse("technicalPath", e.target.checked)
                        }
                      />
                      Quero um caminho mais técnico (prompt, dados, integrações)
                    </label>

                    <div>
                      <div className="text-sm font-medium mb-2">O que você mais precisa? (clique para selecionar)</div>
                      <p className="text-xs text-muted-foreground mb-3">Selecione as opções que fazem sentido para você</p>
                      <div className="flex flex-wrap gap-2">
                        {NEED_OPTIONS.map((need) => {
                          const active = responses.needs.includes(need);
                          return (
                            <button
                              key={need}
                              onClick={() => toggleNeed(need)}
                              className={cn(
                                "text-sm px-4 py-2 rounded-lg border-2 transition-all font-medium",
                                active
                                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                  : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-muted"
                              )}
                            >
                              {active && "✓ "}{need}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStepId === "review" && (
                <div className="max-w-3xl space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold">Revisão</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Confira antes de confirmar. Você pode voltar e editar.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                      <div className="text-sm font-medium mb-2">Resumo</div>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-muted-foreground">Nome:</span>{" "}
                          {responses.fullName || "—"}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Email:</span>{" "}
                          {responses.email || "—"}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Empresa:</span>{" "}
                          {responses.company || "—"}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Objetivo:</span>{" "}
                          {responses.primaryObjective || "—"}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Competências:</span>{" "}
                          {(responses.competencies || []).length > 0
                            ? `${(responses.competencies || []).length} itens`
                            : "—"}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Perfil:</span>{" "}
                          {responses.profileDescription ? "Preenchido" : "—"}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                      <div className="text-sm font-medium mb-2">AI Profile</div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Nível:</span>{" "}
                          {responses.aiExperienceLevel}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Necessidades:</span>{" "}
                          {responses.needs.length > 0 ? responses.needs.join(", ") : "—"}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Organograma:</span>{" "}
                          {responses.orgChartValidated ? "✓ Validado" : "Pendente"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="text-sm font-medium mb-2">Competências</div>

                    {(responses.competencies || []).length === 0 ? (
                      <div className="text-sm text-muted-foreground">
                        Nenhuma competência adicionada.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(responses.competencies || []).map((skill) => (
                          <span
                            key={skill}
                            className="text-xs rounded-full border border-border bg-background px-3 py-1"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        complete();
                      }}
                    >
                      Confirmar e concluir
                    </Button>
                    <Button variant="outline" onClick={close}>
                      Fechar e continuar depois
                    </Button>
                  </div>
                </div>
              )}

              {currentStepId === "done" && (
                <div className="max-w-4xl space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">Seu Agente Profissional foi Criado</h2>
                    <p className="text-sm text-muted-foreground">
                      Agora você tem um assistente AI alinhado ao seu perfil, contexto organizacional e competências
                    </p>
                  </div>

                  {/* Visualização do Agente Personal */}
                  <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background p-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
                        {responses.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Agente {responses.fullName.split(' ')[0]}</h3>
                        <p className="text-sm text-muted-foreground">{responses.jobRole} • {responses.company}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-sm">
                        <span className="font-medium">Objetivo Principal:</span>
                        <p className="text-muted-foreground mt-1">{responses.primaryObjective || "Não informado"}</p>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Competências-chave:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(responses.competencies || []).slice(0, 5).map((skill) => (
                            <span key={skill} className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                              {skill}
                            </span>
                          ))}
                          {(responses.competencies || []).length > 5 && (
                            <span className="text-xs px-2 py-1 text-muted-foreground">
                              +{(responses.competencies || []).length - 5} mais
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Diagrama de Arquitetura */}
                  <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                    <h3 className="text-sm font-semibold">Como seu agente funciona</h3>
                    <div className="bg-muted/30 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                      <pre className="text-muted-foreground">{`flowchart TD
  U[Você] -->|Pergunta| A[Agente ${responses.fullName.split(" ")[0]}]
  A --> R[Router / Orquestrador]
  R --> P[Perfil (sobre você + competências)]
  R --> O[Contexto organizacional + organograma]
  R --> D[Documentos]
  R --> C[Histórico de conversas]
  R -->|Resposta| U
`}</pre>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <h3 className="text-sm font-semibold mb-2">Próximos passos</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <span className="text-primary">1.</span>
                        <span>Comece a conversar com seu Agente Profissional no chat</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-primary">2.</span>
                        <span>Crie nodes de conhecimento para alimentar o grafo</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-primary">3.</span>
                        <span>Explore recursos de automação e scraping</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={close} className="flex-1">
                      Começar a usar
                    </Button>
                    <Button variant="outline" onClick={reset}>
                      Refazer onboarding
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {showFooter && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <Button
                variant="outline"
                onClick={prev}
                disabled={currentStepId === "profile"}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={handleNext} disabled={!canGoNext()}>
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
