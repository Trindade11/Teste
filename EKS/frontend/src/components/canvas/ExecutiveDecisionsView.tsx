"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  Users,
  FolderKanban,
  AlertCircle,
  ChevronRight,
  Filter,
  Search,
  MessageSquare,
  FileText,
  Calendar,
  User,
  TrendingUp,
  Target,
  Eye,
  GripVertical,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useChatContextStore } from "@/store/chatContextStore";

// ============================================
// INTERFACES
// ============================================

interface Decision {
  id: string;
  value: string;
  description: string;
  rationale?: string;
  validated: boolean | null; // null = aguardando validação
  relatedPerson: string;
  createdAt: string;
  meetingTitle: string;
  meetingDate: string;
  meetingId: string;
  impact?: string;
  confidence: number;
  hasImplementation: boolean; // Tem Tasks de implementação vinculadas?
  context: "mine" | "area" | "subordinates" | "projects" | "critical"; // Contexto de relevância
  linkedProjects?: { id: string; name: string }[];
  linkedOkrs?: { id: string; name: string }[];
}

type ContextFilter = "all" | "mine" | "area" | "subordinates" | "projects" | "critical";
type StatusFilter = "all" | "awaiting_validation" | "without_implementation";

// ============================================
// MOCK DATA (alinhado ao modelo de relevância contextual)
// ============================================

const MOCK_DECISIONS: Decision[] = [
  {
    id: "dec-1",
    value: "Aprovar orçamento adicional para projeto EKS",
    description: "Solicitação de R$ 150k para acelerar desenvolvimento da Sprint 2",
    rationale: "Necessário para manter cronograma após atrasos em dependências externas",
    validated: null, // Aguardando validação
    relatedPerson: "Carlos Silva",
    createdAt: "2025-02-08T10:00:00Z",
    meetingTitle: "Reunião Q1 - Planejamento",
    meetingDate: "2025-02-08",
    meetingId: "meeting-1",
    impact: "Alto impacto no cronograma",
    confidence: 0.9,
    hasImplementation: false,
    context: "mine", // Ele decidiu
    linkedProjects: [{ id: "proj-1", name: "Implementação EKS" }],
  },
  {
    id: "dec-2",
    value: "Expandir time de desenvolvimento em 3 pessoas",
    description: "Contratação para suportar aumento de demanda e acelerar entregas",
    validated: true, // Já validada
    relatedPerson: "Maria Santos",
    createdAt: "2025-02-07T14:30:00Z",
    meetingTitle: "Reunião de Recursos Humanos",
    meetingDate: "2025-02-07",
    meetingId: "meeting-2",
    confidence: 0.85,
    hasImplementation: false, // Sem Tasks de implementação (precisa de ação)
    context: "area", // Mesmo departamento
  },
  {
    id: "dec-3",
    value: "Mudar estratégia de pricing para Q2",
    description: "Ajuste baseado em análise de mercado e feedback de clientes",
    rationale: "Análise mostrou que preços atuais estão abaixo do mercado",
    validated: true,
    relatedPerson: "João Pedro",
    createdAt: "2025-02-06T15:00:00Z",
    meetingTitle: "Reunião Estratégica",
    meetingDate: "2025-02-06",
    meetingId: "meeting-3",
    confidence: 0.92,
    hasImplementation: true, // Já tem Tasks vinculadas
    context: "projects", // Afeta projetos dele
    linkedProjects: [{ id: "proj-2", name: "Automação de Processos" }],
  },
  {
    id: "dec-4",
    value: "Cancelar projeto de integração com sistema legado",
    description: "Decisão estratégica após análise de ROI negativo",
    validated: true,
    relatedPerson: "Ana Costa",
    createdAt: "2025-02-05T11:00:00Z",
    meetingTitle: "Reunião de Diretoria",
    meetingDate: "2025-02-05",
    meetingId: "meeting-4",
    impact: "Crítico - afeta roadmap Q2",
    confidence: 0.88,
    hasImplementation: false,
    context: "critical", // Decisão crítica
  },
  {
    id: "dec-5",
    value: "Implementar novo processo de aprovação de orçamentos",
    description: "Automatizar fluxo que atualmente leva 5 dias úteis",
    validated: null, // Aguardando validação
    relatedPerson: "Pedro Alves",
    createdAt: "2025-02-09T09:00:00Z",
    meetingTitle: "Reunião de Processos",
    meetingDate: "2025-02-09",
    meetingId: "meeting-5",
    confidence: 0.82,
    hasImplementation: false,
    context: "subordinates", // Subordinado dele
  },
];

