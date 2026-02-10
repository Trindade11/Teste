"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  FolderKanban,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Filter,
  Search,
  FileText,
  Calendar,
  User,
  GripVertical,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Users,
  Milestone,
  Ban,
  Zap,
  DollarSign,
  Flame,
  ShieldAlert,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useChatContextStore } from "@/store/chatContextStore";

// ============================================
// INTERFACES
// ============================================

interface ProjectMilestone {
  id: string;
  title: string;
  dueDate: string;
  status: "completed" | "in_progress" | "delayed" | "blocked";
}

interface ProjectMember {
  name: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: "on_track" | "at_risk" | "delayed" | "blocked" | "critical";
  phase: string;
  progress: number;
  ownerName: string;
  department: string;
  startDate: string;
  deadline: string;
  daysToDeadline: number;
  budgetUsed: number;   // % do orçamento consumido
  budgetPlanned: number; // % que deveria ter sido consumido até agora
  teamSize: number;
  milestones: ProjectMilestone[];
  members?: ProjectMember[];
  context: "mine" | "area" | "subordinates" | "critical";
  blockers?: string[];
  linkedOKRs?: { id: string; objective: string }[];
  linkedDecisions?: { id: string; value: string }[];
  linkedRisks?: { id: string; value: string }[];
  lastUpdate: string;
  trend: "improving" | "stable" | "declining";
  meetingSource?: string;
}

type ContextFilter = "all" | "mine" | "area" | "subordinates" | "critical";
type StatusFilter = "all" | "critical" | "blocked" | "delayed" | "at_risk" | "on_track";

// ============================================
// MOCK DATA
// ============================================

