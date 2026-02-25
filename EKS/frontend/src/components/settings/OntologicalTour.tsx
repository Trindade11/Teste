"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Compass,
  BookOpen,
  Layers,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Circle,
  Loader2,
  AlertTriangle,
  Info,
  Users,
  FileText,
  Target,
  FolderKanban,
  Building2,
  Network,
  MessageSquare,
  Brain,
  BarChart3,
  Sparkles,
  Bell,
  ChevronDown,
  ChevronRight,
  History,
  RefreshCw,
} from "lucide-react"
import { Tooltip } from "@/components/ui/tooltip"

// ─── Tooltip descriptions for each KPI ─────────────────────────────────────────────

const KPI_TOOLTIPS: Record<string, string> = {
  "Nós totais": "Total de entidades no grafo de conhecimento. Inclui Users, Departments, Projects, Knowledge, Documents e todos os tipos de nó do EKS.",
  "Relações totais": "Total de conexões entre entidades. Cada relação tem tipo semântico (MEMBER_OF, SUPPORTS, EXTRACTED_FROM) que define o significado.",
  "R/N": "Relações por Nó \u2014 densidade de conexões do grafo. <1 indica nós isolados, >3 indica boa conectividade.",
  "Completude props": "Média de propriedades preenchidas por label vs. o que o schema define. Ex: se User tem 10 propriedades no schema mas só 5 preenchidas = 50%.",
  "Governance Score": "Score composto (0-100). Combina: completude de props (30%), ausência de órfãos (30%), conectividade R/N (20%) e cobertura temporal (20%).",
  "BIG Anchoring": "Business Intent Graph \u2014 % de Knowledge nodes conectados a Objectives via SUPPORTS. Mede o quanto o conhecimento está ancorado à estratégia.",
}

const ZONE_TOOLTIPS = {
  wellKnown: "Labels onde a contagem de nós atinge >70% do esperado para o porte da empresa. \u00c1reas bem mapeadas.",
  partiallyKnown: "Labels com cobertura 30-70%. Há dados, mas incompletos. Prioridade média de enriquecimento.",
  barelyKnown: "Labels com <30% do esperado. \u00c1reas críticas que precisam de gestão de dados. Os 'esperados' são baseados no porte da empresa.",
}

// ─── Types ───────────────────────────────────────────────────────────

type TourTab = "synthesis" | "maturity" | "labels" | "questions"

interface TourStage {
  id: number
  name: string
  description: string
  criteria: string[]
  status: "achieved" | "in_progress" | "pending"
  progress: number // 0-100
  achievedAt?: string
}

interface LabelCoverage {
  label: string
  icon: React.ElementType
  nodeCount: number
  expectedCount: number
  coveragePercent: number
  propertyCompleteness: number
  avgConnections: number
  freshnessDays: number
  bigAnchoring: number
  validatedPercent: number
  trend: "up" | "down" | "stable"
}

interface SuggestedQuestion {
  id: string
  question: string
  reason: string
  category: "missing_relation" | "stale_data" | "low_coverage" | "no_validation" | "orphan"
  severity: "low" | "medium" | "high"
  targetLabel: string
  targetNode?: string
  resonanceType?: string // Connection to Ressonância model
  resonanceMessage?: string
}

interface TourSnapshot {
  version: string
  createdAt: string
  maturityStage: number
  totalNodes: number
  totalRelationships: number
  totalLabels: number
  rPerN: number
  propertyCompleteness: number
  governanceScore: number
  temporalCoverage: number
  bigAnchoring: number
  stages: TourStage[]
  labelCoverage: LabelCoverage[]
  suggestedQuestions: SuggestedQuestion[]
  previousVersion?: string
  companyName: string
  companySize?: number | null
  expectedCountSource?: "company_data" | "inferred" | "actual"
  synthesisText: string
  wellKnown: string[]
  partiallyKnown: string[]
  barelyKnown: string[]
  keyNumbers: { label: string; value: string; trend: "up" | "down" | "stable"; delta?: string }[]
}

interface MonitoringConfig {
  frequency: string
  lastRun?: string
  nextRun?: string
  alertsEnabled: boolean
}

// ─── Mock Data ───────────────────────────────────────────────────────

const MOCK_MONITORING: MonitoringConfig = {
  frequency: "Diário (12:00)",
  lastRun: "2026-02-10T12:00:00Z",
  nextRun: "2026-02-11T12:00:00Z",
  alertsEnabled: true,
}

