"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  AlertTriangle,
  Target,
  FolderKanban,
  Lightbulb,
  TrendingUp,
  Clock,
  Users,
  BarChart3,
  ArrowRight,
  ChevronRight,
  Shield,
  Zap,
  Activity,
} from "lucide-react";
import { api } from "@/lib/api";

// ============================================
// INTERFACES
// ============================================

interface Decision {
  id: string;
  value: string;
  description: string;
  validated: boolean | null; // null = pendente validação, true = validada, false = rejeitada
  relatedPerson: string;
  createdAt: string;
  meetingTitle: string;
  meetingDate: string;
  impact?: string;
  confidence: number;
  hasImplementation?: boolean; // Tem Tasks de implementação vinculadas?
  context?: "mine" | "area" | "subordinates" | "projects" | "critical"; // Contexto de relevância
}

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
  mitigation?: string;
  hasMitigation?: boolean; // Tem Tasks de mitigação vinculadas?
  context?: "mine" | "area" | "subordinates" | "projects" | "unmitigated";
}

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
  ownerName: string;
  blocked: boolean;
  overdue: boolean;
  linkedOkrIds: string[];
}

interface OKR {
  id: string;
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  status: "on_track" | "at_risk" | "behind";
  ownerName: string;
  deadline: string;
}

interface Insight {
  id: string;
  value: string;
  description: string;
  impact: "low" | "medium" | "high";
  validated: boolean | null;
  relatedPerson: string;
  createdAt: string;
  meetingTitle: string;
  meetingDate: string;
  hasAction?: boolean; // Tem Tasks ou Decisions derivadas?
  context?: "mine" | "area" | "subordinates" | "projects" | "unactioned";
}

interface DashboardMetrics {
  awaitingValidation: number; // Decision + Risk + Insight com validated: null (do ValidationFeed)
  criticalRisksUnmitigated: number; // Risk crítico sem mitigação
  okrsAtRisk: number;
  blockedProjects: number;
  insightsUnactioned: number; // Insight alto impacto sem ação
  recentChanges: number; // Delta 24h/7d
}

// ============================================
// MOCK DATA (será substituído por API)
// ============================================

// Mock data alinhado ao modelo: Decision é registro histórico
const MOCK_DECISIONS: Decision[] = [
  {
    id: "dec-1",
    value: "Aprovar orçamento adicional para projeto EKS",
    description: "Solicitação de R$ 150k para acelerar desenvolvimento",
    validated: null, // Aguardando validação no ValidationFeed
    relatedPerson: "Carlos Silva",
    createdAt: "2025-02-08T10:00:00Z",
    meetingTitle: "Reunião Q1 - Planejamento",
    meetingDate: "2025-02-08",
    impact: "Alto impacto no cronograma",
    confidence: 0.9,
    hasImplementation: false, // Sem Tasks de implementação
    context: "mine", // Ele decidiu
  },
  {
    id: "dec-2",
    value: "Expandir time de desenvolvimento em 3 pessoas",
    description: "Contratação para suportar aumento de demanda",
    validated: true, // Já validada
    relatedPerson: "Maria Santos",
    createdAt: "2025-02-07T14:30:00Z",
    meetingTitle: "Reunião de Recursos Humanos",
    meetingDate: "2025-02-07",
    confidence: 0.85,
    hasImplementation: false, // Sem Tasks de implementação (precisa de ação)
    context: "area", // Mesmo departamento
  },
  {
    id: "dec-3",
    value: "Mudar estratégia de pricing para Q2",
    description: "Ajuste baseado em análise de mercado",
    validated: true,
    relatedPerson: "João Pedro",
    createdAt: "2025-02-06T15:00:00Z",
    meetingTitle: "Reunião Estratégica",
    meetingDate: "2025-02-06",
    confidence: 0.92,
    hasImplementation: true, // Já tem Tasks vinculadas
    context: "projects", // Afeta projetos dele
  },
];