const MOCK_PROJECTS: Project[] = [
  {
    id: "proj-1",
    name: "Implementação EKS",
    description: "Plataforma de gestão do conhecimento organizacional com IA generativa",
    status: "at_risk",
    phase: "Desenvolvimento",
    progress: 62,
    ownerName: "Maria Santos",
    department: "Tecnologia",
    startDate: "2024-09-01",
    deadline: "2025-06-30",
    daysToDeadline: 142,
    budgetUsed: 72,
    budgetPlanned: 65,
    teamSize: 8,
    context: "mine",
    trend: "stable",
    lastUpdate: "2025-02-09",
    blockers: ["Integração com sistema legado pendente de decisão"],
    milestones: [
      { id: "ms-1a", title: "MVP Backend", dueDate: "2025-01-15", status: "completed" },
      { id: "ms-1b", title: "Cockpit Executivo v1", dueDate: "2025-03-15", status: "in_progress" },
      { id: "ms-1c", title: "Integração Neo4j completa", dueDate: "2025-04-30", status: "delayed" },
      { id: "ms-1d", title: "Go-live", dueDate: "2025-06-30", status: "in_progress" },
    ],
    linkedOKRs: [
      { id: "okr-2", objective: "Reduzir time-to-market de features em 50%" },
    ],
    linkedDecisions: [
      { id: "dec-1", value: "Cancelar integração com sistema legado" },
    ],
    linkedRisks: [
      { id: "risk-1", value: "Dependência de fornecedor sem contrato renovado" },
    ],
  },
  {
    id: "proj-2",
    name: "Automação de Processos",
    description: "Redesign e automação de processos core com RPA e workflows inteligentes",
    status: "blocked",
    phase: "Validação",
    progress: 38,
    ownerName: "João Pedro",
    department: "Operações",
    startDate: "2024-11-01",
    deadline: "2025-05-31",
    daysToDeadline: 112,
    budgetUsed: 55,
    budgetPlanned: 48,
    teamSize: 5,
    context: "area",
    trend: "declining",
    lastUpdate: "2025-02-07",
    blockers: [
      "Aprovação do comitê de compliance pendente",
      "Licenças RPA não adquiridas",
    ],
    milestones: [
      { id: "ms-2a", title: "Mapeamento AS-IS", dueDate: "2025-01-20", status: "completed" },
      { id: "ms-2b", title: "Design TO-BE", dueDate: "2025-02-28", status: "delayed" },
      { id: "ms-2c", title: "Implementação RPA", dueDate: "2025-04-15", status: "blocked" },
      { id: "ms-2d", title: "Rollout", dueDate: "2025-05-31", status: "in_progress" },
    ],
    linkedOKRs: [
      { id: "okr-4", objective: "Implementar governança de dados corporativa" },
    ],
    linkedDecisions: [
      { id: "dec-2", value: "Expandir time de desenvolvimento em 3 pessoas" },
    ],
    linkedRisks: [
      { id: "risk-3", value: "Atraso na entrega do EKS pode bloquear decisões estratégicas" },
    ],
  },
  {
    id: "proj-3",
    name: "Plataforma Enterprise",
    description: "Nova plataforma B2B para clientes enterprise com self-service e analytics",
    status: "critical",
    phase: "Planejamento",
    progress: 15,
    ownerName: "Carlos Silva",
    department: "Comercial",
    startDate: "2025-01-15",
    deadline: "2025-06-30",
    daysToDeadline: 142,
    budgetUsed: 28,
    budgetPlanned: 15,
    teamSize: 12,
    context: "critical",
    trend: "declining",
    lastUpdate: "2025-02-08",
    blockers: [
      "Arquitetura ainda não definida",
      "Contratação de tech lead sênior em andamento",
    ],
    milestones: [
      { id: "ms-3a", title: "Discovery & Research", dueDate: "2025-02-15", status: "delayed" },
      { id: "ms-3b", title: "Arquitetura definida", dueDate: "2025-03-15", status: "in_progress" },
      { id: "ms-3c", title: "MVP", dueDate: "2025-05-15", status: "in_progress" },
      { id: "ms-3d", title: "Beta launch", dueDate: "2025-06-30", status: "in_progress" },
    ],
    linkedOKRs: [
      { id: "okr-1", objective: "Aumentar receita recorrente em 40%" },
    ],
    linkedRisks: [
      { id: "risk-2", value: "Perda de talentos-chave" },
    ],
  },
  {
    id: "proj-4",
    name: "Redesign UX",
    description: "Reformulação completa da experiência do usuário com design system unificado",
    status: "delayed",
    phase: "Implementação",
    progress: 48,
    ownerName: "Ana Costa",
    department: "Produto",
    startDate: "2024-10-01",
    deadline: "2025-04-30",
    daysToDeadline: 81,
    budgetUsed: 60,
    budgetPlanned: 70,
    teamSize: 6,
    context: "subordinates",
    trend: "improving",
    lastUpdate: "2025-02-09",
    milestones: [
      { id: "ms-4a", title: "Design System v1", dueDate: "2025-01-15", status: "completed" },
      { id: "ms-4b", title: "Componentes migrados", dueDate: "2025-03-01", status: "in_progress" },
      { id: "ms-4c", title: "Testes de usabilidade", dueDate: "2025-04-01", status: "in_progress" },
      { id: "ms-4d", title: "Rollout completo", dueDate: "2025-04-30", status: "in_progress" },
    ],
    linkedOKRs: [
      { id: "okr-3", objective: "Alcançar NPS > 75 no produto" },
    ],
  },
  {
    id: "proj-5",
    name: "Expansão LATAM",
    description: "Estabelecer operações e parcerias estratégicas na América Latina",
    status: "on_track",
    phase: "Execução",
    progress: 71,
    ownerName: "Pedro Alves",
    department: "Operações",
    startDate: "2024-08-01",
    deadline: "2025-06-30",
    daysToDeadline: 142,
    budgetUsed: 58,
    budgetPlanned: 62,
    teamSize: 4,
    context: "mine",
    trend: "improving",
    lastUpdate: "2025-02-09",
    milestones: [
      { id: "ms-5a", title: "Due diligence mercados", dueDate: "2024-12-15", status: "completed" },
      { id: "ms-5b", title: "Parceiro México fechado", dueDate: "2025-01-31", status: "completed" },
      { id: "ms-5c", title: "Parceiro Colômbia fechado", dueDate: "2025-03-31", status: "in_progress" },
      { id: "ms-5d", title: "Primeiro revenue LATAM", dueDate: "2025-06-30", status: "in_progress" },
    ],
    linkedOKRs: [
      { id: "okr-5", objective: "Expandir operações para 2 novos mercados" },
    ],
  },
  {
    id: "proj-6",
    name: "Migração Cloud",
    description: "Migração de infraestrutura on-premise para cloud multi-tenant",
    status: "at_risk",
    phase: "Migração",
    progress: 55,
    ownerName: "Fernanda Reis",
    department: "Tecnologia",
    startDate: "2024-07-01",
    deadline: "2025-04-30",
    daysToDeadline: 81,
    budgetUsed: 78,
    budgetPlanned: 68,
    teamSize: 7,
    context: "area",
    trend: "stable",
    lastUpdate: "2025-02-06",
    blockers: ["Vendor lock-in em módulo de autenticação"],
    milestones: [
      { id: "ms-6a", title: "Assessment completo", dueDate: "2024-10-31", status: "completed" },
      { id: "ms-6b", title: "Ambientes staging", dueDate: "2025-01-31", status: "completed" },
      { id: "ms-6c", title: "Migração dados prod", dueDate: "2025-03-15", status: "delayed" },
      { id: "ms-6d", title: "Cutover final", dueDate: "2025-04-30", status: "in_progress" },
    ],
    linkedRisks: [
      { id: "risk-4", value: "Mudança regulatória pode impactar roadmap" },
    ],
  },
];