// ============================================
// COMPONENT
// ============================================

export function ExecutiveDecisionsView() {
  const { user } = useAuthStore();
  const { addContextItem } = useChatContextStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [contextFilter, setContextFilter] = useState<ContextFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Carregar dados (mock por enquanto)
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // TODO: Substituir por chamada real à API
        // const response = await api.getExecutiveDecisions({ context: contextFilter, status: statusFilter });
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        console.error("Failed to load decisions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [contextFilter, statusFilter]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("pt-BR", { 
        day: "2-digit", 
        month: "2-digit", 
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  // Filtrar decisões
  const filteredDecisions = MOCK_DECISIONS.filter((decision) => {
    // Filtro de busca
    const matchesSearch =
      decision.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      decision.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      decision.relatedPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      decision.meetingTitle.toLowerCase().includes(searchQuery.toLowerCase());

    // Filtro de contexto
    const matchesContext = contextFilter === "all" || decision.context === contextFilter;

    // Filtro de status
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "awaiting_validation" && decision.validated === null) ||
      (statusFilter === "without_implementation" && decision.validated === true && !decision.hasImplementation);

    return matchesSearch && matchesContext && matchesStatus;
  });

  // Ordenar: críticas primeiro, depois recentes
  const sortedDecisions = [...filteredDecisions].sort((a, b) => {
    // Priorizar aguardando validação
    if (a.validated === null && b.validated !== null) return -1;
    if (a.validated !== null && b.validated === null) return 1;
    
    // Priorizar sem implementação
    if (!a.hasImplementation && b.hasImplementation) return -1;
    if (a.hasImplementation && !b.hasImplementation) return 1;
    
    // Priorizar críticas (context: critical)
    if (a.context === "critical" && b.context !== "critical") return -1;
    if (a.context !== "critical" && b.context === "critical") return 1;
    
    // Depois por data (mais recentes primeiro)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Estatísticas
  const stats = {
    total: MOCK_DECISIONS.length,
    awaitingValidation: MOCK_DECISIONS.filter((d) => d.validated === null).length,
    withoutImplementation: MOCK_DECISIONS.filter((d) => d.validated === true && !d.hasImplementation).length,
    byContext: {
      mine: MOCK_DECISIONS.filter((d) => d.context === "mine").length,
      area: MOCK_DECISIONS.filter((d) => d.context === "area").length,
      subordinates: MOCK_DECISIONS.filter((d) => d.context === "subordinates").length,
      projects: MOCK_DECISIONS.filter((d) => d.context === "projects").length,
      critical: MOCK_DECISIONS.filter((d) => d.context === "critical").length,
    },
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/30">
        <div className="animate-pulse text-muted-foreground">Carregando decisões...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-10 p-6 border-b border-border bg-card/80 backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-7 h-7 text-primary" />
              Decisões
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Decisões relevantes para você, filtradas por contexto organizacional
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{filteredDecisions.length}</div>
            <div className="text-xs text-muted-foreground">decisões encontradas</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por conteúdo, pessoa ou reunião..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Filtros de Contexto */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Contexto:
            </span>
            {[
              { value: "all" as ContextFilter, label: "Todas" },
              { value: "mine", label: "Minhas" },
              { value: "area", label: "Minha Área" },
              { value: "subordinates", label: "Subordinados" },
              { value: "projects", label: "Meus Projetos" },
              { value: "critical", label: "Críticas" },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setContextFilter(filter.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  contextFilter === filter.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}
              >
                {filter.label}
                {filter.value !== "all" && stats.byContext[filter.value] > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary-foreground/20 text-xs">
                    {stats.byContext[filter.value]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Filtros de Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">Status:</span>
            {[
              { value: "all" as StatusFilter, label: "Todas", count: stats.total },
              { value: "awaiting_validation", label: "Aguardando Validação", count: stats.awaitingValidation },
              { value: "without_implementation", label: "Sem Implementação", count: stats.withoutImplementation },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2",
                  statusFilter === filter.value
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}
              >
                {filter.label}
                {filter.count > 0 && (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-xs",
                    statusFilter === filter.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted-foreground/20"
                  )}>
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {sortedDecisions.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-medium text-muted-foreground">Nenhuma decisão encontrada</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tente ajustar os filtros ou buscar por outros termos
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDecisions.map((decision) => {
              const isExpanded = expandedId === decision.id;
              const isDragging = draggedId === decision.id;
              
              const handleDragStart = (e: React.DragEvent) => {
                setDraggedId(decision.id);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("application/json", JSON.stringify({
                  type: "decision",
                  id: decision.id,
                  title: decision.value,
                  description: decision.description,
                  metadata: {
                    relatedPerson: decision.relatedPerson,
                    meetingTitle: decision.meetingTitle,
                    meetingDate: decision.meetingDate,
                    impact: decision.impact,
                    rationale: decision.rationale,
                    confidence: decision.confidence,
                    validated: decision.validated,
                    hasImplementation: decision.hasImplementation,
                  },
                }));
              };

              const handleDragEnd = () => {
                setDraggedId(null);
              };

              return (
                <div
                  key={decision.id}
                  draggable
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "rounded-xl border border-border bg-card/80 backdrop-blur transition-all overflow-hidden cursor-move",
                    decision.validated === null && "border-amber-300 dark:border-amber-800",
                    !decision.hasImplementation && decision.validated === true && "border-orange-300 dark:border-orange-800",
                    decision.context === "critical" && "border-red-300 dark:border-red-800",
                    isDragging && "opacity-50 scale-95"
                  )}
                >
                  {/* Card Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : decision.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 cursor-grab active:cursor-grabbing" onMouseDown={(e) => e.stopPropagation()}>
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        decision.validated === null ? "bg-amber-100 dark:bg-amber-950/30" :
                        !decision.hasImplementation ? "bg-orange-100 dark:bg-orange-950/30" :
                        "bg-green-100 dark:bg-green-950/30"
                      )}>
                        <CheckCircle2 className={cn(
                          "w-5 h-5",
                          decision.validated === null ? "text-amber-600" :
                          !decision.hasImplementation ? "text-orange-600" :
                          "text-green-600"
                        )} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-base flex-1">{decision.value}</h3>
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Badges de Status */}
                            {decision.validated === null && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-medium">
                                Aguardando Validação
                              </span>
                            )}
                            {decision.validated === true && !decision.hasImplementation && (
                              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs font-medium">
                                Sem Implementação
                              </span>
                            )}
                            {decision.hasImplementation && (
                              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium">
                                Em Implementação
                              </span>
                            )}
                            {decision.context === "critical" && (
                              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-medium">
                                Crítica
                              </span>
                            )}
                            <ChevronRight className={cn(
                              "w-4 h-4 text-muted-foreground transition-transform",
                              isExpanded && "rotate-90"
                            )} />
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{decision.description}</p>

                        {/* Meta Info */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <strong className="text-foreground/80">{decision.relatedPerson}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(decision.meetingDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {decision.meetingTitle}
                          </span>
                          {decision.impact && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {decision.impact}
                            </span>
                          )}
                          <span className="flex items-center gap-1 ml-auto">
                            <Eye className="w-3 h-3" />
                            {Math.round(decision.confidence * 100)}% confiança
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-border bg-muted/20">
                      <div className="pt-4 space-y-4">
                        {/* Rationale */}
                        {decision.rationale && (
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              Justificativa
                            </h4>
                            <p className="text-sm bg-muted/50 p-3 rounded-lg">{decision.rationale}</p>
                          </div>
                        )}

                        {/* Impact */}
                        {decision.impact && (
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              Impacto
                            </h4>
                            <p className="text-sm bg-muted/50 p-3 rounded-lg">{decision.impact}</p>
                          </div>
                        )}

                        {/* Linked Projects/OKRs */}
                        {(decision.linkedProjects?.length || decision.linkedOkrs?.length) && (
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                              <FolderKanban className="w-3 h-3" />
                              Vinculado a
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {decision.linkedProjects?.map((project) => (
                                <span
                                  key={project.id}
                                  className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium"
                                >
                                  {project.name}
                                </span>
                              ))}
                              {decision.linkedOkrs?.map((okr) => (
                                <span
                                  key={okr.id}
                                  className="px-2 py-1 rounded-lg bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 text-xs font-medium"
                                >
                                  {okr.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Proveniência Completa */}
                        <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                          <h4 className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Proveniência
                          </h4>
                          <div className="space-y-1 text-xs text-purple-600 dark:text-purple-400">
                            <div><strong>Reunião:</strong> {decision.meetingTitle}</div>
                            <div><strong>Data:</strong> {formatDateTime(decision.createdAt)}</div>
                            <div><strong>Decidido por:</strong> {decision.relatedPerson}</div>
                            <div><strong>Confiança da extração:</strong> {Math.round(decision.confidence * 100)}%</div>
                            <div><strong>ID da reunião:</strong> {decision.meetingId}</div>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

