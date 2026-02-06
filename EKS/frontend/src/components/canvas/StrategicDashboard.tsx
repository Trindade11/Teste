"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  ChevronDown,
  Sparkles,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Activity,
  Zap,
  Users,
  MessageSquare,
  Brain,
  Calendar,
  Clock,
  ArrowRight,
  Link2,
  Lightbulb,
  FolderKanban,
  Shield,
  Gauge,
  Eye,
  Play,
  PieChart,
  GitBranch,
  History,
  Award,
  Flame,
  X,
} from "lucide-react";

// ============================================
// INTERFACES
// ============================================

interface OKR {
  id: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string;
  trend: "up" | "down" | "stable";
  owner: string;
  linkedProjects: { id: string; name: string }[];
  linkedInsights: { id: string; title: string }[];
  checkIns: { date: string; value: number; note?: string }[];
  confidence: number; // 0-100
}

interface StrategicRisk {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  probability: "low" | "medium" | "high";
  impact: string;
  mitigation?: string;
  linkedObjectiveId: string;
}

interface StrategicObjective {
  id: string;
  title: string;
  description: string;
  status: "on_track" | "at_risk" | "behind" | "achieved";
  progress: number;
  okrs: OKR[];
  knowledgeCoverage: number;
  memoryDistribution: {
    semantic: number;
    episodic: number;
    procedural: number;
    evaluative: number;
  };
  owner: string;
  team: string[];
  startDate: string;
  targetDate: string;
  linkedProjects: { id: string; name: string; progress: number }[];
  risks: StrategicRisk[];
  aiRecommendations: string[];
}

interface StrategicArea {
  id: string;
  name: string;
  description: string;
  initiativeCount: number;
  knowledgeCount: number;
  color: string;
  objectiveIds: string[];
  health: number;
}

