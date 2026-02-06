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
  Play,
  Pause,
  ArrowRight,
  X,
  Mic,
  FileUp,
  Brain,
  Link2,
  Milestone,
  TrendingUp,
  History,
  AlertOctagon,
  Gauge,
  Zap,
  BarChart3,
  Shield,
  Sparkles,
  Timer,
  Activity,
} from "lucide-react";

// Tipos baseados nas specs 013 (Ingestion), 015 (Neo4j), 017 (Memory)
export interface ProjectMeeting {
  id: string;
  title: string;
  date: string;
  participants: string[];
  type: "kickoff" | "sprint" | "review" | "planning" | "adhoc";
  decisions: string[];
  insights: string[];
  tasks: string[];
  risks: string[];
  status: "completed" | "scheduled" | "cancelled";
  transcriptAvailable: boolean;
  documentsLinked: number;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  targetDate: string;
  completedDate?: string;
  status: "pending" | "in_progress" | "completed" | "delayed";
  progress: number;
  linkedMeetings: string[];
}

export interface ProjectIngestionEvent {
  id: string;
  type: "meeting_transcript" | "document" | "chat" | "decision" | "feedback";
  title: string;
  date: string;
  source: string;
  knowledgeExtracted: number;
  status: "processed" | "pending" | "failed";
}

export interface ProjectRisk {
  id: string;
  title: string;
  description: string;
  category: "technical" | "schedule" | "resource" | "external" | "scope";
  severity: "low" | "medium" | "high" | "critical";
  probability: "low" | "medium" | "high";
  impact: string;
  mitigation: string;
  owner: string;
  status: "open" | "mitigated" | "accepted" | "closed";
  identifiedAt: string;
  source?: string;
}

export interface ProjectComplexity {
  overall: "low" | "medium" | "high" | "very_high";
  technical: number; // 1-5
  organizational: number; // 1-5
  integration: number; // 1-5
  scope: number; // 1-5
  factors: string[];
}

export interface ProjectHealth {
  score: number; // 0-100
  trend: "improving" | "stable" | "declining";
  alerts: { type: "warning" | "critical"; message: string }[];
}

export interface ProjectDetail {
  id: string;
  name: string;
  description: string;
  status: "em andamento" | "planejado" | "concluído" | "pausado";
  phase: "initiation" | "planning" | "execution" | "monitoring" | "closing";
  progress: number;
  startDate: string;
  targetEndDate: string;
  owner: string;
  team: { id: string; name: string; role: string }[];
  linkedOkrs: { id: string; title: string; progress: number }[];
  meetings: ProjectMeeting[];
  milestones: ProjectMilestone[];
  ingestionEvents: ProjectIngestionEvent[];
  memoryClass: "semantic" | "episodic" | "procedural" | "evaluative";
  knowledgeNodesCount: number;
  tags: string[];
  risks: ProjectRisk[];
  complexity: ProjectComplexity;
  health: ProjectHealth;
}

