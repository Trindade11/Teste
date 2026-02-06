"use client";

import { useState } from "react";
import {
  Lightbulb,
  X,
  Calendar,
  Users,
  Brain,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  FileText,
  Link2,
  Sparkles,
  ArrowRight,
  Zap,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Bookmark,
  BarChart3,
  Layers,
  GitBranch,
  History,
  User,
  Building2,
  TrendingDown,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Interfaces
export interface InsightSource {
  id: string;
  type: "meeting" | "document" | "chat" | "analysis" | "feedback" | "external";
  title: string;
  date: string;
  participants?: string[];
  relevantSnippet?: string;
}

export interface InsightAction {
  id: string;
  title: string;
  type: "task" | "project" | "decision" | "investigation";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  assignee?: string;
  dueDate?: string;
  linkedId?: string;
}

export interface InsightConnection {
  id: string;
  type: "okr" | "project" | "process" | "client" | "competitor" | "trend";
  name: string;
  relationship: string;
  strength: "weak" | "moderate" | "strong";
}

export interface InsightValidation {
  id: string;
  validatedBy: string;
  validatedAt: string;
  verdict: "confirmed" | "partial" | "rejected" | "pending";
  comment?: string;
}

export interface InsightImpact {
  financial: "none" | "low" | "medium" | "high" | "critical";
  strategic: "none" | "low" | "medium" | "high" | "critical";
  operational: "none" | "low" | "medium" | "high" | "critical";
  timeframe: "immediate" | "short_term" | "medium_term" | "long_term";
  confidence: number; // 0-100
}

export interface InsightDetail {
  id: string;
  title: string;
  description: string;
  category: "opportunity" | "risk" | "trend" | "pattern" | "anomaly" | "recommendation";
  status: "novo" | "em análise" | "validado" | "acionado" | "arquivado";
  priority: "low" | "medium" | "high" | "critical";
  discoveredAt: string;
  discoveredBy: string;
  sources: InsightSource[];
  actions: InsightAction[];
  connections: InsightConnection[];
  validations: InsightValidation[];
  impact: InsightImpact;
  tags: string[];
  memoryClass: "semantic" | "episodic" | "procedural" | "evaluative";
  aiConfidence: number; // 0-100
  aiReasoning?: string;
  relatedInsights: { id: string; title: string; similarity: number }[];
}

// Mock Data
const MOCK_INSIGHT_DETAILS: Record<string, InsightDetail> = {
  "ins-1": {
    id: "ins-1",
    title: "Cliente demonstrou interesse em expansão",
    description: "Durante a reunião com o cliente Acme Corp, foi identificado interesse significativo em expandir o contrato atual para incluir novas regiões. O diretor comercial mencionou planos de crescimento para o Sul e Nordeste, com potencial de aumento de 40% no volume atual.",
    category: "opportunity",
    status: "novo",
    priority: "high",
    discoveredAt: "2025-02-01",
    discoveredBy: "Sistema EKS",
    sources: [
      {
        id: "src-1",
        type: "meeting",
        title: "Reunião Trimestral Acme Corp",
        date: "2025-02-01",
        participants: ["Carlos Silva", "Maria Santos", "João Diretor (Acme)"],
        relevantSnippet: "...estamos planejando expandir para o Sul ainda este semestre, e gostaríamos de entender como vocês podem nos apoiar nessa jornada...",
      },
      {
        id: "src-2",
        type: "document",
        title: "Relatório de Mercado Sul",
        date: "2025-01-15",
        relevantSnippet: "Região Sul representa 25% do mercado potencial ainda não explorado...",
      },
    ],
    actions: [
      {
        id: "act-1",
        title: "Preparar proposta de expansão",
        type: "task",
        status: "in_progress",
        assignee: "Maria Santos",
        dueDate: "2025-02-10",
      },
      {
        id: "act-2",
        title: "Agendar follow-up com diretor comercial",
        type: "task",
        status: "pending",
        assignee: "Carlos Silva",
        dueDate: "2025-02-05",
      },
    ],
    connections: [
      { id: "conn-1", type: "okr", name: "Aumentar receita recorrente em 30%", relationship: "Contribui diretamente", strength: "strong" },
      { id: "conn-2", type: "project", name: "Expansão Regional 2025", relationship: "Valida hipótese", strength: "strong" },
      { id: "conn-3", type: "client", name: "Acme Corp", relationship: "Cliente origem", strength: "strong" },
    ],
    validations: [
      { id: "val-1", validatedBy: "Maria Santos", validatedAt: "2025-02-01", verdict: "confirmed", comment: "Confirmado via email do cliente" },
    ],
    impact: {
      financial: "high",
      strategic: "high",
      operational: "medium",
      timeframe: "short_term",
      confidence: 85,
    },
    tags: ["cliente", "expansão", "receita", "oportunidade"],
    memoryClass: "episodic",
    aiConfidence: 92,
    aiReasoning: "O insight foi extraído de uma reunião com participação do tomador de decisão do cliente. As palavras utilizadas ('planejando', 'expandir', 'gostaríamos') indicam intenção clara. Correlacionado com dados de mercado que confirmam potencial na região mencionada.",
    relatedInsights: [
      { id: "ins-rel-1", title: "Tendência de expansão no setor", similarity: 78 },
      { id: "ins-rel-2", title: "Concorrente entrou na região Sul", similarity: 65 },
    ],
  },
  "ins-2": {
    id: "ins-2",
    title: "Processo de aprovação pode ser otimizado",
    description: "Análise dos fluxos de trabalho revelou que o processo de aprovação de propostas comerciais leva em média 5 dias, enquanto o benchmark do setor é de 2 dias. Gargalo identificado na etapa de validação jurídica.",
    category: "recommendation",
    status: "validado",
    priority: "medium",
    discoveredAt: "2025-01-28",
    discoveredBy: "Agente de Análise",
    sources: [
      {
        id: "src-1",
        type: "analysis",
        title: "Análise de Lead Time de Processos",
        date: "2025-01-28",
        relevantSnippet: "Lead time médio de aprovação: 5.2 dias. Desvio padrão: 1.8 dias. Principal gargalo: validação jurídica (2.3 dias).",
      },
      {
        id: "src-2",
        type: "feedback",
        title: "Feedback da equipe comercial",
        date: "2025-01-25",
        relevantSnippet: "Perdemos 3 deals no último mês por demora na aprovação...",
      },
    ],
    actions: [
      {
        id: "act-1",
        title: "Mapear processo atual de aprovação",
        type: "task",
        status: "completed",
        assignee: "Ana Costa",
      },
      {
        id: "act-2",
        title: "Propor automação da validação padrão",
        type: "project",
        status: "pending",
        assignee: "João Pedro",
        linkedId: "proj-otimizacao",
      },
    ],
    connections: [
      { id: "conn-1", type: "okr", name: "Reduzir tempo de ciclo de vendas", relationship: "Impacta diretamente", strength: "strong" },
      { id: "conn-2", type: "process", name: "Fluxo de Aprovação Comercial", relationship: "Processo alvo", strength: "strong" },
    ],
    validations: [
      { id: "val-1", validatedBy: "Gerente Jurídico", validatedAt: "2025-01-30", verdict: "confirmed", comment: "Dados conferem. Equipe está sobrecarregada." },
      { id: "val-2", validatedBy: "Dir. Comercial", validatedAt: "2025-01-30", verdict: "confirmed", comment: "Prioritário resolver." },
    ],
    impact: {
      financial: "medium",
      strategic: "low",
      operational: "high",
      timeframe: "immediate",
      confidence: 95,
    },
    tags: ["processo", "otimização", "automação", "vendas"],
    memoryClass: "procedural",
    aiConfidence: 95,
    aiReasoning: "Dados quantitativos sólidos de múltiplas fontes. Benchmark setorial confirma gap. Feedback qualitativo alinhado com dados. Alta confiança na recomendação.",
    relatedInsights: [
      { id: "ins-rel-1", title: "Equipe jurídica precisa de reforço", similarity: 82 },
    ],
  },
  "ins-3": {
    id: "ins-3",
    title: "Oportunidade de automação identificada",
    description: "Identificada oportunidade de automatizar o processo de geração de relatórios mensais, atualmente consumindo 40h/mês da equipe. Solução pode reduzir para 4h/mês com ROI de 3 meses.",
    category: "opportunity",
    status: "em análise",
    priority: "high",
    discoveredAt: "2025-01-20",
    discoveredBy: "Agente de Conhecimento",
    sources: [
      {
        id: "src-1",
        type: "analysis",
        title: "Análise de Tempo por Atividade",
        date: "2025-01-20",
        relevantSnippet: "Geração de relatórios: 40h/mês. 90% do tempo é coleta e formatação de dados.",
      },
      {
        id: "src-2",
        type: "chat",
        title: "Conversa com equipe de operações",
        date: "2025-01-18",
        relevantSnippet: "Todo mês é a mesma coisa, passamos uma semana só montando relatório...",
      },
    ],
    actions: [
      {
        id: "act-1",
        title: "Avaliar ferramentas de automação",
        type: "investigation",
        status: "in_progress",
        assignee: "João Pedro",
      },
    ],
    connections: [
      { id: "conn-1", type: "okr", name: "Aumentar eficiência operacional", relationship: "Contribui diretamente", strength: "strong" },
      { id: "conn-2", type: "process", name: "Geração de Relatórios Mensais", relationship: "Processo alvo", strength: "strong" },
    ],
    validations: [],
    impact: {
      financial: "medium",
      strategic: "low",
      operational: "high",
      timeframe: "short_term",
      confidence: 78,
    },
    tags: ["automação", "eficiência", "relatórios", "operações"],
    memoryClass: "procedural",
    aiConfidence: 78,
    aiReasoning: "Dados de tempo confirmados. ROI estimado precisa de validação com custos reais de implementação. Oportunidade clara mas requer investigação técnica.",
    relatedInsights: [
      { id: "ins-rel-1", title: "Processo de aprovação pode ser otimizado", similarity: 71 },
    ],
  },
};

// Config Objects
const CATEGORY_CONFIG: Record<InsightDetail["category"], { label: string; color: string; icon: React.ReactNode }> = {
  opportunity: { label: "Oportunidade", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: <TrendingUp className="w-3 h-3" /> },
  risk: { label: "Risco", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: <AlertTriangle className="w-3 h-3" /> },
  trend: { label: "Tendência", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: <TrendingUp className="w-3 h-3" /> },
  pattern: { label: "Padrão", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: <Layers className="w-3 h-3" /> },
  anomaly: { label: "Anomalia", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: <Zap className="w-3 h-3" /> },
  recommendation: { label: "Recomendação", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400", icon: <Sparkles className="w-3 h-3" /> },
};

const STATUS_CONFIG: Record<InsightDetail["status"], { label: string; color: string }> = {
  novo: { label: "Novo", color: "bg-blue-100 text-blue-700" },
  "em análise": { label: "Em Análise", color: "bg-amber-100 text-amber-700" },
  validado: { label: "Validado", color: "bg-green-100 text-green-700" },
  acionado: { label: "Acionado", color: "bg-purple-100 text-purple-700" },
  arquivado: { label: "Arquivado", color: "bg-gray-100 text-gray-700" },
};

const PRIORITY_CONFIG: Record<InsightDetail["priority"], { label: string; color: string }> = {
  low: { label: "Baixa", color: "text-gray-500" },
  medium: { label: "Média", color: "text-amber-500" },
  high: { label: "Alta", color: "text-orange-500" },
  critical: { label: "Crítica", color: "text-red-500" },
};

const IMPACT_CONFIG: Record<string, { label: string; color: string }> = {
  none: { label: "Nenhum", color: "bg-gray-100 text-gray-500" },
  low: { label: "Baixo", color: "bg-green-100 text-green-600" },
  medium: { label: "Médio", color: "bg-amber-100 text-amber-600" },
  high: { label: "Alto", color: "bg-orange-100 text-orange-600" },
  critical: { label: "Crítico", color: "bg-red-100 text-red-600" },
};

const SOURCE_TYPE_CONFIG: Record<InsightSource["type"], { label: string; icon: React.ReactNode }> = {
  meeting: { label: "Reunião", icon: <Users className="w-3 h-3" /> },
  document: { label: "Documento", icon: <FileText className="w-3 h-3" /> },
  chat: { label: "Chat", icon: <MessageSquare className="w-3 h-3" /> },
  analysis: { label: "Análise", icon: <BarChart3 className="w-3 h-3" /> },
  feedback: { label: "Feedback", icon: <MessageSquare className="w-3 h-3" /> },
  external: { label: "Externo", icon: <Eye className="w-3 h-3" /> },
};

const MEMORY_CLASS_CONFIG: Record<InsightDetail["memoryClass"], { label: string; color: string }> = {
  semantic: { label: "Semântica", color: "bg-cyan-100 text-cyan-700" },
  episodic: { label: "Episódica", color: "bg-purple-100 text-purple-700" },
  procedural: { label: "Procedural", color: "bg-green-100 text-green-700" },
  evaluative: { label: "Avaliativa", color: "bg-amber-100 text-amber-700" },
};

interface InsightDetailPanelProps {
  insightId: string;
  onClose: () => void;
}

type TabType = "overview" | "sources" | "actions" | "connections" | "validations";

export function InsightDetailPanel({ insightId, onClose }: InsightDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  const insight = MOCK_INSIGHT_DETAILS[insightId];

  if (!insight) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Insight não encontrado
      </div>
    );
  }

  const categoryConfig = CATEGORY_CONFIG[insight.category];
  const statusConfig = STATUS_CONFIG[insight.status];
  const priorityConfig = PRIORITY_CONFIG[insight.priority];

  const pendingValidations = insight.validations.filter(v => v.verdict === "pending").length;
  const pendingActions = insight.actions.filter(a => a.status === "pending" || a.status === "in_progress").length;

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "overview", label: "Visão Geral", icon: <Lightbulb className="w-4 h-4" /> },
    { id: "sources", label: "Fontes", icon: <FileText className="w-4 h-4" />, count: insight.sources.length },
    { id: "actions", label: "Ações", icon: <Target className="w-4 h-4" />, count: pendingActions },
    { id: "connections", label: "Conexões", icon: <GitBranch className="w-4 h-4" />, count: insight.connections.length },
    { id: "validations", label: "Validações", icon: <CheckCircle2 className="w-4 h-4" />, count: insight.validations.length },
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="p-6 border-b border-border bg-card/80 backdrop-blur">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={cn("p-2 rounded-lg", categoryConfig.color)}>
                {categoryConfig.icon}
              </span>
              <h2 className="text-2xl font-bold">{insight.title}</h2>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <span className={cn("text-xs px-2 py-1 rounded-full", statusConfig.color)}>
                {statusConfig.label}
              </span>
              <span className={cn("text-xs px-2 py-1 rounded-full", categoryConfig.color)}>
                {categoryConfig.label}
              </span>
              <span className={cn("text-xs px-2 py-1 rounded-full", MEMORY_CLASS_CONFIG[insight.memoryClass].color)}>
                <Brain className="w-3 h-3 inline mr-1" />
                {MEMORY_CLASS_CONFIG[insight.memoryClass].label}
              </span>
              <span className={cn("text-xs font-medium", priorityConfig.color)}>
                Prioridade: {priorityConfig.label}
              </span>
            </div>

            <p className="text-sm text-muted-foreground mb-4">{insight.description}</p>

            {/* Quick Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Descoberto em {insight.discoveredAt}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{insight.discoveredBy}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>Confiança IA: {insight.aiConfidence}%</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              {insight.tags.map((tag, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full bg-muted">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-muted transition-colors" title="Salvar">
              <Bookmark className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-muted transition-colors" title="Compartilhar">
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  activeTab === tab.id ? "bg-white/20" : "bg-muted"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-12 gap-6">
            {/* Main Content */}
            <div className="col-span-8 space-y-6">
              {/* AI Analysis */}
              <div className="p-5 rounded-xl border bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Análise da IA
                </h3>
                <p className="text-sm text-muted-foreground">{insight.aiReasoning}</p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium">Confiança: {insight.aiConfidence}%</span>
                  </div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        insight.aiConfidence >= 80 ? "bg-green-500" :
                        insight.aiConfidence >= 60 ? "bg-amber-500" : "bg-red-500"
                      )}
                      style={{ width: `${insight.aiConfidence}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Impact Analysis */}
              <div className="p-5 rounded-xl border bg-card/80 backdrop-blur">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  Análise de Impacto
                </h3>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <div className="text-xs text-muted-foreground mb-2">Financeiro</div>
                    <span className={cn("text-sm px-2 py-1 rounded", IMPACT_CONFIG[insight.impact.financial].color)}>
                      {IMPACT_CONFIG[insight.impact.financial].label}
                    </span>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <div className="text-xs text-muted-foreground mb-2">Estratégico</div>
                    <span className={cn("text-sm px-2 py-1 rounded", IMPACT_CONFIG[insight.impact.strategic].color)}>
                      {IMPACT_CONFIG[insight.impact.strategic].label}
                    </span>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <div className="text-xs text-muted-foreground mb-2">Operacional</div>
                    <span className={cn("text-sm px-2 py-1 rounded", IMPACT_CONFIG[insight.impact.operational].color)}>
                      {IMPACT_CONFIG[insight.impact.operational].label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Horizonte de Tempo:</span>
                  </div>
                  <span className="text-sm font-medium">
                    {insight.impact.timeframe === "immediate" ? "Imediato" :
                     insight.impact.timeframe === "short_term" ? "Curto Prazo (1-3 meses)" :
                     insight.impact.timeframe === "medium_term" ? "Médio Prazo (3-12 meses)" : "Longo Prazo (>12 meses)"}
                  </span>
                </div>
              </div>

              {/* Related Insights */}
              {insight.relatedInsights.length > 0 && (
                <div className="p-5 rounded-xl border bg-card/80 backdrop-blur">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <Link2 className="w-5 h-5 text-cyan-500" />
                    Insights Relacionados
                  </h3>
                  <div className="space-y-3">
                    {insight.relatedInsights.map((related) => (
                      <div key={related.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          <span className="text-sm">{related.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{related.similarity}% similar</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="col-span-4 space-y-4">
              {/* Quick Actions */}
              <div className="p-5 rounded-xl border bg-card/80 backdrop-blur">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">AÇÕES RÁPIDAS</h4>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-2 p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                    <Target className="w-4 h-4" />
                    <span className="text-sm font-medium">Criar Tarefa</span>
                  </button>
                  <button className="w-full flex items-center gap-2 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Validar Insight</span>
                  </button>
                  <button className="w-full flex items-center gap-2 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                    <Link2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Vincular a OKR</span>
                  </button>
                </div>
              </div>

              {/* Status Summary */}
              <div className="p-5 rounded-xl border bg-card/80 backdrop-blur">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">RESUMO</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Fontes</span>
                    <span className="text-sm font-semibold">{insight.sources.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Ações</span>
                    <span className="text-sm font-semibold">{insight.actions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Conexões</span>
                    <span className="text-sm font-semibold">{insight.connections.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Validações</span>
                    <span className="text-sm font-semibold">{insight.validations.length}</span>
                  </div>
                </div>
              </div>

              {/* Feedback */}
              <div className="p-5 rounded-xl border bg-card/80 backdrop-blur">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">ESTE INSIGHT FOI ÚTIL?</h4>
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-sm font-medium">Sim</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors">
                    <ThumbsDown className="w-4 h-4" />
                    <span className="text-sm font-medium">Não</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "sources" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Fontes do Insight
              </h3>
              <span className="text-sm text-muted-foreground">
                {insight.sources.length} fonte(s) identificada(s)
              </span>
            </div>

            {insight.sources.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma fonte registrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {insight.sources.map((source) => {
                  const sourceConfig = SOURCE_TYPE_CONFIG[source.type];
                  const isExpanded = expandedSource === source.id;

                  return (
                    <div
                      key={source.id}
                      className={cn(
                        "p-4 rounded-xl border bg-card/80 backdrop-blur cursor-pointer transition-all hover:shadow-md",
                        isExpanded && "ring-2 ring-primary"
                      )}
                      onClick={() => setExpandedSource(isExpanded ? null : source.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="p-1.5 rounded bg-muted">
                              {sourceConfig.icon}
                            </span>
                            <span className="text-xs text-muted-foreground">{sourceConfig.label}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{source.date}</span>
                          </div>
                          <h4 className="font-semibold">{source.title}</h4>
                          {source.participants && (
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Users className="w-3 h-3" />
                              {source.participants.join(", ")}
                            </div>
                          )}
                        </div>
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>

                      {isExpanded && source.relevantSnippet && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500">
                            <div className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Trecho Relevante</div>
                            <p className="text-sm italic">"{source.relevantSnippet}"</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "actions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-green-500" />
                Ações Derivadas
              </h3>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm">
                <Zap className="w-4 h-4" />
                Nova Ação
              </button>
            </div>

            {insight.actions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma ação criada ainda</p>
                <p className="text-sm mt-1">Crie ações para transformar este insight em resultados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {insight.actions.map((action) => (
                  <div key={action.id} className="p-4 rounded-xl border bg-card/80 backdrop-blur">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded",
                            action.type === "task" ? "bg-blue-100 text-blue-700" :
                            action.type === "project" ? "bg-purple-100 text-purple-700" :
                            action.type === "decision" ? "bg-amber-100 text-amber-700" :
                            "bg-cyan-100 text-cyan-700"
                          )}>
                            {action.type === "task" ? "Tarefa" :
                             action.type === "project" ? "Projeto" :
                             action.type === "decision" ? "Decisão" : "Investigação"}
                          </span>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded",
                            action.status === "completed" ? "bg-green-100 text-green-700" :
                            action.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                            action.status === "cancelled" ? "bg-gray-100 text-gray-700" :
                            "bg-amber-100 text-amber-700"
                          )}>
                            {action.status === "completed" ? "Concluído" :
                             action.status === "in_progress" ? "Em Andamento" :
                             action.status === "cancelled" ? "Cancelado" : "Pendente"}
                          </span>
                        </div>
                        <h4 className="font-semibold">{action.title}</h4>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {action.assignee && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {action.assignee}
                            </div>
                          )}
                          {action.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {action.dueDate}
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "connections" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-purple-500" />
                Conexões no Grafo
              </h3>
            </div>

            {insight.connections.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma conexão identificada</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {insight.connections.map((conn) => (
                  <div key={conn.id} className="p-4 rounded-xl border bg-card/80 backdrop-blur hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn(
                        "p-1.5 rounded",
                        conn.type === "okr" ? "bg-green-100 text-green-700" :
                        conn.type === "project" ? "bg-blue-100 text-blue-700" :
                        conn.type === "process" ? "bg-purple-100 text-purple-700" :
                        conn.type === "client" ? "bg-amber-100 text-amber-700" :
                        conn.type === "competitor" ? "bg-red-100 text-red-700" :
                        "bg-cyan-100 text-cyan-700"
                      )}>
                        {conn.type === "okr" ? <Target className="w-3 h-3" /> :
                         conn.type === "project" ? <Layers className="w-3 h-3" /> :
                         conn.type === "process" ? <Activity className="w-3 h-3" /> :
                         conn.type === "client" ? <Building2 className="w-3 h-3" /> :
                         conn.type === "competitor" ? <Eye className="w-3 h-3" /> :
                         <TrendingUp className="w-3 h-3" />}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">{conn.type}</span>
                      <span className={cn(
                        "ml-auto text-xs px-1.5 py-0.5 rounded",
                        conn.strength === "strong" ? "bg-green-100 text-green-700" :
                        conn.strength === "moderate" ? "bg-amber-100 text-amber-700" :
                        "bg-gray-100 text-gray-500"
                      )}>
                        {conn.strength === "strong" ? "Forte" : conn.strength === "moderate" ? "Moderada" : "Fraca"}
                      </span>
                    </div>
                    <h4 className="font-semibold mb-1">{conn.name}</h4>
                    <p className="text-xs text-muted-foreground">{conn.relationship}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "validations" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Validações
              </h3>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Validar
              </button>
            </div>

            {insight.validations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma validação ainda</p>
                <p className="text-sm mt-1">Seja o primeiro a validar este insight</p>
              </div>
            ) : (
              <div className="space-y-4">
                {insight.validations.map((validation) => (
                  <div key={validation.id} className="p-4 rounded-xl border bg-card/80 backdrop-blur">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          validation.verdict === "confirmed" ? "bg-green-100 text-green-700" :
                          validation.verdict === "partial" ? "bg-amber-100 text-amber-700" :
                          validation.verdict === "rejected" ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-500"
                        )}>
                          {validation.verdict === "confirmed" ? <ThumbsUp className="w-5 h-5" /> :
                           validation.verdict === "partial" ? <AlertTriangle className="w-5 h-5" /> :
                           validation.verdict === "rejected" ? <ThumbsDown className="w-5 h-5" /> :
                           <Clock className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="font-semibold">{validation.validatedBy}</div>
                          <div className="text-xs text-muted-foreground">{validation.validatedAt}</div>
                        </div>
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded",
                        validation.verdict === "confirmed" ? "bg-green-100 text-green-700" :
                        validation.verdict === "partial" ? "bg-amber-100 text-amber-700" :
                        validation.verdict === "rejected" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-500"
                      )}>
                        {validation.verdict === "confirmed" ? "Confirmado" :
                         validation.verdict === "partial" ? "Parcial" :
                         validation.verdict === "rejected" ? "Rejeitado" : "Pendente"}
                      </span>
                    </div>
                    {validation.comment && (
                      <div className="mt-3 p-3 rounded-lg bg-muted/30">
                        <p className="text-sm">{validation.comment}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