interface StrategicHealth {
  overall: number;
  trend: "improving" | "stable" | "declining";
  onTrackCount: number;
  atRiskCount: number;
  behindCount: number;
  achievedCount: number;
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_OBJECTIVES: StrategicObjective[] = [
  {
    id: "obj-1",
    title: "Aumentar eficiência operacional",
    description: "Reduzir tempo de processos e aumentar produtividade da equipe através de automação e otimização de fluxos de trabalho",
    status: "on_track",
    progress: 70,
    knowledgeCoverage: 85,
    memoryDistribution: { semantic: 30, episodic: 25, procedural: 35, evaluative: 10 },
    owner: "Carlos Silva",
    team: ["Maria Santos", "João Pedro", "Ana Costa"],
    startDate: "2025-01-01",
    targetDate: "2025-06-30",
    linkedProjects: [
      { id: "proj-1", name: "Implementação EKS", progress: 45 },
      { id: "proj-2", name: "Automação de Processos", progress: 60 },
    ],
    risks: [
      { id: "r1", title: "Resistência à mudança", description: "Equipes podem resistir a novos processos", severity: "medium", probability: "medium", impact: "Atraso na adoção", mitigation: "Programa de change management", linkedObjectiveId: "obj-1" },
    ],
    aiRecommendations: [
      "Priorizar automação do processo de aprovação (ganho estimado: 15h/semana)",
      "Considerar treinamento adicional em Neo4j para acelerar Sprint 2",
    ],
    okrs: [
      { 
        id: "okr-1-1", 
        title: "Reduzir tempo médio de atendimento", 
        description: "Diminuir o tempo de resposta ao cliente interno",
        targetValue: 15, 
        currentValue: 18, 
        unit: "min", 
        deadline: "Q1 2025", 
        trend: "down",
        owner: "Maria Santos",
        linkedProjects: [{ id: "proj-1", name: "Implementação EKS" }],
        linkedInsights: [{ id: "ins-2", title: "Processo de aprovação pode ser otimizado" }],
        checkIns: [
          { date: "2025-01-15", value: 22, note: "Baseline inicial" },
          { date: "2025-01-31", value: 20, note: "Primeiras melhorias" },
          { date: "2025-02-01", value: 18, note: "Novo fluxo implementado" },
        ],
        confidence: 75,
      },
      { 
        id: "okr-1-2", 
        title: "Automatizar 50 processos manuais", 
        description: "Identificar e automatizar processos repetitivos",
        targetValue: 50, 
        currentValue: 35, 
        unit: "processos", 
        deadline: "Q2 2025", 
        trend: "up",
        owner: "João Pedro",
        linkedProjects: [{ id: "proj-2", name: "Automação de Processos" }],
        linkedInsights: [{ id: "ins-3", title: "Oportunidade de automação identificada" }],
        checkIns: [
          { date: "2025-01-15", value: 20 },
          { date: "2025-01-31", value: 28 },
          { date: "2025-02-01", value: 35, note: "Boa evolução" },
        ],
        confidence: 85,
      },
      { 
        id: "okr-1-3", 
        title: "Taxa de retrabalho < 5%", 
        description: "Reduzir erros que geram retrabalho",
        targetValue: 5, 
        currentValue: 7, 
        unit: "%", 
        deadline: "Q1 2025", 
        trend: "down",
        owner: "Ana Costa",
        linkedProjects: [],
        linkedInsights: [],
        checkIns: [
          { date: "2025-01-15", value: 12 },
          { date: "2025-01-31", value: 9 },
          { date: "2025-02-01", value: 7 },
        ],
        confidence: 60,
      },
    ],
  },
  {
    id: "obj-2",
    title: "Expandir base de conhecimento",
    description: "Capturar, estruturar e disseminar conhecimento organizacional crítico para toda a empresa",
    status: "at_risk",
    progress: 45,
    knowledgeCoverage: 45,
    memoryDistribution: { semantic: 45, episodic: 20, procedural: 20, evaluative: 15 },
    owner: "Maria Santos",
    team: ["Carlos Silva", "Paula Mendes"],
    startDate: "2025-01-01",
    targetDate: "2025-06-30",
    linkedProjects: [
      { id: "proj-1", name: "Implementação EKS", progress: 45 },
    ],
    risks: [
      { id: "r2", title: "Baixa adesão ao onboarding", description: "Colaboradores não completam o treinamento", severity: "high", probability: "medium", impact: "Conhecimento não é utilizado", mitigation: "Gamificação e incentivos", linkedObjectiveId: "obj-2" },
      { id: "r3", title: "Qualidade dos dados", description: "Conhecimento inserido sem curadoria adequada", severity: "medium", probability: "high", impact: "Base poluída", mitigation: "Curador ontológico dedicado", linkedObjectiveId: "obj-2" },
    ],
    aiRecommendations: [
      "Agendar sessões de documentação com áreas críticas (Comercial, Operações)",
      "Implementar validação obrigatória para novos conhecimentos",
    ],
    okrs: [
      { 
        id: "okr-2-1", 
        title: "Documentar 100 processos críticos", 
        description: "Mapear e documentar processos essenciais",
        targetValue: 100, 
        currentValue: 45, 
        unit: "docs", 
        deadline: "Q2 2025", 
        trend: "up",
        owner: "Paula Mendes",
        linkedProjects: [{ id: "proj-1", name: "Implementação EKS" }],
        linkedInsights: [],
        checkIns: [
          { date: "2025-01-15", value: 20 },
          { date: "2025-01-31", value: 35 },
          { date: "2025-02-01", value: 45 },
        ],
        confidence: 70,
      },
      { 
        id: "okr-2-2", 
        title: "Onboarding 100% do time", 
        description: "Todos os colaboradores treinados na plataforma",
        targetValue: 100, 
        currentValue: 31, 
        unit: "%", 
        deadline: "Q1 2025", 
        trend: "stable",
        owner: "Maria Santos",
        linkedProjects: [],
        linkedInsights: [],
        checkIns: [
          { date: "2025-01-15", value: 15 },
          { date: "2025-01-31", value: 28 },
          { date: "2025-02-01", value: 31, note: "Precisa acelerar" },
        ],
        confidence: 40,
      },
    ],
  },
  {
    id: "obj-3",
    title: "Acelerar tomada de decisão",
    description: "Fornecer insights em tempo real para decisões estratégicas através de análise inteligente de dados",
    status: "behind",
    progress: 30,
    knowledgeCoverage: 35,
    memoryDistribution: { semantic: 20, episodic: 40, procedural: 15, evaluative: 25 },
    owner: "João Pedro",
    team: ["Ana Costa"],
    startDate: "2025-01-15",
    targetDate: "2025-06-30",
    linkedProjects: [
      { id: "proj-1", name: "Implementação EKS", progress: 45 },
    ],
    risks: [
      { id: "r4", title: "Dependência do módulo de IA", description: "Insights dependem de features ainda não implementadas", severity: "high", probability: "high", impact: "Atraso significativo", mitigation: "MVP com regras básicas primeiro", linkedObjectiveId: "obj-3" },
    ],
    aiRecommendations: [
      "Começar com dashboards estáticos enquanto IA é desenvolvida",
      "Coletar feedback dos decisores sobre tipos de insight mais valiosos",
    ],
    okrs: [
      { 
        id: "okr-3-1", 
        title: "Tempo médio de decisão < 24h", 
        description: "Reduzir tempo entre identificação de problema e decisão",
        targetValue: 24, 
        currentValue: 48, 
        unit: "h", 
        deadline: "Q2 2025", 
        trend: "stable",
        owner: "João Pedro",
        linkedProjects: [{ id: "proj-1", name: "Implementação EKS" }],
        linkedInsights: [],
        checkIns: [
          { date: "2025-01-15", value: 72 },
          { date: "2025-01-31", value: 52 },
          { date: "2025-02-01", value: 48 },
        ],
        confidence: 45,
      },
      { 
        id: "okr-3-2", 
        title: "Insights acionáveis por semana", 
        description: "Gerar insights que levem a ações concretas",
        targetValue: 10, 
        currentValue: 4, 
        unit: "insights", 
        deadline: "Q1 2025", 
        trend: "up",
        owner: "Ana Costa",
        linkedProjects: [],
        linkedInsights: [{ id: "ins-1", title: "Cliente demonstrou interesse em expansão" }],
        checkIns: [
          { date: "2025-01-15", value: 1 },
          { date: "2025-01-31", value: 3 },
          { date: "2025-02-01", value: 4 },
        ],
        confidence: 55,
      },
    ],
  },
];

const MOCK_STRATEGIC_AREAS: StrategicArea[] = [
  { id: "area-1", name: "Eficiência Operacional", description: "Otimização de processos internos", initiativeCount: 12, knowledgeCount: 156, color: "#3b82f6", objectiveIds: ["obj-1"], health: 78 },
  { id: "area-2", name: "Inteligência de Decisão", description: "Dados e insights para gestão", initiativeCount: 5, knowledgeCount: 89, color: "#8b5cf6", objectiveIds: ["obj-3"], health: 45 },
  { id: "area-3", name: "Gestão do Conhecimento", description: "Captura e disseminação de conhecimento", initiativeCount: 8, knowledgeCount: 234, color: "#10b981", objectiveIds: ["obj-2"], health: 62 },
  { id: "area-4", name: "Experiência do Cliente", description: "Satisfação e fidelização", initiativeCount: 6, knowledgeCount: 78, color: "#f59e0b", objectiveIds: [], health: 85 },
];

const MOCK_HEALTH: StrategicHealth = {
  overall: 65,
  trend: "stable",
  onTrackCount: 1,
  atRiskCount: 1,
  behindCount: 1,
  achievedCount: 0,
};

// ============================================
// COMPONENTES AUXILIARES
// ============================================

const StatusBadge = ({ status }: { status: StrategicObjective["status"] }) => {
  const config = {
    on_track: { label: "No prazo", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
    at_risk: { label: "Em risco", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: AlertTriangle },
    behind: { label: "Atrasado", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertTriangle },
    achieved: { label: "Alcançado", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Award },
  };
  const { label, color, icon: Icon } = config[status];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", color)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

const TrendIcon = ({ trend, size = 4 }: { trend: OKR["trend"]; size?: number }) => {
  if (trend === "up") return <TrendingUp className={`w-${size} h-${size} text-green-500`} />;
  if (trend === "down") return <TrendingDown className={`w-${size} h-${size} text-red-500`} />;
  return <Minus className={`w-${size} h-${size} text-gray-400`} />;
};

const ProgressRing = ({ progress, size = 60, strokeWidth = 6 }: { progress: number; size?: number; strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  const color = progress >= 70 ? "#22c55e" : progress >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="none" className="text-muted/20" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-500" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold">{progress}%</span>
      </div>
    </div>
  );
};

const MemoryDistributionBar = ({ distribution }: { distribution: StrategicObjective["memoryDistribution"] }) => {
  const total = distribution.semantic + distribution.episodic + distribution.procedural + distribution.evaluative;
  return (
    <div className="flex h-2 rounded-full overflow-hidden">
      <div className="bg-cyan-500" style={{ width: `${(distribution.semantic / total) * 100}%` }} title="Semântica" />
      <div className="bg-purple-500" style={{ width: `${(distribution.episodic / total) * 100}%` }} title="Episódica" />
      <div className="bg-green-500" style={{ width: `${(distribution.procedural / total) * 100}%` }} title="Procedural" />
      <div className="bg-amber-500" style={{ width: `${(distribution.evaluative / total) * 100}%` }} title="Avaliativa" />
    </div>
  );
};

const ConfidenceMeter = ({ confidence }: { confidence: number }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            confidence >= 70 ? "bg-green-500" : confidence >= 40 ? "bg-amber-500" : "bg-red-500"
          )}
          style={{ width: `${confidence}%` }}
        />
      </div>
      <span className={cn(
        "text-xs font-medium",
        confidence >= 70 ? "text-green-600" : confidence >= 40 ? "text-amber-600" : "text-red-600"
      )}>
        {confidence}%
      </span>
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

type ViewMode = "overview" | "okrs" | "risks" | "memory";

export function StrategicDashboard() {
  const [selectedObjective, setSelectedObjective] = useState<StrategicObjective | null>(null);
  const [selectedOKR, setSelectedOKR] = useState<OKR | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("overview");

  // Cálculos agregados
  const avgProgress = Math.round(MOCK_OBJECTIVES.reduce((sum, obj) => sum + obj.progress, 0) / MOCK_OBJECTIVES.length);
  const totalOKRs = MOCK_OBJECTIVES.reduce((sum, obj) => sum + obj.okrs.length, 0);
  const avgCoverage = Math.round(MOCK_OBJECTIVES.reduce((sum, obj) => sum + obj.knowledgeCoverage, 0) / MOCK_OBJECTIVES.length);
  const totalRisks = MOCK_OBJECTIVES.reduce((sum, obj) => sum + obj.risks.length, 0);
  const highRisks = MOCK_OBJECTIVES.reduce((sum, obj) => sum + obj.risks.filter(r => r.severity === "high" || r.severity === "critical").length, 0);

  // Calcular confiança média dos OKRs
  const allOKRs = MOCK_OBJECTIVES.flatMap(obj => obj.okrs);
  const avgConfidence = Math.round(allOKRs.reduce((sum, okr) => sum + okr.confidence, 0) / allOKRs.length);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header Executivo */}
      <div className="p-6 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Target className="w-7 h-7 text-primary" />
              Estratégia Organizacional
            </h2>
            <p className="text-muted-foreground mt-1">
              Visão executiva dos objetivos estratégicos e OKRs
            </p>
          </div>
          
          {/* Health Score Card */}
          <div className="flex items-center gap-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
            <div className="text-center">
              <div className={cn(
                "text-4xl font-bold",
                MOCK_HEALTH.overall >= 70 ? "text-green-500" :
                MOCK_HEALTH.overall >= 50 ? "text-amber-500" : "text-red-500"
              )}>
                {MOCK_HEALTH.overall}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 justify-center mt-1">
                {MOCK_HEALTH.trend === "improving" ? <TrendingUp className="w-3 h-3 text-green-500" /> :
                 MOCK_HEALTH.trend === "declining" ? <TrendingDown className="w-3 h-3 text-red-500" /> :
                 <Minus className="w-3 h-3 text-gray-400" />}
                Saúde Estratégica
              </div>
            </div>
            <div className="h-12 w-px bg-border/50" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">No prazo:</span>
                <span className="font-semibold">{MOCK_HEALTH.onTrackCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">Em risco:</span>
                <span className="font-semibold">{MOCK_HEALTH.atRiskCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-muted-foreground">Atrasado:</span>
                <span className="font-semibold">{MOCK_HEALTH.behindCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Alcançado:</span>
                <span className="font-semibold">{MOCK_HEALTH.achievedCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="flex items-center gap-8 mt-4 p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{avgProgress}%</div>
              <div className="text-xs text-muted-foreground">Progresso Geral</div>
            </div>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{MOCK_OBJECTIVES.length}</div>
              <div className="text-xs text-muted-foreground">Objetivos</div>
            </div>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Gauge className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalOKRs}</div>
              <div className="text-xs text-muted-foreground">OKRs</div>
            </div>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Brain className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{avgCoverage}%</div>
              <div className="text-xs text-muted-foreground">Cobertura</div>
            </div>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <Activity className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{avgConfidence}%</div>
              <div className="text-xs text-muted-foreground">Confiança</div>
            </div>
          </div>
          {highRisks > 0 && (
            <>
              <div className="h-10 w-px bg-border" />
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-500">{highRisks}</div>
                  <div className="text-xs text-muted-foreground">Riscos Altos</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mt-4">
          {[
            { id: "overview", label: "Visão Geral", icon: BarChart3 },
            { id: "okrs", label: "OKRs Detalhados", icon: Target },
            { id: "risks", label: "Riscos", icon: Shield, count: totalRisks },
            { id: "memory", label: "Memória", icon: Brain },
          ].map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => { setViewMode(id as ViewMode); setSelectedObjective(null); setSelectedOKR(null); }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative",
                viewMode === id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
              {count !== undefined && count > 0 && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  viewMode === id ? "bg-white/20" : "bg-muted"
                )}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {viewMode === "overview" && (
          <div className="grid grid-cols-12 gap-6">
            {/* Objetivos Estratégicos - Grid principal */}
            <div className="col-span-8 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Objetivos Estratégicos
              </h3>
              
              {MOCK_OBJECTIVES.map((objective) => (
                <div
                  key={objective.id}
                  onClick={() => setSelectedObjective(selectedObjective?.id === objective.id ? null : objective)}
                  className={cn(
                    "p-5 rounded-xl border bg-card/80 backdrop-blur cursor-pointer transition-all hover:shadow-lg",
                    selectedObjective?.id === objective.id && "ring-2 ring-primary border-primary"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <ProgressRing progress={objective.progress} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-lg">{objective.title}</h4>
                        <StatusBadge status={objective.status} />
                        {objective.risks.some(r => r.severity === "high" || r.severity === "critical") && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Risco Alto
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{objective.description}</p>
                      
                      {/* Meta info */}
                      <div className="flex items-center gap-4 text-sm mb-3">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          {objective.owner}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {objective.startDate} → {objective.targetDate}
                        </span>
                      </div>
                      
                      {/* Quick stats */}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Target className="w-4 h-4" />
                          {objective.okrs.length} OKRs
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Brain className="w-4 h-4" />
                          {objective.knowledgeCoverage}% cobertura
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <FolderKanban className="w-4 h-4" />
                          {objective.linkedProjects.length} projetos
                        </span>
                        {objective.risks.length > 0 && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <Shield className="w-4 h-4" />
                            {objective.risks.length} riscos
                          </span>
                        )}
                      </div>

                      {/* Memory Distribution */}
                      <div className="mt-3">
                        <MemoryDistributionBar distribution={objective.memoryDistribution} />
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500" /> Semântica</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Episódica</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Procedural</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Avaliativa</span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className={cn(
                      "w-5 h-5 text-muted-foreground transition-transform shrink-0",
                      selectedObjective?.id === objective.id && "rotate-90"
                    )} />
                  </div>

                  {/* Expanded Content */}
                  {selectedObjective?.id === objective.id && (
                    <div className="mt-4 pt-4 border-t border-border space-y-4">
                      {/* AI Recommendations */}
                      {objective.aiRecommendations.length > 0 && (
                        <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
                          <h5 className="text-sm font-medium flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-purple-500" />
                            Recomendações da IA
                          </h5>
                          <ul className="space-y-1">
                            {objective.aiRecommendations.map((rec, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <ArrowRight className="w-3 h-3 mt-1 text-purple-500 shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Linked Projects */}
                      {objective.linkedProjects.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium flex items-center gap-2 mb-2">
                            <FolderKanban className="w-4 h-4 text-blue-500" />
                            Projetos Vinculados
                          </h5>
                          <div className="flex gap-2">
                            {objective.linkedProjects.map((proj) => (
                              <div key={proj.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30">
                                <span className="text-sm">{proj.name}</span>
                                <span className={cn(
                                  "text-xs px-1.5 py-0.5 rounded",
                                  proj.progress >= 70 ? "bg-green-100 text-green-700" :
                                  proj.progress >= 40 ? "bg-amber-100 text-amber-700" :
                                  "bg-red-100 text-red-700"
                                )}>
                                  {proj.progress}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* OKRs */}
                      <div>
                        <h5 className="text-sm font-medium flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-green-500" />
                          Key Results
                        </h5>
                        <div className="space-y-3">
                          {objective.okrs.map((okr) => {
                            const progress = Math.min(100, Math.round((okr.currentValue / okr.targetValue) * 100));
                            return (
                              <div 
                                key={okr.id} 
                                className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                                onClick={(e) => { e.stopPropagation(); setSelectedOKR(selectedOKR?.id === okr.id ? null : okr); }}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-sm">{okr.title}</span>
                                      <TrendIcon trend={okr.trend} />
                                    </div>
                                    {okr.description && (
                                      <p className="text-xs text-muted-foreground">{okr.description}</p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-sm">
                                      {okr.currentValue}/{okr.targetValue} {okr.unit}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{okr.deadline}</div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                                      <div
                                        className={cn(
                                          "h-full rounded-full transition-all",
                                          progress >= 100 ? "bg-green-500" : progress >= 70 ? "bg-blue-500" : progress >= 40 ? "bg-amber-500" : "bg-red-500"
                                        )}
                                        style={{ width: `${Math.min(100, progress)}%` }}
                                      />
                                    </div>
                                  </div>
                                  <div className="w-20">
                                    <ConfidenceMeter confidence={okr.confidence} />
                                  </div>
                                </div>

                                {/* OKR Expanded */}
                                {selectedOKR?.id === okr.id && (
                                  <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
                                    <div className="flex items-center gap-4 text-xs">
                                      <span className="flex items-center gap-1 text-muted-foreground">
                                        <Users className="w-3 h-3" />
                                        {okr.owner}
                                      </span>
                                    </div>

                                    {/* Check-ins */}
                                    {okr.checkIns.length > 0 && (
                                      <div>
                                        <div className="text-xs font-medium mb-2 flex items-center gap-1">
                                          <History className="w-3 h-3" />
                                          Histórico de Check-ins
                                        </div>
                                        <div className="flex gap-2">
                                          {okr.checkIns.slice(-5).map((checkIn, i) => (
                                            <div key={i} className="text-center p-2 rounded bg-muted/50 min-w-[60px]">
                                              <div className="text-sm font-bold">{checkIn.value}</div>
                                              <div className="text-xs text-muted-foreground">{checkIn.date.slice(5)}</div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Linked items */}
                                    <div className="flex gap-4">
                                      {okr.linkedProjects.length > 0 && (
                                        <div className="flex items-center gap-1 text-xs text-blue-600">
                                          <FolderKanban className="w-3 h-3" />
                                          {okr.linkedProjects.length} projeto(s)
                                        </div>
                                      )}
                                      {okr.linkedInsights.length > 0 && (
                                        <div className="flex items-center gap-1 text-xs text-amber-600">
                                          <Lightbulb className="w-3 h-3" />
                                          {okr.linkedInsights.length} insight(s)
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Sidebar direita */}
            <div className="col-span-4 space-y-6">
              {/* Macroáreas Estratégicas */}
              <div className="p-5 rounded-xl border bg-card/80 backdrop-blur">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-purple-500" />
                  Macroáreas Estratégicas
                </h3>
                <div className="space-y-3">
                  {MOCK_STRATEGIC_AREAS.map((area) => (
                    <div
                      key={area.id}
                      className="p-3 rounded-lg border border-border/50 hover:border-border transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: area.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm truncate">{area.name}</div>
                            <span className={cn(
                              "text-xs font-semibold",
                              area.health >= 70 ? "text-green-600" :
                              area.health >= 50 ? "text-amber-600" : "text-red-600"
                            )}>
                              {area.health}%
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">{area.description}</div>
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            area.health >= 70 ? "bg-green-500" :
                            area.health >= 50 ? "bg-amber-500" : "bg-red-500"
                          )}
                          style={{ width: `${area.health}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {area.initiativeCount} iniciativas
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {area.knowledgeCount} conhecimentos
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-5 rounded-xl border bg-card/80 backdrop-blur">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">AÇÕES RÁPIDAS</h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-2 p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium">
                    <MessageSquare className="w-4 h-4" />
                    Conversar sobre Estratégia
                  </button>
                  <button className="w-full flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm">
                    <Target className="w-4 h-4" />
                    Novo OKR
                  </button>
                  <button className="w-full flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm">
                    <Users className="w-4 h-4" />
                    Ver Responsáveis
                  </button>
                </div>
              </div>

              {/* AI Insights */}
              <div className="p-5 rounded-xl border bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  INSIGHTS DA IA
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="p-2 rounded bg-white/50 dark:bg-black/20">
                    <span className="text-amber-600 font-medium">⚠️</span> Objetivo "Expandir base de conhecimento" precisa de atenção
                  </div>
                  <div className="p-2 rounded bg-white/50 dark:bg-black/20">
                    <span className="text-green-600 font-medium">✓</span> Automação de processos está 15% acima da meta
                  </div>
                  <div className="p-2 rounded bg-white/50 dark:bg-black/20">
                    <span className="text-blue-600 font-medium">💡</span> 3 insights podem acelerar decisões
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === "okrs" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-green-500" />
                Todos os OKRs
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> ≥100%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> ≥70%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> ≥40%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> &lt;40%</span>
              </div>
            </div>
            
            {MOCK_OBJECTIVES.map((objective) => (
              <div key={objective.id} className="p-5 rounded-xl border bg-card/80 backdrop-blur">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={objective.status} />
                    <h4 className="font-semibold">{objective.title}</h4>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {objective.owner}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {objective.okrs.map((okr) => {
                    const progress = Math.min(100, Math.round((okr.currentValue / okr.targetValue) * 100));
                    return (
                      <div 
                        key={okr.id} 
                        className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedOKR(selectedOKR?.id === okr.id ? null : okr)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{okr.title}</span>
                          <TrendIcon trend={okr.trend} />
                        </div>
                        <div className="flex items-end gap-2 mb-2">
                          <span className="text-2xl font-bold">{okr.currentValue}</span>
                          <span className="text-muted-foreground text-sm mb-1">/ {okr.targetValue} {okr.unit}</span>
                        </div>
                        <div className="h-2 bg-muted/50 rounded-full overflow-hidden mb-2">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              progress >= 100 ? "bg-green-500" : progress >= 70 ? "bg-blue-500" : progress >= 40 ? "bg-amber-500" : "bg-red-500"
                            )}
                            style={{ width: `${Math.min(100, progress)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Prazo: {okr.deadline}</span>
                          <span className={cn(
                            "font-medium",
                            okr.confidence >= 70 ? "text-green-600" : okr.confidence >= 40 ? "text-amber-600" : "text-red-600"
                          )}>
                            Confiança: {okr.confidence}%
                          </span>
                        </div>
                        
                        {/* OKR Detail Expansion */}
                        {selectedOKR?.id === okr.id && (
                          <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">Responsável:</span> {okr.owner}
                            </div>
                            {okr.description && (
                              <p className="text-sm text-muted-foreground">{okr.description}</p>
                            )}
                            
                            {/* Check-in chart */}
                            {okr.checkIns.length > 0 && (
                              <div>
                                <div className="text-xs font-medium mb-2">Evolução</div>
                                <div className="flex items-end gap-1 h-12">
                                  {okr.checkIns.map((ci, i) => {
                                    const height = (ci.value / okr.targetValue) * 100;
                                    return (
                                      <div
                                        key={i}
                                        className={cn(
                                          "flex-1 rounded-t transition-all",
                                          height >= 100 ? "bg-green-500" : height >= 70 ? "bg-blue-500" : height >= 40 ? "bg-amber-500" : "bg-red-500"
                                        )}
                                        style={{ height: `${Math.min(100, height)}%` }}
                                        title={`${ci.date}: ${ci.value}`}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Links */}
                            <div className="flex flex-wrap gap-2">
                              {okr.linkedProjects.map((proj) => (
                                <span key={proj.id} className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                                  <FolderKanban className="w-3 h-3 inline mr-1" />
                                  {proj.name}
                                </span>
                              ))}
                              {okr.linkedInsights.map((ins) => (
                                <span key={ins.id} className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700">
                                  <Lightbulb className="w-3 h-3 inline mr-1" />
                                  {ins.title}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === "risks" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-500" />
                Riscos Estratégicos
              </h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-red-500" />
                  Crítico/Alto: {MOCK_OBJECTIVES.reduce((sum, obj) => sum + obj.risks.filter(r => r.severity === "high" || r.severity === "critical").length, 0)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-amber-500" />
                  Médio: {MOCK_OBJECTIVES.reduce((sum, obj) => sum + obj.risks.filter(r => r.severity === "medium").length, 0)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-8 space-y-4">
                {MOCK_OBJECTIVES.map((objective) => (
                  objective.risks.length > 0 && (
                    <div key={objective.id} className="p-5 rounded-xl border bg-card/80 backdrop-blur">
                      <div className="flex items-center gap-3 mb-4">
                        <StatusBadge status={objective.status} />
                        <h4 className="font-semibold">{objective.title}</h4>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {objective.risks.length} risco(s)
                        </span>
                      </div>
                      <div className="space-y-3">
                        {objective.risks.map((risk) => (
                          <div key={risk.id} className={cn(
                            "p-4 rounded-lg border",
                            risk.severity === "critical" ? "border-red-300 bg-red-50 dark:bg-red-950/20" :
                            risk.severity === "high" ? "border-orange-300 bg-orange-50 dark:bg-orange-950/20" :
                            risk.severity === "medium" ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20" :
                            "border-green-300 bg-green-50 dark:bg-green-950/20"
                          )}>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={cn(
                                    "text-xs px-2 py-0.5 rounded",
                                    risk.severity === "critical" ? "bg-red-200 text-red-800" :
                                    risk.severity === "high" ? "bg-orange-200 text-orange-800" :
                                    risk.severity === "medium" ? "bg-amber-200 text-amber-800" :
                                    "bg-green-200 text-green-800"
                                  )}>
                                    {risk.severity === "critical" ? "Crítico" : risk.severity === "high" ? "Alto" : risk.severity === "medium" ? "Médio" : "Baixo"}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Prob: {risk.probability === "high" ? "Alta" : risk.probability === "medium" ? "Média" : "Baixa"}
                                  </span>
                                </div>
                                <h5 className="font-semibold">{risk.title}</h5>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{risk.description}</p>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="p-2 rounded bg-red-100/50 dark:bg-red-950/30">
                                <div className="text-xs text-muted-foreground mb-1">Impacto</div>
                                <div>{risk.impact}</div>
                              </div>
                              {risk.mitigation && (
                                <div className="p-2 rounded bg-green-100/50 dark:bg-green-950/30">
                                  <div className="text-xs text-muted-foreground mb-1">Mitigação</div>
                                  <div>{risk.mitigation}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>

              <div className="col-span-4">
                <div className="p-5 rounded-xl border bg-card/80 backdrop-blur sticky top-0">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-4">MATRIZ DE RISCOS</h4>
                  <div className="grid grid-cols-3 gap-1 mb-4">
                    <div className="text-xs text-center text-muted-foreground"></div>
                    <div className="text-xs text-center text-muted-foreground col-span-2">Probabilidade</div>
                    <div className="text-xs text-muted-foreground writing-mode-vertical">Impacto</div>
                    <div className="grid grid-cols-3 gap-1 col-span-2">
                      {["Baixa", "Média", "Alta"].map((prob) => (
                        <div key={prob} className="text-xs text-center text-muted-foreground">{prob}</div>
                      ))}
                      {[["low", "low"], ["low", "medium"], ["medium", "medium"],
                        ["low", "medium"], ["medium", "high"], ["high", "high"],
                        ["medium", "high"], ["high", "critical"], ["critical", "critical"]].map(([sev], i) => (
                        <div key={i} className={cn(
                          "h-8 rounded flex items-center justify-center text-xs font-bold",
                          sev === "critical" ? "bg-red-500 text-white" :
                          sev === "high" ? "bg-orange-400 text-white" :
                          sev === "medium" ? "bg-amber-300" : "bg-green-300"
                        )}>
                          {MOCK_OBJECTIVES.flatMap(o => o.risks).filter(r => {
                            const probIdx = ["low", "medium", "high"].indexOf(r.probability);
                            const sevIdx = ["low", "medium", "high", "critical"].indexOf(r.severity);
                            return i === probIdx + (2 - Math.min(2, sevIdx)) * 3;
                          }).length || ""}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="p-2 rounded bg-muted/30">
                      <div className="font-medium">Recomendação</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Priorize mitigação dos riscos de alta severidade no objetivo "Acelerar tomada de decisão"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === "memory" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="w-5 h-5 text-emerald-500" />
                Distribuição de Memória
              </h3>
              <div className="text-sm text-muted-foreground">
                Cobertura média: <span className="font-bold text-emerald-600">{avgCoverage}%</span>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              {/* Memory Overview */}
              <div className="col-span-8 space-y-4">
                <div className="p-5 rounded-xl border bg-card/80 backdrop-blur">
                  <h4 className="font-semibold mb-4">Classes de Memória por Objetivo</h4>
                  <div className="space-y-6">
                    {MOCK_OBJECTIVES.map((objective) => {
                      const total = Object.values(objective.memoryDistribution).reduce((a, b) => a + b, 0);
                      return (
                        <div key={objective.id}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h5 className="font-medium">{objective.title}</h5>
                              <StatusBadge status={objective.status} />
                            </div>
                            <span className={cn(
                              "text-sm font-semibold",
                              objective.knowledgeCoverage >= 70 ? "text-green-600" :
                              objective.knowledgeCoverage >= 50 ? "text-amber-600" : "text-red-600"
                            )}>
                              {objective.knowledgeCoverage}% cobertura
                            </span>
                          </div>
                          <div className="flex h-8 rounded-lg overflow-hidden mb-2">
                            <div 
                              className="bg-cyan-500 flex items-center justify-center text-xs font-medium text-white"
                              style={{ width: `${(objective.memoryDistribution.semantic / total) * 100}%` }}
                            >
                              {objective.memoryDistribution.semantic}%
                            </div>
                            <div 
                              className="bg-purple-500 flex items-center justify-center text-xs font-medium text-white"
                              style={{ width: `${(objective.memoryDistribution.episodic / total) * 100}%` }}
                            >
                              {objective.memoryDistribution.episodic}%
                            </div>
                            <div 
                              className="bg-green-500 flex items-center justify-center text-xs font-medium text-white"
                              style={{ width: `${(objective.memoryDistribution.procedural / total) * 100}%` }}
                            >
                              {objective.memoryDistribution.procedural}%
                            </div>
                            <div 
                              className="bg-amber-500 flex items-center justify-center text-xs font-medium text-white"
                              style={{ width: `${(objective.memoryDistribution.evaluative / total) * 100}%` }}
                            >
                              {objective.memoryDistribution.evaluative}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Memory Gaps Analysis */}
                <div className="p-5 rounded-xl border bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                  <h4 className="font-semibold flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Análise de Gaps de Conhecimento
                  </h4>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-white/50 dark:bg-black/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">Acelerar tomada de decisão</span>
                        <span className="text-sm text-red-600 font-medium">35% cobertura</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Gap crítico em memória procedural. Recomendado documentar processos de decisão existentes.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/50 dark:bg-black/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">Expandir base de conhecimento</span>
                        <span className="text-sm text-amber-600 font-medium">45% cobertura</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Memória episódica subrepresentada. Considerar ingestão de transcrições de reuniões.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Memory Legend & Stats */}
              <div className="col-span-4 space-y-4">
                <div className="p-5 rounded-xl border bg-card/80 backdrop-blur">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-4">CLASSES DE MEMÓRIA</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-4 h-4 rounded bg-cyan-500 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">Semântica</div>
                        <p className="text-xs text-muted-foreground">Conceitos, definições, fatos estruturados</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-4 h-4 rounded bg-purple-500 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">Episódica</div>
                        <p className="text-xs text-muted-foreground">Eventos, reuniões, decisões no tempo</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-4 h-4 rounded bg-green-500 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">Procedural</div>
                        <p className="text-xs text-muted-foreground">Processos, como fazer, workflows</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-4 h-4 rounded bg-amber-500 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">Avaliativa</div>
                        <p className="text-xs text-muted-foreground">Opiniões, análises, julgamentos</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-xl border bg-card/80 backdrop-blur">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-4">ESTATÍSTICAS GLOBAIS</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total de conhecimentos</span>
                      <span className="font-semibold">{MOCK_STRATEGIC_AREAS.reduce((sum, a) => sum + a.knowledgeCount, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Objetivos cobertos</span>
                      <span className="font-semibold">{MOCK_OBJECTIVES.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">OKRs mapeados</span>
                      <span className="font-semibold">{totalOKRs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Cobertura média</span>
                      <span className={cn(
                        "font-semibold",
                        avgCoverage >= 70 ? "text-green-600" :
                        avgCoverage >= 50 ? "text-amber-600" : "text-red-600"
                      )}>
                        {avgCoverage}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
