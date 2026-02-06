"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Users,
  MessageSquare,
  FileText,
  Target,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  ChevronDown,
  X,
  Brain,
  Link2,
  TrendingUp,
  History,
  Zap,
  Timer,
  AlertOctagon,
  Gauge,
  GitBranch,
  CircleDot,
  ArrowUpRight,
  BarChart3,
  Flag,
  Play,
  Pause,
  CheckSquare,
  Square,
  User,
  Building2,
  Workflow,
  BookOpen,
  Sparkles,
} from "lucide-react";

// Tipos baseados nas specs do EKS
export interface TaskDependency {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
  type: "blocks" | "blocked_by" | "related";
}

export interface TaskActivity {
  id: string;
  type: "comment" | "status_change" | "assignment" | "decision" | "insight" | "blocker";
  content: string;
  author: string;
  date: string;
  source?: string;
}

export interface TaskContext {
  id: string;
  type: "meeting" | "document" | "chat" | "email";
  title: string;
  date: string;
  relevance: "high" | "medium" | "low";
  snippet?: string;
}

export interface TaskRisk {
  id: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  probability: "low" | "medium" | "high";
  mitigation?: string;
  status: "open" | "mitigated" | "accepted";
}

export interface TaskMetrics {
  estimatedHours: number;
  actualHours: number;
  complexity: "trivial" | "simple" | "medium" | "complex" | "very_complex";
  businessImpact: "low" | "medium" | "high" | "critical";
  urgency: "low" | "normal" | "high" | "urgent";
  knowledgeGap: number; // 0-100, quanto conhecimento falta
}

export interface TaskDetail {
  id: string;
  title: string;
  description: string;
  status: "pendente" | "em andamento" | "concluído" | "bloqueado" | "cancelado";
  priority: "baixa" | "média" | "alta" | "crítica";
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  assignee: { id: string; name: string; role: string };
  project?: { id: string; name: string };
  okr?: { id: string; title: string };
  dependencies: TaskDependency[];
  activities: TaskActivity[];
  contexts: TaskContext[];
  risks: TaskRisk[];
  metrics: TaskMetrics;
  tags: string[];
  memoryClass: "semantic" | "episodic" | "procedural" | "evaluative";
  aiSuggestions: string[];
}