// Mock data baseado nas discussões do chat sobre reuniões e ingestão
const MOCK_PROJECT_DETAILS: Record<string, ProjectDetail> = {
  "proj-1": {
    id: "proj-1",
    name: "Implementação EKS",
    description: "Implementação do Enterprise Knowledge System para gestão inteligente do conhecimento organizacional",
    status: "em andamento",
    phase: "execution",
    progress: 25,
    startDate: "2025-01-15",
    targetEndDate: "2025-03-15",
    owner: "Carlos Silva",
    team: [
      { id: "u1", name: "Carlos Silva", role: "Project Owner" },
      { id: "u2", name: "Maria Santos", role: "Tech Lead" },
      { id: "u3", name: "João Pedro", role: "Developer" },
      { id: "u4", name: "Ana Costa", role: "UX Designer" },
    ],
    linkedOkrs: [
      { id: "okr-1", title: "Aumentar eficiência operacional", progress: 70 },
      { id: "okr-2", title: "Expandir base de conhecimento", progress: 45 },
    ],
    meetings: [
      {
        id: "m1",
        title: "Kickoff - Alinhamento Estratégico",
        date: "2025-01-15",
        participants: ["Carlos Silva", "Maria Santos", "Direção"],
        type: "kickoff",
        decisions: [
          "Adotar Neo4j como banco de grafos",
          "Usar Pydantic AI para agentes",
          "Sprint 1 focado em infraestrutura",
        ],
        insights: [
          "Conhecimento organizacional é fragmentado",
          "Necessidade de memória episódica para decisões",
        ],
        tasks: [
          "Definir arquitetura de 5 camadas",
          "Configurar ambiente Neo4j Aura",
        ],
        risks: ["Curva de aprendizado do time em grafos"],
        status: "completed",
        transcriptAvailable: true,
        documentsLinked: 3,
      },
      {
        id: "m2",
        title: "Sprint 1 - Review & Retrospectiva",
        date: "2025-01-29",
        participants: ["Carlos Silva", "Maria Santos", "João Pedro", "Ana Costa"],
        type: "review",
        decisions: [
          "Implementar CDC (Context Depth Controller) no Sprint 2",
          "Priorizar ontologia organizacional",
        ],
        insights: [
          "Curador ontológico é papel crítico",
          "Feedback como pipeline de projetos",
        ],
        tasks: [
          "Criar spec do sistema de feedback",
          "Mapear entidades core",
        ],
        risks: [],
        status: "completed",
        transcriptAvailable: true,
        documentsLinked: 5,
      },
      {
        id: "m3",
        title: "Sprint 2 - Planning",
        date: "2025-02-03",
        participants: ["Carlos Silva", "Maria Santos", "João Pedro"],
        type: "planning",
        decisions: [],
        insights: [],
        tasks: ["Definir backlog Sprint 2"],
        risks: ["Dependência de integração com CRM"],
        status: "scheduled",
        transcriptAvailable: false,
        documentsLinked: 0,
      },
    ],
    milestones: [
      {
        id: "ms1",
        title: "Infraestrutura Core",
        targetDate: "2025-01-31",
        completedDate: "2025-01-29",
        status: "completed",
        progress: 100,
        linkedMeetings: ["m1", "m2"],
      },
      {
        id: "ms2",
        title: "Ontologia Organizacional",
        targetDate: "2025-02-15",
        status: "in_progress",
        progress: 40,
        linkedMeetings: ["m2", "m3"],
      },
      {
        id: "ms3",
        title: "Pipeline de Ingestão",
        targetDate: "2025-02-28",
        status: "pending",
        progress: 0,
        linkedMeetings: [],
      },
      {
        id: "ms4",
        title: "MVP Funcional",
        targetDate: "2025-03-15",
        status: "pending",
        progress: 0,
        linkedMeetings: [],
      },
    ],
    ingestionEvents: [
      {
        id: "ie1",
        type: "meeting_transcript",
        title: "Transcrição Kickoff",
        date: "2025-01-15",
        source: "Gravação Zoom",
        knowledgeExtracted: 12,
        status: "processed",
      },
      {
        id: "ie2",
        type: "document",
        title: "Arquitetura EKS v1",
        date: "2025-01-18",
        source: "Upload Admin",
        knowledgeExtracted: 8,
        status: "processed",
      },
      {
        id: "ie3",
        type: "meeting_transcript",
        title: "Transcrição Sprint 1 Review",
        date: "2025-01-29",
        source: "Gravação Teams",
        knowledgeExtracted: 15,
        status: "processed",
      },
      {
        id: "ie4",
        type: "chat",
        title: "Discussão sobre Ontologia",
        date: "2025-02-01",
        source: "Chat EKS",
        knowledgeExtracted: 5,
        status: "processed",
      },
      {
        id: "ie5",
        type: "feedback",
        title: "Sugestão: Sistema de Menções",
        date: "2025-02-02",
        source: "Feedback Usuário",
        knowledgeExtracted: 2,
        status: "pending",
      },
    ],
    memoryClass: "procedural",
    knowledgeNodesCount: 42,
    tags: ["eks", "knowledge-management", "neo4j", "ai-agents"],
    risks: [
      {
        id: "r1",
        title: "Curva de Aprendizado em Grafos",
        description: "Time precisa desenvolver expertise em Neo4j e modelagem de grafos, o que pode impactar velocidade inicial",
        category: "technical",
        severity: "medium",
        probability: "high",
        impact: "Atraso de 2-3 semanas no Sprint 2",
        mitigation: "Treinamento intensivo + pair programming com especialista",
        owner: "Maria Santos",
        status: "mitigated",
        identifiedAt: "2025-01-15",
        source: "Reunião Kickoff",
      },
      {
        id: "r2",
        title: "Integração com CRM Indefinida",
        description: "APIs do CRM não estão documentadas e dependem de fornecedor externo",
        category: "external",
        severity: "high",
        probability: "medium",
        impact: "Bloqueio do módulo de clientes no EKS",
        mitigation: "Reunião com fornecedor agendada para 10/02",
        owner: "João Pedro",
        status: "open",
        identifiedAt: "2025-01-29",
        source: "Sprint 1 Review",
      },
      {
        id: "r3",
        title: "Curador Ontológico como Gargalo",
        description: "Papel do curador ontológico é crítico e não há backup definido",
        category: "resource",
        severity: "high",
        probability: "medium",
        impact: "Qualidade da ontologia comprometida se curador ausente",
        mitigation: "Treinar segundo curador + documentar critérios de curadoria",
        owner: "Carlos Silva",
        status: "open",
        identifiedAt: "2025-01-29",
        source: "Sprint 1 Review",
      },
      {
        id: "r4",
        title: "Escopo do MVP não Delimitado",
        description: "Funcionalidades do MVP ainda em discussão, pode gerar scope creep",
        category: "scope",
        severity: "medium",
        probability: "medium",
        impact: "Atraso na entrega do MVP",
        mitigation: "Definir MoSCoW na próxima planning",
        owner: "Carlos Silva",
        status: "open",
        identifiedAt: "2025-02-01",
      },
    ],
    complexity: {
      overall: "high",
      technical: 4,
      organizational: 3,
      integration: 4,
      scope: 3,
      factors: [
        "Tecnologia nova (Neo4j + Pydantic AI)",
        "Múltiplas integrações (CRM, Email, Calendar)",
        "Mudança cultural (curadoria de conhecimento)",
        "Arquitetura de 5 camadas",
      ],
    },
    health: {
      score: 72,
      trend: "stable",
      alerts: [
        { type: "warning", message: "2 riscos de alta severidade em aberto" },
        { type: "warning", message: "Integração CRM sem definição clara" },
      ],
    },
  },
  "proj-2": {
    id: "proj-2",
    name: "Mapeamento de Processos",
    description: "Documentação e otimização dos processos organizacionais críticos",
    status: "planejado",
    phase: "planning",
    progress: 0,
    startDate: "2025-03-01",
    targetEndDate: "2025-05-30",
    owner: "Maria Santos",
    team: [
      { id: "u2", name: "Maria Santos", role: "Project Owner" },
      { id: "u5", name: "Roberto Lima", role: "Process Analyst" },
    ],
    linkedOkrs: [
      { id: "okr-1", title: "Aumentar eficiência operacional", progress: 70 },
    ],
    meetings: [],
    milestones: [
      {
        id: "ms1",
        title: "Levantamento de Processos",
        targetDate: "2025-03-15",
        status: "pending",
        progress: 0,
        linkedMeetings: [],
      },
      {
        id: "ms2",
        title: "Documentação AS-IS",
        targetDate: "2025-04-15",
        status: "pending",
        progress: 0,
        linkedMeetings: [],
      },
    ],
    ingestionEvents: [],
    memoryClass: "procedural",
    knowledgeNodesCount: 0,
    tags: ["processos", "bpmn", "otimização"],
    risks: [
      {
        id: "r1",
        title: "Resistência à Documentação",
        description: "Colaboradores podem resistir a documentar processos por falta de tempo ou cultura",
        category: "resource",
        severity: "medium",
        probability: "high",
        impact: "Baixa adesão e documentação incompleta",
        mitigation: "Workshops de sensibilização + templates simplificados",
        owner: "Maria Santos",
        status: "open",
        identifiedAt: "2025-02-01",
      },
    ],
    complexity: {
      overall: "medium",
      technical: 2,
      organizational: 4,
      integration: 2,
      scope: 3,
      factors: [
        "Mudança cultural necessária",
        "Múltiplas áreas envolvidas",
        "Processos não documentados",
      ],
    },
    health: {
      score: 85,
      trend: "stable",
      alerts: [],
    },
  },
  "proj-3": {
    id: "proj-3",
    name: "Integração CRM",
    description: "Integração do sistema de CRM com a base de conhecimento EKS",
    status: "em andamento",
    phase: "execution",
    progress: 75,
    startDate: "2024-11-01",
    targetEndDate: "2025-02-28",
    owner: "João Pedro",
    team: [
      { id: "u3", name: "João Pedro", role: "Tech Lead" },
      { id: "u6", name: "Paula Mendes", role: "Integration Specialist" },
    ],
    linkedOkrs: [],
    meetings: [
      {
        id: "m1",
        title: "Definição de APIs",
        date: "2024-11-15",
        participants: ["João Pedro", "Paula Mendes", "Vendor CRM"],
        type: "planning",
        decisions: ["Usar REST API do CRM", "Sincronização em tempo real"],
        insights: ["Dados de cliente podem enriquecer grafo"],
        tasks: ["Mapear endpoints", "Criar conectores"],
        risks: ["Rate limiting da API"],
        status: "completed",
        transcriptAvailable: true,
        documentsLinked: 2,
      },
    ],
    milestones: [
      {
        id: "ms1",
        title: "Conectores Básicos",
        targetDate: "2024-12-15",
        completedDate: "2024-12-10",
        status: "completed",
        progress: 100,
        linkedMeetings: ["m1"],
      },
      {
        id: "ms2",
        title: "Sincronização Bidirecional",
        targetDate: "2025-01-31",
        completedDate: "2025-01-28",
        status: "completed",
        progress: 100,
        linkedMeetings: [],
      },
      {
        id: "ms3",
        title: "Testes de Carga",
        targetDate: "2025-02-15",
        status: "in_progress",
        progress: 60,
        linkedMeetings: [],
      },
    ],
    ingestionEvents: [
      {
        id: "ie1",
        type: "document",
        title: "Documentação API CRM",
        date: "2024-11-10",
        source: "Vendor",
        knowledgeExtracted: 6,
        status: "processed",
      },
    ],
    memoryClass: "semantic",
    knowledgeNodesCount: 18,
    tags: ["crm", "integração", "api"],
    risks: [
      {
        id: "r1",
        title: "Rate Limiting da API",
        description: "API do CRM tem limites de requisições que podem impactar sincronização em tempo real",
        category: "technical",
        severity: "low",
        probability: "medium",
        impact: "Atrasos na sincronização de dados",
        mitigation: "Implementar cache e batch updates",
        owner: "João Pedro",
        status: "mitigated",
        identifiedAt: "2024-11-15",
        source: "Reunião APIs",
      },
    ],
    complexity: {
      overall: "medium",
      technical: 3,
      organizational: 2,
      integration: 4,
      scope: 2,
      factors: [
        "Dependência de API externa",
        "Sincronização bidirecional",
        "Mapeamento de entidades",
      ],
    },
    health: {
      score: 88,
      trend: "improving",
      alerts: [],
    },
  },
};