const MOCK_TOUR: TourSnapshot = {
  version: "V3",
  createdAt: "2026-02-10T22:00:00Z",
  maturityStage: 1.5,
  totalNodes: 69,
  totalRelationships: 114,
  totalLabels: 14,
  rPerN: 1.65,
  propertyCompleteness: 62,
  governanceScore: 52,
  temporalCoverage: 8,
  bigAnchoring: 15,
  companyName: "Alocc Gestão Patrimonial",
  previousVersion: "V2",
  synthesisText: "",
  wellKnown: [
    "Estrutura organizacional: 5 departamentos, 18 usuários, hierarquia mapeada",
    "Objetivos estratégicos: 6 objetivos, 12 OKRs, todos com métricas definidas",
    "Base documental: 35 documentos ingeridos, 210 chunks extraídos",
  ],
  partiallyKnown: [
    "Projetos: 8 projetos cadastrados, mas 3 sem owner definido",
    "Conhecimento: 42 Knowledge nodes, 60% classificados por classe de memória",
    "Competências: Mapeadas para 12 dos 18 usuários (67%)",
  ],
  barelyKnown: [
    "Processos operacionais: Apenas 4 processos documentados via PIA",
    "Relações de suporte: 15% do Knowledge tem SUPPORTS → Objective",
    "Handoffs: Nenhum handoff mapeado entre áreas",
    "Regras de negócio: 0 BusinessRule nodes extraídos",
  ],
  keyNumbers: [
    { label: "Nós totais", value: "69", trend: "up", delta: "+12 (7d)" },
    { label: "Relações totais", value: "114", trend: "up", delta: "+8 (7d)" },
    { label: "R/N", value: "1.65", trend: "stable" },
    { label: "Completude props", value: "62%", trend: "up", delta: "+5% (30d)" },
    { label: "Governance Score", value: "52/100", trend: "stable" },
    { label: "BIG Anchoring", value: "15%", trend: "up", delta: "+3% (7d)" },
  ],
  stages: [
    {
      id: 0,
      name: "Schema Definido",
      description: "Labels e relationships nomeados, Meta-Grafo criado",
      criteria: [
        "14 labels definidos com descrições",
        "16 tipos de relacionamento mapeados",
        "Propriedades documentadas por label",
      ],
      status: "achieved",
      progress: 100,
      achievedAt: "2026-01-20",
    },
    {
      id: 1,
      name: "Dados Base Ingeridos",
      description: "Nós populados via ingestão (chat, docs, CSV, reuniões)",
      criteria: [
        "Organograma importado (CSV)",
        "Documentos ingeridos e chunks extraídos",
        "Reuniões transcritas e processadas",
      ],
      status: "achieved",
      progress: 100,
      achievedAt: "2026-02-01",
    },
    {
      id: 2,
      name: "Propriedades Enriquecidas",
      description: "Propriedades preenchidas >80% com enriquecimento semântico",
      criteria: [
        "Completude de propriedades >80% (atual: 62%)",
        "Aliases limpos e normalizados",
        "Relações semânticas conectadas",
      ],
      status: "in_progress",
      progress: 62,
    },
    {
      id: 3,
      name: "Temporalidade Ativa",
      description: "createdAt/updatedAt populados, versionamento funcionando",
      criteria: [
        "Propriedades temporais em >80% dos nós",
        "PersonaVersion com histórico",
        "SUPERSEDES em entidades versionadas",
      ],
      status: "pending",
      progress: 8,
    },
    {
      id: 4,
      name: "Curadoria Validada",
      description: "Curador ontológico revisou e validou o grafo",
      criteria: [
        "Supernós identificados e documentados",
        "Nós órfãos tratados (<5%)",
        "Governança ativa (score >70)",
        "Decisões logadas no grafo",
      ],
      status: "pending",
      progress: 15,
    },
    {
      id: 5,
      name: "Consciência Plena",
      description: "BIG ancorado, 4 classes de memória, auto-monitoramento",
      criteria: [
        "BIG Anchoring >80% (todo knowledge ligado a objectives)",
        "4 classes de memória classificadas (Semântica, Episódica, Procedural, Avaliativa)",
        "Tour se atualiza automaticamente",
        "Alertas proativos funcionando",
      ],
      status: "pending",
      progress: 0,
    },
  ],
  labelCoverage: [
    { label: "User", icon: Users, nodeCount: 18, expectedCount: 25, coveragePercent: 72, propertyCompleteness: 88, avgConnections: 4.2, freshnessDays: 15, bigAnchoring: 0, validatedPercent: 28, trend: "stable" },
    { label: "Department", icon: Building2, nodeCount: 5, expectedCount: 6, coveragePercent: 83, propertyCompleteness: 90, avgConnections: 5.8, freshnessDays: 20, bigAnchoring: 0, validatedPercent: 60, trend: "stable" },
    { label: "Document", icon: FileText, nodeCount: 35, expectedCount: 50, coveragePercent: 70, propertyCompleteness: 95, avgConnections: 3.1, freshnessDays: 5, bigAnchoring: 20, validatedPercent: 0, trend: "up" },
    { label: "Objective", icon: Target, nodeCount: 6, expectedCount: 8, coveragePercent: 75, propertyCompleteness: 85, avgConnections: 4.5, freshnessDays: 10, bigAnchoring: 100, validatedPercent: 50, trend: "stable" },
    { label: "OKR", icon: BarChart3, nodeCount: 12, expectedCount: 16, coveragePercent: 75, propertyCompleteness: 78, avgConnections: 3.0, freshnessDays: 12, bigAnchoring: 100, validatedPercent: 33, trend: "up" },
    { label: "Project", icon: FolderKanban, nodeCount: 8, expectedCount: 12, coveragePercent: 67, propertyCompleteness: 60, avgConnections: 2.8, freshnessDays: 38, bigAnchoring: 62, validatedPercent: 25, trend: "down" },
    { label: "Knowledge", icon: Brain, nodeCount: 42, expectedCount: 100, coveragePercent: 42, propertyCompleteness: 55, avgConnections: 1.8, freshnessDays: 8, bigAnchoring: 15, validatedPercent: 0, trend: "up" },
    { label: "Chunk", icon: FileText, nodeCount: 210, expectedCount: 300, coveragePercent: 70, propertyCompleteness: 92, avgConnections: 2.0, freshnessDays: 5, bigAnchoring: 0, validatedPercent: 0, trend: "up" },
    { label: "Conversation", icon: MessageSquare, nodeCount: 28, expectedCount: 50, coveragePercent: 56, propertyCompleteness: 70, avgConnections: 3.5, freshnessDays: 3, bigAnchoring: 0, validatedPercent: 0, trend: "up" },
    { label: "Process", icon: Network, nodeCount: 4, expectedCount: 20, coveragePercent: 20, propertyCompleteness: 45, avgConnections: 2.2, freshnessDays: 25, bigAnchoring: 50, validatedPercent: 0, trend: "stable" },
  ],
  suggestedQuestions: [
    {
      id: "q1",
      question: "Quem é o responsável pelo Departamento de Marketing?",
      reason: "Department 'Marketing' existe mas não possui relação REPORTS_TO → User",
      category: "missing_relation",
      severity: "high",
      targetLabel: "Department",
      targetNode: "Marketing",
      resonanceType: "area_citation",
      resonanceMessage: "Quando preenchido, todos os membros de Marketing receberão um sinal de conexão",
    },
    {
      id: "q2",
      question: "O Projeto 'Portal do Investidor' ainda está ativo?",
      reason: "Última atualização há 38 dias. Sem progresso registrado.",
      category: "stale_data",
      severity: "high",
      targetLabel: "Project",
      targetNode: "Portal do Investidor",
      resonanceType: "flow_refinement",
      resonanceMessage: "A atualização dispara sinal para todos os envolvidos no projeto",
    },
    {
      id: "q3",
      question: "Que processos existem na área Financeira?",
      reason: "Department 'Financeiro' tem 0 Knowledge nodes com memory_class: procedural",
      category: "low_coverage",
      severity: "high",
      targetLabel: "Process",
      resonanceType: "concept_propagation",
      resonanceMessage: "Mapear processos do Financeiro pode revelar conexões com Compliance e Operações",
    },
    {
      id: "q4",
      question: "Os 3 projetos sem owner pertencem a quem?",
      reason: "Projetos 'Automação RPA', 'Portal Externo' e 'BI Dashboard' não têm OWNED_BY",
      category: "missing_relation",
      severity: "medium",
      targetLabel: "Project",
      resonanceType: "area_citation",
      resonanceMessage: "Definir ownership ativa ressonância para as equipes envolvidas",
    },
    {
      id: "q5",
      question: "As competências dos 6 usuários sem mapeamento são quais?",
      reason: "6 Users não possuem HAS_COMPETENCY (33% sem competências)",
      category: "missing_relation",
      severity: "medium",
      targetLabel: "User",
      resonanceType: "knowledge_validated",
      resonanceMessage: "Competências mapeadas enriquecem o perfil e melhoram recomendações",
    },
    {
      id: "q6",
      question: "Os 42 Knowledge nodes foram revisados por alguém?",
      reason: "0% de validação humana nos Knowledge nodes",
      category: "no_validation",
      severity: "high",
      targetLabel: "Knowledge",
      resonanceType: "knowledge_validated",
      resonanceMessage: "Validar knowledge pode gerar ressonância para quem criou o conteúdo original",
    },
    {
      id: "q7",
      question: "Existem regras de negócio documentadas?",
      reason: "0 nodes do tipo BusinessRule no grafo",
      category: "low_coverage",
      severity: "medium",
      targetLabel: "BusinessRule",
      resonanceType: "pattern_reuse",
      resonanceMessage: "Regras de negócio são reutilizáveis e geram alta ressonância cross-departamento",
    },
    {
      id: "q8",
      question: "Há handoffs mapeados entre as áreas?",
      reason: "0 relações HANDS_OFF no grafo. PIA disponível mas não utilizado.",
      category: "low_coverage",
      severity: "medium",
      targetLabel: "Process",
      resonanceType: "concept_propagation",
      resonanceMessage: "Handoffs conectam áreas e revelam fluxos implícitos",
    },
    {
      id: "q9",
      question: "Os documentos ingeridos estão ligados a objetivos estratégicos?",
      reason: "Apenas 20% dos Documents têm relação com Objectives via Knowledge",
      category: "missing_relation",
      severity: "low",
      targetLabel: "Document",
      resonanceType: "feedback_strategic_impact",
      resonanceMessage: "Conectar documentos a objetivos melhora o BIG Anchoring",
    },
    {
      id: "q10",
      question: "Qual é a visão e missão formal da empresa?",
      reason: "Company node existe mas propriedades 'vision' e 'mission' estão vazias",
      category: "missing_relation",
      severity: "low",
      targetLabel: "Company",
      targetNode: "Alocc",
    },
  ],
}