// Mock data rico para tarefas
const MOCK_TASK_DETAILS: Record<string, TaskDetail> = {
  "task-1": {
    id: "task-1",
    title: "Revisar cronograma do projeto",
    description: "Atualizar o cronograma do projeto EKS considerando as novas dependências identificadas na reunião de Sprint 1 Review. Incluir buffer para riscos identificados.",
    status: "pendente",
    priority: "alta",
    dueDate: "2025-02-03",
    createdAt: "2025-01-29",
    assignee: { id: "u1", name: "Carlos Silva", role: "Project Owner" },
    project: { id: "proj-1", name: "Implementação EKS" },
    okr: { id: "okr-1", title: "Aumentar eficiência operacional" },
    dependencies: [
      { id: "task-5", title: "Mapear dependências do CDC", status: "completed", type: "blocked_by" },
      { id: "task-6", title: "Definir arquitetura de agentes", status: "in_progress", type: "blocked_by" },
      { id: "task-7", title: "Alocar recursos para Sprint 2", status: "pending", type: "blocks" },
    ],
    activities: [
      { id: "a1", type: "comment", content: "Precisamos considerar o risco de integração com CRM no cronograma", author: "Maria Santos", date: "2025-02-02 14:30", source: "Chat EKS" },
      { id: "a2", type: "insight", content: "Reunião revelou que curador ontológico é papel crítico - impacta timeline", author: "Sistema", date: "2025-01-29 16:00", source: "Sprint 1 Review" },
      { id: "a3", type: "status_change", content: "Status alterado de 'novo' para 'pendente'", author: "Carlos Silva", date: "2025-01-29 17:00" },
      { id: "a4", type: "blocker", content: "Aguardando finalização da arquitetura de agentes", author: "João Pedro", date: "2025-02-01 10:00" },
    ],
    contexts: [
      { id: "c1", type: "meeting", title: "Sprint 1 - Review & Retrospectiva", date: "2025-01-29", relevance: "high", snippet: "Decisão: Implementar CDC no Sprint 2. Cronograma precisa ser ajustado..." },
      { id: "c2", type: "document", title: "Arquitetura EKS v1", date: "2025-01-18", relevance: "medium", snippet: "A arquitetura de 5 camadas define a sequência de implementação..." },
      { id: "c3", type: "chat", title: "Discussão sobre Ontologia", date: "2025-02-01", relevance: "medium", snippet: "Carlos: O curador ontológico vai precisar de mais tempo de treinamento..." },
    ],
    risks: [
      { id: "r1", description: "Atraso na definição de agentes pode impactar todo o Sprint 2", severity: "high", probability: "medium", mitigation: "Reunião de alinhamento agendada para 04/02", status: "open" },
      { id: "r2", description: "Dependência de integração CRM não está clara", severity: "medium", probability: "high", mitigation: "Mapear endpoints necessários com time de CRM", status: "open" },
    ],
    metrics: {
      estimatedHours: 8,
      actualHours: 0,
      complexity: "medium",
      businessImpact: "high",
      urgency: "urgent",
      knowledgeGap: 25,
    },
    tags: ["cronograma", "planejamento", "sprint-2"],
    memoryClass: "procedural",
    aiSuggestions: [
      "📊 Considere usar buffer de 20% para riscos identificados",
      "🔗 3 tarefas dependentes podem ser paralelizadas",
      "⚠️ Reunião de 29/01 menciona curador como gargalo - avaliar impacto",
    ],
  },
  "task-2": {
    id: "task-2",
    title: "Preparar apresentação Q1",
    description: "Criar apresentação executiva do progresso Q1 para stakeholders, incluindo métricas de adoção do EKS, conhecimento capturado e próximos passos.",
    status: "pendente",
    priority: "média",
    dueDate: "2025-02-06",
    createdAt: "2025-01-25",
    assignee: { id: "u2", name: "Maria Santos", role: "Tech Lead" },
    project: { id: "proj-1", name: "Implementação EKS" },
    okr: { id: "okr-2", title: "Expandir base de conhecimento" },
    dependencies: [
      { id: "task-1", title: "Revisar cronograma do projeto", status: "pending", type: "blocked_by" },
    ],
    activities: [
      { id: "a1", type: "comment", content: "Incluir demo do grafo de conhecimento", author: "Carlos Silva", date: "2025-01-30 11:00" },
      { id: "a2", type: "assignment", content: "Tarefa atribuída a Maria Santos", author: "Carlos Silva", date: "2025-01-25 09:00" },
    ],
    contexts: [
      { id: "c1", type: "meeting", title: "Kickoff - Alinhamento Estratégico", date: "2025-01-15", relevance: "high", snippet: "Apresentação inicial definiu métricas de sucesso..." },
      { id: "c2", type: "document", title: "Roadmap EKS", date: "2025-01-20", relevance: "high" },
    ],
    risks: [
      { id: "r1", description: "Dados podem não estar consolidados a tempo", severity: "medium", probability: "low", status: "accepted" },
    ],
    metrics: {
      estimatedHours: 12,
      actualHours: 4,
      complexity: "simple",
      businessImpact: "medium",
      urgency: "normal",
      knowledgeGap: 10,
    },
    tags: ["apresentação", "stakeholders", "q1"],
    memoryClass: "episodic",
    aiSuggestions: [
      "📈 42 nodes de conhecimento capturados - destaque no slide",
      "🎯 2 OKRs vinculados podem ser mostrados como progresso",
    ],
  },
  "task-3": {
    id: "task-3",
    title: "Validar entidades da reunião",
    description: "Revisar e validar as entidades extraídas automaticamente da transcrição da reunião Sprint 1 Review. Corrigir classificações incorretas e adicionar relações faltantes.",
    status: "em andamento",
    priority: "alta",
    dueDate: "2025-02-04",
    createdAt: "2025-01-30",
    assignee: { id: "u3", name: "João Pedro", role: "Developer" },
    project: { id: "proj-1", name: "Implementação EKS" },
    dependencies: [],
    activities: [
      { id: "a1", type: "status_change", content: "Iniciou trabalho na tarefa", author: "João Pedro", date: "2025-02-02 09:00" },
      { id: "a2", type: "comment", content: "5 de 12 entidades validadas. Algumas classificações de memória precisam ajuste.", author: "João Pedro", date: "2025-02-02 15:00" },
      { id: "a3", type: "decision", content: "Decisão: Classificar insights de reunião como memória avaliativa", author: "Carlos Silva", date: "2025-02-02 16:00" },
    ],
    contexts: [
      { id: "c1", type: "meeting", title: "Sprint 1 - Review & Retrospectiva", date: "2025-01-29", relevance: "high", snippet: "Transcrição completa disponível com 15 decisões identificadas..." },
    ],
    risks: [],
    metrics: {
      estimatedHours: 4,
      actualHours: 2,
      complexity: "medium",
      businessImpact: "high",
      urgency: "high",
      knowledgeGap: 40,
    },
    tags: ["curadoria", "validação", "entidades"],
    memoryClass: "semantic",
    aiSuggestions: [
      "✅ 12 entidades extraídas, 5 validadas (42%)",
      "🧠 Sugestão: Revisar classificação de 'curador ontológico' como Role",
      "🔗 3 relações potenciais identificadas para validação",
    ],
  },
  "task-4": {
    id: "task-4",
    title: "Atualizar documentação de processos",
    description: "Documentar os processos de ingestão e curadoria implementados no Sprint 1, incluindo fluxogramas e exemplos práticos.",
    status: "concluído",
    priority: "média",
    dueDate: "2025-02-01",
    createdAt: "2025-01-28",
    completedAt: "2025-01-31",
    assignee: { id: "u4", name: "Ana Costa", role: "UX Designer" },
    project: { id: "proj-1", name: "Implementação EKS" },
    dependencies: [],
    activities: [
      { id: "a1", type: "status_change", content: "Tarefa concluída", author: "Ana Costa", date: "2025-01-31 17:00" },
      { id: "a2", type: "comment", content: "Documentação disponível em /docs/processes", author: "Ana Costa", date: "2025-01-31 17:00" },
    ],
    contexts: [
      { id: "c1", type: "document", title: "Spec 013 - Ingestion Ecosystem", date: "2025-01-20", relevance: "high" },
    ],
    risks: [],
    metrics: {
      estimatedHours: 6,
      actualHours: 5,
      complexity: "simple",
      businessImpact: "medium",
      urgency: "normal",
      knowledgeGap: 0,
    },
    tags: ["documentação", "processos", "sprint-1"],
    memoryClass: "procedural",
    aiSuggestions: [],
  },
};