const MOCK_RISKS: Risk[] = [
  {
    id: "risk-1",
    value: "Atraso na entrega do Sprint 2",
    description: "Dependências externas podem atrasar desenvolvimento",
    severity: "critical",
    probability: "high",
    validated: true,
    relatedPerson: "João Pedro",
    createdAt: "2025-02-08T09:00:00Z",
    meetingTitle: "Daily Standup",
    meetingDate: "2025-02-08",
    mitigation: "Negociar prazos com fornecedores externos",
    hasMitigation: false, // Sem Tasks de mitigação (precisa de ação)
    context: "projects", // Afeta projetos dele
  },
  {
    id: "risk-2",
    value: "Resistência à mudança no processo de aprovação",
    description: "Equipes podem resistir ao novo fluxo automatizado",
    severity: "high",
    probability: "high",
    validated: true,
    relatedPerson: "Ana Costa",
    createdAt: "2025-02-07T16:00:00Z",
    meetingTitle: "Reunião de Alinhamento",
    meetingDate: "2025-02-07",
    hasMitigation: true, // Já tem mitigação em andamento
    context: "area", // Mesmo departamento
  },
  {
    id: "risk-3",
    value: "Perda de cliente estratégico",
    description: "Cliente principal pode não renovar contrato",
    severity: "critical",
    probability: "medium",
    validated: null, // Aguardando validação
    relatedPerson: "Carlos Silva",
    createdAt: "2025-02-09T11:00:00Z",
    meetingTitle: "Reunião Comercial",
    meetingDate: "2025-02-09",
    context: "mine", // Ele levantou
  },
];

const MOCK_PROJECTS: Project[] = [
  {
    id: "proj-1",
    name: "Implementação EKS",
    status: "in_progress",
    progress: 45,
    ownerName: "Carlos Silva",
    blocked: true,
    overdue: false,
    linkedOkrIds: ["okr-1"],
  },
  {
    id: "proj-2",
    name: "Automação de Processos",
    status: "in_progress",
    progress: 60,
    ownerName: "Maria Santos",
    blocked: false,
    overdue: true,
    linkedOkrIds: ["okr-2"],
  },
];

const MOCK_OKRS: OKR[] = [
  {
    id: "okr-1",
    title: "Reduzir tempo médio de atendimento",
    currentValue: 18,
    targetValue: 15,
    unit: "min",
    status: "at_risk",
    ownerName: "Maria Santos",
    deadline: "2025-03-31",
  },
  {
    id: "okr-2",
    title: "Automatizar 50 processos manuais",
    currentValue: 35,
    targetValue: 50,
    unit: "processos",
    status: "on_track",
    ownerName: "João Pedro",
    deadline: "2025-06-30",
  },
];

const MOCK_INSIGHTS: Insight[] = [
  {
    id: "ins-1",
    value: "Cliente demonstrou interesse em expansão",
    description: "Oportunidade de aumentar contrato em 40%",
    impact: "high",
    validated: true,
    relatedPerson: "Ana Costa",
    createdAt: "2025-02-08T11:00:00Z",
    meetingTitle: "Reunião Comercial Q1",
    meetingDate: "2025-02-08",
    hasAction: false, // Sem ação derivada (oportunidade perdida)
    context: "projects", // Pode beneficiar projetos dele
  },
  {
    id: "ins-2",
    value: "Processo de onboarding pode ser reduzido em 50%",
    description: "Análise mostra que etapas podem ser automatizadas",
    impact: "high",
    validated: true,
    relatedPerson: "Maria Santos",
    createdAt: "2025-02-07T14:00:00Z",
    meetingTitle: "Reunião de Processos",
    meetingDate: "2025-02-07",
    hasAction: true, // Já gerou Tasks
    context: "area", // Mesmo departamento
  },
];

// ============================================
// COMPONENT
// ============================================