const MOCK_VERSIONS: { version: string; date: string; stage: number; nodes: number }[] = [
  { version: "V3", date: "2026-02-10", stage: 1.5, nodes: 69 },
  { version: "V2", date: "2026-02-01", stage: 1.0, nodes: 57 },
  { version: "V1", date: "2026-01-25", stage: 0.5, nodes: 34 },
]

// ─── Helper Components ───────────────────────────────────────────────

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
  if (trend === "down") return <TrendingDown className="h-3.5 w-3.5 text-red-500" />
  return <Minus className="h-3.5 w-3.5 text-gray-400" />
}

function StageIcon({ status }: { status: "achieved" | "in_progress" | "pending" }) {
  if (status === "achieved") return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
  if (status === "in_progress") return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
  return <Circle className="h-5 w-5 text-gray-300" />
}

function SeverityBadge({ severity }: { severity: "low" | "medium" | "high" }) {
  const colors = {
    low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  }
  const labels = { low: "Baixa", medium: "Média", high: "Alta" }
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${colors[severity]}`}>
      {labels[severity]}
    </span>
  )
}

function CategoryBadge({ category }: { category: SuggestedQuestion["category"] }) {
  const map: Record<string, { label: string; color: string }> = {
    missing_relation: { label: "Relação Faltante", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    stale_data: { label: "Dado Obsoleto", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    low_coverage: { label: "Baixa Cobertura", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
    no_validation: { label: "Sem Validação", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    orphan: { label: "Órfão", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" },
  }
  const item = map[category] || { label: category, color: "bg-gray-100 text-gray-700" }
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${item.color}`}>
      {item.label}
    </span>
  )
}