const STATUS_CONFIG: Record<TaskDetail["status"], { label: string; color: string; icon: React.ReactNode }> = {
  pendente: { label: "Pendente", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: <Clock className="w-3 h-3" /> },
  "em andamento": { label: "Em Andamento", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: <Play className="w-3 h-3" /> },
  concluído: { label: "Concluído", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: <CheckCircle2 className="w-3 h-3" /> },
  bloqueado: { label: "Bloqueado", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: <AlertOctagon className="w-3 h-3" /> },
  cancelado: { label: "Cancelado", color: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500", icon: <X className="w-3 h-3" /> },
};

const PRIORITY_CONFIG: Record<TaskDetail["priority"], { label: string; color: string; icon: React.ReactNode }> = {
  baixa: { label: "Baixa", color: "bg-gray-100 text-gray-600", icon: <Flag className="w-3 h-3" /> },
  média: { label: "Média", color: "bg-blue-100 text-blue-600", icon: <Flag className="w-3 h-3" /> },
  alta: { label: "Alta", color: "bg-orange-100 text-orange-600", icon: <Flag className="w-3 h-3" /> },
  crítica: { label: "Crítica", color: "bg-red-100 text-red-600", icon: <AlertTriangle className="w-3 h-3" /> },
};

const COMPLEXITY_CONFIG: Record<TaskMetrics["complexity"], { label: string; color: string; score: number }> = {
  trivial: { label: "Trivial", color: "bg-green-500", score: 1 },
  simple: { label: "Simples", color: "bg-green-400", score: 2 },
  medium: { label: "Média", color: "bg-amber-400", score: 3 },
  complex: { label: "Complexa", color: "bg-orange-500", score: 4 },
  very_complex: { label: "Muito Complexa", color: "bg-red-500", score: 5 },
};

const IMPACT_CONFIG: Record<TaskMetrics["businessImpact"], { label: string; color: string }> = {
  low: { label: "Baixo", color: "text-gray-500" },
  medium: { label: "Médio", color: "text-blue-500" },
  high: { label: "Alto", color: "text-orange-500" },
  critical: { label: "Crítico", color: "text-red-500" },
};

const RISK_SEVERITY_CONFIG: Record<TaskRisk["severity"], { label: string; color: string }> = {
  low: { label: "Baixo", color: "bg-green-100 text-green-700" },
  medium: { label: "Médio", color: "bg-amber-100 text-amber-700" },
  high: { label: "Alto", color: "bg-orange-100 text-orange-700" },
  critical: { label: "Crítico", color: "bg-red-100 text-red-700" },
};

const ACTIVITY_CONFIG: Record<TaskActivity["type"], { label: string; color: string; icon: React.ReactNode }> = {
  comment: { label: "Comentário", color: "bg-gray-100 text-gray-700", icon: <MessageSquare className="w-3 h-3" /> },
  status_change: { label: "Status", color: "bg-blue-100 text-blue-700", icon: <ArrowUpRight className="w-3 h-3" /> },
  assignment: { label: "Atribuição", color: "bg-purple-100 text-purple-700", icon: <User className="w-3 h-3" /> },
  decision: { label: "Decisão", color: "bg-amber-100 text-amber-700", icon: <Target className="w-3 h-3" /> },
  insight: { label: "Insight", color: "bg-cyan-100 text-cyan-700", icon: <Lightbulb className="w-3 h-3" /> },
  blocker: { label: "Bloqueio", color: "bg-red-100 text-red-700", icon: <AlertOctagon className="w-3 h-3" /> },
};

const MEMORY_CLASS_CONFIG: Record<TaskDetail["memoryClass"], { label: string; color: string }> = {
  semantic: { label: "Semântica", color: "bg-cyan-100 text-cyan-700" },
  episodic: { label: "Episódica", color: "bg-purple-100 text-purple-700" },
  procedural: { label: "Procedural", color: "bg-green-100 text-green-700" },
  evaluative: { label: "Avaliativa", color: "bg-amber-100 text-amber-700" },
};

interface TaskDetailPanelProps {
  taskId: string;
  onClose: () => void;
}

type TabType = "overview" | "activity" | "context" | "risks" | "dependencies";

export function TaskDetailPanel({ taskId, onClose }: TaskDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const task = MOCK_TASK_DETAILS[taskId];

  if (!task) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Tarefa não encontrada
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[task.status];
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const complexityConfig = COMPLEXITY_CONFIG[task.metrics.complexity];
  const impactConfig = IMPACT_CONFIG[task.metrics.businessImpact];

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number; alert?: boolean }[] = [
    { id: "overview", label: "Visão Geral", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "activity", label: "Atividade", icon: <History className="w-4 h-4" />, count: task.activities.length },
    { id: "context", label: "Contexto", icon: <BookOpen className="w-4 h-4" />, count: task.contexts.length },
    { id: "risks", label: "Riscos", icon: <AlertTriangle className="w-4 h-4" />, count: task.risks.length, alert: task.risks.some(r => r.status === "open" && (r.severity === "high" || r.severity === "critical")) },
    { id: "dependencies", label: "Dependências", icon: <GitBranch className="w-4 h-4" />, count: task.dependencies.length },
  ];

  const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysUntilDue < 0 && task.status !== "concluído";
  const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 2 && task.status !== "concluído";

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="p-6 border-b border-border bg-card/80 backdrop-blur">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Status e Prioridade */}
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("text-xs px-2 py-1 rounded-full flex items-center gap-1", statusConfig.color)}>
                {statusConfig.icon}
                {statusConfig.label}
              </span>
              <span className={cn("text-xs px-2 py-1 rounded-full flex items-center gap-1", priorityConfig.color)}>
                {priorityConfig.icon}
                {priorityConfig.label}
              </span>
              <span className={cn("text-xs px-2 py-1 rounded-full", MEMORY_CLASS_CONFIG[task.memoryClass].color)}>
                <Brain className="w-3 h-3 inline mr-1" />
                {MEMORY_CLASS_CONFIG[task.memoryClass].label}
              </span>
              {isOverdue && (
                <span className="text-xs px-2 py-1 rounded-full bg-red-500 text-white flex items-center gap-1">
                  <AlertOctagon className="w-3 h-3" />
                  Atrasada!
                </span>
              )}
              {isDueSoon && !isOverdue && (
                <span className="text-xs px-2 py-1 rounded-full bg-amber-500 text-white flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  Vence em breve
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold mb-2">{task.title}</h2>
            <p className="text-sm text-muted-foreground mb-4">{task.description}</p>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-4 gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
              {/* Responsável */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  {task.assignee.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Responsável</div>
                  <div className="text-sm font-medium">{task.assignee.name}</div>
                </div>
              </div>

              {/* Prazo */}
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  isOverdue ? "bg-red-100 text-red-600" : isDueSoon ? "bg-amber-100 text-amber-600" : "bg-muted"
                )}>
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Prazo</div>
                  <div className={cn("text-sm font-medium", isOverdue && "text-red-600", isDueSoon && "text-amber-600")}>
                    {task.dueDate}
                  </div>
                </div>
              </div>

              {/* Projeto */}
              {task.project && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Projeto</div>
                    <div className="text-sm font-medium truncate">{task.project.name}</div>
                  </div>
                </div>
              )}

              {/* OKR */}
              {task.okr && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">OKR</div>
                    <div className="text-sm font-medium truncate">{task.okr.title}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative",
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
              {tab.alert && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-12 gap-6">
            {/* Métricas de Complexidade */}
            <div className="col-span-8 space-y-6">
              {/* Análise de Complexidade */}
              <div className="p-5 rounded-xl border bg-card/80 backdrop-blur">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Gauge className="w-5 h-5 text-purple-500" />
                  Análise de Complexidade
                </h3>
                
                <div className="grid grid-cols-4 gap-4">
                  {/* Complexidade Técnica */}
                  <div className="p-4 rounded-lg bg-muted/30">
                    <div className="text-xs text-muted-foreground mb-2">Complexidade</div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={cn(
                            "w-4 h-4 rounded-sm",
                            level <= complexityConfig.score ? complexityConfig.color : "bg-muted"
                          )}
                        />
                      ))}
                    </div>
                    <div className="text-sm font-semibold mt-1">{complexityConfig.label}</div>
                  </div>

                  {/* Impacto no Negócio */}
                  <div className="p-4 rounded-lg bg-muted/30">
                    <div className="text-xs text-muted-foreground mb-2">Impacto</div>
                    <div className={cn("text-2xl font-bold", impactConfig.color)}>
                      <TrendingUp className="w-6 h-6 inline" />
                    </div>
                    <div className="text-sm font-semibold mt-1">{impactConfig.label}</div>
                  </div>

                  {/* Horas */}
                  <div className="p-4 rounded-lg bg-muted/30">
                    <div className="text-xs text-muted-foreground mb-2">Esforço</div>
                    <div className="text-2xl font-bold">
                      {task.metrics.actualHours}/{task.metrics.estimatedHours}h
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          task.metrics.actualHours > task.metrics.estimatedHours ? "bg-red-500" : "bg-blue-500"
                        )}
                        style={{ width: `${Math.min(100, (task.metrics.actualHours / task.metrics.estimatedHours) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Lacuna de Conhecimento */}
                  <div className="p-4 rounded-lg bg-muted/30">
                    <div className="text-xs text-muted-foreground mb-2">Gap de Conhecimento</div>
                    <div className="text-2xl font-bold">{task.metrics.knowledgeGap}%</div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          task.metrics.knowledgeGap > 50 ? "bg-red-500" : task.metrics.knowledgeGap > 25 ? "bg-amber-500" : "bg-green-500"
                        )}
                        style={{ width: `${task.metrics.knowledgeGap}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sugestões da IA */}
              {task.aiSuggestions.length > 0 && (
                <div className="p-5 rounded-xl border bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-800">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    Sugestões Inteligentes
                  </h3>
                  <div className="space-y-2">
                    {task.aiSuggestions.map((suggestion, i) => (
                      <div key={i} className="p-3 rounded-lg bg-white/50 dark:bg-black/20 text-sm">
                        {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div className="p-5 rounded-xl border bg-card/80 backdrop-blur">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">TAGS</h3>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-1 rounded-full bg-muted">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar - Quick Stats */}
            <div className="col-span-4 space-y-4">
              {/* Riscos Resumo */}
              {task.risks.length > 0 && (
                <div className="p-5 rounded-xl border bg-card/80 backdrop-blur">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    RISCOS ATIVOS
                  </h3>
                  <div className="space-y-2">
                    {task.risks.filter(r => r.status === "open").slice(0, 2).map((risk) => (
                      <div key={risk.id} className="p-2 rounded-lg bg-muted/30 text-sm">
                        <span className={cn("text-xs px-1.5 py-0.5 rounded mr-2", RISK_SEVERITY_CONFIG[risk.severity].color)}>
                          {RISK_SEVERITY_CONFIG[risk.severity].label}
                        </span>
                        <span className="text-muted-foreground">{risk.description.slice(0, 50)}...</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dependências Resumo */}
              {task.dependencies.length > 0 && (
                <div className="p-5 rounded-xl border bg-card/80 backdrop-blur">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-blue-500" />
                    DEPENDÊNCIAS
                  </h3>
                  <div className="space-y-2">
                    {task.dependencies.slice(0, 3).map((dep) => (
                      <div key={dep.id} className="flex items-center gap-2 text-sm">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          dep.status === "completed" ? "bg-green-500" : dep.status === "blocked" ? "bg-red-500" : "bg-amber-500"
                        )} />
                        <span className="truncate flex-1">{dep.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {dep.type === "blocks" ? "bloqueia" : "bloqueado por"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Última Atividade */}
              <div className="p-5 rounded-xl border bg-card/80 backdrop-blur">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-green-500" />
                  ÚLTIMA ATIVIDADE
                </h3>
                {task.activities[0] && (
                  <div className="text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-xs px-1.5 py-0.5 rounded flex items-center gap-1", ACTIVITY_CONFIG[task.activities[0].type].color)}>
                        {ACTIVITY_CONFIG[task.activities[0].type].icon}
                        {ACTIVITY_CONFIG[task.activities[0].type].label}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{task.activities[0].content}</p>
                    <div className="text-xs text-muted-foreground mt-2">
                      {task.activities[0].author} • {task.activities[0].date}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-green-500" />
              Histórico de Atividades
            </h3>

            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

              {task.activities.map((activity, index) => {
                const config = ACTIVITY_CONFIG[activity.type];
                return (
                  <div key={activity.id} className="relative pl-14 pb-4">
                    <div className={cn(
                      "absolute left-4 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center",
                      config.color
                    )}>
                      {config.icon}
                    </div>

                    <div className="p-4 rounded-xl border bg-card/80 backdrop-blur">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn("text-xs px-2 py-0.5 rounded flex items-center gap-1", config.color)}>
                          {config.label}
                        </span>
                        {activity.source && (
                          <span className="text-xs text-muted-foreground">via {activity.source}</span>
                        )}
                      </div>
                      <p className="text-sm">{activity.content}</p>
                      <div className="text-xs text-muted-foreground mt-2">
                        {activity.author} • {activity.date}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "context" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-cyan-500" />
              Contexto Relacionado
            </h3>

            {task.contexts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum contexto relacionado encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {task.contexts.map((ctx) => (
                  <div key={ctx.id} className="p-4 rounded-xl border bg-card/80 backdrop-blur hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          ctx.type === "meeting" ? "bg-purple-100 text-purple-700" :
                          ctx.type === "document" ? "bg-blue-100 text-blue-700" :
                          ctx.type === "chat" ? "bg-green-100 text-green-700" :
                          "bg-gray-100 text-gray-700"
                        )}>
                          {ctx.type === "meeting" ? <MessageSquare className="w-4 h-4" /> :
                           ctx.type === "document" ? <FileText className="w-4 h-4" /> :
                           ctx.type === "chat" ? <MessageSquare className="w-4 h-4" /> :
                           <MessageSquare className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{ctx.title}</h4>
                            <span className={cn(
                              "text-xs px-1.5 py-0.5 rounded",
                              ctx.relevance === "high" ? "bg-green-100 text-green-700" :
                              ctx.relevance === "medium" ? "bg-amber-100 text-amber-700" :
                              "bg-gray-100 text-gray-700"
                            )}>
                              {ctx.relevance === "high" ? "Alta relevância" : ctx.relevance === "medium" ? "Média" : "Baixa"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{ctx.date}</p>
                          {ctx.snippet && (
                            <p className="text-sm text-muted-foreground mt-2 italic">"{ctx.snippet}"</p>
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

        {activeTab === "risks" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Análise de Riscos
            </h3>

            {task.risks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-50" />
                <p>Nenhum risco identificado</p>
                <p className="text-sm mt-1">Esta tarefa está livre de riscos mapeados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {task.risks.map((risk) => (
                  <div key={risk.id} className={cn(
                    "p-5 rounded-xl border",
                    risk.status === "open" ? "bg-card/80" : "bg-muted/30 opacity-75"
                  )}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs px-2 py-1 rounded-full", RISK_SEVERITY_CONFIG[risk.severity].color)}>
                          {RISK_SEVERITY_CONFIG[risk.severity].label}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-muted">
                          Prob: {risk.probability === "low" ? "Baixa" : risk.probability === "medium" ? "Média" : "Alta"}
                        </span>
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          risk.status === "open" ? "bg-red-100 text-red-700" :
                          risk.status === "mitigated" ? "bg-green-100 text-green-700" :
                          "bg-gray-100 text-gray-700"
                        )}>
                          {risk.status === "open" ? "Aberto" : risk.status === "mitigated" ? "Mitigado" : "Aceito"}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm mb-3">{risk.description}</p>

                    {risk.mitigation && (
                      <div className="p-3 rounded-lg bg-muted/30 text-sm">
                        <div className="text-xs text-muted-foreground mb-1">Mitigação:</div>
                        {risk.mitigation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "dependencies" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <GitBranch className="w-5 h-5 text-blue-500" />
              Dependências da Tarefa
            </h3>

            {task.dependencies.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma dependência mapeada</p>
                <p className="text-sm mt-1">Esta tarefa é independente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Bloqueada por */}
                {task.dependencies.filter(d => d.type === "blocked_by").length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">BLOQUEADA POR</h4>
                    <div className="space-y-2">
                      {task.dependencies.filter(d => d.type === "blocked_by").map((dep) => (
                        <div key={dep.id} className="p-4 rounded-xl border bg-card/80 flex items-center gap-4">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            dep.status === "completed" ? "bg-green-100 text-green-600" :
                            dep.status === "blocked" ? "bg-red-100 text-red-600" :
                            dep.status === "in_progress" ? "bg-blue-100 text-blue-600" :
                            "bg-amber-100 text-amber-600"
                          )}>
                            {dep.status === "completed" ? <CheckCircle2 className="w-4 h-4" /> :
                             dep.status === "blocked" ? <AlertOctagon className="w-4 h-4" /> :
                             dep.status === "in_progress" ? <Play className="w-4 h-4" /> :
                             <Clock className="w-4 h-4" />}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{dep.title}</div>
                            <div className="text-xs text-muted-foreground capitalize">{dep.status.replace("_", " ")}</div>
                          </div>
                          {dep.status !== "completed" && (
                            <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                              Aguardando
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bloqueia */}
                {task.dependencies.filter(d => d.type === "blocks").length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">BLOQUEIA</h4>
                    <div className="space-y-2">
                      {task.dependencies.filter(d => d.type === "blocks").map((dep) => (
                        <div key={dep.id} className="p-4 rounded-xl border bg-card/80 flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{dep.title}</div>
                            <div className="text-xs text-muted-foreground capitalize">{dep.status.replace("_", " ")}</div>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                            Dependente
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function getTaskDetail(taskId: string): TaskDetail | null {
  return MOCK_TASK_DETAILS[taskId] || null;
}