const MEETING_TYPE_CONFIG: Record<ProjectMeeting["type"], { label: string; color: string; icon: React.ReactNode }> = {
  kickoff: { label: "Kickoff", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: <Play className="w-3 h-3" /> },
  sprint: { label: "Sprint", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: <TrendingUp className="w-3 h-3" /> },
  review: { label: "Review", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: <CheckCircle2 className="w-3 h-3" /> },
  planning: { label: "Planning", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: <Target className="w-3 h-3" /> },
  adhoc: { label: "Ad-hoc", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400", icon: <MessageSquare className="w-3 h-3" /> },
};

const INGESTION_TYPE_CONFIG: Record<ProjectIngestionEvent["type"], { label: string; color: string; icon: React.ReactNode }> = {
  meeting_transcript: { label: "Transcrição", color: "bg-purple-100 text-purple-700", icon: <Mic className="w-3 h-3" /> },
  document: { label: "Documento", color: "bg-blue-100 text-blue-700", icon: <FileText className="w-3 h-3" /> },
  chat: { label: "Chat", color: "bg-green-100 text-green-700", icon: <MessageSquare className="w-3 h-3" /> },
  decision: { label: "Decisão", color: "bg-amber-100 text-amber-700", icon: <Target className="w-3 h-3" /> },
  feedback: { label: "Feedback", color: "bg-cyan-100 text-cyan-700", icon: <Lightbulb className="w-3 h-3" /> },
};

const PHASE_LABELS: Record<ProjectDetail["phase"], string> = {
  initiation: "Iniciação",
  planning: "Planejamento",
  execution: "Execução",
  monitoring: "Monitoramento",
  closing: "Encerramento",
};

const MEMORY_CLASS_CONFIG: Record<ProjectDetail["memoryClass"], { label: string; color: string }> = {
  semantic: { label: "Semântica", color: "bg-cyan-100 text-cyan-700" },
  episodic: { label: "Episódica", color: "bg-purple-100 text-purple-700" },
  procedural: { label: "Procedural", color: "bg-green-100 text-green-700" },
  evaluative: { label: "Avaliativa", color: "bg-amber-100 text-amber-700" },
};

interface ProjectDetailPanelProps {
  projectId: string;
  onClose: () => void;
}

type TabType = "timeline" | "risks" | "milestones" | "ingestion" | "team";

const RISK_CATEGORY_CONFIG: Record<ProjectRisk["category"], { label: string; color: string }> = {
  technical: { label: "Técnico", color: "bg-blue-100 text-blue-700" },
  schedule: { label: "Cronograma", color: "bg-purple-100 text-purple-700" },
  resource: { label: "Recursos", color: "bg-orange-100 text-orange-700" },
  external: { label: "Externo", color: "bg-cyan-100 text-cyan-700" },
  scope: { label: "Escopo", color: "bg-pink-100 text-pink-700" },
};

const RISK_SEVERITY_CONFIG: Record<ProjectRisk["severity"], { label: string; color: string }> = {
  low: { label: "Baixo", color: "bg-green-100 text-green-700" },
  medium: { label: "Médio", color: "bg-amber-100 text-amber-700" },
  high: { label: "Alto", color: "bg-orange-100 text-orange-700" },
  critical: { label: "Crítico", color: "bg-red-100 text-red-700" },
};

const COMPLEXITY_CONFIG: Record<ProjectComplexity["overall"], { label: string; color: string }> = {
  low: { label: "Baixa", color: "text-green-600" },
  medium: { label: "Média", color: "text-amber-600" },
  high: { label: "Alta", color: "text-orange-600" },
  very_high: { label: "Muito Alta", color: "text-red-600" },
};

export function ProjectDetailPanel({ projectId, onClose }: ProjectDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("timeline");
  const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null);

  const project = MOCK_PROJECT_DETAILS[projectId];

  if (!project) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Projeto não encontrado
      </div>
    );
  }

  const openRisks = project.risks.filter(r => r.status === "open").length;
  const hasHighRisks = project.risks.some(r => r.status === "open" && (r.severity === "high" || r.severity === "critical"));

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number; alert?: boolean }[] = [
    { id: "timeline", label: "Timeline", icon: <History className="w-4 h-4" />, count: project.meetings.length },
    { id: "risks", label: "Riscos & Complexidade", icon: <AlertTriangle className="w-4 h-4" />, count: openRisks, alert: hasHighRisks },
    { id: "milestones", label: "Milestones", icon: <Milestone className="w-4 h-4" />, count: project.milestones.length },
    { id: "ingestion", label: "Ingestão", icon: <FileUp className="w-4 h-4" />, count: project.ingestionEvents.length },
    { id: "team", label: "Equipe", icon: <Users className="w-4 h-4" />, count: project.team.length },
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="p-6 border-b border-border bg-card/80 backdrop-blur">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold">{project.name}</h2>
              <span className={cn(
                "text-xs px-2 py-1 rounded-full",
                project.status === "em andamento" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                project.status === "planejado" && "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
                project.status === "concluído" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                project.status === "pausado" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
              )}>
                {project.status}
              </span>
              <span className={cn("text-xs px-2 py-1 rounded-full", MEMORY_CLASS_CONFIG[project.memoryClass].color)}>
                <Brain className="w-3 h-3 inline mr-1" />
                {MEMORY_CLASS_CONFIG[project.memoryClass].label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{project.description}</p>

            {/* Quick Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{project.startDate} → {project.targetEndDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{project.team.length} membros</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-muted-foreground" />
                <span>{project.knowledgeNodesCount} nodes</span>
              </div>
              {project.linkedOkrs.length > 0 && (
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">{project.linkedOkrs.length} OKR(s)</span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Progresso • {PHASE_LABELS[project.phase]}</span>
                <span className="font-semibold">{project.progress}%</span>
              </div>
              <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    project.progress >= 75 ? "bg-green-500" : project.progress >= 50 ? "bg-blue-500" : project.progress >= 25 ? "bg-amber-500" : "bg-gray-400"
                  )}
                  style={{ width: `${project.progress}%` }}
                />
              </div>
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
        {activeTab === "timeline" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <History className="w-5 h-5 text-purple-500" />
                História do Projeto
              </h3>
              <span className="text-sm text-muted-foreground">
                {project.meetings.length} reuniões • {project.meetings.filter(m => m.transcriptAvailable).length} transcrições
              </span>
            </div>

            {project.meetings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma reunião registrada ainda</p>
                <p className="text-sm mt-1">As reuniões aparecerão aqui conforme forem realizadas</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

                {project.meetings.map((meeting, index) => {
                  const config = MEETING_TYPE_CONFIG[meeting.type];
                  const isExpanded = expandedMeeting === meeting.id;

                  return (
                    <div key={meeting.id} className="relative pl-14 pb-6">
                      {/* Timeline Dot */}
                      <div className={cn(
                        "absolute left-4 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center",
                        meeting.status === "completed" ? "bg-green-500" : meeting.status === "scheduled" ? "bg-blue-500" : "bg-gray-400"
                      )}>
                        {meeting.status === "completed" ? (
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        ) : (
                          <Clock className="w-3 h-3 text-white" />
                        )}
                      </div>

                      {/* Meeting Card */}
                      <div
                        className={cn(
                          "p-4 rounded-xl border bg-card/80 backdrop-blur cursor-pointer transition-all hover:shadow-md",
                          isExpanded && "ring-2 ring-primary"
                        )}
                        onClick={() => setExpandedMeeting(isExpanded ? null : meeting.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn("text-xs px-2 py-0.5 rounded-full flex items-center gap-1", config.color)}>
                                {config.icon}
                                {config.label}
                              </span>
                              <span className="text-xs text-muted-foreground">{meeting.date}</span>
                              {meeting.transcriptAvailable && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 flex items-center gap-1">
                                  <Mic className="w-3 h-3" />
                                  Transcrição
                                </span>
                              )}
                            </div>
                            <h4 className="font-semibold">{meeting.title}</h4>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Users className="w-3 h-3" />
                              {meeting.participants.slice(0, 3).join(", ")}
                              {meeting.participants.length > 3 && ` +${meeting.participants.length - 3}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {meeting.decisions.length > 0 && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                {meeting.decisions.length} decisões
                              </span>
                            )}
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-border space-y-4">
                            {meeting.decisions.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium flex items-center gap-2 mb-2">
                                  <Target className="w-4 h-4 text-amber-500" />
                                  Decisões
                                </h5>
                                <ul className="space-y-1">
                                  {meeting.decisions.map((decision, i) => (
                                    <li key={i} className="text-sm pl-4 border-l-2 border-amber-500/50">
                                      {decision}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {meeting.insights.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium flex items-center gap-2 mb-2">
                                  <Lightbulb className="w-4 h-4 text-purple-500" />
                                  Insights
                                </h5>
                                <ul className="space-y-1">
                                  {meeting.insights.map((insight, i) => (
                                    <li key={i} className="text-sm pl-4 border-l-2 border-purple-500/50">
                                      {insight}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {meeting.tasks.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium flex items-center gap-2 mb-2">
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  Tarefas Geradas
                                </h5>
                                <ul className="space-y-1">
                                  {meeting.tasks.map((task, i) => (
                                    <li key={i} className="text-sm pl-4 border-l-2 border-green-500/50">
                                      {task}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {meeting.risks.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium flex items-center gap-2 mb-2">
                                  <AlertTriangle className="w-4 h-4 text-red-500" />
                                  Riscos Identificados
                                </h5>
                                <ul className="space-y-1">
                                  {meeting.risks.map((risk, i) => (
                                    <li key={i} className="text-sm pl-4 border-l-2 border-red-500/50">
                                      {risk}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {meeting.documentsLinked > 0 && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                                <FileText className="w-4 h-4" />
                                {meeting.documentsLinked} documento(s) vinculado(s)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "risks" && (
          <div className="space-y-6">
            {/* Health Score Card */}
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-8 space-y-6">
                {/* Saúde do Projeto */}
                <div className="p-5 rounded-xl border bg-card/80 backdrop-blur">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-green-500" />
                    Saúde do Projeto
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30 text-center">
                      <div className={cn(
                        "text-4xl font-bold",
                        project.health.score >= 80 ? "text-green-500" :
                        project.health.score >= 60 ? "text-amber-500" :
                        project.health.score >= 40 ? "text-orange-500" : "text-red-500"
                      )}>
                        {project.health.score}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">Score de Saúde</div>
                      <div className={cn(
                        "text-xs mt-2 flex items-center justify-center gap-1",
                        project.health.trend === "improving" ? "text-green-600" :
                        project.health.trend === "declining" ? "text-red-600" : "text-gray-500"
                      )}>
                        <TrendingUp className={cn(
                          "w-3 h-3",
                          project.health.trend === "declining" && "rotate-180"
                        )} />
                        {project.health.trend === "improving" ? "Melhorando" :
                         project.health.trend === "declining" ? "Piorando" : "Estável"}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30">
                      <div className="text-2xl font-bold">{project.risks.length}</div>
                      <div className="text-sm text-muted-foreground">Riscos Totais</div>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Abertos</span>
                          <span className="font-semibold text-red-600">{project.risks.filter(r => r.status === "open").length}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Mitigados</span>
                          <span className="font-semibold text-green-600">{project.risks.filter(r => r.status === "mitigated").length}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30">
                      <div className={cn("text-2xl font-bold", COMPLEXITY_CONFIG[project.complexity.overall].color)}>
                        {COMPLEXITY_CONFIG[project.complexity.overall].label}
                      </div>
                      <div className="text-sm text-muted-foreground">Complexidade</div>
                      <div className="mt-2 flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={cn(
                              "w-4 h-4 rounded-sm",
                              level <= (project.complexity.overall === "low" ? 1 : 
                                        project.complexity.overall === "medium" ? 2 :
                                        project.complexity.overall === "high" ? 4 : 5)
                                ? project.complexity.overall === "low" ? "bg-green-500" :
                                  project.complexity.overall === "medium" ? "bg-amber-500" :
                                  project.complexity.overall === "high" ? "bg-orange-500" : "bg-red-500"
                                : "bg-muted"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Alertas */}
                  {project.health.alerts.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {project.health.alerts.map((alert, i) => (
                        <div key={i} className={cn(
                          "p-3 rounded-lg flex items-center gap-2 text-sm",
                          alert.type === "critical" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        )}>
                          <AlertTriangle className="w-4 h-4" />
                          {alert.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Análise de Complexidade */}
                <div className="p-5 rounded-xl border bg-card/80 backdrop-blur">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <Gauge className="w-5 h-5 text-purple-500" />
                    Análise de Complexidade
                  </h3>
                  
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    {[
                      { label: "Técnica", value: project.complexity.technical },
                      { label: "Organizacional", value: project.complexity.organizational },
                      { label: "Integração", value: project.complexity.integration },
                      { label: "Escopo", value: project.complexity.scope },
                    ].map((item) => (
                      <div key={item.label} className="p-3 rounded-lg bg-muted/30">
                        <div className="text-xs text-muted-foreground mb-2">{item.label}</div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={cn(
                                "flex-1 h-2 rounded-sm",
                                level <= item.value
                                  ? item.value <= 2 ? "bg-green-500" :
                                    item.value <= 3 ? "bg-amber-500" :
                                    item.value <= 4 ? "bg-orange-500" : "bg-red-500"
                                  : "bg-muted"
                              )}
                            />
                          ))}
                        </div>
                        <div className="text-right text-xs font-semibold mt-1">{item.value}/5</div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-lg bg-muted/20">
                    <div className="text-sm font-medium mb-2">Fatores de Complexidade</div>
                    <div className="flex flex-wrap gap-2">
                      {project.complexity.factors.map((factor, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-full bg-muted">
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar - Resumo de Riscos por Categoria */}
              <div className="col-span-4 space-y-4">
                <div className="p-5 rounded-xl border bg-card/80 backdrop-blur">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">POR CATEGORIA</h4>
                  <div className="space-y-2">
                    {(["technical", "schedule", "resource", "external", "scope"] as const).map((cat) => {
                      const count = project.risks.filter(r => r.category === cat).length;
                      if (count === 0) return null;
                      return (
                        <div key={cat} className="flex items-center justify-between">
                          <span className={cn("text-xs px-2 py-1 rounded", RISK_CATEGORY_CONFIG[cat].color)}>
                            {RISK_CATEGORY_CONFIG[cat].label}
                          </span>
                          <span className="text-sm font-semibold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-5 rounded-xl border bg-card/80 backdrop-blur">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">POR SEVERIDADE</h4>
                  <div className="space-y-2">
                    {(["critical", "high", "medium", "low"] as const).map((sev) => {
                      const count = project.risks.filter(r => r.severity === sev && r.status === "open").length;
                      if (count === 0) return null;
                      return (
                        <div key={sev} className="flex items-center justify-between">
                          <span className={cn("text-xs px-2 py-1 rounded", RISK_SEVERITY_CONFIG[sev].color)}>
                            {RISK_SEVERITY_CONFIG[sev].label}
                          </span>
                          <span className="text-sm font-semibold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Riscos */}
            <div className="p-5 rounded-xl border bg-card/80 backdrop-blur">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-red-500" />
                Registro de Riscos ({project.risks.length})
              </h3>

              {project.risks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-50" />
                  <p>Nenhum risco identificado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {project.risks.map((risk) => (
                    <div key={risk.id} className={cn(
                      "p-4 rounded-xl border",
                      risk.status === "open" ? "bg-card" : "bg-muted/30 opacity-75"
                    )}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn("text-xs px-2 py-0.5 rounded", RISK_SEVERITY_CONFIG[risk.severity].color)}>
                              {RISK_SEVERITY_CONFIG[risk.severity].label}
                            </span>
                            <span className={cn("text-xs px-2 py-0.5 rounded", RISK_CATEGORY_CONFIG[risk.category].color)}>
                              {RISK_CATEGORY_CONFIG[risk.category].label}
                            </span>
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded",
                              risk.status === "open" ? "bg-red-100 text-red-700" :
                              risk.status === "mitigated" ? "bg-green-100 text-green-700" :
                              risk.status === "accepted" ? "bg-gray-100 text-gray-700" :
                              "bg-blue-100 text-blue-700"
                            )}>
                              {risk.status === "open" ? "Aberto" :
                               risk.status === "mitigated" ? "Mitigado" :
                               risk.status === "accepted" ? "Aceito" : "Fechado"}
                            </span>
                          </div>
                          <h4 className="font-semibold">{risk.title}</h4>
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                          <div>Prob: {risk.probability === "low" ? "Baixa" : risk.probability === "medium" ? "Média" : "Alta"}</div>
                          <div>{risk.owner}</div>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">{risk.description}</p>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
                          <div className="text-xs text-muted-foreground mb-1">Impacto</div>
                          <div>{risk.impact}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
                          <div className="text-xs text-muted-foreground mb-1">Mitigação</div>
                          <div>{risk.mitigation}</div>
                        </div>
                      </div>

                      {risk.source && (
                        <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                          Identificado em: {risk.source} ({risk.identifiedAt})
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "milestones" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Milestone className="w-5 h-5 text-blue-500" />
              Milestones do Projeto
            </h3>

            {project.milestones.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Milestone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum milestone definido</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {project.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="p-4 rounded-xl border bg-card/80 backdrop-blur"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold">{milestone.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>Meta: {milestone.targetDate}</span>
                          {milestone.completedDate && (
                            <>
                              <ArrowRight className="w-3 h-3" />
                              <span className="text-green-600">Concluído: {milestone.completedDate}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        milestone.status === "completed" && "bg-green-100 text-green-700",
                        milestone.status === "in_progress" && "bg-blue-100 text-blue-700",
                        milestone.status === "pending" && "bg-gray-100 text-gray-700",
                        milestone.status === "delayed" && "bg-red-100 text-red-700",
                      )}>
                        {milestone.status === "completed" ? "Concluído" : milestone.status === "in_progress" ? "Em andamento" : milestone.status === "delayed" ? "Atrasado" : "Pendente"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-semibold">{milestone.progress}%</span>
                      </div>
                      <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            milestone.status === "completed" ? "bg-green-500" : milestone.status === "delayed" ? "bg-red-500" : "bg-blue-500"
                          )}
                          style={{ width: `${milestone.progress}%` }}
                        />
                      </div>
                    </div>

                    {milestone.linkedMeetings.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                        <MessageSquare className="w-3 h-3 inline mr-1" />
                        {milestone.linkedMeetings.length} reunião(ões) vinculada(s)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "ingestion" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileUp className="w-5 h-5 text-cyan-500" />
                Histórico de Ingestão
              </h3>
              <span className="text-sm text-muted-foreground">
                {project.ingestionEvents.reduce((sum, e) => sum + e.knowledgeExtracted, 0)} conhecimentos extraídos
              </span>
            </div>

            {project.ingestionEvents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma ingestão de dados ainda</p>
                <p className="text-sm mt-1">Transcrições, documentos e feedbacks aparecerão aqui</p>
              </div>
            ) : (
              <div className="space-y-3">
                {project.ingestionEvents.map((event) => {
                  const config = INGESTION_TYPE_CONFIG[event.type];
                  return (
                    <div
                      key={event.id}
                      className="p-4 rounded-xl border bg-card/80 backdrop-blur hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2 rounded-lg", config.color)}>
                            {config.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn("text-xs px-2 py-0.5 rounded", config.color)}>
                                {config.label}
                              </span>
                              <span className="text-xs text-muted-foreground">{event.date}</span>
                            </div>
                            <h4 className="font-medium">{event.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">Fonte: {event.source}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm">
                            <Brain className="w-4 h-4 text-muted-foreground" />
                            <span className="font-semibold">{event.knowledgeExtracted}</span>
                          </div>
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded",
                            event.status === "processed" && "bg-green-100 text-green-700",
                            event.status === "pending" && "bg-amber-100 text-amber-700",
                            event.status === "failed" && "bg-red-100 text-red-700",
                          )}>
                            {event.status === "processed" ? "Processado" : event.status === "pending" ? "Pendente" : "Falhou"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "team" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-green-500" />
              Equipe do Projeto
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {project.team.map((member) => (
                <div
                  key={member.id}
                  className="p-4 rounded-xl border bg-card/80 backdrop-blur flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-semibold">{member.name}</h4>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>

            {project.linkedOkrs.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">OKRs VINCULADOS</h4>
                <div className="space-y-2">
                  {project.linkedOkrs.map((okr) => (
                    <div key={okr.id} className="p-3 rounded-lg border bg-card/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{okr.title}</span>
                      </div>
                      <span className="text-sm font-semibold">{okr.progress}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {project.tags.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">TAGS</h4>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-1 rounded-full bg-muted">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function getProjectDetail(projectId: string): ProjectDetail | null {
  return MOCK_PROJECT_DETAILS[projectId] || null;
}