function ProgressBar({ value, color = "blue" }: { value: number; color?: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
  }
  const barColor = value >= 80 ? "bg-emerald-500" : value >= 50 ? colorMap[color] || "bg-blue-500" : value >= 30 ? "bg-yellow-500" : "bg-red-500"
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div className={`${barColor} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  )
}

// ─── Icon mapping for backend data ──────────────────────────────────

const LABEL_ICONS: Record<string, React.ElementType> = {
  User: Users,
  Department: Building2,
  Document: FileText,
  Objective: Target,
  OKR: BarChart3,
  Project: FolderKanban,
  Knowledge: Brain,
  Chunk: FileText,
  Conversation: MessageSquare,
  Process: Network,
  Company: Building2,
  Task: Target,
  Plan: FileText,
  Agent: Brain,
  Message: MessageSquare,
}

function getIconForLabel(label: string): React.ElementType {
  return LABEL_ICONS[label] || Network
}

function getResponderLabel(category: string, targetLabel: string): string {
  if (category === "missing_relation" && ["Department", "Company"].includes(targetLabel)) return "Curador"
  if (category === "missing_relation" && targetLabel === "Project") return "Líder da Área"
  if (category === "stale_data") return "Líder da Área"
  if (category === "low_coverage" && targetLabel === "Process") return "Área + PIA"
  if (category === "low_coverage" && targetLabel === "Document") return "Área"
  if (category === "no_validation") return "Curador"
  return "Curador"
}

function getResponderTooltip(category: string, targetLabel: string): string {
  const responder = getResponderLabel(category, targetLabel)
  const tooltips: Record<string, string> = {
    "Curador": "O Curador Ontológico é responsável por validar e enriquecer o grafo. Não é admin — é um papel de gestão do conhecimento.",
    "Líder da Área": "O líder ou gestor da área afetada deve fornecer a informação. Ele conhece o contexto operacional.",
    "Área + PIA": "Os colaboradores da área, apoiados pelo agente PIA (Process Intelligence), mapeiam processos em conjunto.",
    "Área": "Os colaboradores da área são a fonte primária desta informação. Pode ser coletado via onboarding ou chat.",
  }
  return tooltips[responder] || "Responsável a definir."
}

function DemoBanner({ isLive }: { isLive: boolean }) {
  if (isLive) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              Dados ao vivo do Neo4j
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
              Este Tour mostra métricas calculadas em tempo real a partir do grafo.
            </p>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
      <div className="flex items-start gap-2">
        <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Dados de demonstração
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
            Não foi possível conectar ao backend. Exibindo dados simulados.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────

export function OntologicalTour() {
  const [activeTab, setActiveTab] = useState<TourTab>("synthesis")
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [tourData, setTourData] = useState<TourSnapshot | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { api } = await import("@/lib/api")
      const res = await api.getOntologicalTourSnapshot()
      if (res.success && res.data) {
        // Map backend data to frontend format (add icons to labelCoverage)
        const mapped: TourSnapshot = {
          ...res.data,
          labelCoverage: (res.data.labelCoverage || []).map((lc: any) => ({
            ...lc,
            icon: getIconForLabel(lc.label),
          })),
        }
        setTourData(mapped)
        setIsLive(true)
      } else {
        setTourData(MOCK_TOUR)
        setIsLive(false)
      }
    } catch {
      setTourData(MOCK_TOUR)
      setIsLive(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const tour = tourData || MOCK_TOUR
  const monitoring = MOCK_MONITORING

  const toggleQuestion = (id: string) => {
    const next = new Set(expandedQuestions)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedQuestions(next)
  }

  // ─── Tab: Síntese ────────────────────────────────────────────────

  const renderSynthesis = () => {
    const maturityColor = tour.maturityStage >= 4 ? "text-emerald-500" : tour.maturityStage >= 2 ? "text-blue-500" : "text-yellow-500"

    return (
      <div className="space-y-4">
        {/* Maturity Overview Bar */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900/20 border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Compass className="h-5 w-5 text-blue-500" />
                Síntese Ontológica — {tour.version}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Configurado para <span className="font-medium text-foreground">{tour.companyName}</span>
                {tour.companySize ? (
                  <span className="ml-1 text-xs text-blue-500">({tour.companySize} colaboradores — base para estimativas)</span>
                ) : tour.expectedCountSource === "inferred" ? (
                  <span className="ml-1 text-xs text-yellow-600">(porte inferido de {tour.totalNodes} Users)</span>
                ) : (
                  <Tooltip content="Sem employeeCount no nó Company. As estimativas usam contagens atuais. Defina c.employeeCount no Company para ativar análise por porte." className="max-w-xs whitespace-normal">
                    <span className="ml-1 text-xs text-muted-foreground cursor-help">(porte não definido <Info className="h-3 w-3 inline opacity-50" />)</span>
                  </Tooltip>
                )}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${maturityColor}`}>
                {tour.maturityStage.toFixed(1)}/5.0
              </div>
              <div className="text-xs text-muted-foreground">Estágio de Maturidade</div>
            </div>
          </div>
          <ProgressBar value={(tour.maturityStage / 5) * 100} color="blue" />
          {tour.synthesisText ? (
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{tour.synthesisText}</p>
          ) : (
            <p className="text-xs text-muted-foreground mt-2">
              Schema definido, dados base ingeridos, propriedades parcialmente completas. Próximo marco: completar propriedades (&gt;80%).
            </p>
          )}
        </div>

        {/* Key Numbers Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {tour.keyNumbers.map((kn, i) => (
            <Tooltip key={i} content={KPI_TOOLTIPS[kn.label] || kn.label} className="max-w-xs whitespace-normal">
              <div className="bg-card border rounded-lg p-3 cursor-help">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  {kn.label}
                  <Info className="h-3 w-3 opacity-40" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold">{kn.value}</span>
                  <TrendIcon trend={kn.trend} />
                </div>
                {kn.delta && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">{kn.delta}</div>
                )}
              </div>
            </Tooltip>
          ))}
        </div>

        {/* Monitoring Info */}
        <div className="bg-card border rounded-lg p-4">
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
            <RefreshCw className="h-4 w-4 text-blue-500" />
            Monitoramento & Atualização
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase">Frequência</div>
              <div className="text-sm font-medium">{monitoring.frequency}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase">Última execução</div>
              <div className="text-sm font-medium">
                {monitoring.lastRun ? new Date(monitoring.lastRun).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase">Próxima execução</div>
              <div className="text-sm font-medium">
                {monitoring.nextRun ? new Date(monitoring.nextRun).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase">Alertas</div>
              <div className="text-sm font-medium flex items-center gap-1.5">
                <Bell className={`h-3.5 w-3.5 ${monitoring.alertsEnabled ? "text-emerald-500" : "text-gray-400"}`} />
                {monitoring.alertsEnabled ? "Ativos" : "Desativados"}
              </div>
            </div>
          </div>
        </div>

        {/* Version History Toggle */}
        <button
          type="button"
          onClick={() => setShowVersionHistory(!showVersionHistory)}
          className="w-full text-left bg-card border rounded-lg p-3 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Histórico de Versões</span>
            </div>
            {showVersionHistory ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>
        {showVersionHistory && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2 text-xs font-medium text-muted-foreground">Versão</th>
                  <th className="text-left p-2 text-xs font-medium text-muted-foreground">Data</th>
                  <th className="text-left p-2 text-xs font-medium text-muted-foreground">Estágio</th>
                  <th className="text-left p-2 text-xs font-medium text-muted-foreground">Nós</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_VERSIONS.map((v, i) => (
                  <tr key={v.version} className={i === 0 ? "bg-blue-50 dark:bg-blue-900/10" : ""}>
                    <td className="p-2 font-medium">{v.version} {i === 0 && <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded ml-1">Atual</span>}</td>
                    <td className="p-2 text-muted-foreground">{new Date(v.date).toLocaleDateString("pt-BR")}</td>
                    <td className="p-2">{v.stage.toFixed(1)}</td>
                    <td className="p-2">{v.nodes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  // ─── Tab: Maturidade ─────────────────────────────────────────────

  const renderMaturity = () => {
    return (
      <div className="space-y-4">
        {/* Current stage highlight */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Estágio Atual: {tour.maturityStage.toFixed(1)} / 5.0</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {(() => {
                  const achieved = tour.stages.filter(s => s.status === "achieved")
                  const inProgress = tour.stages.find(s => s.status === "in_progress")
                  if (inProgress) {
                    const lastAchieved = achieved[achieved.length - 1]
                    return <>Entre <strong>{lastAchieved?.name || "início"}</strong> e <strong>{inProgress.name}</strong> ({inProgress.progress}%)</>
                  }
                  if (achieved.length === 0) return <>Nenhum estágio concluído. Primeiro passo: definir schema.</>
                  if (achieved.length === tour.stages.length) return <>Todos os estágios concluídos. Consciência plena ativa.</>
                  const last = achieved[achieved.length - 1]
                  return <><strong>{last.name}</strong> concluído.</>
                })()}
              </p>
            </div>
            <div className="text-4xl font-bold text-blue-500">{tour.maturityStage.toFixed(1)}</div>
          </div>
          <div className="mt-3">
            <ProgressBar value={(tour.maturityStage / 5) * 100} color="blue" />
          </div>
        </div>

        {/* Stages Timeline */}
        <div className="space-y-0">
          {tour.stages.map((stage, i) => (
            <div key={stage.id} className="relative">
              {/* Connector line */}
              {i < tour.stages.length - 1 && (
                <div className={`absolute left-[9px] top-[28px] w-0.5 h-[calc(100%-8px)] ${stage.status === "achieved" ? "bg-emerald-300 dark:bg-emerald-700" : "bg-gray-200 dark:bg-gray-700"}`} />
              )}
              <div className={`flex gap-3 p-4 rounded-lg border mb-1 transition-all ${
                stage.status === "in_progress" ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800" :
                stage.status === "achieved" ? "bg-emerald-50/50 dark:bg-emerald-900/5 border-emerald-200 dark:border-emerald-800/50" :
                "bg-card border-border opacity-60"
              }`}>
                <div className="shrink-0 mt-0.5">
                  <StageIcon status={stage.status} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold">Estágio {stage.id}: {stage.name}</h4>
                    {stage.status === "achieved" && stage.achievedAt && (
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                        Concluído em {new Date(stage.achievedAt).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                    {stage.status === "in_progress" && (
                      <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">
                        Em progresso — {stage.progress}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{stage.description}</p>
                  {/* Criteria */}
                  <div className="mt-2 space-y-1">
                    {stage.criteria.map((c, ci) => (
                      <div key={ci} className="flex items-start gap-1.5">
                        {stage.status === "achieved" ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                        ) : (
                          <Circle className="h-3 w-3 text-gray-300 mt-0.5 shrink-0" />
                        )}
                        <span className="text-[11px] text-muted-foreground">{c}</span>
                      </div>
                    ))}
                  </div>
                  {/* Progress bar for in_progress */}
                  {stage.status === "in_progress" && (
                    <div className="mt-2">
                      <ProgressBar value={stage.progress} color="blue" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Next Action */}
        <div className="bg-card border rounded-lg p-4">
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            Para avançar ao Estágio 2.0
          </h4>
          <ul className="space-y-1.5">
            <li className="text-xs text-muted-foreground flex items-start gap-1.5">
              <span className="mt-0.5 shrink-0">→</span>
              <span>Completar propriedades faltantes nos Users (email, role, competências)</span>
            </li>
            <li className="text-xs text-muted-foreground flex items-start gap-1.5">
              <span className="mt-0.5 shrink-0">→</span>
              <span>Enriquecer Projects com owners e datas de início/fim</span>
            </li>
            <li className="text-xs text-muted-foreground flex items-start gap-1.5">
              <span className="mt-0.5 shrink-0">→</span>
              <span>Limpar possíveis aliases/duplicatas nos Knowledge nodes</span>
            </li>
            <li className="text-xs text-muted-foreground flex items-start gap-1.5">
              <span className="mt-0.5 shrink-0">→</span>
              <span>Meta: propriedade completude de 62% → 80%</span>
            </li>
          </ul>
        </div>
      </div>
    )
  }

  // ─── Tab: Por Label ──────────────────────────────────────────────

  const renderLabels = () => {
    const sorted = [...tour.labelCoverage].sort((a, b) => b.coveragePercent - a.coveragePercent)

    return (
      <div className="space-y-4">
        <div className="bg-card border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-1">Cobertura por Label</h3>
          <p className="text-xs text-muted-foreground">
            Cada label do grafo com métricas de cobertura, completude, conectividade, frescor e ancoragem BIG.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> &gt;70%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> 30-70%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> &lt;30%</span>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2.5 text-xs font-medium text-muted-foreground">Label</th>
                <th className="text-center p-2.5 text-xs font-medium text-muted-foreground">
                  <Tooltip content="Nós atuais / esperados para o porte da empresa. O 'esperado' é derivado do número de colaboradores." className="max-w-xs whitespace-normal">
                    <span className="cursor-help">Nós <Info className="h-2.5 w-2.5 inline opacity-40" /></span>
                  </Tooltip>
                </th>
                <th className="text-center p-2.5 text-xs font-medium text-muted-foreground">
                  <Tooltip content="Cobertura = (nós atuais / esperados) × 100. >70% verde, 30-70% amarelo, <30% vermelho." className="max-w-xs whitespace-normal">
                    <span className="cursor-help">Cobertura <Info className="h-2.5 w-2.5 inline opacity-40" /></span>
                  </Tooltip>
                </th>
                <th className="text-center p-2.5 text-xs font-medium text-muted-foreground">
                  <Tooltip content="Completude de propriedades: % médio de propriedades preenchidas vs. definidas no schema. >80% bom, <50% crítico." className="max-w-xs whitespace-normal">
                    <span className="cursor-help">Props <Info className="h-2.5 w-2.5 inline opacity-40" /></span>
                  </Tooltip>
                </th>
                <th className="text-center p-2.5 text-xs font-medium text-muted-foreground">
                  <Tooltip content="Média de conexões por nó deste label. Indica o quão integrado o label está no grafo. <1 = isolado, >3 = bem conectado." className="max-w-xs whitespace-normal">
                    <span className="cursor-help">Conn. <Info className="h-2.5 w-2.5 inline opacity-40" /></span>
                  </Tooltip>
                </th>
                <th className="text-center p-2.5 text-xs font-medium text-muted-foreground">
                  <Tooltip content="Frescor médio: dias desde a última atualização. ≤7d verde, ≤30d amarelo, >30d vermelho (dados velhos)." className="max-w-xs whitespace-normal">
                    <span className="cursor-help">Frescor <Info className="h-2.5 w-2.5 inline opacity-40" /></span>
                  </Tooltip>
                </th>
                <th className="text-center p-2.5 text-xs font-medium text-muted-foreground">
                  <Tooltip content="BIG Anchoring: % de nós deste label conectados a Objectives via SUPPORTS. Mede ancoragem à estratégia." className="max-w-xs whitespace-normal">
                    <span className="cursor-help">BIG <Info className="h-2.5 w-2.5 inline opacity-40" /></span>
                  </Tooltip>
                </th>
                <th className="text-center p-2.5 text-xs font-medium text-muted-foreground">
                  <Tooltip content="% de nós deste label que foram validados pelo Curador Ontológico. Indica confiança nos dados." className="max-w-xs whitespace-normal">
                    <span className="cursor-help">Valid. <Info className="h-2.5 w-2.5 inline opacity-40" /></span>
                  </Tooltip>
                </th>
                <th className="text-center p-2.5 text-xs font-medium text-muted-foreground w-8" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((lc) => {
                const Icon = lc.icon
                const covColor = lc.coveragePercent >= 70 ? "text-emerald-600 dark:text-emerald-400" : lc.coveragePercent >= 30 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"
                const propColor = lc.propertyCompleteness >= 80 ? "text-emerald-600 dark:text-emerald-400" : lc.propertyCompleteness >= 50 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"
                const freshColor = lc.freshnessDays <= 7 ? "text-emerald-600 dark:text-emerald-400" : lc.freshnessDays <= 30 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"
                const bigColor = lc.bigAnchoring >= 70 ? "text-emerald-600 dark:text-emerald-400" : lc.bigAnchoring >= 30 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"

                return (
                  <tr key={lc.label} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="p-2.5">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-xs">{lc.label}</span>
                      </div>
                    </td>
                    <td className="p-2.5 text-center text-xs">
                      {lc.nodeCount}/{lc.expectedCount}
                    </td>
                    <td className={`p-2.5 text-center text-xs font-semibold ${covColor}`}>
                      {lc.coveragePercent}%
                    </td>
                    <td className={`p-2.5 text-center text-xs ${propColor}`}>
                      {lc.propertyCompleteness}%
                    </td>
                    <td className="p-2.5 text-center text-xs">
                      {lc.avgConnections.toFixed(1)}
                    </td>
                    <td className={`p-2.5 text-center text-xs ${freshColor}`}>
                      {lc.freshnessDays}d
                    </td>
                    <td className={`p-2.5 text-center text-xs ${bigColor}`}>
                      {lc.bigAnchoring}%
                    </td>
                    <td className="p-2.5 text-center text-xs">
                      {lc.validatedPercent}%
                    </td>
                    <td className="p-2.5 text-center">
                      <TrendIcon trend={lc.trend} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Summary insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Melhor cobertura</h4>
            <p className="text-xs text-emerald-600 dark:text-emerald-400/80">
              <strong>Department</strong> (83%) e <strong>Objective</strong> (75%) são os labels mais completos.
              Boa base organizacional e estratégica.
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Atenção necessária</h4>
            <p className="text-xs text-red-600 dark:text-red-400/80">
              <strong>Process</strong> (20%) e <strong>Knowledge</strong> (42%) precisam de enriquecimento urgente.
              Usar PIA para mapear processos.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ─── Tab: Dúvidas ────────────────────────────────────────────────

  const renderQuestions = () => {
    const byCategory: Record<string, SuggestedQuestion[]> = {}
    tour.suggestedQuestions.forEach((q) => {
      if (!byCategory[q.category]) byCategory[q.category] = []
      byCategory[q.category].push(q)
    })

    const highCount = tour.suggestedQuestions.filter(q => q.severity === "high").length
    const mediumCount = tour.suggestedQuestions.filter(q => q.severity === "medium").length
    const withResonance = tour.suggestedQuestions.filter(q => q.resonanceType).length

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-5">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-purple-500" />
            O que o EKS deveria perguntar
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Perguntas geradas automaticamente a partir de gaps detectados no grafo.
            Respondê-las enriquece o conhecimento e pode gerar <strong>ressonância</strong> para colaboradores.
            Cada pergunta indica <strong>quem deve responder</strong>: o Curador Ontológico, o líder da área, ou o próprio colaborador.
          </p>
          <div className="flex gap-4 mt-3">
            <div className="text-center">
              <div className="text-xl font-bold text-red-500">{highCount}</div>
              <div className="text-[10px] text-muted-foreground">Alta prioridade</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-500">{mediumCount}</div>
              <div className="text-[10px] text-muted-foreground">Média prioridade</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-500">{withResonance}</div>
              <div className="text-[10px] text-muted-foreground">Com ressonância</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{tour.suggestedQuestions.length}</div>
              <div className="text-[10px] text-muted-foreground">Total</div>
            </div>
          </div>
        </div>

        {/* Resonance Connection Banner */}
        <div className="bg-indigo-50 dark:bg-indigo-900/15 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">
                Conexão com Ressonância (Spec 020)
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                Perguntas respondidas pelo colaborador podem disparar sinais semânticos para outros membros da organização,
                revelando conexões emergentes e incentivando contribuição por ressonância — não por gamificação.
              </p>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-2">
          {tour.suggestedQuestions
            .sort((a, b) => {
              const sev = { high: 0, medium: 1, low: 2 }
              return sev[a.severity] - sev[b.severity]
            })
            .map((q) => {
              const isExpanded = expandedQuestions.has(q.id)
              return (
                <div key={q.id} className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleQuestion(q.id)}
                    className="w-full text-left p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <HelpCircle className={`h-4 w-4 mt-0.5 shrink-0 ${
                        q.severity === "high" ? "text-red-500" : q.severity === "medium" ? "text-yellow-500" : "text-blue-500"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{q.question}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <SeverityBadge severity={q.severity} />
                          <CategoryBadge category={q.category} />
                          <span className="text-[10px] text-muted-foreground">
                            {q.targetLabel}{q.targetNode ? `: ${q.targetNode}` : ""}
                          </span>
                          {q.resonanceType && (
                            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Sparkles className="h-2.5 w-2.5" />
                              Ressonância
                            </span>
                          )}
                          <Tooltip content={getResponderTooltip(q.category, q.targetLabel)} className="max-w-xs whitespace-normal">
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded flex items-center gap-0.5 cursor-help">
                              <Users className="h-2.5 w-2.5" />
                              {getResponderLabel(q.category, q.targetLabel)}
                            </span>
                          </Tooltip>
                        </div>
                      </div>
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t bg-muted/20">
                      <div className="pt-2 space-y-2">
                        <div>
                          <div className="text-[10px] font-medium text-muted-foreground uppercase">Por que esta pergunta?</div>
                          <p className="text-xs mt-0.5">{q.reason}</p>
                        </div>
                        {q.resonanceMessage && (
                          <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded p-2">
                            <div className="text-[10px] font-medium text-indigo-700 dark:text-indigo-400 uppercase flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              Efeito de Ressonância
                            </div>
                            <p className="text-xs text-indigo-600 dark:text-indigo-400/80 mt-0.5">
                              {q.resonanceMessage}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      </div>
    )
  }

  // ─── Main Render ─────────────────────────────────────────────────

  const tabs: { id: TourTab; label: string; icon: React.ElementType }[] = [
    { id: "synthesis", label: "Síntese", icon: BookOpen },
    { id: "maturity", label: "Maturidade", icon: Layers },
    { id: "labels", label: "Por Label", icon: BarChart3 },
    { id: "questions", label: "Dúvidas", icon: HelpCircle },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Compass className="h-5 w-5 text-blue-500" />
          Tour Ontológico
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Consciência do EKS — o que o sistema sabe, o que não sabe, e para onde ir
        </p>
      </div>

      <DemoBanner isLive={isLive} />

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-muted-foreground">Calculando snapshot do grafo...</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b pb-0">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                isActive
                  ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.id === "questions" && (
                <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded-full ml-0.5">
                  {tour.suggestedQuestions.filter(q => q.severity === "high").length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "synthesis" && renderSynthesis()}
      {activeTab === "maturity" && renderMaturity()}
      {activeTab === "labels" && renderLabels()}
      {activeTab === "questions" && renderQuestions()}
    </div>
  )
}