export function ExecutiveConsolidatedView() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    pendingDecisions: 0,
    criticalRisks: 0,
    okrsAtRisk: 0,
    blockedProjects: 0,
    highImpactInsights: 0,
    recentChanges: 0,
  });

  // Carregar dados (mock por enquanto)
  useEffect(() => {
    // TODO: Substituir por chamadas reais à API
    const loadData = async () => {
      setLoading(true);
      try {
        // Simular delay de API
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Calcular métricas baseadas no modelo correto
        const awaitingValidation = 
          MOCK_DECISIONS.filter((d) => d.validated === null).length +
          MOCK_RISKS.filter((r) => r.validated === null).length +
          MOCK_INSIGHTS.filter((i) => i.validated === null).length;
        
        const criticalRisksUnmitigated = MOCK_RISKS.filter(
          (r) => r.validated === true && 
          (r.severity === "high" || r.severity === "critical") && 
          !r.hasMitigation
        ).length;

        const insightsUnactioned = MOCK_INSIGHTS.filter(
          (i) => i.validated === true && 
          i.impact === "high" && 
          !i.hasAction
        ).length;

        setMetrics({
          awaitingValidation,
          criticalRisksUnmitigated,
          okrsAtRisk: MOCK_OKRS.filter((o) => o.status === "at_risk" || o.status === "behind").length,
          blockedProjects: MOCK_PROJECTS.filter((p) => p.blocked).length,
          insightsUnactioned,
          recentChanges: 12, // Mock - será calculado com delta de datas
        });
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/30">
        <div className="animate-pulse text-muted-foreground">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-10 p-6 border-b border-border bg-card/80 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-primary" />
              Visão Consolidada
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Dashboard executivo com panorama geral e itens que precisam de atenção
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Última atualização</div>
            <div className="text-sm font-medium">{new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Métricas Principais (Tiles) */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard
            icon={CheckCircle2}
            label="Aguardando Validação"
            value={metrics.awaitingValidation}
            color="text-amber-600"
            bgColor="bg-amber-50 dark:bg-amber-950/30"
            onClick={() => {
              // TODO: Navegar para ValidationFeed ou subaba específica
            }}
          />
          <MetricCard
            icon={AlertTriangle}
            label="Riscos Sem Mitigação"
            value={metrics.criticalRisksUnmitigated}
            color="text-red-600"
            bgColor="bg-red-50 dark:bg-red-950/30"
            onClick={() => {
              // TODO: Navegar para subaba de Riscos
            }}
          />
          <MetricCard
            icon={Target}
            label="OKRs em Risco"
            value={metrics.okrsAtRisk}
            color="text-orange-600"
            bgColor="bg-orange-50 dark:bg-orange-950/30"
            onClick={() => {
              // TODO: Navegar para subaba de OKRs
            }}
          />
          <MetricCard
            icon={FolderKanban}
            label="Projetos Bloqueados"
            value={metrics.blockedProjects}
            color="text-purple-600"
            bgColor="bg-purple-50 dark:bg-purple-950/30"
            onClick={() => {
              // TODO: Navegar para subaba de Projetos
            }}
          />
          <MetricCard
            icon={Lightbulb}
            label="Insights Sem Ação"
            value={metrics.insightsUnactioned}
            color="text-cyan-600"
            bgColor="bg-cyan-50 dark:bg-cyan-950/30"
            onClick={() => {
              // TODO: Navegar para subaba de Insights
            }}
          />
          <MetricCard
            icon={TrendingUp}
            label="Mudanças Recentes"
            value={metrics.recentChanges}
            color="text-blue-600"
            bgColor="bg-blue-50 dark:bg-blue-950/30"
            onClick={() => {
              // TODO: Navegar para subaba de Mudanças
            }}
          />
        </div>

        {/* Grid Principal: 2 colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna Esquerda */}
          <div className="space-y-6">
            {/* Aguardando Minha Validação */}
            <SectionCard
              title="Aguardando Minha Validação"
              icon={CheckCircle2}
              count={MOCK_DECISIONS.filter((d) => d.validated === null).length + MOCK_RISKS.filter((r) => r.validated === null).length + MOCK_INSIGHTS.filter((i) => i.validated === null).length}
              emptyMessage="Nenhum item aguardando validação"
            >
              {[
                ...MOCK_DECISIONS.filter((d) => d.validated === null).map((d) => ({ ...d, type: "decision" as const })),
                ...MOCK_RISKS.filter((r) => r.validated === null).map((r) => ({ ...r, type: "risk" as const })),
                ...MOCK_INSIGHTS.filter((i) => i.validated === null).map((i) => ({ ...i, type: "insight" as const })),
              ].slice(0, 3).map((item) => (
                <ItemCard
                  key={item.id}
                  title={item.value}
                  description={item.description}
                  meta={`${item.relatedPerson} • ${formatDate(item.meetingDate)}`}
                  status={item.type === "decision" ? "Decisão" : item.type === "risk" ? "Risco" : "Insight"}
                  statusColor={
                    item.type === "decision" ? "bg-amber-100 text-amber-700" :
                    item.type === "risk" ? "bg-red-100 text-red-700" :
                    "bg-cyan-100 text-cyan-700"
                  }
                  source={item.meetingTitle}
                />
              ))}
            </SectionCard>

            {/* Decisões Sem Implementação */}
            <SectionCard
              title="Decisões Sem Implementação"
              icon={CheckCircle2}
              count={MOCK_DECISIONS.filter((d) => d.validated === true && !d.hasImplementation).length}
              emptyMessage="Todas as decisões têm implementação em andamento"
            >
              {MOCK_DECISIONS.filter((d) => d.validated === true && !d.hasImplementation).slice(0, 3).map((decision) => (
                <ItemCard
                  key={decision.id}
                  title={decision.value}
                  description={decision.description}
                  meta={`${decision.relatedPerson} • ${formatDate(decision.meetingDate)}`}
                  status="Sem Ação"
                  statusColor="bg-orange-100 text-orange-700"
                  source={decision.meetingTitle}
                />
              ))}
            </SectionCard>

            {/* Riscos Críticos Sem Mitigação */}
            <SectionCard
              title="Riscos Críticos Sem Mitigação"
              icon={AlertTriangle}
              count={MOCK_RISKS.filter((r) => r.validated === true && (r.severity === "high" || r.severity === "critical") && !r.hasMitigation).length}
              emptyMessage="Todos os riscos críticos têm mitigação em andamento"
            >
              {MOCK_RISKS.filter((r) => r.validated === true && (r.severity === "high" || r.severity === "critical") && !r.hasMitigation).slice(0, 3).map((risk) => (
                <ItemCard
                  key={risk.id}
                  title={risk.value}
                  description={risk.description}
                  meta={`${risk.relatedPerson} • ${formatDate(risk.meetingDate)} • Prob: ${risk.probability === "high" ? "Alta" : risk.probability === "medium" ? "Média" : "Baixa"}`}
                  status={risk.severity === "critical" ? "Crítico" : "Alto"}
                  statusColor={risk.severity === "critical" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}
                  source={risk.meetingTitle}
                />
              ))}
            </SectionCard>
          </div>

          {/* Coluna Direita */}
          <div className="space-y-6">
            {/* OKRs em Risco */}
            <SectionCard
              title="OKRs em Risco"
              icon={Target}
              count={MOCK_OKRS.filter((o) => o.status === "at_risk" || o.status === "behind").length}
              emptyMessage="Todos os OKRs estão no caminho certo"
            >
              {MOCK_OKRS.filter((o) => o.status === "at_risk" || o.status === "behind").slice(0, 3).map((okr) => {
                const progress = (okr.currentValue / okr.targetValue) * 100;
                return (
                  <ItemCard
                    key={okr.id}
                    title={okr.title}
                    description={`${okr.currentValue} / ${okr.targetValue} ${okr.unit} (${Math.round(progress)}%)`}
                    meta={`${okr.ownerName} • Prazo: ${formatDate(okr.deadline)}`}
                    status={okr.status === "at_risk" ? "Em Risco" : "Atrasado"}
                    statusColor={okr.status === "at_risk" ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}
                    progress={Math.min(progress, 100)}
                  />
                );
              })}
            </SectionCard>

            {/* Projetos Críticos */}
            <SectionCard
              title="Projetos Críticos"
              icon={FolderKanban}
              count={MOCK_PROJECTS.filter((p) => p.blocked || p.overdue).length}
              emptyMessage="Nenhum projeto crítico no momento"
            >
              {MOCK_PROJECTS.filter((p) => p.blocked || p.overdue).slice(0, 3).map((project) => (
                <ItemCard
                  key={project.id}
                  title={project.name}
                  description={`${project.progress}% concluído`}
                  meta={`${project.ownerName} • ${project.status}`}
                  status={project.blocked ? "Bloqueado" : project.overdue ? "Atrasado" : "Em Andamento"}
                  statusColor={project.blocked ? "bg-red-100 text-red-700" : project.overdue ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}
                  progress={project.progress}
                />
              ))}
            </SectionCard>
          </div>
        </div>

        {/* Insights Sem Ação (Full Width) */}
        <SectionCard
          title="Insights Sem Ação"
          icon={Lightbulb}
          count={MOCK_INSIGHTS.filter((i) => i.validated === true && i.impact === "high" && !i.hasAction).length}
          emptyMessage="Todos os insights de alto impacto têm ações derivadas"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_INSIGHTS.filter((i) => i.validated === true && i.impact === "high" && !i.hasAction).slice(0, 4).map((insight) => (
              <ItemCard
                key={insight.id}
                title={insight.value}
                description={insight.description}
                meta={`${insight.relatedPerson} • ${formatDate(insight.meetingDate)}`}
                status="Oportunidade"
                statusColor="bg-cyan-100 text-cyan-700"
                source={insight.meetingTitle}
              />
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  bgColor: string;
  onClick?: () => void;
}

function MetricCard({ icon: Icon, label, value, color, bgColor, onClick }: MetricCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border border-border bg-card hover:bg-card/80 transition-all text-left group",
        onClick && "cursor-pointer hover:shadow-md hover:border-primary/30"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={cn("p-2 rounded-lg", bgColor)}>
          <Icon className={cn("w-5 h-5", color)} />
        </div>
        {onClick && <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </button>
  );
}

interface SectionCardProps {
  title: string;
  icon: React.ElementType;
  count: number;
  emptyMessage: string;
  children: React.ReactNode;
}

function SectionCard({ title, icon: Icon, count, emptyMessage, children }: SectionCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card/80 backdrop-blur">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">{title}</h3>
        </div>
        {count > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">{count}</span>
        )}
      </div>
      <div className="p-4">
        {count === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{emptyMessage}</p>
        ) : (
          <div className="space-y-3">{children}</div>
        )}
      </div>
    </div>
  );
}

interface ItemCardProps {
  title: string;
  description: string;
  meta: string;
  status: string;
  statusColor: string;
  source?: string;
  progress?: number;
}

function ItemCard({ title, description, meta, status, statusColor, source, progress }: ItemCardProps) {
  return (
    <div className="p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-sm flex-1">{title}</h4>
        <span className={cn("text-xs px-2 py-0.5 rounded-full shrink-0", statusColor)}>{status}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{description}</p>
      {progress !== undefined && (
        <div className="mb-2">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{meta}</span>
        {source && (
          <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
            <Clock className="w-3 h-3" />
            {source}
          </span>
        )}
      </div>
    </div>
  );
}


