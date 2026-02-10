"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Lightbulb,
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
  BarChart3,
  FolderKanban,
  Sparkles,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Brain,
  Layers,
  ArrowRight,
  MessageSquare,
  BookOpen,
  Rocket,
  Shield,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useChatContextStore } from "@/store/chatContextStore";

// ============================================
// INTERFACES
// ============================================

type InsightCategory = "strategic" | "operational" | "market" | "technology" | "people" | "financial";
type InsightImpact = "transformational" | "high" | "medium" | "low";
type InsightActionability = "immediate" | "short_term" | "long_term" | "informational";
type InsightValidationStatus = "validated" | "awaiting_validation" | "disputed" | "new";

interface RelatedEvidence {
  id: string;
  type: "meeting" | "decision" | "risk" | "data";
  label: string;
  date?: string;
}

interface Insight {
  id: string;
  title: string;
  description: string;
  synthesis: string; // resumo executivo gerado por IA
  category: InsightCategory;
  impact: InsightImpact;
  actionability: InsightActionability;
  validationStatus: InsightValidationStatus;
  ownerName: string;
  department: string;
  discoveredDate: string;
  context: "mine" | "area" | "subordinates" | "projects" | "critical";
  confidence: number; // 0-1 nível de confiança da IA na extração
  upvotes: number;
  downvotes: number;
  evidence: RelatedEvidence[];
  suggestedActions?: string[];
  linkedProjects?: { id: string; name: string }[];
  linkedOKRs?: { id: string; objective: string }[];
  linkedRisks?: { id: string; value: string }[];
  tags: string[];
  meetingSource?: string;
}

type ContextFilter = "all" | "mine" | "area" | "subordinates" | "projects" | "critical";
type CategoryFilter = "all" | InsightCategory;
type ImpactFilter = "all" | InsightImpact;

// ============================================
// MOCK DATA
// ============================================

const CATEGORY_CONFIG: Record<InsightCategory, { label: string; icon: typeof Lightbulb; color: string; bgColor: string; badgeColor: string }> = {
  strategic: {
    label: "Estratégico",
    icon: Target,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
  },
  operational: {
    label: "Operacional",
    icon: Layers,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  },
  market: {
    label: "Mercado",
    icon: TrendingUp,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  },
  technology: {
    label: "Tecnologia",
    icon: Zap,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
    badgeColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400",
  },
  people: {
    label: "Pessoas",
    icon: User,
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/30",
    badgeColor: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400",
  },
  financial: {
    label: "Financeiro",
    icon: BarChart3,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  },
};

const IMPACT_CONFIG: Record<InsightImpact, { label: string; color: string; badgeColor: string; weight: number }> = {
  transformational: {
    label: "Transformacional",
    color: "text-purple-600",
    badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
    weight: 4,
  },
  high: {
    label: "Alto",
    color: "text-red-600",
    badgeColor: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    weight: 3,
  },
  medium: {
    label: "Médio",
    color: "text-amber-600",
    badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    weight: 2,
  },
  low: {
    label: "Baixo",
    color: "text-muted-foreground",
    badgeColor: "bg-muted text-muted-foreground",
    weight: 1,
  },
};

const ACTIONABILITY_CONFIG: Record<InsightActionability, { label: string; icon: typeof Rocket; color: string }> = {
  immediate: { label: "Ação Imediata", icon: Rocket, color: "text-red-600" },
  short_term: { label: "Curto Prazo", icon: ArrowRight, color: "text-amber-600" },
  long_term: { label: "Longo Prazo", icon: Clock, color: "text-blue-600" },
  informational: { label: "Informacional", icon: BookOpen, color: "text-muted-foreground" },
};

