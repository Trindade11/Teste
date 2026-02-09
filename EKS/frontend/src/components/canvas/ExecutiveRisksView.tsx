"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Shield,
  ShieldAlert,
  Flame,
  Clock,
  Users,
  FolderKanban,
  Target,
  ChevronRight,
  Filter,
  Search,
  FileText,
  Calendar,
  User,
  Eye,
  GripVertical,
  Zap,
  AlertCircle,
  Activity,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useChatContextStore } from "@/store/chatContextStore";

// ============================================
// INTERFACES
// ============================================

interface Risk {
  id: string;
  value: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  probability: "low" | "medium" | "high";
  validated: boolean | null;
  relatedPerson: string;
  createdAt: string;
  meetingTitle: string;
  meetingDate: string;
  meetingId: string;
  impact?: string;
  confidence: number;
  hasMitigation: boolean; // Tem Tasks de mitigação vinculadas?
  context: "mine" | "area" | "subordinates" | "projects" | "critical";
  linkedProjects?: { id: string; name: string }[];
  linkedOkrs?: { id: string; name: string }[];
  estimatedImpact?: string;
  timeframe?: string; // "immediate" | "short-term" | "medium-term" | "long-term"
}

type ContextFilter = "all" | "mine" | "area" | "subordinates" | "projects" | "critical";
type SeverityFilter = "all" | "critical" | "high" | "medium" | "low";
type StatusFilter = "all" | "awaiting_validation" | "without_mitigation" | "mitigating";

// ============================================
// MOCK DATA
// ============================================

