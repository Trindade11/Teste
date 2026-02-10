"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { 
  Upload,
  FileText,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  Sparkles,
  BookOpen,
  FolderUp,
  ShieldCheck,
  Database,
  Link2,
  X,
  Check,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Layers,
  FileType2,
  Building2,
  Users,
  FolderKanban,
  Target,
  Lightbulb,
  Tag,
  MoreVertical,
  ArrowUpRight,
  Loader2,
  FileImage,
  FileSpreadsheet,
  File,
  Trash2,
  RefreshCw,
  ChevronUp,
  MessageSquare,
  Puzzle,
  Boxes,
  SlidersHorizontal,
  Brain,
  CircleDot,
  Workflow,
  BadgeCheck,
  History,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ──────────────────────────────────────────────────────────────────

type KnowledgeTab = "acervo" | "ingestao" | "curadoria";

type DocumentStatus =
  | "uploading"
  | "processing"
  | "chunking"
  | "embedding"
  | "awaiting_curation"
  | "approved"
  | "rejected"
  | "error";

type DocumentType =
  | "contrato"
  | "relatorio"
  | "ata"
  | "politica"
  | "manual"
  | "proposta"
  | "apresentacao"
  | "planilha"
  | "outro";

type EntityType = "project" | "okr" | "department" | "person" | "risk" | "decision" | "meeting";

interface LinkedEntity {
  id: string;
  type: EntityType;
  name: string;
  relationship: string; // Ex: "pertence_a", "referencia", "impacta"
}

interface DocumentChunk {
  id: string;
  content: string;
  chunkIndex: number;
  tokens: number;
  hasTable: boolean;
  confidence: number;
}

interface KnowledgeDocument {
  id: string;
  title: string;
  description: string;
  type: DocumentType;
  format: string; // pdf, docx, xlsx, etc.
  status: DocumentStatus;
  uploadedBy: string;
  uploadedAt: string;
  processedAt?: string;
  fileSize: string;
  chunkCount: number;
  linkedEntities: LinkedEntity[];
  tags: string[];
  confidence: number;
  curatorNotes?: string;
}

interface CurationItem {
  id: string;
  documentId: string;
  documentTitle: string;
  type: DocumentType;
  submittedBy: string;
  submittedAt: string;
  chunks: DocumentChunk[];
  linkedEntities: LinkedEntity[];
  suggestedEntities: LinkedEntity[];
  aiSummary: string;
  aiClassification: string;
  confidence: number;
  status: "pending" | "in_review" | "approved" | "rejected";
  issues: CurationIssue[];
}

interface CurationIssue {
  id: string;
  type: "quality" | "structure" | "relevance" | "duplicate" | "policy";
  severity: "low" | "medium" | "high";
  description: string;
  suggestion?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TABS: { id: KnowledgeTab; label: string; icon: React.ReactNode; description: string }[] = [
  { id: "acervo", label: "Acervo Digital", icon: <Database className="w-4 h-4" />, description: "Documentos e conhecimento da organização" },
  { id: "ingestao", label: "Nova Ingestão", icon: <FolderUp className="w-4 h-4" />, description: "Upload e vinculação de documentos" },
  { id: "curadoria", label: "Curadoria", icon: <ShieldCheck className="w-4 h-4" />, description: "Validação ontológica" },
];

const DOCUMENT_TYPES: { id: DocumentType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "contrato", label: "Contrato", icon: <FileText className="w-4 h-4" />, color: "bg-blue-500" },
  { id: "relatorio", label: "Relatório", icon: <BarChart3 className="w-4 h-4" />, color: "bg-emerald-500" },
  { id: "ata", label: "Ata de Reunião", icon: <MessageSquare className="w-4 h-4" />, color: "bg-violet-500" },
  { id: "politica", label: "Política/Norma", icon: <ShieldCheck className="w-4 h-4" />, color: "bg-amber-500" },
  { id: "manual", label: "Manual", icon: <BookOpen className="w-4 h-4" />, color: "bg-cyan-500" },
  { id: "proposta", label: "Proposta", icon: <Lightbulb className="w-4 h-4" />, color: "bg-orange-500" },
  { id: "apresentacao", label: "Apresentação", icon: <Layers className="w-4 h-4" />, color: "bg-pink-500" },
  { id: "planilha", label: "Planilha", icon: <FileSpreadsheet className="w-4 h-4" />, color: "bg-green-500" },
  { id: "outro", label: "Outro", icon: <File className="w-4 h-4" />, color: "bg-gray-500" },
];