const VALIDATION_CONFIG: Record<InsightValidationStatus, { label: string; color: string; badgeColor: string }> = {
  validated: {
    label: "Validado",
    color: "text-emerald-600",
    badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  },
  awaiting_validation: {
    label: "Aguardando Validação",
    color: "text-amber-600",
    badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  },
  disputed: {
    label: "Contestado",
    color: "text-red-600",
    badgeColor: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  },
  new: {
    label: "Novo",
    color: "text-blue-600",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  },
};

const MOCK_INSIGHTS: Insight[] = [
  {
    id: "ins-1",
    title: "Convergência de insatisfação em 3 áreas indica problema sistêmico de onboarding",
    description: "Análise cruzada de reuniões de Produto, Comercial e Suporte revela um padrão: clientes enterprise abandonam no 2º mês por complexidade percebida, não por falta de features.",
    synthesis: "O churn enterprise não é funcional — é experiencial. O onboarding atual foi desenhado para power-users, mas 70% dos novos clientes enterprise são usuários de primeira viagem em plataformas dessa natureza.",
    category: "strategic",
    impact: "transformational",
    actionability: "immediate",
    validationStatus: "validated",
    ownerName: "Carlos Silva",
    department: "Comercial",
    discoveredDate: "2025-02-08",
    context: "mine",
    confidence: 0.92,
    upvotes: 8,
    downvotes: 0,
    tags: ["churn", "onboarding", "enterprise", "UX"],
    evidence: [
      { id: "ev-1a", type: "meeting", label: "Reunião de Diretoria — 05/02", date: "2025-02-05" },
      { id: "ev-1b", type: "meeting", label: "Review Trimestral Produto — 03/02", date: "2025-02-03" },
      { id: "ev-1c", type: "data", label: "Dashboard churn Q4 2024" },
      { id: "ev-1d", type: "decision", label: "Decisão: Redesign UX prioritário" },
    ],
    suggestedActions: [
      "Criar programa de onboarding guiado para enterprise (guided tour + success manager)",
      "Redefinir métricas de ativação: trocar 'feature usage' por 'value realization'",
      "Agendar workshop cross-funcional Produto + Comercial + CS",
    ],
    linkedProjects: [{ id: "proj-4", name: "Redesign UX" }],
    linkedOKRs: [{ id: "okr-3", objective: "Alcançar NPS > 75 no produto" }],
  },
  {
    id: "ins-2",
    title: "Time de engenharia gasta 40% do tempo em integração manual que poderia ser automatizada",
    description: "Dados de sprint retrospectives dos últimos 3 meses mostram que o bottleneck principal não é complexidade técnica, mas sim deploys e testes manuais em ambientes legados.",
    synthesis: "O custo oculto do sistema legado não está na manutenção direta — está no tempo de engenharia desperdiçado em workarounds manuais. Automatizar os 3 pipelines críticos liberaria ~15h/semana de capacity sênior.",
    category: "technology",
    impact: "high",
    actionability: "short_term",
    validationStatus: "validated",
    ownerName: "Maria Santos",
    department: "Engenharia",
    discoveredDate: "2025-02-07",
    context: "area",
    confidence: 0.88,
    upvotes: 5,
    downvotes: 1,
    tags: ["automação", "DevOps", "legacy", "produtividade"],
    evidence: [
      { id: "ev-2a", type: "meeting", label: "Sprint Retro — 06/02", date: "2025-02-06" },
      { id: "ev-2b", type: "data", label: "Métricas DORA Q4" },
      { id: "ev-2c", type: "risk", label: "Risco: Atraso no EKS por gargalo de deploy" },
    ],
    suggestedActions: [
      "Priorizar automação dos 3 pipelines críticos identificados",
      "Avaliar descomissionamento acelerado do módulo legado mais custoso",
      "Estabelecer meta DORA para deploy frequency no Q2",
    ],
    linkedProjects: [{ id: "proj-2", name: "Automação de Processos" }],
    linkedOKRs: [{ id: "okr-2", objective: "Reduzir time-to-market de features em 50%" }],
  },
  {
    id: "ins-3",
    title: "Competidor X acaba de anunciar feature equivalente ao nosso diferencial",
    description: "Reunião de inteligência competitiva identificou que o Competidor X lançou em beta uma feature de knowledge graph muito similar à proposta de valor central do EKS.",
    synthesis: "A janela de vantagem competitiva está se fechando. Precisamos acelerar o go-to-market e, mais importante, pivotar a narrativa de 'knowledge graph' para 'intelligence layer' — um posicionamento mais defensável.",
    category: "market",
    impact: "high",
    actionability: "immediate",
    validationStatus: "awaiting_validation",
    ownerName: "Pedro Alves",
    department: "Comercial",
    discoveredDate: "2025-02-09",
    context: "critical",
    confidence: 0.78,
    upvotes: 6,
    downvotes: 2,
    tags: ["competição", "GTM", "posicionamento", "urgente"],
    evidence: [
      { id: "ev-3a", type: "meeting", label: "Reunião Inteligência Competitiva — 09/02", date: "2025-02-09" },
      { id: "ev-3b", type: "data", label: "Release notes Competidor X — Feb 2025" },
    ],
    suggestedActions: [
      "Agendar war room com Produto + Marketing + Vendas para redefinir posicionamento",
      "Antecipar release de features diferenciadores em 2 sprints",
      "Atualizar battle cards da equipe comercial",
    ],
    linkedOKRs: [{ id: "okr-1", objective: "Aumentar receita recorrente em 40%" }],
    linkedRisks: [{ id: "risk-5", value: "Perda de diferencial competitivo" }],
  },
  {
    id: "ins-4",
    title: "Padrão de reuniões improdutivas consome 12h/semana de liderança sênior",
    description: "Análise de transcripts das últimas 4 semanas mostra que 35% das reuniões de liderança terminam sem decisões concretas ou action items, gerando reuniões de follow-up redundantes.",
    synthesis: "O problema não é excesso de reuniões — é a falta de estrutura decisória. Reuniões sem pre-read, sem pauta de decisão e sem owner de follow-up geram um ciclo vicioso de 'reunião sobre a reunião'.",
    category: "operational",
    impact: "medium",
    actionability: "short_term",
    validationStatus: "new",
    ownerName: "Ana Costa",
    department: "Produto",
    discoveredDate: "2025-02-09",
    context: "subordinates",
    confidence: 0.85,
    upvotes: 3,
    downvotes: 0,
    tags: ["produtividade", "reuniões", "decisões", "liderança"],
    evidence: [
      { id: "ev-4a", type: "data", label: "Análise de 47 transcripts (Jan/Fev 2025)" },
      { id: "ev-4b", type: "meeting", label: "Retro de Liderança — 08/02", date: "2025-02-08" },
    ],
    suggestedActions: [
      "Implementar framework de 'decisão-first' para reuniões executivas",
      "Usar EKS para gerar pre-reads automáticos com contexto de decisões anteriores",
      "Estabelecer política de 'no decision = no meeting'",
    ],
  },
  {
    id: "ins-5",
    title: "Parceiros LATAM reportam demanda 3x maior que estimada para módulo de compliance",
    description: "Feedback consolidado dos 3 parceiros de expansão LATAM indica que compliance e governança de dados são os drivers #1 de compra na região, não analytics como previsto inicialmente.",
    synthesis: "A estratégia de GTM para LATAM precisa ser revisada: compliance-first, analytics-second. Os parceiros sugerem que um módulo específico de 'regulatory intelligence' pode ser um standalone com alto ticket.",
    category: "market",
    impact: "high",
    actionability: "short_term",
    validationStatus: "validated",
    ownerName: "Pedro Alves",
    department: "Operações",
    discoveredDate: "2025-02-06",
    context: "projects",
    confidence: 0.91,
    upvotes: 7,
    downvotes: 0,
    tags: ["LATAM", "compliance", "GTM", "produto"],
    evidence: [
      { id: "ev-5a", type: "meeting", label: "Review Expansão LATAM — 05/02", date: "2025-02-05" },
      { id: "ev-5b", type: "meeting", label: "Call com Parceiro México — 04/02", date: "2025-02-04" },
      { id: "ev-5c", type: "data", label: "Pipeline LATAM Q1 2025" },
    ],
    suggestedActions: [
      "Priorizar desenvolvimento de módulo de compliance/regulatory intelligence",
      "Redesenhar proposta de valor LATAM com compliance como lead",
      "Agendar design sprint para MVP do módulo standalone",
    ],
    linkedProjects: [{ id: "proj-5", name: "Expansão LATAM" }],
    linkedOKRs: [{ id: "okr-5", objective: "Expandir operações para 2 novos mercados" }],
  },
  {
    id: "ins-6",
    title: "Risco de burnout detectado em 2 squads críticos",
    description: "Sprint velocities em queda contínua por 3 sprints, combinado com aumento de 25% em sick days, indica pressão insustentável nas equipes de backend e infra.",
    synthesis: "Os sinais de fadiga organizacional são claros: equipes menores entregando mais scope em menos tempo. Se não interviermos, o risco de turnover sobe significativamente no Q2.",
    category: "people",
    impact: "high",
    actionability: "immediate",
    validationStatus: "awaiting_validation",
    ownerName: "Fernanda Reis",
    department: "Tecnologia",
    discoveredDate: "2025-02-08",
    context: "area",
    confidence: 0.82,
    upvotes: 4,
    downvotes: 1,
    tags: ["burnout", "retenção", "engenharia", "wellbeing"],
    evidence: [
      { id: "ev-6a", type: "data", label: "Sprint velocities — últimos 6 sprints" },
      { id: "ev-6b", type: "data", label: "People Analytics — sick days Jan/Fev" },
      { id: "ev-6c", type: "meeting", label: "1:1 com Tech Leads — 07/02", date: "2025-02-07" },
    ],
    suggestedActions: [
      "Rebalancear scope entre squads imediatamente",
      "Agendar check-in individual com membros das equipes críticas",
      "Revisar roadmap Q2 com capacidade realista (buffer de 20%)",
    ],
    linkedRisks: [{ id: "risk-2", value: "Perda de talentos-chave" }],
  },
];