const MOCK_RISKS: Risk[] = [
  {
    id: "risk-1",
    value: "Atraso crítico na entrega do projeto EKS",
    description: "Dependências externas não foram entregues, impactando toda a Sprint 2",
    severity: "critical",
    probability: "high",
    validated: null,
    relatedPerson: "Carlos Silva",
    createdAt: "2025-02-08T10:00:00Z",
    meetingTitle: "Reunião Q1 - Planejamento",
    meetingDate: "2025-02-08",
    meetingId: "meeting-1",
    impact: "Bloqueio completo do desenvolvimento",
    confidence: 0.92,
    hasMitigation: false,
    context: "critical",
    timeframe: "immediate",
    linkedProjects: [{ id: "proj-1", name: "Implementação EKS" }],
  },
  {
    id: "risk-2",
    value: "Perda de talentos-chave do time de desenvolvimento",
    description: "3 desenvolvedores sênior demonstraram interesse em outras oportunidades",
    severity: "high",
    probability: "medium",
    validated: true,
    relatedPerson: "Maria Santos",
    createdAt: "2025-02-07T14:30:00Z",
    meetingTitle: "Reunião de Recursos Humanos",
    meetingDate: "2025-02-07",
    meetingId: "meeting-2",
    impact: "Impacto significativo na capacidade de entrega",
    confidence: 0.85,
    hasMitigation: false,
    context: "area",
    timeframe: "short-term",
    estimatedImpact: "Redução de 40% na velocidade de desenvolvimento",
  },
  {
    id: "risk-3",
    value: "Sobrecarga de infraestrutura em picos de uso",
    description: "Sistema pode não suportar aumento esperado de 300% no Q2",
    severity: "high",
    probability: "medium",
    validated: true,
    relatedPerson: "João Pedro",
    createdAt: "2025-02-06T15:00:00Z",
    meetingTitle: "Reunião Técnica",
    meetingDate: "2025-02-06",
    meetingId: "meeting-3",
    confidence: 0.78,
    hasMitigation: true,
    context: "projects",
    timeframe: "medium-term",
    linkedProjects: [{ id: "proj-2", name: "Automação de Processos" }],
  },
  {
    id: "risk-4",
    value: "Mudança regulatória pode impactar roadmap",
    description: "Nova legislação sobre privacidade de dados em discussão",
    severity: "medium",
    probability: "low",
    validated: null,
    relatedPerson: "Ana Costa",
    createdAt: "2025-02-05T11:00:00Z",
    meetingTitle: "Reunião de Compliance",
    meetingDate: "2025-02-05",
    meetingId: "meeting-4",
    impact: "Pode exigir refatoração de módulos críticos",
    confidence: 0.65,
    hasMitigation: false,
    context: "critical",
    timeframe: "long-term",
  },
  {
    id: "risk-5",
    value: "Dependência de fornecedor único para componente crítico",
    description: "Vendor pode aumentar preços ou alterar termos no próximo contrato",
    severity: "medium",
    probability: "medium",
    validated: true,
    relatedPerson: "Pedro Alves",
    createdAt: "2025-02-09T09:00:00Z",
    meetingTitle: "Reunião de Fornecedores",
    meetingDate: "2025-02-09",
    meetingId: "meeting-5",
    confidence: 0.72,
    hasMitigation: true,
    context: "subordinates",
    timeframe: "medium-term",
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

const getSeverityConfig = (severity: Risk["severity"]) => {
  switch (severity) {
    case "critical":
      return {
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950/30",
        borderColor: "border-red-300 dark:border-red-800",
        badgeColor: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        icon: Flame,
        label: "Crítico",
      };
    case "high":
      return {
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950/30",
        borderColor: "border-orange-300 dark:border-orange-800",
        badgeColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        icon: AlertTriangle,
        label: "Alto",
      };
    case "medium":
      return {
        color: "text-amber-600",
        bgColor: "bg-amber-50 dark:bg-amber-950/30",
        borderColor: "border-amber-300 dark:border-amber-800",
        badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        icon: AlertCircle,
        label: "Médio",
      };
    case "low":
      return {
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950/30",
        borderColor: "border-blue-300 dark:border-blue-800",
        badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        icon: Shield,
        label: "Baixo",
      };
  }
};

const getProbabilityConfig = (probability: Risk["probability"]) => {
  switch (probability) {
    case "high":
      return { label: "Alta", percentage: 75, color: "text-red-600" };
    case "medium":
      return { label: "Média", percentage: 50, color: "text-orange-600" };
    case "low":
      return { label: "Baixa", percentage: 25, color: "text-blue-600" };
  }
};

const getTimeframeConfig = (timeframe?: string) => {
  switch (timeframe) {
    case "immediate":
      return { label: "Imediato", icon: Zap, color: "text-red-600" };
    case "short-term":
      return { label: "Curto Prazo", icon: Clock, color: "text-orange-600" };
    case "medium-term":
      return { label: "Médio Prazo", icon: Calendar, color: "text-amber-600" };
    case "long-term":
      return { label: "Longo Prazo", icon: TrendingUp, color: "text-blue-600" };
    default:
      return { label: "Não definido", icon: Clock, color: "text-muted-foreground" };
  }
};

// ============================================
// COMPONENT
// ============================================

export function ExecutiveRisksView() {
  const { user } = useAuthStore();
  const { addContextItem } = useChatContextStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [contextFilter, setContextFilter] = useState<ContextFilter>("all");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        console.error("Failed to load risks:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [contextFilter, severityFilter, statusFilter]);

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
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Filtrar riscos
  const filteredRisks = MOCK_RISKS.filter((risk) => {
    const matchesSearch =
      risk.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      risk.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      risk.relatedPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      risk.meetingTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesContext = contextFilter === "all" || risk.context === contextFilter;
    const matchesSeverity = severityFilter === "all" || risk.severity === severityFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "awaiting_validation" && risk.validated === null) ||
      (statusFilter === "without_mitigation" && risk.validated === true && !risk.hasMitigation) ||
      (statusFilter === "mitigating" && risk.hasMitigation);

    return matchesSearch && matchesContext && matchesSeverity && matchesStatus;
  });

  // Ordenar: críticos primeiro, depois por severidade e probabilidade
  const sortedRisks = [...filteredRisks].sort((a, b) => {
    // Priorizar aguardando validação
    if (a.validated === null && b.validated !== null) return -1;
    if (a.validated !== null && b.validated === null) return 1;

    // Priorizar sem mitigação
    if (!a.hasMitigation && b.hasMitigation) return -1;
    if (a.hasMitigation && !b.hasMitigation) return 1;

    // Ordenar por severidade (critical > high > medium > low)
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[b.severity] - severityOrder[a.severity];
    }

    // Depois por probabilidade (high > medium > low)
    const probOrder = { high: 3, medium: 2, low: 1 };
    if (probOrder[a.probability] !== probOrder[b.probability]) {
      return probOrder[b.probability] - probOrder[a.probability];
    }

    // Por fim, por data (mais recentes primeiro)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Estatísticas
  const stats = {
    total: MOCK_RISKS.length,
    critical: MOCK_RISKS.filter((r) => r.severity === "critical").length,
    high: MOCK_RISKS.filter((r) => r.severity === "high").length,
    awaitingValidation: MOCK_RISKS.filter((r) => r.validated === null).length,
    withoutMitigation: MOCK_RISKS.filter((r) => r.validated === true && !r.hasMitigation).length,
    byContext: {
      mine: MOCK_RISKS.filter((r) => r.context === "mine").length,
      area: MOCK_RISKS.filter((r) => r.context === "area").length,
      subordinates: MOCK_RISKS.filter((r) => r.context === "subordinates").length,
      projects: MOCK_RISKS.filter((r) => r.context === "projects").length,
      critical: MOCK_RISKS.filter((r) => r.context === "critical").length,
    },
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/30">
        <div className="animate-pulse text-muted-foreground">Carregando riscos...</div>
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
              <AlertTriangle className="w-7 h-7 text-red-600" />
              Riscos Emergentes
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Riscos críticos e bloqueios que precisam de atenção imediata
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-red-600">{filteredRisks.length}</div>
            <div className="text-xs text-muted-foreground">riscos encontrados</div>
            {stats.critical > 0 && (
              <div className="text-xs text-red-600 font-semibold mt-1">
                {stats.critical} crítico{stats.critical > 1 ? "s" : ""}
              </div>
            )}
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
              { value: "mine", label: "Meus" },
              { value: "area", label: "Minha Área" },
              { value: "subordinates", label: "Subordinados" },
              { value: "projects", label: "Meus Projetos" },
              { value: "critical", label: "Críticos" },
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

          {/* Filtros de Severidade */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">Severidade:</span>
            {[
              { value: "all" as SeverityFilter, label: "Todas", count: stats.total },
              { value: "critical", label: "Crítico", count: stats.critical },
              { value: "high", label: "Alto", count: stats.high },
              { value: "medium", label: "Médio", count: MOCK_RISKS.filter((r) => r.severity === "medium").length },
              { value: "low", label: "Baixo", count: MOCK_RISKS.filter((r) => r.severity === "low").length },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSeverityFilter(filter.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2",
                  severityFilter === filter.value
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}
              >
                {filter.label}
                {filter.count > 0 && (
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-full text-xs",
                      severityFilter === filter.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted-foreground/20"
                    )}
                  >
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Filtros de Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">Status:</span>
            {[
              { value: "all" as StatusFilter, label: "Todos", count: stats.total },
              { value: "awaiting_validation", label: "Aguardando Validação", count: stats.awaitingValidation },
              { value: "without_mitigation", label: "Sem Mitigação", count: stats.withoutMitigation },
              {
                value: "mitigating" as StatusFilter,
                label: "Em Mitigação",
                count: MOCK_RISKS.filter((r) => r.hasMitigation).length,
              },
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
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-full text-xs",
                      statusFilter === filter.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted-foreground/20"
                    )}
                  >
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
        {sortedRisks.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-medium text-muted-foreground">Nenhum risco encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tente ajustar os filtros ou buscar por outros termos
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedRisks.map((risk) => {
              const isExpanded = expandedId === risk.id;
              const isDragging = draggedId === risk.id;
              const severityConfig = getSeverityConfig(risk.severity);
              const probabilityConfig = getProbabilityConfig(risk.probability);
              const timeframeConfig = getTimeframeConfig(risk.timeframe);
              const SeverityIcon = severityConfig.icon;

              const handleDragStart = (e: React.DragEvent) => {
                setDraggedId(risk.id);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData(
                  "application/json",
                  JSON.stringify({
                    type: "risk",
                    id: risk.id,
                    title: risk.value,
                    description: risk.description,
                    metadata: {
                      relatedPerson: risk.relatedPerson,
                      meetingTitle: risk.meetingTitle,
                      meetingDate: risk.meetingDate,
                      severity: risk.severity,
                      probability: risk.probability,
                      impact: risk.impact,
                      confidence: risk.confidence,
                      validated: risk.validated,
                      hasMitigation: risk.hasMitigation,
                    },
                  })
                );
              };

              const handleDragEnd = () => {
                setDraggedId(null);
              };

              return (
                <div
                  key={risk.id}
                  draggable
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "rounded-xl border-2 bg-card/80 backdrop-blur transition-all overflow-hidden cursor-move",
                    severityConfig.borderColor,
                    isDragging && "opacity-50 scale-95",
                    risk.severity === "critical" && "shadow-lg shadow-red-500/20"
                  )}
                >
                  {/* Card Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : risk.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 cursor-grab active:cursor-grabbing" onMouseDown={(e) => e.stopPropagation()}>
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                      </div>

                      {/* Ícone de Severidade */}
                      <div className={cn("p-3 rounded-lg shrink-0", severityConfig.bgColor)}>
                        <SeverityIcon className={cn("w-6 h-6", severityConfig.color)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-base flex-1">{risk.value}</h3>
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Badges */}
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", severityConfig.badgeColor)}>
                              {severityConfig.label}
                            </span>
                            {risk.validated === null && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-medium">
                                Aguardando Validação
                              </span>
                            )}
                            {risk.validated === true && !risk.hasMitigation && (
                              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs font-medium">
                                Sem Mitigação
                              </span>
                            )}
                            {risk.hasMitigation && (
                              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium">
                                Em Mitigação
                              </span>
                            )}
                            <ChevronRight
                              className={cn(
                                "w-4 h-4 text-muted-foreground transition-transform",
                                isExpanded && "rotate-90"
                              )}
                            />
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{risk.description}</p>

                        {/* Indicadores Visuais */}
                        <div className="flex items-center gap-4 flex-wrap">
                          {/* Probabilidade */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Probabilidade:</span>
                              <span className={cn("text-xs font-semibold", probabilityConfig.color)}>
                                {probabilityConfig.label} ({probabilityConfig.percentage}%)
                              </span>
                            </div>
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  probabilityConfig.color.replace("text-", "bg-")
                                )}
                                style={{ width: `${probabilityConfig.percentage}%` }}
                              />
                            </div>
                          </div>

                          {/* Timeframe */}
                          {risk.timeframe && (
                            <div className="flex items-center gap-1.5">
                              {timeframeConfig.icon && (
                                <timeframeConfig.icon className={cn("w-3.5 h-3.5", timeframeConfig.color)} />
                              )}
                              <span className={cn("text-xs font-medium", timeframeConfig.color)}>
                                {timeframeConfig.label}
                              </span>
                            </div>
                          )}

                          {/* Meta Info */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground ml-auto">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <strong className="text-foreground/80">{risk.relatedPerson}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(risk.meetingDate)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {Math.round(risk.confidence * 100)}% confiança
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-border bg-muted/20">
                      <div className="pt-4 space-y-4">
                        {/* Impact */}
                        {risk.impact && (
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                              <TrendingDown className="w-3 h-3" />
                              Impacto
                            </h4>
                            <p className="text-sm bg-muted/50 p-3 rounded-lg">{risk.impact}</p>
                          </div>
                        )}

                        {/* Estimated Impact */}
                        {risk.estimatedImpact && (
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                              <Activity className="w-3 h-3" />
                              Impacto Estimado
                            </h4>
                            <p className="text-sm bg-muted/50 p-3 rounded-lg">{risk.estimatedImpact}</p>
                          </div>
                        )}

                        {/* Matriz de Risco Visual */}
                        <div className="p-3 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 border border-border">
                          <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            Matriz de Risco
                          </h4>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center p-2 rounded bg-background/50">
                              <div className="font-semibold text-muted-foreground">Severidade</div>
                              <div className={cn("mt-1 font-bold", severityConfig.color)}>
                                {severityConfig.label}
                              </div>
                            </div>
                            <div className="text-center p-2 rounded bg-background/50">
                              <div className="font-semibold text-muted-foreground">Probabilidade</div>
                              <div className={cn("mt-1 font-bold", probabilityConfig.color)}>
                                {probabilityConfig.label}
                              </div>
                            </div>
                            <div className="text-center p-2 rounded bg-background/50">
                              <div className="font-semibold text-muted-foreground">Prioridade</div>
                              <div
                                className={cn(
                                  "mt-1 font-bold",
                                  risk.severity === "critical" || risk.probability === "high"
                                    ? "text-red-600"
                                    : risk.severity === "high" || risk.probability === "medium"
                                    ? "text-orange-600"
                                    : "text-amber-600"
                                )}
                              >
                                {risk.severity === "critical" || risk.probability === "high"
                                  ? "Alta"
                                  : risk.severity === "high" || risk.probability === "medium"
                                  ? "Média"
                                  : "Baixa"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Linked Projects/OKRs */}
                        {(risk.linkedProjects?.length || risk.linkedOkrs?.length) && (
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                              <FolderKanban className="w-3 h-3" />
                              Afeta
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {risk.linkedProjects?.map((project) => (
                                <span
                                  key={project.id}
                                  className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium"
                                >
                                  {project.name}
                                </span>
                              ))}
                              {risk.linkedOkrs?.map((okr) => (
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

                        {/* Proveniência */}
                        <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                          <h4 className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Proveniência
                          </h4>
                          <div className="space-y-1 text-xs text-purple-600 dark:text-purple-400">
                            <div>
                              <strong>Reunião:</strong> {risk.meetingTitle}
                            </div>
                            <div>
                              <strong>Data:</strong> {formatDateTime(risk.createdAt)}
                            </div>
                            <div>
                              <strong>Identificado por:</strong> {risk.relatedPerson}
                            </div>
                            <div>
                              <strong>Confiança da extração:</strong> {Math.round(risk.confidence * 100)}%
                            </div>
                            <div>
                              <strong>ID da reunião:</strong> {risk.meetingId}
                            </div>
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