const ENTITY_TYPE_CONFIG: Record<EntityType, { label: string; icon: React.ReactNode; color: string }> = {
  project: { label: "Projeto", icon: <FolderKanban className="w-3.5 h-3.5" />, color: "bg-blue-500/10 text-blue-700 border-blue-200" },
  okr: { label: "OKR", icon: <Target className="w-3.5 h-3.5" />, color: "bg-violet-500/10 text-violet-700 border-violet-200" },
  department: { label: "Departamento", icon: <Building2 className="w-3.5 h-3.5" />, color: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
  person: { label: "Pessoa", icon: <Users className="w-3.5 h-3.5" />, color: "bg-amber-500/10 text-amber-700 border-amber-200" },
  risk: { label: "Risco", icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "bg-red-500/10 text-red-700 border-red-200" },
  decision: { label: "Decisão", icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "bg-cyan-500/10 text-cyan-700 border-cyan-200" },
  meeting: { label: "Reunião", icon: <MessageSquare className="w-3.5 h-3.5" />, color: "bg-pink-500/10 text-pink-700 border-pink-200" },
};

const RELATIONSHIP_OPTIONS: { value: string; label: string }[] = [
  { value: "pertence_a", label: "Pertence a" },
  { value: "referencia", label: "Referencia" },
  { value: "impacta", label: "Impacta" },
  { value: "complementa", label: "Complementa" },
  { value: "substitui", label: "Substitui" },
  { value: "regula", label: "Regula" },
  { value: "documenta", label: "Documenta" },
];

const STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string; icon: React.ReactNode }> = {
  uploading: { label: "Enviando", color: "bg-blue-500/10 text-blue-700", icon: <Upload className="w-3.5 h-3.5" /> },
  processing: { label: "Processando", color: "bg-amber-500/10 text-amber-700", icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
  chunking: { label: "Fragmentando", color: "bg-violet-500/10 text-violet-700", icon: <Puzzle className="w-3.5 h-3.5" /> },
  embedding: { label: "Indexando", color: "bg-cyan-500/10 text-cyan-700", icon: <Brain className="w-3.5 h-3.5" /> },
  awaiting_curation: { label: "Aguardando Curadoria", color: "bg-orange-500/10 text-orange-700", icon: <Clock className="w-3.5 h-3.5" /> },
  approved: { label: "Aprovado", color: "bg-green-500/10 text-green-700", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected: { label: "Rejeitado", color: "bg-red-500/10 text-red-700", icon: <XCircle className="w-3.5 h-3.5" /> },
  error: { label: "Erro", color: "bg-red-500/10 text-red-700", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
};

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: "doc-001",
    title: "Contrato de Parceria Estratégica — TechCorp",
    description: "Contrato mestre de parceria para desenvolvimento conjunto de soluções de IA aplicada ao setor financeiro. Vigência 2025-2027.",
    type: "contrato",
    format: "pdf",
    status: "approved",
    uploadedBy: "Ana Silva",
    uploadedAt: "2025-12-15",
    processedAt: "2025-12-15",
    fileSize: "2.4 MB",
    chunkCount: 47,
    linkedEntities: [
      { id: "proj-001", type: "project", name: "Integração TechCorp", relationship: "pertence_a" },
      { id: "dept-001", type: "department", name: "Jurídico", relationship: "referencia" },
      { id: "person-001", type: "person", name: "Carlos Mendes", relationship: "referencia" },
    ],
    tags: ["parceria", "IA", "fintech", "estratégico"],
    confidence: 0.94,
  },
  {
    id: "doc-002",
    title: "Relatório de Performance Q4 2025",
    description: "Análise consolidada de indicadores de performance do quarto trimestre, incluindo métricas financeiras, operacionais e de mercado.",
    type: "relatorio",
    format: "pdf",
    status: "approved",
    uploadedBy: "Pedro Santos",
    uploadedAt: "2026-01-10",
    processedAt: "2026-01-10",
    fileSize: "5.1 MB",
    chunkCount: 83,
    linkedEntities: [
      { id: "okr-001", type: "okr", name: "Crescimento Q4 25%", relationship: "referencia" },
      { id: "dept-002", type: "department", name: "Financeiro", relationship: "pertence_a" },
    ],
    tags: ["performance", "Q4", "financeiro", "KPIs"],
    confidence: 0.91,
  },
  {
    id: "doc-003",
    title: "Política de Segurança da Informação v3.2",
    description: "Atualização da política corporativa de segurança da informação, incluindo novas diretrizes para uso de IA generativa.",
    type: "politica",
    format: "docx",
    status: "awaiting_curation",
    uploadedBy: "Mariana Costa",
    uploadedAt: "2026-02-05",
    fileSize: "890 KB",
    chunkCount: 34,
    linkedEntities: [
      { id: "dept-003", type: "department", name: "TI & Segurança", relationship: "pertence_a" },
      { id: "risk-001", type: "risk", name: "Vazamento de dados via LLM", relationship: "impacta" },
    ],
    tags: ["segurança", "política", "IA generativa", "compliance"],
    confidence: 0.87,
  },
  {
    id: "doc-004",
    title: "Proposta Comercial — Projeto Aurora",
    description: "Proposta de implementação de plataforma de analytics preditivo para operações de supply chain.",
    type: "proposta",
    format: "pdf",
    status: "processing",
    uploadedBy: "Ricardo Alves",
    uploadedAt: "2026-02-08",
    fileSize: "3.2 MB",
    chunkCount: 0,
    linkedEntities: [
      { id: "proj-002", type: "project", name: "Projeto Aurora", relationship: "pertence_a" },
    ],
    tags: ["proposta", "analytics", "supply chain"],
    confidence: 0,
  },
  {
    id: "doc-005",
    title: "Manual de Onboarding — Equipe de Dados",
    description: "Guia completo de integração para novos membros da equipe de dados, incluindo ferramentas, processos e boas práticas.",
    type: "manual",
    format: "pdf",
    status: "approved",
    uploadedBy: "Julia Ferreira",
    uploadedAt: "2025-11-20",
    processedAt: "2025-11-20",
    fileSize: "1.8 MB",
    chunkCount: 28,
    linkedEntities: [
      { id: "dept-004", type: "department", name: "Dados & Analytics", relationship: "pertence_a" },
    ],
    tags: ["onboarding", "dados", "manual", "processos"],
    confidence: 0.96,
  },
  {
    id: "doc-006",
    title: "Ata da Reunião de Diretoria — Jan/2026",
    description: "Registro das deliberações da reunião mensal de diretoria, incluindo decisões sobre budget e prioridades estratégicas.",
    type: "ata",
    format: "docx",
    status: "approved",
    uploadedBy: "Ana Silva",
    uploadedAt: "2026-01-28",
    processedAt: "2026-01-28",
    fileSize: "450 KB",
    chunkCount: 15,
    linkedEntities: [
      { id: "meeting-001", type: "meeting", name: "Diretoria Jan/26", relationship: "documenta" },
      { id: "decision-001", type: "decision", name: "Aprovar orçamento Q1", relationship: "referencia" },
    ],
    tags: ["diretoria", "ata", "decisões", "orçamento"],
    confidence: 0.92,
  },
];

const MOCK_SEARCHABLE_ENTITIES: LinkedEntity[] = [
  { id: "proj-001", type: "project", name: "Integração TechCorp", relationship: "pertence_a" },
  { id: "proj-002", type: "project", name: "Projeto Aurora", relationship: "pertence_a" },
  { id: "proj-003", type: "project", name: "Migração Cloud AWS", relationship: "pertence_a" },
  { id: "proj-004", type: "project", name: "EKS Platform", relationship: "pertence_a" },
  { id: "okr-001", type: "okr", name: "Crescimento Q4 25%", relationship: "referencia" },
  { id: "okr-002", type: "okr", name: "NPS > 70 até Q2", relationship: "referencia" },
  { id: "okr-003", type: "okr", name: "Reduzir churn para < 5%", relationship: "impacta" },
  { id: "dept-001", type: "department", name: "Jurídico", relationship: "referencia" },
  { id: "dept-002", type: "department", name: "Financeiro", relationship: "referencia" },
  { id: "dept-003", type: "department", name: "TI & Segurança", relationship: "pertence_a" },
  { id: "dept-004", type: "department", name: "Dados & Analytics", relationship: "pertence_a" },
  { id: "dept-005", type: "department", name: "Comercial", relationship: "referencia" },
  { id: "person-001", type: "person", name: "Carlos Mendes", relationship: "referencia" },
  { id: "person-002", type: "person", name: "Ana Silva", relationship: "referencia" },
  { id: "person-003", type: "person", name: "Pedro Santos", relationship: "referencia" },
  { id: "risk-001", type: "risk", name: "Vazamento de dados via LLM", relationship: "impacta" },
  { id: "risk-002", type: "risk", name: "Atraso migração cloud", relationship: "impacta" },
  { id: "meeting-001", type: "meeting", name: "Diretoria Jan/26", relationship: "documenta" },
  { id: "decision-001", type: "decision", name: "Aprovar orçamento Q1", relationship: "referencia" },
];

const MOCK_CURATION_ITEMS: CurationItem[] = [
  {
    id: "cur-001",
    documentId: "doc-003",
    documentTitle: "Política de Segurança da Informação v3.2",
    type: "politica",
    submittedBy: "Mariana Costa",
    submittedAt: "2026-02-05",
    chunks: [
      { id: "ch-001", content: "1. Escopo e Aplicabilidade\n\nEsta política aplica-se a todos os colaboradores, prestadores de serviço e parceiros que acessem recursos de informação da organização...", chunkIndex: 0, tokens: 312, hasTable: false, confidence: 0.92 },
      { id: "ch-002", content: "2. Uso de IA Generativa\n\n2.1 É proibido o envio de dados classificados como 'Confidencial' ou 'Restrito' para ferramentas de IA generativa externas sem aprovação prévia...", chunkIndex: 1, tokens: 458, hasTable: false, confidence: 0.95 },
      { id: "ch-003", content: "3. Classificação de Dados\n\n| Nível | Descrição | Exemplos |\n|---|---|---|\n| Público | Informações de domínio público | Press releases |\n| Interno | Uso interno da organização | Manuais de processo |", chunkIndex: 2, tokens: 287, hasTable: true, confidence: 0.88 },
    ],
    linkedEntities: [
      { id: "dept-003", type: "department", name: "TI & Segurança", relationship: "pertence_a" },
    ],
    suggestedEntities: [
      { id: "risk-001", type: "risk", name: "Vazamento de dados via LLM", relationship: "impacta" },
      { id: "proj-004", type: "project", name: "EKS Platform", relationship: "referencia" },
    ],
    aiSummary: "Atualização da política de segurança da informação com novas diretrizes específicas para uso de IA generativa. Define classificação de dados em 4 níveis e estabelece restrições para ferramentas externas.",
    aiClassification: "Documento normativo corporativo — Governança de TI",
    confidence: 0.89,
    status: "pending",
    issues: [
      { id: "iss-001", type: "quality", severity: "low", description: "Chunk 3 contém tabela que pode ter formatação parcial", suggestion: "Verificar se a extração da tabela preservou todas as colunas" },
      { id: "iss-002", type: "relevance", severity: "medium", description: "Documento menciona 'EKS Platform' mas não foi vinculado pelo submitter", suggestion: "Sugerir vinculação ao Projeto EKS Platform" },
    ],
  },
  {
    id: "cur-002",
    documentId: "doc-007",
    documentTitle: "Plano Estratégico 2026-2028",
    type: "relatorio",
    submittedBy: "Ricardo Alves",
    submittedAt: "2026-02-07",
    chunks: [
      { id: "ch-004", content: "Visão 2028: Ser referência em soluções corporativas inteligentes, integrando IA de forma ética e transformadora nos processos de gestão e inovação...", chunkIndex: 0, tokens: 524, hasTable: false, confidence: 0.94 },
      { id: "ch-005", content: "Pilar 1: Transformação Digital\n\nObjetivo: Digitalizar 100% dos processos core até Q4 2027\nMeta intermediária: 60% até Q4 2026\nInvestimento previsto: R$ 2.4M", chunkIndex: 1, tokens: 398, hasTable: false, confidence: 0.91 },
      { id: "ch-006", content: "Pilar 2: Cultura de Dados\n\nObjetivo: Democratizar acesso a dados e analytics\n- Implantar Data Mesh até Q2 2027\n- Treinar 80% dos gestores em data literacy", chunkIndex: 2, tokens: 445, hasTable: false, confidence: 0.93 },
    ],
    linkedEntities: [
      { id: "dept-002", type: "department", name: "Financeiro", relationship: "referencia" },
    ],
    suggestedEntities: [
      { id: "okr-001", type: "okr", name: "Crescimento Q4 25%", relationship: "referencia" },
      { id: "dept-004", type: "department", name: "Dados & Analytics", relationship: "referencia" },
      { id: "proj-003", type: "project", name: "Migração Cloud AWS", relationship: "impacta" },
    ],
    aiSummary: "Plano estratégico trienal com 3 pilares: Transformação Digital, Cultura de Dados e Inovação Aberta. Define investimentos, metas intermediárias e KPIs para cada pilar.",
    aiClassification: "Documento estratégico — Planejamento de longo prazo",
    confidence: 0.92,
    status: "pending",
    issues: [
      { id: "iss-003", type: "structure", severity: "low", description: "O documento possui referência cruzada a outros 4 documentos não presentes no grafo" },
    ],
  },
  {
    id: "cur-003",
    documentId: "doc-008",
    documentTitle: "SLA de Suporte TechCorp — Nível Enterprise",
    type: "contrato",
    submittedBy: "Julia Ferreira",
    submittedAt: "2026-02-09",
    chunks: [
      { id: "ch-007", content: "Acordo de Nível de Serviço (SLA)\n\nEste documento define os níveis de serviço acordados entre TechCorp e o cliente para o suporte Enterprise...", chunkIndex: 0, tokens: 380, hasTable: false, confidence: 0.96 },
      { id: "ch-008", content: "Tempos de Resposta:\n\n| Severidade | Primeira Resposta | Resolução |\n|---|---|---|\n| Crítica (P1) | 15 min | 4h |\n| Alta (P2) | 1h | 8h |\n| Média (P3) | 4h | 24h |", chunkIndex: 1, tokens: 295, hasTable: true, confidence: 0.93 },
    ],
    linkedEntities: [
      { id: "proj-001", type: "project", name: "Integração TechCorp", relationship: "pertence_a" },
    ],
    suggestedEntities: [],
    aiSummary: "SLA de suporte enterprise definindo tempos de resposta por severidade, métricas de disponibilidade (99.9%) e penalidades por descumprimento.",
    aiClassification: "Documento contratual — Acordo de nível de serviço",
    confidence: 0.95,
    status: "in_review",
    issues: [],
  },
];

// ─── Utility Functions ──────────────────────────────────────────────────────

function getFileIcon(format: string) {
  switch (format.toLowerCase()) {
    case "pdf": return <FileText className="w-5 h-5 text-red-500" />;
    case "docx":
    case "doc": return <FileText className="w-5 h-5 text-blue-500" />;
    case "xlsx":
    case "xls":
    case "csv": return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
    case "pptx":
    case "ppt": return <Layers className="w-5 h-5 text-orange-500" />;
    case "png":
    case "jpg":
    case "jpeg": return <FileImage className="w-5 h-5 text-pink-500" />;
    default: return <File className="w-5 h-5 text-gray-500" />;
  }
}

function getDocTypeInfo(type: DocumentType) {
  return DOCUMENT_TYPES.find((dt) => dt.id === type) || DOCUMENT_TYPES[DOCUMENT_TYPES.length - 1];
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

// --- Entity Badge ---
function EntityBadge({ entity, onRemove }: { entity: LinkedEntity; onRemove?: () => void }) {
  const config = ENTITY_TYPE_CONFIG[entity.type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        config.color
      )}
    >
      {config.icon}
      <span className="truncate max-w-[140px]">{entity.name}</span>
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 hover:opacity-70 transition-opacity">
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

// --- Status Badge ---
function StatusBadge({ status }: { status: DocumentStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", config.color)}>
      {config.icon}
      {config.label}
    </span>
  );
}

// --- Pipeline Stepper ---
function PipelineStepper({ currentStatus }: { currentStatus: DocumentStatus }) {
  const steps: { status: DocumentStatus; label: string }[] = [
    { status: "uploading", label: "Upload" },
    { status: "processing", label: "Extração" },
    { status: "chunking", label: "Fragmentação" },
    { status: "embedding", label: "Indexação" },
    { status: "awaiting_curation", label: "Curadoria" },
    { status: "approved", label: "Aprovado" },
  ];

  const currentIdx = steps.findIndex((s) => s.status === currentStatus);
  const isError = currentStatus === "error";
  const isRejected = currentStatus === "rejected";

  return (
    <div className="flex items-center gap-1 w-full">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isPending = idx > currentIdx;

        return (
          <div key={step.status} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  isCompleted && "bg-green-500 text-white",
                  isCurrent && !isError && !isRejected && "bg-primary text-primary-foreground ring-2 ring-primary/30",
                  isCurrent && isError && "bg-red-500 text-white ring-2 ring-red-300",
                  isCurrent && isRejected && "bg-red-500 text-white ring-2 ring-red-300",
                  isPending && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" />
                ) : isCurrent && isError ? (
                  <XCircle className="w-3.5 h-3.5" />
                ) : isCurrent && isRejected ? (
                  <XCircle className="w-3.5 h-3.5" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span className={cn(
                "text-[9px] mt-1 text-center leading-tight",
                (isCompleted || isCurrent) ? "text-foreground font-medium" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-0.5 rounded-full mt-[-12px]",
                  isCompleted ? "bg-green-500" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// --- Entity Search Input ---
function EntitySearchInput({
  onSelect,
  excludeIds,
}: {
  onSelect: (entity: LinkedEntity) => void;
  excludeIds: string[];
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState("pertence_a");
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return MOCK_SEARCHABLE_ENTITIES
      .filter((e) => !excludeIds.includes(e.id))
      .filter((e) => e.name.toLowerCase().includes(query.toLowerCase()) || ENTITY_TYPE_CONFIG[e.type].label.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 8);
  }, [query, excludeIds]);

  const handleSelect = (entity: LinkedEntity) => {
    onSelect({ ...entity, relationship: selectedRelationship });
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar projeto, OKR, departamento, pessoa..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => query.trim() && setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={selectedRelationship}
          onChange={(e) => setSelectedRelationship(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {RELATIONSHIP_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
          {results.map((entity) => {
            const config = ENTITY_TYPE_CONFIG[entity.type];
            return (
              <button
                key={entity.id}
                onClick={() => handleSelect(entity)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
              >
                <div className={cn("p-1.5 rounded-md border", config.color)}>
                  {config.icon}
            </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{entity.name}</div>
                  <div className="text-[10px] text-muted-foreground">{config.label}</div>
          </div>
                <Link2 className="w-4 h-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      )}

      {isOpen && query.trim() && results.length === 0 && (
        <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-card border border-border rounded-lg shadow-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma entidade encontrada para &quot;{query}&quot;</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Tente outro termo ou verifique o grafo</p>
        </div>
      )}
    </div>
  );
}

// ─── Acervo (Library) Tab ───────────────────────────────────────────────────

function AcervoTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<DocumentType | null>(null);
  const [filterStatus, setFilterStatus] = useState<DocumentStatus | null>(null);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "name" | "chunks">("date");

  const filteredDocs = useMemo(() => {
    let docs = [...MOCK_DOCUMENTS];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)) ||
          d.linkedEntities.some((e) => e.name.toLowerCase().includes(q))
      );
    }

    if (filterType) docs = docs.filter((d) => d.type === filterType);
    if (filterStatus) docs = docs.filter((d) => d.status === filterStatus);

    docs.sort((a, b) => {
      if (sortBy === "date") return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      if (sortBy === "name") return a.title.localeCompare(b.title);
      if (sortBy === "chunks") return b.chunkCount - a.chunkCount;
      return 0;
    });

    return docs;
  }, [searchQuery, filterType, filterStatus, sortBy]);

  // Stats
  const stats = useMemo(() => ({
    total: MOCK_DOCUMENTS.length,
    approved: MOCK_DOCUMENTS.filter((d) => d.status === "approved").length,
    pending: MOCK_DOCUMENTS.filter((d) => d.status === "awaiting_curation").length,
    processing: MOCK_DOCUMENTS.filter((d) => ["uploading", "processing", "chunking", "embedding"].includes(d.status)).length,
    totalChunks: MOCK_DOCUMENTS.reduce((sum, d) => sum + d.chunkCount, 0),
    totalEntities: new Set(MOCK_DOCUMENTS.flatMap((d) => d.linkedEntities.map((e) => e.id))).size,
  }), []);

  return (
    <div className="h-full flex flex-col">
      {/* Summary Tiles */}
      <div className="p-4 border-b border-border bg-card/30">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10"><Database className="w-4 h-4 text-blue-600" /></div>
            <div>
              <div className="text-lg font-bold">{stats.total}</div>
              <div className="text-[10px] text-muted-foreground">Documentos</div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10"><CheckCircle2 className="w-4 h-4 text-green-600" /></div>
            <div>
              <div className="text-lg font-bold">{stats.approved}</div>
              <div className="text-[10px] text-muted-foreground">Aprovados</div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10"><Clock className="w-4 h-4 text-orange-600" /></div>
            <div>
              <div className="text-lg font-bold">{stats.pending}</div>
              <div className="text-[10px] text-muted-foreground">Aguardando</div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10"><Loader2 className="w-4 h-4 text-violet-600" /></div>
            <div>
              <div className="text-lg font-bold">{stats.processing}</div>
              <div className="text-[10px] text-muted-foreground">Processando</div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10"><Puzzle className="w-4 h-4 text-cyan-600" /></div>
            <div>
              <div className="text-lg font-bold">{stats.totalChunks}</div>
              <div className="text-[10px] text-muted-foreground">Fragmentos</div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10"><Link2 className="w-4 h-4 text-amber-600" /></div>
            <div>
              <div className="text-lg font-bold">{stats.totalEntities}</div>
              <div className="text-[10px] text-muted-foreground">Vínculos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 border-b border-border bg-card/50 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
              placeholder="Buscar documentos, tags, entidades vinculadas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
          >
            <option value="date">Mais recentes</option>
            <option value="name">Nome A-Z</option>
            <option value="chunks">Mais fragmentos</option>
          </select>
        </div>

        {/* Type Pills */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterType(null)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors",
              !filterType ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
            )}
          >
            Todos
          </button>
          {DOCUMENT_TYPES.map((dt) => (
            <button
              key={dt.id}
              onClick={() => setFilterType(filterType === dt.id ? null : dt.id)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5",
                filterType === dt.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
              )}
            >
              {dt.icon}
              {dt.label}
            </button>
          ))}
        </div>

        {/* Status Pills */}
        <div className="flex gap-2 flex-wrap">
          {(["approved", "awaiting_curation", "processing", "rejected"] as DocumentStatus[]).map((st) => {
            const config = STATUS_CONFIG[st];
            return (
              <button
                key={st}
                onClick={() => setFilterStatus(filterStatus === st ? null : st)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5",
                  filterStatus === st ? "bg-primary text-primary-foreground" : config.color
                )}
              >
                {config.icon}
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-16">
            <Database className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Nenhum documento encontrado</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Ajuste os filtros ou faça uma nova ingestão</p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isExpanded = expandedDoc === doc.id;
            const typeInfo = getDocTypeInfo(doc.type);

            return (
              <div
                key={doc.id}
                className={cn(
                  "rounded-xl border border-border bg-card transition-all",
                  isExpanded && "ring-1 ring-primary/20 shadow-sm"
                )}
              >
                {/* Card Header */}
                <button
                  onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors rounded-xl"
                >
                  {/* File Icon */}
                  <div className="shrink-0">{getFileIcon(doc.format)}</div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{doc.title}</h4>
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium text-white", typeInfo.color)}>
                        {typeInfo.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{doc.description}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-muted-foreground">{doc.uploadedBy}</span>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <span className="text-[10px] text-muted-foreground">{doc.uploadedAt}</span>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <span className="text-[10px] text-muted-foreground">{doc.fileSize}</span>
                      {doc.chunkCount > 0 && (
                        <>
                          <span className="text-[10px] text-muted-foreground">•</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Puzzle className="w-3 h-3" />
                            {doc.chunkCount} chunks
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status & Chevron */}
                  <div className="shrink-0 flex items-center gap-3">
                    <StatusBadge status={doc.status} />
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border">
                    {/* Pipeline Progress */}
                    <div className="py-4">
                      <p className="text-xs font-medium text-muted-foreground mb-3">Pipeline de Processamento</p>
                      <PipelineStepper currentStatus={doc.status} />
                    </div>

                    {/* Linked Entities */}
                    {doc.linkedEntities.length > 0 && (
                      <div className="py-3 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Entidades Vinculadas</p>
                        <div className="flex flex-wrap gap-2">
                          {doc.linkedEntities.map((entity) => (
                            <EntityBadge key={entity.id} entity={entity} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {doc.tags.length > 0 && (
                      <div className="py-3 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Tags</p>
                        <div className="flex flex-wrap gap-1.5">
                          {doc.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Confidence */}
                    {doc.confidence > 0 && (
                      <div className="py-3 border-t border-border flex items-center gap-3">
                        <p className="text-xs font-medium text-muted-foreground">Confiança da Extração</p>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-[200px]">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              doc.confidence >= 0.9 ? "bg-green-500" : doc.confidence >= 0.7 ? "bg-amber-500" : "bg-red-500"
                            )}
                            style={{ width: `${doc.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{Math.round(doc.confidence * 100)}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Ingestão (Upload) Tab ──────────────────────────────────────────────────

function IngestaoTab() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [docTitle, setDocTitle] = useState("");
  const [docDescription, setDocDescription] = useState("");
  const [docType, setDocType] = useState<DocumentType>("outro");
  const [linkedEntities, setLinkedEntities] = useState<LinkedEntity[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Metadata, 3: Confirm
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles(files);
      if (files.length === 1) {
        setDocTitle(files[0].name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
      }
      setStep(2);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(files);
      if (files.length === 1) {
        setDocTitle(files[0].name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
      }
      setStep(2);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setSubmitSuccess(true);
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setDocTitle("");
    setDocDescription("");
    setDocType("outro");
    setLinkedEntities([]);
    setTags([]);
    setTagInput("");
    setStep(1);
    setIsSubmitting(false);
    setSubmitSuccess(false);
  };

  // Success State
  if (submitSuccess) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Documento Enviado com Sucesso!</h3>
          <p className="text-muted-foreground mb-2">
            O documento entrou no pipeline de processamento.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs font-medium text-muted-foreground mb-2">Próximas etapas:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                <span>Extração via Docling (texto, tabelas, estrutura)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Puzzle className="w-3.5 h-3.5 text-cyan-500" />
                <span>Fragmentação em chunks semânticos</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Brain className="w-3.5 h-3.5 text-blue-500" />
                <span>Geração de embeddings vetoriais</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>Validação pelo curador ontológico</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleReset}>
              <Upload className="w-4 h-4 mr-2" />
              Novo Upload
            </Button>
            <Button onClick={handleReset}>
              <Eye className="w-4 h-4 mr-2" />
              Ver no Acervo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Step Indicator */}
      <div className="p-4 border-b border-border bg-card/30">
        <div className="flex items-center gap-4 max-w-2xl mx-auto">
          {[
            { n: 1, label: "Upload", icon: <Upload className="w-4 h-4" /> },
            { n: 2, label: "Metadados & Vínculos", icon: <Link2 className="w-4 h-4" /> },
            { n: 3, label: "Confirmar", icon: <CheckCircle2 className="w-4 h-4" /> },
          ].map((s, idx) => (
            <div key={s.n} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                    step >= s.n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {step > s.n ? <Check className="w-4 h-4" /> : s.icon}
                </div>
                <span className={cn("text-xs mt-1.5", step >= s.n ? "text-foreground font-medium" : "text-muted-foreground")}>
                  {s.label}
                </span>
              </div>
              {idx < 2 && (
                <div className={cn("h-0.5 flex-1 mx-2 rounded-full mt-[-16px]", step > s.n ? "bg-primary" : "bg-muted")} />
              )}
            </div>
          ))}
        </div>
      </div>

        <div className="flex-1 overflow-auto p-6">
        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold mb-1">Enviar Documento</h3>
              <p className="text-sm text-muted-foreground">
                Arraste arquivos ou clique para selecionar. O sistema extrairá automaticamente o conteúdo usando Docling.
              </p>
            </div>

            {/* Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
                  className={cn(
                "relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all",
                dragActive
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.pptx,.ppt,.txt,.md"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-4">
                  <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
                  dragActive ? "bg-primary/10" : "bg-muted"
                  )}>
                  <FolderUp className={cn("w-8 h-8", dragActive ? "text-primary" : "text-muted-foreground")} />
                  </div>
                <div>
                  <p className="font-medium">
                    {dragActive ? "Solte os arquivos aqui" : "Arraste e solte seus documentos"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    ou <span className="text-primary font-medium">clique para selecionar</span>
                  </p>
                  </div>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {["PDF", "DOCX", "XLSX", "PPTX", "CSV", "TXT"].map((fmt) => (
                    <span key={fmt} className="px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground font-mono">
                      .{fmt.toLowerCase()}
                    </span>
                  ))}
                  </div>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <span className="text-sm font-medium">Extração Inteligente</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Docling extrai texto, tabelas e estrutura preservando formatação e contexto.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Puzzle className="w-4 h-4 text-cyan-500" />
                  <span className="text-sm font-medium">Chunking Semântico</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Conteúdo fragmentado em chunks otimizados para busca semântica e recuperação de contexto.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Vinculação Dinâmica</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Relacione documentos a projetos, OKRs, pessoas e qualquer entidade do grafo de conhecimento.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Metadata & Entity Linking */}
        {step === 2 && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Selected Files */}
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Arquivos Selecionados
              </p>
              <div className="space-y-2">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                    {getFileIcon(file.name.split(".").pop() || "")}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button
                      onClick={() => {
                        const newFiles = selectedFiles.filter((_, i) => i !== idx);
                        setSelectedFiles(newFiles);
                        if (newFiles.length === 0) setStep(1);
                      }}
                      className="p-1 rounded hover:bg-muted transition-colors"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                </button>
                  </div>
              ))}
            </div>
          </div>

            {/* Document Metadata */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Metadados do Documento
              </p>

              <div className="space-y-3">
                {/* Title */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Título *</label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="Ex: Contrato de Parceria Estratégica — TechCorp"
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Descrição</label>
                  <textarea
                    value={docDescription}
                    onChange={(e) => setDocDescription(e.target.value)}
                    placeholder="Breve descrição do conteúdo e propósito do documento..."
                    rows={3}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tipo de Documento *</label>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-2">
                    {DOCUMENT_TYPES.map((dt) => (
            <button
                        key={dt.id}
                        onClick={() => setDocType(dt.id)}
              className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all text-center",
                          docType === dt.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                            : "border-border hover:border-primary/30 hover:bg-muted/30"
                        )}
                      >
                        <div className={cn("p-1.5 rounded-md text-white", dt.color)}>{dt.icon}</div>
                        <span className="text-[10px] font-medium">{dt.label}</span>
            </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tags</label>
                  <div className="flex gap-2 mt-1">
                    <div className="flex-1 relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                        placeholder="Adicionar tag..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={handleAddTag} disabled={!tagInput.trim()}>
                      Adicionar
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs"
                        >
                          #{tag}
                          <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Entity Linking */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Vinculação a Entidades
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Relacione este documento a projetos, OKRs, departamentos, pessoas, etc.
                  </p>
                </div>
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <Link2 className="w-4 h-4 text-blue-500" />
                </div>
              </div>

              <EntitySearchInput
                onSelect={(entity) => setLinkedEntities([...linkedEntities, entity])}
                excludeIds={linkedEntities.map((e) => e.id)}
              />

              {linkedEntities.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Vínculos adicionados:</p>
                  <div className="flex flex-wrap gap-2">
                    {linkedEntities.map((entity) => (
                      <EntityBadge
                        key={entity.id}
                        entity={entity}
                        onRemove={() => setLinkedEntities(linkedEntities.filter((e) => e.id !== entity.id))}
                      />
                    ))}
                  </div>
                  <div className="mt-2 space-y-1">
                    {linkedEntities.map((entity) => {
                      const config = ENTITY_TYPE_CONFIG[entity.type];
                      const relLabel = RELATIONSHIP_OPTIONS.find((r) => r.value === entity.relationship)?.label || entity.relationship;
                      return (
                        <div key={entity.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                            Documento
                          </span>
                          <ArrowUpRight className="w-3 h-3" />
                          <span className="font-medium text-foreground/70 italic">{relLabel}</span>
                          <ArrowUpRight className="w-3 h-3" />
                          <span className={cn("px-1.5 py-0.5 rounded border text-[10px]", config.color)}>
                            {config.label}: {entity.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button onClick={() => setStep(3)} disabled={!docTitle.trim()}>
                Continuar
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-1">Confirmar Ingestão</h3>
              <p className="text-sm text-muted-foreground">Revise as informações antes de enviar para processamento</p>
            </div>

            {/* Summary Card */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {/* Document Info */}
              <div className="p-4 border-b border-border">
                <div className="flex items-start gap-3">
                  {selectedFiles.length > 0 && getFileIcon(selectedFiles[0].name.split(".").pop() || "")}
                  <div className="flex-1">
                    <h4 className="font-medium">{docTitle}</h4>
                    {docDescription && <p className="text-sm text-muted-foreground mt-1">{docDescription}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium text-white", getDocTypeInfo(docType).color)}>
                        {getDocTypeInfo(docType).label}
                      </span>
                      {selectedFiles.map((f, i) => (
                        <span key={i} className="text-[10px] text-muted-foreground">
                          {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Linked Entities */}
              {linkedEntities.length > 0 && (
                <div className="p-4 border-b border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Vínculos ({linkedEntities.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {linkedEntities.map((entity) => (
                      <EntityBadge key={entity.id} entity={entity} />
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <div className="p-4 border-b border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-muted text-xs">#{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pipeline Preview */}
              <div className="p-4 bg-muted/20">
                <p className="text-xs font-medium text-muted-foreground mb-3">Pipeline de Processamento</p>
                <div className="space-y-2">
                  {[
                    { icon: <Upload className="w-3.5 h-3.5" />, label: "Upload para armazenamento seguro (Azure Blob)", color: "text-blue-500" },
                    { icon: <Sparkles className="w-3.5 h-3.5" />, label: "Extração via Docling (texto, tabelas, estrutura)", color: "text-violet-500" },
                    { icon: <Puzzle className="w-3.5 h-3.5" />, label: "Fragmentação em chunks semânticos", color: "text-cyan-500" },
                    { icon: <Brain className="w-3.5 h-3.5" />, label: "Geração de embeddings vetoriais (Azure OpenAI)", color: "text-blue-500" },
                    { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: "Validação pelo curador ontológico", color: "text-amber-500" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs">
                      <span className={item.color}>{item.icon}</span>
                      <span className="text-muted-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <FolderUp className="w-4 h-4 mr-2" />
                      Enviar para Processamento
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Curadoria Tab ──────────────────────────────────────────────────────────

function CuradoriaTab() {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<CurationItem["status"] | null>(null);
  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set());

  const filteredItems = useMemo(() => {
    let items = [...MOCK_CURATION_ITEMS];
    if (filterStatus) items = items.filter((i) => i.status === filterStatus);
    return items;
  }, [filterStatus]);

  const stats = useMemo(() => ({
    total: MOCK_CURATION_ITEMS.length,
    pending: MOCK_CURATION_ITEMS.filter((i) => i.status === "pending").length,
    inReview: MOCK_CURATION_ITEMS.filter((i) => i.status === "in_review").length,
    approved: MOCK_CURATION_ITEMS.filter((i) => i.status === "approved").length,
  }), []);

  const toggleChunk = (chunkId: string) => {
    setExpandedChunks((prev) => {
      const next = new Set(prev);
      if (next.has(chunkId)) next.delete(chunkId);
      else next.add(chunkId);
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold">Curadoria Ontológica</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valide a qualidade, estrutura e classificação dos documentos ingeridos antes de integrá-los ao grafo de conhecimento.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10"><Database className="w-4 h-4 text-blue-600" /></div>
            <div>
              <div className="text-lg font-bold">{stats.total}</div>
              <div className="text-[10px] text-muted-foreground">Total</div>
            </div>
          </div>
              <button
            onClick={() => setFilterStatus(filterStatus === "pending" ? null : "pending")}
                className={cn(
              "bg-card rounded-xl border p-3 flex items-center gap-3 transition-all text-left",
              filterStatus === "pending" ? "border-orange-400 ring-1 ring-orange-200" : "border-border hover:border-orange-300"
            )}
          >
            <div className="p-2 rounded-lg bg-orange-500/10"><Clock className="w-4 h-4 text-orange-600" /></div>
            <div>
              <div className="text-lg font-bold">{stats.pending}</div>
              <div className="text-[10px] text-muted-foreground">Pendentes</div>
            </div>
              </button>
          <button
            onClick={() => setFilterStatus(filterStatus === "in_review" ? null : "in_review")}
            className={cn(
              "bg-card rounded-xl border p-3 flex items-center gap-3 transition-all text-left",
              filterStatus === "in_review" ? "border-violet-400 ring-1 ring-violet-200" : "border-border hover:border-violet-300"
            )}
          >
            <div className="p-2 rounded-lg bg-violet-500/10"><Eye className="w-4 h-4 text-violet-600" /></div>
            <div>
              <div className="text-lg font-bold">{stats.inReview}</div>
              <div className="text-[10px] text-muted-foreground">Em Revisão</div>
            </div>
          </button>
          <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10"><CheckCircle2 className="w-4 h-4 text-green-600" /></div>
            <div>
              <div className="text-lg font-bold">{stats.approved}</div>
              <div className="text-[10px] text-muted-foreground">Aprovados</div>
            </div>
          </div>
        </div>
          </div>

      {/* Curation Items */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
            {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Nenhum item para curadoria</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Todos os documentos foram revisados</p>
              </div>
            ) : (
              filteredItems.map((item) => {
            const isSelected = selectedItem === item.id;
            const typeInfo = getDocTypeInfo(item.type);
            const statusColors: Record<CurationItem["status"], string> = {
              pending: "border-l-orange-500",
              in_review: "border-l-violet-500",
              approved: "border-l-green-500",
              rejected: "border-l-red-500",
            };

                return (
                  <div
                    key={item.id}
                className={cn(
                  "rounded-xl border border-border bg-card border-l-4 transition-all",
                  statusColors[item.status],
                  isSelected && "ring-1 ring-primary/20 shadow-md"
                )}
              >
                {/* Item Header */}
                <button
                  onClick={() => setSelectedItem(isSelected ? null : item.id)}
                  className="w-full p-4 text-left hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg text-white shrink-0", typeInfo.color)}>
                      {typeInfo.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{item.documentTitle}</h4>
                        {item.issues.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 text-[10px] font-medium">
                            {item.issues.length} {item.issues.length === 1 ? "observação" : "observações"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.aiSummary}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-muted-foreground">Por {item.submittedBy}</span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] text-muted-foreground">{item.submittedAt}</span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Puzzle className="w-3 h-3" />
                          {item.chunks.length} chunks
                        </span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Brain className="w-3 h-3" />
                          {Math.round(item.confidence * 100)}% confiança
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {isSelected ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                </button>

                {/* Expanded Detail */}
                {isSelected && (
                  <div className="border-t border-border">
                    {/* AI Classification */}
                    <div className="p-4 bg-violet-500/5 border-b border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-violet-500" />
                        <span className="text-xs font-medium">Classificação IA</span>
                      </div>
                      <p className="text-sm">{item.aiClassification}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.aiSummary}</p>
                    </div>

                    {/* Chunks Preview */}
                    <div className="p-4 border-b border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-3">
                        Fragmentos Extraídos ({item.chunks.length})
                      </p>
                      <div className="space-y-2">
                        {item.chunks.map((chunk) => {
                          const isChunkExpanded = expandedChunks.has(chunk.id);
                          return (
                            <div key={chunk.id} className="rounded-lg border border-border overflow-hidden">
                              <button
                                onClick={() => toggleChunk(chunk.id)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors text-left"
                              >
                                <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">
                                  #{chunk.chunkIndex + 1}
                          </span>
                                <p className="flex-1 text-xs text-muted-foreground truncate">
                                  {chunk.content.substring(0, 100)}...
                                </p>
                                <div className="flex items-center gap-2 shrink-0">
                                  {chunk.hasTable && (
                                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 text-[10px]">
                                      <FileSpreadsheet className="w-3 h-3 inline mr-0.5" />
                                      Tabela
                                    </span>
                                  )}
                                  <span className="text-[10px] text-muted-foreground">{chunk.tokens} tokens</span>
                                  {isChunkExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                  )}
                      </div>
                              </button>
                              {isChunkExpanded && (
                                <div className="p-3 bg-muted/20 border-t border-border">
                                  <pre className="text-xs whitespace-pre-wrap text-foreground/80 font-sans leading-relaxed">
                                    {chunk.content}
                                  </pre>
                                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border">
                                    <span className="text-[10px] text-muted-foreground">
                                      Confiança: {Math.round(chunk.confidence * 100)}%
                                    </span>
                    </div>
                    </div>
                              )}
                  </div>
                );
                        })}
                      </div>
                    </div>

                    {/* Entities: Current + Suggested */}
                    <div className="p-4 border-b border-border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Current Links */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Vínculos do Submitter
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {item.linkedEntities.length > 0 ? (
                              item.linkedEntities.map((entity) => (
                                <EntityBadge key={entity.id} entity={entity} />
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Nenhum vínculo informado</span>
                            )}
                          </div>
                        </div>

                        {/* AI Suggested */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                            Sugestões da IA
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {item.suggestedEntities.length > 0 ? (
                              item.suggestedEntities.map((entity) => (
                                <div key={entity.id} className="flex items-center gap-1">
                                  <EntityBadge entity={entity} />
                                  <button className="p-0.5 rounded hover:bg-green-500/10 transition-colors" title="Aceitar sugestão">
                                    <Check className="w-3.5 h-3.5 text-green-600" />
                                  </button>
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Sem sugestões adicionais</span>
                            )}
                          </div>
          </div>
        </div>
      </div>

                    {/* Issues */}
                    {item.issues.length > 0 && (
                      <div className="p-4 border-b border-border bg-amber-500/5">
                        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          Observações da Análise
                        </p>
                        <div className="space-y-2">
                          {item.issues.map((issue) => (
                            <div key={issue.id} className="flex items-start gap-2 text-xs">
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 mt-0.5",
                                  issue.severity === "high" && "bg-red-500/10 text-red-700",
                                  issue.severity === "medium" && "bg-amber-500/10 text-amber-700",
                                  issue.severity === "low" && "bg-blue-500/10 text-blue-700"
                                )}
                              >
                                {issue.severity === "high" ? "Alta" : issue.severity === "medium" ? "Média" : "Baixa"}
                              </span>
                              <div>
                                <p className="text-foreground/80">{issue.description}</p>
                                {issue.suggestion && (
                                  <p className="text-muted-foreground mt-0.5 italic">💡 {issue.suggestion}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Curator Actions */}
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <textarea
                          placeholder="Notas do curador (opcional)..."
                          rows={1}
                          className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none w-64"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                          <XCircle className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                        <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700">
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Solicitar Revisão
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Aprovar e Integrar
              </Button>
            </div>
          </div>
        </div>
      )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Main KnowledgeBase Component ───────────────────────────────────────────

export function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState<KnowledgeTab>("acervo");

  return (
    <div className="h-full w-full overflow-hidden bg-muted/30 relative">
      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="p-4 pb-0 border-b border-border bg-card/50 backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Conhecimento
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ingestão, curadoria e gestão do conhecimento corporativo
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors relative",
                  activeTab === tab.id
                    ? "bg-background text-foreground border-t border-l border-r border-border -mb-px"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.id === "curadoria" && MOCK_CURATION_ITEMS.filter((i) => i.status === "pending").length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                    {MOCK_CURATION_ITEMS.filter((i) => i.status === "pending").length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "acervo" && <AcervoTab />}
          {activeTab === "ingestao" && <IngestaoTab />}
          {activeTab === "curadoria" && <CuradoriaTab />}
        </div>
      </div>
    </div>
  );
}
