"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Filter,
  Search,
  FileText,
  Calendar,
  User,
  Eye,
  GripVertical,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart3,
  FolderKanban,
  Flame,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useChatContextStore } from "@/store/chatContextStore";

// ============================================
// INTERFACES
// ============================================

interface KeyResult {
  id: string;
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  trend: "up" | "down" | "stable";
  trendValue?: number; // % de variação recente
  ownerName: string;
}

interface OKR {
  id: string;
  objective: string;
  description: string;
  status: "on_track" | "at_risk" | "behind" | "critical";
  progress: number; // 0-100
  ownerName: string;
  department: string;
  deadline: string;
  quarter: string;
  keyResults: KeyResult[];
  confidence: number;
  context: "mine" | "area" | "subordinates" | "projects" | "critical";
  linkedProjects?: { id: string; name: string }[];
  linkedDecisions?: { id: string; value: string }[];
  linkedRisks?: { id: string; value: string }[];
  lastUpdate?: string;
  daysToDeadline: number;
  meetingSource?: string;
}

type ContextFilter = "all" | "mine" | "area" | "subordinates" | "projects" | "critical";
type StatusFilter = "all" | "critical" | "behind" | "at_risk" | "on_track";

// ============================================
// MOCK DATA
// ============================================

const MOCK_OKRS: OKR[] = [
  {
    id: "okr-1",
    objective: "Aumentar receita recorrente em 40%",
    description: "Crescimento agressivo de MRR via upsell e novos clientes enterprise",
    status: "critical",
    progress: 18,
    ownerName: "Carlos Silva",
    department: "Comercial",
    deadline: "2025-06-30",
    quarter: "Q2 2025",
    confidence: 0.35,
    context: "mine",
    daysToDeadline: 142,
    lastUpdate: "2025-02-07",
    linkedProjects: [
      { id: "proj-1", name: "Implementação EKS" },
      { id: "proj-3", name: "Plataforma Enterprise" },
    ],
    linkedRisks: [{ id: "risk-2", value: "Perda de talentos-chave" }],
    keyResults: [
      {
        id: "kr-1a",
        title: "Atingir R$ 2M de MRR",
        currentValue: 1.2,
        targetValue: 2.0,
        unit: "M",
        trend: "up",
        trendValue: 5.2,
        ownerName: "Carlos Silva",
      },
      {
        id: "kr-1b",
        title: "Fechar 15 contratos Enterprise",
        currentValue: 3,
        targetValue: 15,
        unit: "contratos",
        trend: "down",
        trendValue: -12,
        ownerName: "Ana Luiza",
      },
      {
        id: "kr-1c",
        title: "Reduzir churn para < 3%",
        currentValue: 5.8,
        targetValue: 3.0,
        unit: "%",
        trend: "up",
        trendValue: -0.5,
        ownerName: "Marcos Vieira",
      },
    ],
  },
  {
    id: "okr-2",
    objective: "Reduzir time-to-market de features em 50%",
    description: "Otimização do pipeline de desenvolvimento e eliminação de gargalos",
    status: "behind",
    progress: 32,
    ownerName: "Maria Santos",
    department: "Engenharia",
    deadline: "2025-06-30",
    quarter: "Q2 2025",
    confidence: 0.52,
    context: "area",
    daysToDeadline: 142,
    lastUpdate: "2025-02-08",
    linkedProjects: [{ id: "proj-2", name: "Automação de Processos" }],
    linkedDecisions: [{ id: "dec-2", value: "Expandir time de desenvolvimento em 3 pessoas" }],
    keyResults: [
      {
        id: "kr-2a",
        title: "Lead time médio < 5 dias",
        currentValue: 12,
        targetValue: 5,
        unit: "dias",
        trend: "down",
        trendValue: -8,
        ownerName: "Maria Santos",
      },
      {
        id: "kr-2b",
        title: "Cobertura de testes > 80%",
        currentValue: 62,
        targetValue: 80,
        unit: "%",
        trend: "up",
        trendValue: 3,
        ownerName: "Pedro Alves",
      },
      {
        id: "kr-2c",
        title: "Deploy automatizado em 100% dos repos",
        currentValue: 45,
        targetValue: 100,
        unit: "%",
        trend: "up",
        trendValue: 10,
        ownerName: "João Pedro",
      },
    ],
  },
  {
    id: "okr-3",
    objective: "Alcançar NPS > 75 no produto",
    description: "Melhorar experiência do usuário com foco em onboarding e suporte",
    status: "at_risk",
    progress: 58,
    ownerName: "Ana Costa",
    department: "Produto",
    deadline: "2025-03-31",
    quarter: "Q1 2025",
    confidence: 0.68,
    context: "subordinates",
    daysToDeadline: 49,
    lastUpdate: "2025-02-09",
    linkedProjects: [{ id: "proj-4", name: "Redesign UX" }],
    keyResults: [
      {
        id: "kr-3a",
        title: "NPS atual",
        currentValue: 62,
        targetValue: 75,
        unit: "pontos",
        trend: "up",
        trendValue: 4,
        ownerName: "Ana Costa",
      },
      {
        id: "kr-3b",
        title: "Tempo médio de onboarding < 3 min",
        currentValue: 4.2,
        targetValue: 3.0,
        unit: "min",
        trend: "stable",
        ownerName: "Lucia Fernandes",
      },
      {
        id: "kr-3c",
        title: "Tickets de suporte / mês < 50",
        currentValue: 78,
        targetValue: 50,
        unit: "tickets",
        trend: "down",
        trendValue: -5,
        ownerName: "Roberto Lima",
      },
    ],
  },
  {
    id: "okr-4",
    objective: "Implementar governança de dados corporativa",
    description: "Framework de data governance com políticas de qualidade e compliance",
    status: "at_risk",
    progress: 45,
    ownerName: "João Pedro",
    department: "Tecnologia",
    deadline: "2025-06-30",
    quarter: "Q2 2025",
    confidence: 0.60,
    context: "projects",
    daysToDeadline: 142,
    lastUpdate: "2025-02-06",
    linkedDecisions: [{ id: "dec-3", value: "Mudar estratégia de pricing para Q2" }],
    linkedRisks: [{ id: "risk-4", value: "Mudança regulatória pode impactar roadmap" }],
    keyResults: [
      {
        id: "kr-4a",
        title: "Catalogar 100% dos datasets críticos",
        currentValue: 55,
        targetValue: 100,
        unit: "%",
        trend: "up",
        trendValue: 8,
        ownerName: "João Pedro",
      },
      {
        id: "kr-4b",
        title: "Score de qualidade de dados > 90",
        currentValue: 72,
        targetValue: 90,
        unit: "pontos",
        trend: "stable",
        ownerName: "Fernanda Reis",
      },
    ],
  },
  {
    id: "okr-5",
    objective: "Expandir operações para 2 novos mercados",
    description: "Entrada estratégica em LATAM e Europa com parceiros locais",
    status: "on_track",
    progress: 72,
    ownerName: "Pedro Alves",
    department: "Operações",
    deadline: "2025-06-30",
    quarter: "Q2 2025",
    confidence: 0.82,
    context: "critical",
    daysToDeadline: 142,
    lastUpdate: "2025-02-09",
    linkedProjects: [{ id: "proj-5", name: "Expansão LATAM" }],
    keyResults: [
      {
        id: "kr-5a",
        title: "Parceiros fechados",
        currentValue: 3,
        targetValue: 4,
        unit: "parceiros",
        trend: "up",
        trendValue: 1,
        ownerName: "Pedro Alves",
      },
      {
        id: "kr-5b",
        title: "Revenue pipeline mercados novos",
        currentValue: 320,
        targetValue: 500,
        unit: "K",
        trend: "up",
        trendValue: 15,
        ownerName: "Marina Costa",
      },
    ],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

const getStatusConfig = (status: OKR["status"]) => {
  switch (status) {
    case "critical":
      return {
        label: "Crítico",
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950/30",
        borderColor: "border-red-300 dark:border-red-800",
        badgeColor: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
        progressColor: "bg-red-500",
        icon: Flame,
      };
    case "behind":
      return {
        label: "Atrasado",
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950/30",
        borderColor: "border-orange-300 dark:border-orange-800",
        badgeColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
        progressColor: "bg-orange-500",
        icon: TrendingDown,
      };
    case "at_risk":
      return {
        label: "Em Risco",
        color: "text-amber-600",
        bgColor: "bg-amber-50 dark:bg-amber-950/30",
        borderColor: "border-amber-300 dark:border-amber-800",
        badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
        progressColor: "bg-amber-500",
        icon: AlertTriangle,
      };
    case "on_track":
      return {
        label: "No Prazo",
        color: "text-emerald-600",
        bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
        borderColor: "border-emerald-300 dark:border-emerald-800",
        badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
        progressColor: "bg-emerald-500",
        icon: CheckCircle2,
      };
  }
};

const getTrendIcon = (trend: "up" | "down" | "stable") => {
  switch (trend) {
    case "up":
      return ArrowUpRight;
    case "down":
      return ArrowDownRight;
    case "stable":
      return Minus;
  }
};

// ============================================
// COMPONENT
// ============================================

export function ExecutiveOKRsView() {
  const { user } = useAuthStore();
  const { addContextItem } = useChatContextStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [contextFilter, setContextFilter] = useState<ContextFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        console.error("Failed to load OKRs:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [contextFilter, statusFilter]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Filtrar OKRs
  const filteredOKRs = MOCK_OKRS.filter((okr) => {
    const matchesSearch =
      okr.objective.toLowerCase().includes(searchQuery.toLowerCase()) ||
      okr.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      okr.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      okr.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesContext = contextFilter === "all" || okr.context === contextFilter;
    const matchesStatus = statusFilter === "all" || okr.status === statusFilter;

    return matchesSearch && matchesContext && matchesStatus;
  });

  // Ordenar: critical > behind > at_risk > on_track, depois por progresso
  const sortedOKRs = [...filteredOKRs].sort((a, b) => {
    const statusOrder = { critical: 4, behind: 3, at_risk: 2, on_track: 1 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[b.status] - statusOrder[a.status];
    }
    // Menos progresso primeiro (mais urgente)
    return a.progress - b.progress;
  });

  // Estatísticas
  const stats = useMemo(() => {
    const allKRs = MOCK_OKRS.flatMap((o) => o.keyResults);
    const avgProgress = Math.round(MOCK_OKRS.reduce((sum, o) => sum + o.progress, 0) / MOCK_OKRS.length);
    const avgConfidence = Math.round(
      (MOCK_OKRS.reduce((sum, o) => sum + o.confidence, 0) / MOCK_OKRS.length) * 100
    );

    return {
      total: MOCK_OKRS.length,
      critical: MOCK_OKRS.filter((o) => o.status === "critical").length,
      behind: MOCK_OKRS.filter((o) => o.status === "behind").length,
      atRisk: MOCK_OKRS.filter((o) => o.status === "at_risk").length,
      onTrack: MOCK_OKRS.filter((o) => o.status === "on_track").length,
      avgProgress,
      avgConfidence,
      totalKRs: allKRs.length,
      krsOnTrack: allKRs.filter((kr) => (kr.currentValue / kr.targetValue) * 100 >= 60).length,
      byContext: {
        mine: MOCK_OKRS.filter((o) => o.context === "mine").length,
        area: MOCK_OKRS.filter((o) => o.context === "area").length,
        subordinates: MOCK_OKRS.filter((o) => o.context === "subordinates").length,
        projects: MOCK_OKRS.filter((o) => o.context === "projects").length,
        critical: MOCK_OKRS.filter((o) => o.context === "critical").length,
      },
    };
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/30">
        <div className="animate-pulse text-muted-foreground">Carregando OKRs...</div>
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
              <Target className="w-7 h-7 text-amber-600" />
              OKRs em Risco
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Objetivos e resultados-chave que demandam atenção executiva
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-amber-600">{filteredOKRs.length}</div>
            <div className="text-xs text-muted-foreground">OKRs monitorados</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por objetivo, responsável ou departamento..."
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
              { value: "all" as ContextFilter, label: "Todos" },
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

          {/* Filtros de Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">Status:</span>
            {[
              { value: "all" as StatusFilter, label: "Todos", count: stats.total },
              { value: "critical", label: "Crítico", count: stats.critical },
              { value: "behind", label: "Atrasado", count: stats.behind },
              { value: "at_risk", label: "Em Risco", count: stats.atRisk },
              { value: "on_track", label: "No Prazo", count: stats.onTrack },
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

      {/* Tiles de Resumo */}
      <div className="px-6 pt-5 pb-0">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Progresso Médio - Tile maior com gauge visual */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center justify-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Progresso Médio</span>
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32" cy="32" r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-muted/30"
                />
                <circle
                  cx="32" cy="32" r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeDasharray={`${(stats.avgProgress / 100) * 175.9} 175.9`}
                  strokeLinecap="round"
                  className={cn(
                    stats.avgProgress >= 60
                      ? "text-emerald-500"
                      : stats.avgProgress >= 40
                      ? "text-amber-500"
                      : "text-red-500"
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold">{stats.avgProgress}%</span>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground">geral dos OKRs</span>
          </div>

          {/* Confiança Média */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center justify-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Confiança</span>
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32" cy="32" r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-muted/30"
                />
                <circle
                  cx="32" cy="32" r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeDasharray={`${(stats.avgConfidence / 100) * 175.9} 175.9`}
                  strokeLinecap="round"
                  className={cn(
                    stats.avgConfidence >= 70
                      ? "text-emerald-500"
                      : stats.avgConfidence >= 50
                      ? "text-amber-500"
                      : "text-red-500"
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold">{stats.avgConfidence}%</span>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground">de atingimento</span>
          </div>

          {/* Críticos */}
          <div className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-red-600">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-medium">Críticos</span>
            </div>
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.critical}</div>
            <span className="text-[10px] text-red-600/70">risco de não entrega</span>
          </div>

          {/* Atrasados */}
          <div className="rounded-xl border border-orange-300 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20 p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-orange-600">
              <TrendingDown className="w-4 h-4" />
              <span className="text-xs font-medium">Atrasados</span>
            </div>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">{stats.behind}</div>
            <span className="text-[10px] text-orange-600/70">abaixo da meta esperada</span>
          </div>

          {/* Em Risco */}
          <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-medium">Em Risco</span>
            </div>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.atRisk}</div>
            <span className="text-[10px] text-amber-600/70">requerem acompanhamento</span>
          </div>

          {/* Key Results */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs font-medium">Key Results</span>
            </div>
            <div className="text-2xl font-bold">
              {stats.krsOnTrack}<span className="text-sm font-normal text-muted-foreground">/{stats.totalKRs}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">no caminho certo</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {sortedOKRs.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-medium text-muted-foreground">Nenhum OKR encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tente ajustar os filtros ou buscar por outros termos
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedOKRs.map((okr) => {
              const isExpanded = expandedId === okr.id;
              const isDragging = draggedId === okr.id;
              const statusConfig = getStatusConfig(okr.status);
              const StatusIcon = statusConfig.icon;

              const handleDragStart = (e: React.DragEvent) => {
                setDraggedId(okr.id);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData(
                  "application/json",
                  JSON.stringify({
                    type: "okr",
                    id: okr.id,
                    title: okr.objective,
                    description: okr.description,
                    metadata: {
                      ownerName: okr.ownerName,
                      department: okr.department,
                      status: okr.status,
                      progress: okr.progress,
                      confidence: okr.confidence,
                      quarter: okr.quarter,
                      daysToDeadline: okr.daysToDeadline,
                      keyResults: okr.keyResults.length,
                    },
                  })
                );
              };

              const handleDragEnd = () => {
                setDraggedId(null);
              };

              return (
                <div
                  key={okr.id}
                  draggable
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "rounded-xl border-2 bg-card/80 backdrop-blur transition-all overflow-hidden cursor-move",
                    statusConfig.borderColor,
                    isDragging && "opacity-50 scale-95",
                    okr.status === "critical" && "shadow-lg shadow-red-500/20"
                  )}
                >
                  {/* Card Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : okr.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 cursor-grab active:cursor-grabbing" onMouseDown={(e) => e.stopPropagation()}>
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                      </div>

                      {/* Status Icon */}
                      <div className={cn("p-3 rounded-lg shrink-0", statusConfig.bgColor)}>
                        <StatusIcon className={cn("w-6 h-6", statusConfig.color)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-base">{okr.objective}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">{okr.department}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{okr.quarter}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusConfig.badgeColor)}>
                              {statusConfig.label}
                            </span>
                            {okr.daysToDeadline <= 30 && (
                              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {okr.daysToDeadline}d
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

                        <p className="text-sm text-muted-foreground mb-3 line-clamp-1">{okr.description}</p>

                        {/* Progress Bar + Info */}
                        <div className="space-y-2">
                          {/* Barra de Progresso Principal */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all duration-500", statusConfig.progressColor)}
                                style={{ width: `${okr.progress}%` }}
                              />
                            </div>
                            <span className={cn("text-sm font-bold min-w-[3rem] text-right", statusConfig.color)}>
                              {okr.progress}%
                            </span>
                          </div>

                          {/* Meta Info Row */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <strong className="text-foreground/80">{okr.ownerName}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              até {formatDate(okr.deadline)}
                            </span>
                            <span className="flex items-center gap-1">
                              <BarChart3 className="w-3 h-3" />
                              {okr.keyResults.length} Key Results
                            </span>
                            <span className="flex items-center gap-1 ml-auto">
                              <Gauge className="w-3 h-3" />
                              {Math.round(okr.confidence * 100)}% confiança
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
                        {/* Key Results */}
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" />
                            Key Results
                          </h4>
                          <div className="space-y-3">
                            {okr.keyResults.map((kr) => {
                              const krProgress = Math.min(
                                Math.round((kr.currentValue / kr.targetValue) * 100),
                                100
                              );
                              // Para métricas invertidas (ex: churn, lead time, tickets)
                              const isInverseMetric = kr.unit === "%" && kr.targetValue < kr.currentValue
                                || kr.unit === "dias" && kr.targetValue < kr.currentValue
                                || kr.unit === "tickets" && kr.targetValue < kr.currentValue
                                || kr.unit === "min" && kr.targetValue < kr.currentValue;

                              const krColor = isInverseMetric
                                ? krProgress <= 80
                                  ? "bg-emerald-500"
                                  : krProgress <= 120
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                                : krProgress >= 60
                                ? "bg-emerald-500"
                                : krProgress >= 40
                                ? "bg-amber-500"
                                : "bg-red-500";

                              const TrendIcon = getTrendIcon(kr.trend);

                              return (
                                <div
                                  key={kr.id}
                                  className="p-3 rounded-lg bg-background/80 border border-border"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium flex-1">{kr.title}</span>
                                    <div className="flex items-center gap-2">
                                      {kr.trendValue !== undefined && (
                                        <span
                                          className={cn(
                                            "flex items-center gap-0.5 text-xs font-medium",
                                            kr.trend === "up" && !isInverseMetric
                                              ? "text-emerald-600"
                                              : kr.trend === "down" && isInverseMetric
                                              ? "text-emerald-600"
                                              : kr.trend === "stable"
                                              ? "text-muted-foreground"
                                              : "text-red-600"
                                          )}
                                        >
                                          <TrendIcon className="w-3 h-3" />
                                          {kr.trendValue > 0 ? "+" : ""}
                                          {kr.trendValue}
                                          {kr.unit === "%" ? "pp" : ""}
                                        </span>
                                      )}
                                      <span className="text-sm font-bold">
                                        {kr.currentValue}
                                        <span className="text-muted-foreground font-normal">
                                          /{kr.targetValue} {kr.unit}
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                      <div
                                        className={cn(
                                          "h-full rounded-full transition-all",
                                          krColor
                                        )}
                                        style={{
                                          width: `${Math.min(krProgress, 100)}%`,
                                        }}
                                      />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground min-w-[3rem] text-right">
                                      {krProgress}%
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                      • {kr.ownerName}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Timeline / Prazo */}
                        <div className="p-3 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 border border-border">
                          <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Timeline
                          </h4>
                          <div className="flex items-center justify-between text-xs">
                            <div>
                              <span className="text-muted-foreground">Deadline:</span>{" "}
                              <strong>{formatDate(okr.deadline)}</strong>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Restam:</span>{" "}
                              <strong
                                className={cn(
                                  okr.daysToDeadline <= 30
                                    ? "text-red-600"
                                    : okr.daysToDeadline <= 60
                                    ? "text-amber-600"
                                    : "text-foreground"
                                )}
                              >
                                {okr.daysToDeadline} dias
                              </strong>
                            </div>
                            {okr.lastUpdate && (
                              <div>
                                <span className="text-muted-foreground">Última atualização:</span>{" "}
                                <strong>{formatDate(okr.lastUpdate)}</strong>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Linked Items */}
                        {(okr.linkedProjects?.length || okr.linkedDecisions?.length || okr.linkedRisks?.length) && (
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                              <FolderKanban className="w-3 h-3" />
                              Elementos Vinculados
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {okr.linkedProjects?.map((p) => (
                                <span
                                  key={p.id}
                                  className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium flex items-center gap-1"
                                >
                                  <FolderKanban className="w-3 h-3" />
                                  {p.name}
                                </span>
                              ))}
                              {okr.linkedDecisions?.map((d) => (
                                <span
                                  key={d.id}
                                  className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-medium flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  {d.value}
                                </span>
                              ))}
                              {okr.linkedRisks?.map((r) => (
                                <span
                                  key={r.id}
                                  className="px-2 py-1 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-medium flex items-center gap-1"
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                  {r.value}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Proveniência */}
                        {okr.meetingSource && (
                          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                            <h4 className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              Proveniência
                            </h4>
                            <p className="text-xs text-purple-600 dark:text-purple-400">{okr.meetingSource}</p>
                          </div>
                        )}
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