// ============================================
// HELPERS
// ============================================

const getStatusConfig = (status: Project["status"]) => {
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
    case "blocked":
      return {
        label: "Bloqueado",
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-950/30",
        borderColor: "border-purple-300 dark:border-purple-800",
        badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
        progressColor: "bg-purple-500",
        icon: Ban,
      };
    case "delayed":
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

const getTrendConfig = (trend: Project["trend"]) => {
  switch (trend) {
    case "improving":
      return { label: "Melhorando", color: "text-emerald-600", icon: ArrowUpRight };
    case "stable":
      return { label: "Estável", color: "text-muted-foreground", icon: Minus };
    case "declining":
      return { label: "Piorando", color: "text-red-600", icon: ArrowDownRight };
  }
};

const getMilestoneStatusConfig = (status: ProjectMilestone["status"]) => {
  switch (status) {
    case "completed":
      return { color: "bg-emerald-500", textColor: "text-emerald-600", label: "Concluído" };
    case "in_progress":
      return { color: "bg-blue-500", textColor: "text-blue-600", label: "Em andamento" };
    case "delayed":
      return { color: "bg-orange-500", textColor: "text-orange-600", label: "Atrasado" };
    case "blocked":
      return { color: "bg-red-500", textColor: "text-red-600", label: "Bloqueado" };
  }
};

// ============================================
// COMPONENT
// ============================================

export function ExecutiveProjectsView() {
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
        console.error("Failed to load projects:", error);
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

  // Filtrar
  const filteredProjects = MOCK_PROJECTS.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesContext = contextFilter === "all" || p.context === contextFilter;
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;

    return matchesSearch && matchesContext && matchesStatus;
  });

  // Ordenar: critical > blocked > delayed > at_risk > on_track, depois por progresso
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const statusOrder = { critical: 5, blocked: 4, delayed: 3, at_risk: 2, on_track: 1 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[b.status] - statusOrder[a.status];
    }
    return a.daysToDeadline - b.daysToDeadline;
  });

  // Estatísticas
  const stats = useMemo(() => {
    const allMilestones = MOCK_PROJECTS.flatMap((p) => p.milestones);
    const totalBlockers = MOCK_PROJECTS.reduce((sum, p) => sum + (p.blockers?.length || 0), 0);
    const avgProgress = Math.round(
      MOCK_PROJECTS.reduce((sum, p) => sum + p.progress, 0) / MOCK_PROJECTS.length
    );
    const budgetOverrun = MOCK_PROJECTS.filter((p) => p.budgetUsed > p.budgetPlanned).length;

    return {
      total: MOCK_PROJECTS.length,
      critical: MOCK_PROJECTS.filter((p) => p.status === "critical").length,
      blocked: MOCK_PROJECTS.filter((p) => p.status === "blocked").length,
      delayed: MOCK_PROJECTS.filter((p) => p.status === "delayed").length,
      atRisk: MOCK_PROJECTS.filter((p) => p.status === "at_risk").length,
      onTrack: MOCK_PROJECTS.filter((p) => p.status === "on_track").length,
      avgProgress,
      totalBlockers,
      budgetOverrun,
      totalTeam: MOCK_PROJECTS.reduce((sum, p) => sum + p.teamSize, 0),
      milestonesCompleted: allMilestones.filter((m) => m.status === "completed").length,
      milestonesTotal: allMilestones.length,
      milestonesDelayed: allMilestones.filter((m) => m.status === "delayed" || m.status === "blocked").length,
      byContext: {
        mine: MOCK_PROJECTS.filter((p) => p.context === "mine").length,
        area: MOCK_PROJECTS.filter((p) => p.context === "area").length,
        subordinates: MOCK_PROJECTS.filter((p) => p.context === "subordinates").length,
        critical: MOCK_PROJECTS.filter((p) => p.context === "critical").length,
      },
    };
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/30">
        <div className="animate-pulse text-muted-foreground">Carregando projetos...</div>
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
              <FolderKanban className="w-7 h-7 text-primary" />
              Projetos Críticos
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Portfólio de projetos com foco em desvios, bloqueios e prazos
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{filteredProjects.length}</div>
            <div className="text-xs text-muted-foreground">projetos monitorados</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por projeto, responsável ou departamento..."
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
              { value: "blocked", label: "Bloqueado", count: stats.blocked },
              { value: "delayed", label: "Atrasado", count: stats.delayed },
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
          {/* Progresso Médio */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center justify-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Progresso Médio</span>
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32" cy="32" r="28"
                  fill="none" stroke="currentColor" strokeWidth="6"
                  className="text-muted/30"
                />
                <circle
                  cx="32" cy="32" r="28"
                  fill="none" stroke="currentColor" strokeWidth="6"
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
            <span className="text-[10px] text-muted-foreground">do portfólio</span>
          </div>

          {/* Bloqueados + Críticos */}
          <div className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-red-600">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-medium">Críticos / Bloqueados</span>
            </div>
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">
              {stats.critical + stats.blocked}
            </div>
            <span className="text-[10px] text-red-600/70">
              {stats.critical} crítico{stats.critical !== 1 ? "s" : ""}, {stats.blocked} bloqueado{stats.blocked !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Bloqueadores */}
          <div className="rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-purple-600">
              <Ban className="w-4 h-4" />
              <span className="text-xs font-medium">Bloqueadores</span>
            </div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.totalBlockers}</div>
            <span className="text-[10px] text-purple-600/70">impedimentos ativos</span>
          </div>

          {/* Orçamento */}
          <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-amber-600">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-medium">Orçamento Excedido</span>
            </div>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.budgetOverrun}</div>
            <span className="text-[10px] text-amber-600/70">projetos acima do planejado</span>
          </div>

          {/* Milestones */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Milestone className="w-4 h-4" />
              <span className="text-xs font-medium">Milestones</span>
            </div>
            <div className="text-2xl font-bold">
              {stats.milestonesCompleted}
              <span className="text-sm font-normal text-muted-foreground">/{stats.milestonesTotal}</span>
            </div>
            <span className="text-[10px] text-orange-600">
              {stats.milestonesDelayed} atrasado{stats.milestonesDelayed !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Pessoas alocadas */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">Pessoas</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalTeam}</div>
            <span className="text-[10px] text-muted-foreground">alocadas no portfólio</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {sortedProjects.length === 0 ? (
          <div className="text-center py-12">
            <FolderKanban className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-medium text-muted-foreground">Nenhum projeto encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tente ajustar os filtros ou buscar por outros termos
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedProjects.map((project) => {
              const isExpanded = expandedId === project.id;
              const isDragging = draggedId === project.id;
              const statusConfig = getStatusConfig(project.status);
              const trendConfig = getTrendConfig(project.trend);
              const StatusIcon = statusConfig.icon;
              const TrendIcon = trendConfig.icon;
              const budgetDelta = project.budgetUsed - project.budgetPlanned;
              const isBudgetOver = budgetDelta > 0;

              const completedMilestones = project.milestones.filter((m) => m.status === "completed").length;
              const milestoneProgress = Math.round((completedMilestones / project.milestones.length) * 100);

              const handleDragStart = (e: React.DragEvent) => {
                setDraggedId(project.id);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData(
                  "application/json",
                  JSON.stringify({
                    type: "project",
                    id: project.id,
                    title: project.name,
                    description: project.description,
                    metadata: {
                      ownerName: project.ownerName,
                      department: project.department,
                      status: project.status,
                      progress: project.progress,
                      phase: project.phase,
                      daysToDeadline: project.daysToDeadline,
                      teamSize: project.teamSize,
                      blockers: project.blockers?.length || 0,
                    },
                  })
                );
              };

              const handleDragEnd = () => {
                setDraggedId(null);
              };

              return (
                <div
                  key={project.id}
                  draggable
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "rounded-xl border-2 bg-card/80 backdrop-blur transition-all overflow-hidden cursor-move",
                    statusConfig.borderColor,
                    isDragging && "opacity-50 scale-95",
                    project.status === "critical" && "shadow-lg shadow-red-500/20",
                    project.status === "blocked" && "shadow-lg shadow-purple-500/20"
                  )}
                >
                  {/* Card Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : project.id)}
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
                            <h3 className="font-semibold text-base">{project.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">{project.department}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{project.phase}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusConfig.badgeColor)}>
                              {statusConfig.label}
                            </span>
                            <span className={cn("flex items-center gap-0.5 text-xs", trendConfig.color)}>
                              <TrendIcon className="w-3 h-3" />
                              {trendConfig.label}
                            </span>
                            {project.daysToDeadline <= 60 && (
                              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {project.daysToDeadline}d
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

                        <p className="text-sm text-muted-foreground mb-3 line-clamp-1">{project.description}</p>

                        {/* Dual Progress: Execução + Orçamento */}
                        <div className="space-y-2">
                          {/* Barra de Progresso — Execução */}
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-muted-foreground min-w-[52px]">Execução</span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all duration-500", statusConfig.progressColor)}
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                            <span className={cn("text-sm font-bold min-w-[3rem] text-right", statusConfig.color)}>
                              {project.progress}%
                            </span>
                          </div>

                          {/* Barra de Orçamento */}
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-muted-foreground min-w-[52px]">Orçamento</span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden relative">
                              {/* Planejado (marcador vertical) */}
                              <div
                                className="absolute top-0 bottom-0 w-0.5 bg-muted-foreground/40 z-10"
                                style={{ left: `${project.budgetPlanned}%` }}
                              />
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  isBudgetOver ? "bg-red-400" : "bg-emerald-400"
                                )}
                                style={{ width: `${Math.min(project.budgetUsed, 100)}%` }}
                              />
                            </div>
                            <span className={cn(
                              "text-sm font-bold min-w-[3rem] text-right",
                              isBudgetOver ? "text-red-600" : "text-emerald-600"
                            )}>
                              {project.budgetUsed}%
                            </span>
                          </div>

                          {/* Meta Info Row */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <strong className="text-foreground/80">{project.ownerName}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {project.teamSize} pessoas
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              até {formatDate(project.deadline)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Milestone className="w-3 h-3" />
                              {completedMilestones}/{project.milestones.length} milestones
                            </span>
                            {project.blockers && project.blockers.length > 0 && (
                              <span className="flex items-center gap-1 text-red-600 font-medium">
                                <Ban className="w-3 h-3" />
                                {project.blockers.length} bloqueador{project.blockers.length > 1 ? "es" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-border bg-muted/20">
                      <div className="pt-4 space-y-4">
                        {/* Bloqueadores */}
                        {project.blockers && project.blockers.length > 0 && (
                          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                            <h4 className="text-xs font-semibold text-red-700 dark:text-red-300 mb-2 flex items-center gap-1">
                              <Ban className="w-3 h-3" />
                              Bloqueadores Ativos
                            </h4>
                            <ul className="space-y-1">
                              {project.blockers.map((blocker, idx) => (
                                <li key={idx} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                                  <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                                  {blocker}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Milestones Timeline */}
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1">
                            <Milestone className="w-3 h-3" />
                            Milestones
                          </h4>
                          <div className="space-y-2">
                            {project.milestones.map((ms, idx) => {
                              const msConfig = getMilestoneStatusConfig(ms.status);
                              return (
                                <div
                                  key={ms.id}
                                  className="flex items-center gap-3 p-2 rounded-lg bg-background/80 border border-border"
                                >
                                  {/* Timeline dot + line */}
                                  <div className="flex flex-col items-center shrink-0">
                                    <div className={cn("w-3 h-3 rounded-full", msConfig.color)} />
                                    {idx < project.milestones.length - 1 && (
                                      <div className="w-0.5 h-4 bg-border mt-0.5" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium">{ms.title}</span>
                                  </div>
                                  <span className={cn("text-xs font-medium", msConfig.textColor)}>
                                    {msConfig.label}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(ms.dueDate)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Orçamento Detalhado */}
                        <div className="p-3 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 border border-border">
                          <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            Saúde Financeira
                          </h4>
                          <div className="grid grid-cols-3 gap-4 text-xs">
                            <div>
                              <span className="text-muted-foreground">Consumido:</span>{" "}
                              <strong className={isBudgetOver ? "text-red-600" : "text-foreground"}>
                                {project.budgetUsed}%
                              </strong>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Planejado:</span>{" "}
                              <strong>{project.budgetPlanned}%</strong>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Desvio:</span>{" "}
                              <strong className={cn(
                                isBudgetOver ? "text-red-600" : "text-emerald-600"
                              )}>
                                {isBudgetOver ? "+" : ""}{budgetDelta}pp
                              </strong>
                            </div>
                          </div>
                        </div>

                        {/* Timeline */}
                        <div className="p-3 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 border border-border">
                          <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Timeline
                          </h4>
                          <div className="flex items-center justify-between text-xs">
                            <div>
                              <span className="text-muted-foreground">Início:</span>{" "}
                              <strong>{formatDate(project.startDate)}</strong>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Deadline:</span>{" "}
                              <strong>{formatDate(project.deadline)}</strong>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Restam:</span>{" "}
                              <strong
                                className={cn(
                                  project.daysToDeadline <= 30
                                    ? "text-red-600"
                                    : project.daysToDeadline <= 60
                                    ? "text-amber-600"
                                    : "text-foreground"
                                )}
                              >
                                {project.daysToDeadline} dias
                              </strong>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Atualizado:</span>{" "}
                              <strong>{formatDate(project.lastUpdate)}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Linked Items */}
                        {(project.linkedOKRs?.length || project.linkedDecisions?.length || project.linkedRisks?.length) && (
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              Elementos Vinculados
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {project.linkedOKRs?.map((o) => (
                                <span
                                  key={o.id}
                                  className="px-2 py-1 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-medium flex items-center gap-1"
                                >
                                  <Target className="w-3 h-3" />
                                  {o.objective}
                                </span>
                              ))}
                              {project.linkedDecisions?.map((d) => (
                                <span
                                  key={d.id}
                                  className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-medium flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  {d.value}
                                </span>
                              ))}
                              {project.linkedRisks?.map((r) => (
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