// ============================================
// COMPONENT
// ============================================

export function ExecutiveInsightsView() {
  const { user } = useAuthStore();
  const { addContextItem } = useChatContextStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [contextFilter, setContextFilter] = useState<ContextFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [impactFilter, setImpactFilter] = useState<ImpactFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        console.error("Failed to load insights:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [contextFilter, categoryFilter]);

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
  const filteredInsights = MOCK_INSIGHTS.filter((ins) => {
    const matchesSearch =
      ins.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ins.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ins.synthesis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ins.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ins.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesContext = contextFilter === "all" || ins.context === contextFilter;
    const matchesCategory = categoryFilter === "all" || ins.category === categoryFilter;
    const matchesImpact = impactFilter === "all" || ins.impact === impactFilter;

    return matchesSearch && matchesContext && matchesCategory && matchesImpact;
  });

  // Ordenar: impacto > confiança > votos > data
  const sortedInsights = [...filteredInsights].sort((a, b) => {
    const impactDiff = IMPACT_CONFIG[b.impact].weight - IMPACT_CONFIG[a.impact].weight;
    if (impactDiff !== 0) return impactDiff;

    const scoreDiff = (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
    if (scoreDiff !== 0) return scoreDiff;

    return new Date(b.discoveredDate).getTime() - new Date(a.discoveredDate).getTime();
  });

  // Estatísticas
  const stats = useMemo(() => {
    const avgConfidence = Math.round(
      (MOCK_INSIGHTS.reduce((sum, i) => sum + i.confidence, 0) / MOCK_INSIGHTS.length) * 100
    );
    const actionable = MOCK_INSIGHTS.filter(
      (i) => i.actionability === "immediate" || i.actionability === "short_term"
    ).length;

    return {
      total: MOCK_INSIGHTS.length,
      transformational: MOCK_INSIGHTS.filter((i) => i.impact === "transformational").length,
      highImpact: MOCK_INSIGHTS.filter((i) => i.impact === "high").length,
      actionable,
      awaitingValidation: MOCK_INSIGHTS.filter((i) => i.validationStatus === "awaiting_validation" || i.validationStatus === "new").length,
      avgConfidence,
      totalEvidence: MOCK_INSIGHTS.reduce((sum, i) => sum + i.evidence.length, 0),
      byCategory: Object.fromEntries(
        Object.keys(CATEGORY_CONFIG).map((cat) => [
          cat,
          MOCK_INSIGHTS.filter((i) => i.category === cat).length,
        ])
      ) as Record<InsightCategory, number>,
      byContext: {
        mine: MOCK_INSIGHTS.filter((i) => i.context === "mine").length,
        area: MOCK_INSIGHTS.filter((i) => i.context === "area").length,
        subordinates: MOCK_INSIGHTS.filter((i) => i.context === "subordinates").length,
        projects: MOCK_INSIGHTS.filter((i) => i.context === "projects").length,
        critical: MOCK_INSIGHTS.filter((i) => i.context === "critical").length,
      },
    };
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/30">
        <div className="animate-pulse text-muted-foreground">Carregando insights...</div>
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
              <Lightbulb className="w-7 h-7 text-amber-500" />
              Insights Prioritários
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Descobertas de alto impacto extraídas e sintetizadas por IA
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-amber-600">{filteredInsights.length}</div>
            <div className="text-xs text-muted-foreground">insights identificados</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por insight, tag, responsável..."
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

          {/* Filtros de Categoria + Impacto */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground">Categoria:</span>
              {[
                { value: "all" as CategoryFilter, label: "Todas" },
                ...Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => ({
                  value: key as CategoryFilter,
                  label: cfg.label,
                })),
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setCategoryFilter(filter.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                    categoryFilter === filter.value
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground">Impacto:</span>
              {[
                { value: "all" as ImpactFilter, label: "Todos" },
                { value: "transformational", label: "Transformacional" },
                { value: "high", label: "Alto" },
                { value: "medium", label: "Médio" },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setImpactFilter(filter.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                    impactFilter === filter.value
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tiles de Resumo */}
      <div className="px-6 pt-5 pb-0">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Total */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lightbulb className="w-4 h-4" />
              <span className="text-xs font-medium">Total</span>
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <span className="text-[10px] text-muted-foreground">insights extraídos</span>
          </div>

          {/* Transformacionais */}
          <div className="rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-purple-600">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-medium">Transformacionais</span>
            </div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.transformational}</div>
            <span className="text-[10px] text-purple-600/70">potencial disruptivo</span>
          </div>

          {/* Alto Impacto */}
          <div className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-red-600">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-medium">Alto Impacto</span>
            </div>
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.highImpact}</div>
            <span className="text-[10px] text-red-600/70">demandam atenção</span>
          </div>

          {/* Acionáveis */}
          <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-emerald-600">
              <Rocket className="w-4 h-4" />
              <span className="text-xs font-medium">Acionáveis</span>
            </div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.actionable}</div>
            <span className="text-[10px] text-emerald-600/70">ação imediata ou curto prazo</span>
          </div>

          {/* Confiança IA */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center justify-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Confiança IA</span>
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32" cy="32" r="28"
                  fill="none" stroke="currentColor" strokeWidth="6"
                  className="text-muted/30"
                />
                <circle
                  cx="32" cy="32" r="28"
                  fill="none" stroke="currentColor" strokeWidth="6"
                  strokeDasharray={`${(stats.avgConfidence / 100) * 175.9} 175.9`}
                  strokeLinecap="round"
                  className={cn(
                    stats.avgConfidence >= 80
                      ? "text-emerald-500"
                      : stats.avgConfidence >= 60
                      ? "text-amber-500"
                      : "text-red-500"
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-base font-bold">{stats.avgConfidence}%</span>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground">média de extração</span>
          </div>

          {/* Pendentes Validação */}
          <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-amber-600">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Pendentes</span>
            </div>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.awaitingValidation}</div>
            <span className="text-[10px] text-amber-600/70">aguardando validação</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {sortedInsights.length === 0 ? (
          <div className="text-center py-12">
            <Lightbulb className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-medium text-muted-foreground">Nenhum insight encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tente ajustar os filtros ou buscar por outros termos
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedInsights.map((insight) => {
              const isExpanded = expandedId === insight.id;
              const isDragging = draggedId === insight.id;
              const catConfig = CATEGORY_CONFIG[insight.category];
              const impactConfig = IMPACT_CONFIG[insight.impact];
              const actionConfig = ACTIONABILITY_CONFIG[insight.actionability];
              const validConfig = VALIDATION_CONFIG[insight.validationStatus];
              const CatIcon = catConfig.icon;
              const ActionIcon = actionConfig.icon;
              const netVotes = insight.upvotes - insight.downvotes;

              const handleDragStart = (e: React.DragEvent) => {
                setDraggedId(insight.id);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData(
                  "application/json",
                  JSON.stringify({
                    type: "insight",
                    id: insight.id,
                    title: insight.title,
                    description: insight.synthesis,
                    metadata: {
                      ownerName: insight.ownerName,
                      department: insight.department,
                      category: insight.category,
                      impact: insight.impact,
                      actionability: insight.actionability,
                      confidence: insight.confidence,
                      evidence: insight.evidence.length,
                      tags: insight.tags.join(", "),
                    },
                  })
                );
              };

              const handleDragEnd = () => {
                setDraggedId(null);
              };

              return (
                <div
                  key={insight.id}
                  draggable
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "rounded-xl border-2 bg-card/80 backdrop-blur transition-all overflow-hidden cursor-move",
                    "border-border",
                    isDragging && "opacity-50 scale-95",
                    insight.impact === "transformational" &&
                      "border-purple-300 dark:border-purple-800 shadow-lg shadow-purple-500/10",
                    insight.impact === "high" && insight.actionability === "immediate" &&
                      "border-red-300 dark:border-red-800 shadow-md shadow-red-500/10"
                  )}
                >
                  {/* Card Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 cursor-grab active:cursor-grabbing" onMouseDown={(e) => e.stopPropagation()}>
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                      </div>

                      {/* Category Icon */}
                      <div className={cn("p-3 rounded-lg shrink-0", catConfig.bgColor)}>
                        <CatIcon className={cn("w-6 h-6", catConfig.color)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-base leading-snug">{insight.title}</h3>
                          <div className="flex items-center gap-2 shrink-0">
                            <ChevronRight
                              className={cn(
                                "w-4 h-4 text-muted-foreground transition-transform",
                                isExpanded && "rotate-90"
                              )}
                            />
                          </div>
                        </div>

                        {/* Badges Row */}
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", catConfig.badgeColor)}>
                            {catConfig.label}
                          </span>
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", impactConfig.badgeColor)}>
                            {impactConfig.label}
                          </span>
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1", validConfig.badgeColor)}>
                            {validConfig.label}
                          </span>
                          <span className={cn("flex items-center gap-1 text-xs font-medium", actionConfig.color)}>
                            <ActionIcon className="w-3 h-3" />
                            {actionConfig.label}
                          </span>
                        </div>

                        {/* Síntese Executiva */}
                        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 mb-2">
                          <div className="flex items-center gap-1 mb-1">
                            <Brain className="w-3 h-3 text-primary/60" />
                            <span className="text-[10px] font-semibold text-primary/60 uppercase tracking-wider">
                              Síntese IA
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80 leading-relaxed line-clamp-2">
                            {insight.synthesis}
                          </p>
                        </div>

                        {/* Meta Info Row */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <strong className="text-foreground/80">{insight.ownerName}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(insight.discoveredDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {insight.evidence.length} evidência{insight.evidence.length !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Brain className="w-3 h-3" />
                            {Math.round(insight.confidence * 100)}% confiança
                          </span>
                          <span className="flex items-center gap-1 ml-auto">
                            <ThumbsUp className="w-3 h-3" />
                            <strong className={netVotes > 0 ? "text-emerald-600" : netVotes < 0 ? "text-red-600" : ""}>
                              {netVotes > 0 ? "+" : ""}{netVotes}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-border bg-muted/20">
                      <div className="pt-4 space-y-4">
                        {/* Descrição Completa */}
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            Observação Detalhada
                          </h4>
                          <p className="text-sm text-foreground/80 leading-relaxed">
                            {insight.description}
                          </p>
                        </div>

                        {/* Síntese Completa */}
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                          <h4 className="text-xs font-semibold text-primary mb-1.5 flex items-center gap-1">
                            <Brain className="w-3 h-3" />
                            Síntese Executiva
                          </h4>
                          <p className="text-sm text-foreground/80 leading-relaxed">
                            {insight.synthesis}
                          </p>
                        </div>

                        {/* Ações Sugeridas */}
                        {insight.suggestedActions && insight.suggestedActions.length > 0 && (
                          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                            <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-2 flex items-center gap-1">
                              <Rocket className="w-3 h-3" />
                              Ações Sugeridas pela IA
                            </h4>
                            <ul className="space-y-1.5">
                              {insight.suggestedActions.map((action, idx) => (
                                <li key={idx} className="text-xs text-emerald-700 dark:text-emerald-400 flex items-start gap-2">
                                  <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center text-[10px] font-bold">
                                    {idx + 1}
                                  </span>
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Evidências */}
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Base de Evidências
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {insight.evidence.map((ev) => {
                              const typeIcon = {
                                meeting: MessageSquare,
                                decision: CheckCircle2,
                                risk: AlertTriangle,
                                data: BarChart3,
                              }[ev.type];
                              const TypeIcon = typeIcon;
                              const typeColor = {
                                meeting: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
                                decision: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
                                risk: "text-red-600 bg-red-50 dark:bg-red-950/30",
                                data: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
                              }[ev.type];

                              return (
                                <div
                                  key={ev.id}
                                  className={cn(
                                    "p-2 rounded-lg border border-border flex items-center gap-2",
                                    typeColor
                                  )}
                                >
                                  <TypeIcon className="w-3.5 h-3.5 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-xs font-medium truncate block">{ev.label}</span>
                                    {ev.date && (
                                      <span className="text-[10px] opacity-70">{formatDate(ev.date)}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Tags */}
                        {insight.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {insight.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Linked Items */}
                        {(insight.linkedProjects?.length || insight.linkedOKRs?.length || insight.linkedRisks?.length) && (
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              Elementos Vinculados
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {insight.linkedProjects?.map((p) => (
                                <span
                                  key={p.id}
                                  className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium flex items-center gap-1"
                                >
                                  <FolderKanban className="w-3 h-3" />
                                  {p.name}
                                </span>
                              ))}
                              {insight.linkedOKRs?.map((o) => (
                                <span
                                  key={o.id}
                                  className="px-2 py-1 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-medium flex items-center gap-1"
                                >
                                  <Target className="w-3 h-3" />
                                  {o.objective}
                                </span>
                              ))}
                              {insight.linkedRisks?.map((r) => (
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
                        {insight.meetingSource && (
                          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                            <h4 className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              Proveniência
                            </h4>
                            <p className="text-xs text-purple-600 dark:text-purple-400">{insight.meetingSource}</p>
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

