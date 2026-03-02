import React, { useState, useCallback } from 'react';
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  Check,
  CheckCircle2,
  Loader2,
  Sparkles,
  Users,
  ListTodo,
  AlertTriangle,
  Building2,
  FolderKanban,
  BarChart3,
  MessageSquare,
  ShieldCheck,
  BookOpen,
  Lightbulb,
  Wrench,
  File,
  ChevronDown,
  Shield,
} from 'lucide-react';
import { api } from '../../lib/api';

interface LinkableEntity {
  id: string;
  name: string;
  type: 'project' | 'okr' | 'objective' | 'process';
  status?: string;
  department?: string;
  owner?: string;
  objective?: string;
}

interface MentionedEntity {
  type: 'person' | 'project' | 'department' | 'organization';
  name: string;
  context: string;
  confidence: number;
}

interface OrgChartNode {
  id: string;
  name: string;
  role?: string;
  department?: string;
}

type PreviewEntityType = 'task' | 'decision' | 'risk' | 'insight';

interface PreviewEntity {
  id: string;
  type: PreviewEntityType;
  value: string;
  confidence: number;
  context?: string;
  description?: string;
  relatedPerson?: string;
  assignee?: string;
  deadline?: string;
  impact?: string;
  priority?: 'high' | 'medium' | 'low';
  validated: boolean | null;
}

const ENTITY_CONFIG: Record<
  PreviewEntityType,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    color: string;
  }
> = {
  task: {
    icon: ListTodo,
    label: 'Tarefa',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  risk: {
    icon: AlertTriangle,
    label: 'Risco',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  decision: {
    icon: CheckCircle2,
    label: 'Decisão',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  insight: {
    icon: Lightbulb,
    label: 'Insight',
    color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  },
};

interface DocumentMetadata {
  title: string;
  type: DocumentType;
  confidentiality: ConfidentialityLevel;
  visibility: 'individual' | 'department' | 'corporate';
  memoryClass?: MemoryClass;
  linkedProjectIds: string[];
  linkedOkrIds: string[];
  linkedObjectiveIds: string[];
  linkedProcessId?: string;
  departmentId?: string;
  tags: string[];
  summary?: string;
  canonicalData?: Record<string, string>;
}

type DocumentType =
  | 'contract'
  | 'report'
  | 'meeting'
  | 'process_doc'
  | 'strategic_plan'
  | 'technical_spec'
  | 'email'
  | 'note'
  | 'policy'
  | 'analysis'
  | 'manual'
  | 'proposal'
  | 'spreadsheet'
  | 'other';

type ConfidentialityLevel = 'public' | 'internal' | 'confidential' | 'restricted';
type MemoryClass = 'semantic' | 'episodic' | 'procedural' | 'evaluative';

const DOCUMENT_TYPES: {
  value: DocumentType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: 'contract', label: 'Contrato', description: 'Contratos e acordos formais', icon: FileText },
  { value: 'report', label: 'Relatório', description: 'Relatórios de progresso e análise', icon: BarChart3 },
  { value: 'meeting', label: 'Ata de Reunião', description: 'Registro de reuniões', icon: MessageSquare },
  { value: 'technical_spec', label: 'Especificação Técnica', description: 'Documentação técnica', icon: Wrench },
  { value: 'policy', label: 'Política/Norma', description: 'Políticas organizacionais', icon: ShieldCheck },
  { value: 'manual', label: 'Manual', description: 'Manuais e guias', icon: BookOpen },
  { value: 'proposal', label: 'Proposta', description: 'Propostas comerciais ou de projeto', icon: Lightbulb },
  { value: 'analysis', label: 'Análise/Estudo', description: 'Análises e estudos', icon: BarChart3 },
  { value: 'other', label: 'Outro', description: 'Outros tipos de documento', icon: File },
];

const isSelectableDocumentType = (type?: string): type is DocumentType =>
  !!type && DOCUMENT_TYPES.some((option) => option.value === type);

const CONFIDENTIALITY_LEVELS: { value: ConfidentialityLevel; label: string; description: string }[] = [
  { value: 'public', label: 'Público', description: 'Acessível a todos' },
  { value: 'internal', label: 'Interno', description: 'Apenas colaboradores' },
  { value: 'confidential', label: 'Confidencial', description: 'Equipe do projeto + gestão' },
  { value: 'restricted', label: 'Restrito', description: 'Apenas C-level' },
];

const REQUIRED_RELATIONSHIPS: Record<DocumentType, string[]> = {
  contract: ['Projeto'],
  report: ['Objetivo ou OKR'],
  meeting: ['Projeto'],
  process_doc: ['Processo'],
  strategic_plan: ['Objetivo'],
  technical_spec: ['Projeto'],
  email: [],
  note: [],
  policy: ['Departamento'],
  analysis: ['Objetivo ou OKR'],
  manual: [],
  proposal: ['Projeto'],
  spreadsheet: [],
  other: [],
};

export default function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<DocumentMetadata>({
    title: '',
    type: 'other',
    confidentiality: 'internal',
    visibility: 'corporate',
    linkedProjectIds: [],
    linkedOkrIds: [],
    linkedObjectiveIds: [],
    tags: [],
    canonicalData: {},
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [uploadedDocumentId, setUploadedDocumentId] = useState<string | null>(null);

  const [isExtractingEntities, setIsExtractingEntities] = useState(false);
  const [extractedEntities, setExtractedEntities] = useState<PreviewEntity[]>([]);
  const [entityExtractionError, setEntityExtractionError] = useState<string | null>(null);

  // Linkable entities
  const [projects, setProjects] = useState<LinkableEntity[]>([]);
  const [okrs, setOkrs] = useState<LinkableEntity[]>([]);
  const [objectives, setObjectives] = useState<LinkableEntity[]>([]);
  const [processes, setProcesses] = useState<LinkableEntity[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [orgNodes, setOrgNodes] = useState<OrgChartNode[]>([]);
  const [activeEntityTab, setActiveEntityTab] = useState<PreviewEntityType | 'all'>('all');

  // Preprocessing & Auto-extraction
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedMetadata, setExtractedMetadata] = useState<any>(null);
  const [mentionedEntities, setMentionedEntities] = useState<MentionedEntity[]>([]);
  const [entitySuggestions, setEntitySuggestions] = useState<any[]>([]);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<string>>(new Set());
  const [suggestedRelationships, setSuggestedRelationships] = useState<{
    projects: number;
    okrs: number;
    objectives: number;
    departments: number;
    people: number;
  } | null>(null);

  // Suggestions (legacy - for manual suggestion)
  const [suggestions, setSuggestions] = useState<{
    projects: Array<{ id: string; name: string; confidence: number }>;
    okrs: Array<{ id: string; title: string; confidence: number }>;
    objectives: Array<{ id: string; title: string; confidence: number }>;
  } | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Load linkable entities
  const loadEntities = useCallback(async () => {
    console.log('🔄 Carregando projetos (igual gestão de projetos)...');
    setLoadingEntities(true);
    try {
      const [projectsResponse, orgNodesResponse] = await Promise.all([
        api.getProjects(),
        api.getOrgChartNodes(),
      ]);

      console.log('📦 Resposta de projetos:', projectsResponse);

      if (projectsResponse.success && projectsResponse.data) {
        const projectsList = projectsResponse.data;
        console.log('✅ Projetos recebidos:', projectsList);
        
        // Converter para formato LinkableEntity
        const linkableProjects = projectsList.map((p: any) => ({
          id: p.id,
          name: p.name,
          type: 'project' as const,
          status: p.status,
          department: p.department,
          owner: p.owner
        }));
        
        setProjects(linkableProjects);
        console.log('📂 Projetos convertidos:', linkableProjects);
      } else {
        console.warn('⚠️ Resposta sem sucesso ou sem dados de projetos:', projectsResponse);
      }

      if (orgNodesResponse.success && Array.isArray(orgNodesResponse.data)) {
        const mapped = orgNodesResponse.data.map((node: any) => ({
          id: String(node.id),
          name: String(node.name || ''),
          role: typeof node.role === 'string' ? node.role : undefined,
          department: typeof node.department === 'string' ? node.department : undefined,
        }));
        setOrgNodes(mapped.filter((n) => n.name));
      }
    } catch (error) {
      console.error('❌ Erro ao carregar projetos:', error);
    } finally {
      setLoadingEntities(false);
    }
  }, []);

  // Load suggestions
  const loadSuggestions = useCallback(async () => {
    if (!metadata.title || metadata.title.length < 3) return;

    setLoadingSuggestions(true);
    try {
      const response = await api.suggestDocumentRelationships({
        title: metadata.title,
        type: metadata.type,
        summary: metadata.summary,
      });
      if (response.success && response.data) {
        setSuggestions({
          projects: response.data.suggestedProjects || [],
          okrs: response.data.suggestedOkrs || [],
          objectives: response.data.suggestedObjectives || [],
        });
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [metadata.title, metadata.type, metadata.summary]);

  React.useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      loadSuggestions();
    }, 500);
    return () => clearTimeout(timer);
  }, [loadSuggestions]);

  // Validate required relationships
  const validateRelationships = useCallback((): string[] => {
    const errors: string[] = [];
    const required = REQUIRED_RELATIONSHIPS[metadata.type];

    for (const req of required) {
      if (req === 'Projeto' && metadata.linkedProjectIds.length === 0) {
        errors.push('Projeto é obrigatório para este tipo de documento');
      }
      if (
        req === 'Objetivo ou OKR' &&
        metadata.linkedObjectiveIds.length === 0 &&
        metadata.linkedOkrIds.length === 0
      ) {
        errors.push('Objetivo ou OKR é obrigatório para este tipo de documento');
      }
      if (req === 'Processo' && !metadata.linkedProcessId) {
        errors.push('Processo é obrigatório para este tipo de documento');
      }
      if (req === 'Departamento' && !metadata.departmentId) {
        errors.push('Departamento é obrigatório para este tipo de documento');
      }
    }

    return errors;
  }, [metadata]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const filteredEntities = extractedEntities.filter((entity) => {
    if (activeEntityTab === 'all') return true;
    return entity.type === activeEntityTab;
  });

  const entityCounts = extractedEntities.reduce(
    (acc, entity) => {
      acc[entity.type] = (acc[entity.type] || 0) + 1;
      return acc;
    },
    { task: 0, decision: 0, risk: 0, insight: 0 } as Record<PreviewEntityType, number>
  );

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      analyzeDocument(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Trigger automatic analysis
      analyzeDocument(selectedFile);
    }
  };

  // Analyze document automatically when uploaded
  const analyzeDocument = async (file: File) => {
    setIsAnalyzing(true);
    setExtractedMetadata(null);
    setMentionedEntities([]);
    setEntitySuggestions([]);
    setAcceptedSuggestions(new Set());
    setSuggestedRelationships(null);
    setIsExtractingEntities(true);
    setExtractedEntities([]);
    setEntityExtractionError(null);

    try {
      const response = await api.preprocessDocument(file, {
        preferredType: metadata.type !== 'other' ? metadata.type : undefined,
        prelinkedProjectIds: metadata.linkedProjectIds,
      });
      
      if (response.success && response.data) {
        const {
          suggestedMetadata,
          suggestedEntities,
          mentionedEntities: extractedMentioned,
          suggestedRelationships: relCounts,
        } = response.data;
        
        // Store extracted metadata
        setExtractedMetadata(suggestedMetadata);
        setMentionedEntities(extractedMentioned || []);
        setEntitySuggestions(suggestedEntities || []);
        setSuggestedRelationships(
          relCounts || {
            projects: 0,
            okrs: 0,
            objectives: 0,
            departments: 0,
            people: 0,
          }
        );
        
        // Auto-fill metadata fields
        setMetadata((prev) => ({
          ...prev,
          title: suggestedMetadata.title || prev.title || file.name.replace(/\.[^/.]+$/, ''),
          type:
            prev.type !== 'other'
              ? prev.type
              : isSelectableDocumentType(suggestedMetadata.type)
              ? suggestedMetadata.type
              : 'other',
          tags: suggestedMetadata.tags || prev.tags,
          summary: suggestedMetadata.summary || prev.summary,
          canonicalData: suggestedMetadata.canonicalData || prev.canonicalData,
        }));
        
        // Auto-accept high-confidence suggestions (>0.85)
        const highConfidenceSuggestions = new Set<string>(
          (suggestedEntities || [])
            .filter((s: any) => s.confidence > 0.85)
            .map((s: any) => `${s.entityType}:${s.entityId}` as string)
        );
        setAcceptedSuggestions(highConfidenceSuggestions);
        
        // Auto-link high-confidence entities
        (suggestedEntities || []).forEach((suggestion: any) => {
          if (suggestion.confidence > 0.85) {
            toggleEntitySuggestion(suggestion, true);
          }
        });
      }

      try {
        const extractionResponse = await api.extractDocumentEntities(file, {
          title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
          type: metadata.type,
        });

        if (extractionResponse.success && extractionResponse.data) {
          const payload: any = extractionResponse.data;
          const extraction = payload?.data || payload;
          const rawEntities = Array.isArray(extraction?.entities) ? extraction.entities : [];

          const mapped: PreviewEntity[] = rawEntities
            .map((ent: any, idx: number) => {
              const t = typeof ent?.type === 'string' ? ent.type : '';
              if (!['task', 'decision', 'risk', 'insight'].includes(t)) return null;
              const value = typeof ent?.value === 'string' ? ent.value : '';
              if (!value) return null;
              return {
                id: `preview-${idx}`,
                type: t as PreviewEntityType,
                value,
                confidence: typeof ent?.confidence === 'number' ? ent.confidence : 0.8,
                context: typeof ent?.context === 'string' ? ent.context : undefined,
                description: typeof ent?.description === 'string' ? ent.description : undefined,
                relatedPerson: typeof ent?.relatedPerson === 'string' ? ent.relatedPerson : undefined,
                assignee: typeof ent?.assignee === 'string' ? ent.assignee : undefined,
                deadline: typeof ent?.deadline === 'string' ? ent.deadline : undefined,
                impact: typeof ent?.impact === 'string' ? ent.impact : undefined,
                priority: ['high', 'medium', 'low'].includes(ent?.priority) ? ent.priority : undefined,
                validated: true,
              };
            })
            .filter(Boolean) as PreviewEntity[];

          setExtractedEntities(mapped);
        } else {
          setEntityExtractionError(extractionResponse.error || 'Falha ao extrair entidades');
        }
      } catch (err: any) {
        setEntityExtractionError(err?.message || 'Falha ao extrair entidades');
      }
    } catch (error) {
      console.error('Failed to analyze document:', error);
    } finally {
      setIsAnalyzing(false);
      setIsExtractingEntities(false);
    }
  };

  const updateExtractedEntity = (id: string, updates: Partial<PreviewEntity>) => {
    setExtractedEntities((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const handleValidateEntity = (entityId: string, validated: boolean) => {
    setExtractedEntities((prev) => prev.map((e) => (e.id === entityId ? { ...e, validated } : e)));
  };

  // Toggle entity suggestion acceptance
  const toggleEntitySuggestion = (suggestion: any, forceAccept?: boolean) => {
    const key = `${suggestion.entityType}:${suggestion.entityId}`;
    const isAccepted = forceAccept !== undefined ? forceAccept : !acceptedSuggestions.has(key);
    
    setAcceptedSuggestions((prev) => {
      const next = new Set(prev);
      if (isAccepted) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
    
    // Update metadata with accepted entity
    setMetadata((prev) => {
      if (suggestion.entityType === 'person') {
        // People are not directly linked in current schema
        return prev;
      } else if (suggestion.entityType === 'project') {
        const ids = isAccepted
          ? [...(prev.linkedProjectIds || []), suggestion.entityId]
          : (prev.linkedProjectIds || []).filter((id) => id !== suggestion.entityId);
        return { ...prev, linkedProjectIds: ids };
      } else if (suggestion.entityType === 'okr') {
        const ids = isAccepted
          ? [...(prev.linkedOkrIds || []), suggestion.entityId]
          : (prev.linkedOkrIds || []).filter((id) => id !== suggestion.entityId);
        return { ...prev, linkedOkrIds: ids };
      } else if (suggestion.entityType === 'objective') {
        const ids = isAccepted
          ? [...(prev.linkedObjectiveIds || []), suggestion.entityId]
          : (prev.linkedObjectiveIds || []).filter((id) => id !== suggestion.entityId);
        return { ...prev, linkedObjectiveIds: ids };
      } else if (suggestion.entityType === 'department') {
        return { ...prev, departmentId: isAccepted ? suggestion.entityId : undefined };
      }
      return prev;
    });
  };

  const handleUpload = async () => {
    if (!file) return;

    const errors = validateRelationships();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setValidationErrors([]);

    try {
      const approvedEntities = extractedEntities
        .filter((e) => e.validated === true)
        .map((e) => ({
          type: e.type,
          value: e.value,
          description: e.description || e.context || '',
          confidence: e.confidence,
          assignee: e.assignee || undefined,
          relatedPerson: e.relatedPerson || undefined,
          deadline: e.deadline || undefined,
          impact: e.impact || undefined,
          priority: e.priority || undefined,
        }));

      const response = await api.uploadDocument(file, { ...metadata, approvedEntities });

      if (response.success) {
        const respAny: any = response as any;
        const dataAny: any = response.data as any;
        const docId =
          respAny?.documentId ||
          dataAny?.documentId ||
          dataAny?.data?.documentId ||
          dataAny?.document?.id ||
          null;
        setUploadedDocumentId(typeof docId === 'string' ? docId : null);
        setUploadSuccess(true);
      } else {
        setUploadError(response.error || 'Falha ao fazer upload do documento');
        if (response.details?.missing) {
          setValidationErrors(
            response.details.missing.map((m: string) => `${m} é obrigatório`)
          );
        }
      }
    } catch (error: any) {
      setUploadError(error.message || 'Falha ao fazer upload do documento');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setMetadata({
      title: '',
      type: 'other',
      confidentiality: 'internal',
      visibility: 'corporate',
      linkedProjectIds: [],
      linkedOkrIds: [],
      linkedObjectiveIds: [],
      tags: [],
      canonicalData: {},
    });
    setExtractedMetadata(null);
    setMentionedEntities([]);
    setEntitySuggestions([]);
    setAcceptedSuggestions(new Set());
    setSuggestedRelationships(null);
    setIsExtractingEntities(false);
    setExtractedEntities([]);
    setEntityExtractionError(null);
    setActiveEntityTab('all');
    setUploadSuccess(false);
    setUploadedDocumentId(null);
    setUploadError(null);
    setValidationErrors([]);
    setSuggestions(null);
  };

  if (uploadSuccess && uploadedDocumentId) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-foreground">Ingestão concluída</p>
              <p className="text-xs text-muted-foreground">Entidades validadas foram persistidas no grafo</p>
            </div>
          </div>
          <button
            onClick={resetForm}
            className="text-xs px-3 py-2 rounded-lg border border-border bg-background hover:bg-accent transition-colors"
          >
            Enviar outro documento
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Documento ID: <span className="font-mono text-foreground">{uploadedDocumentId}</span></p>
          </div>
        </div>
      </div>
    );
  }

  const toggleEntity = (entityId: string, type: 'project' | 'okr' | 'objective') => {
    setMetadata((prev) => {
      if (type === 'project') {
        const isSelected = prev.linkedProjectIds.includes(entityId);
        return {
          ...prev,
          linkedProjectIds: isSelected
            ? prev.linkedProjectIds.filter((id) => id !== entityId)
            : [...prev.linkedProjectIds, entityId],
        };
      } else if (type === 'okr') {
        const isSelected = prev.linkedOkrIds.includes(entityId);
        return {
          ...prev,
          linkedOkrIds: isSelected
            ? prev.linkedOkrIds.filter((id) => id !== entityId)
            : [...prev.linkedOkrIds, entityId],
        };
      } else {
        const isSelected = prev.linkedObjectiveIds.includes(entityId);
        return {
          ...prev,
          linkedObjectiveIds: isSelected
            ? prev.linkedObjectiveIds.filter((id) => id !== entityId)
            : [...prev.linkedObjectiveIds, entityId],
        };
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload de Documento</h1>
          <p className="text-sm text-gray-600">
            Faça upload de documentos e vincule-os a projetos, OKRs e objetivos
          </p>
        </div>
      </div>

      {/* Extracted Title (appears after upload) */}
      {file && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Título Extraído</h3>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <input
              type="text"
              value={metadata.title}
              onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Título extraído do documento..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Título extraído automaticamente pelo LLM. Você pode editar se necessário.
          </p>
        </div>
      )}

      {/* Project Pre-link - SECOND */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Projeto (pré-vínculo manual)
        </label>
        <select
          value={metadata.linkedProjectIds[0] || ''}
          onChange={(e) => {
            const selected = e.target.value;
            setMetadata((prev) => ({
              ...prev,
              linkedProjectIds: selected ? [selected] : [],
            }));
          }}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Nenhum projeto pré-vinculado</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        {loadingEntities && (
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Carregando projetos...
          </p>
        )}
        {!loadingEntities && projects.length === 0 && (
          <p className="text-xs text-amber-600 mt-2">
            ⚠️ Nenhum projeto disponível. Verifique se há projetos cadastrados no sistema.
          </p>
        )}
        {!loadingEntities && projects.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            {projects.length} projeto(s) disponível(is)
          </p>
        )}
      </div>

      {/* Document Type Cards - THIRD */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Tipo de Documento *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {DOCUMENT_TYPES.map((type) => {
            const TypeIcon = type.icon;
            const isSelected = metadata.type === type.value;
            return (
              <button
                type="button"
                key={type.value}
                onClick={() => setMetadata((prev) => ({ ...prev, type: type.value }))}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <TypeIcon className={`w-5 h-5 flex-shrink-0 ${
                    isSelected ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium mb-1 ${
                      isSelected ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {type.label}
                    </div>
                    <div className="text-xs text-gray-500 line-clamp-2">
                      {type.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-600">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={resetForm}
              className="p-2 hover:bg-gray-200 rounded-full"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 mb-2">
              Arraste um arquivo aqui ou clique para selecionar
            </p>
            <p className="text-sm text-gray-500 mb-4">
              PDF, DOCX, TXT, MD, XLSX (máx. 50MB)
            </p>
            <input
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              accept=".pdf,.docx,.txt,.md,.xlsx"
            />
            <label
              htmlFor="file-upload"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700"
            >
              Selecionar Arquivo
            </label>
          </>
        )}
      </div>

      {file && (
        <>
          {/* Analysis Status */}
          {isAnalyzing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <div>
                  <p className="font-medium text-blue-900">Analisando documento...</p>
                  <p className="text-sm text-blue-700">Extraindo metadados e identificando entidades relacionadas</p>
                </div>
              </div>
            </div>
          )}

          {isExtractingEntities && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                <div>
                  <p className="font-medium text-purple-900">Extraindo entidades...</p>
                  <p className="text-sm text-purple-700">Gerando tarefas, decisões, riscos e insights para validação</p>
                </div>
              </div>
            </div>
          )}

          {entityExtractionError && !isExtractingEntities && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{entityExtractionError}</p>
              </div>
            </div>
          )}

          {!isExtractingEntities && extractedEntities.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Validação de Entidades Extraídas</h3>
                  <p className="text-sm text-gray-600">
                    Mesmo fluxo da transcrição: confirme, ajuste responsável e retire o que não deve persistir
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExtractedEntities((prev) => prev.map((e) => ({ ...e, validated: true })))}
                    className="text-xs px-3 py-1.5 rounded border border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                  >
                    Confirmar todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtractedEntities((prev) => prev.map((e) => ({ ...e, validated: false })))}
                    className="text-xs px-3 py-1.5 rounded border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                  >
                    Retirar todas
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveEntityTab('all')}
                  className={`px-3 py-1.5 rounded text-xs border ${
                    activeEntityTab === 'all'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Todas ({extractedEntities.length})
                </button>
                {(['task', 'decision', 'risk', 'insight'] as PreviewEntityType[]).map((type) => {
                  const conf = ENTITY_CONFIG[type];
                  const Icon = conf.icon;
                  const count = entityCounts[type] || 0;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setActiveEntityTab(type)}
                      className={`px-3 py-1.5 rounded text-xs border flex items-center gap-1.5 ${
                        activeEntityTab === type
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {conf.label} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3">
                {filteredEntities.map((entity) => {
                  const config = ENTITY_CONFIG[entity.type];
                  const Icon = config.icon;
                  const canEdit = entity.validated !== false;
                  const responsibleValue = entity.type === 'task' ? entity.assignee || '' : entity.relatedPerson || '';
                  const hasResponsibleInOrg = responsibleValue
                    ? orgNodes.some((n) => n.name === responsibleValue)
                    : false;

                  return (
                    <div
                      key={entity.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        entity.validated === true
                          ? 'bg-green-50 border-green-200'
                          : entity.validated === false
                            ? 'bg-red-50 border-red-200 opacity-70'
                            : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${config.color}`}>
                          <Icon className="w-3 h-3" />
                          {config.label}
                        </span>

                        <input
                          value={entity.value}
                          onChange={(e) => updateExtractedEntity(entity.id, { value: e.target.value })}
                          className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                          disabled={!canEdit}
                        />

                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                          {Math.round(entity.confidence * 100)}%
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="p-1.5 rounded hover:bg-green-100 text-green-700"
                            title="Confirmar"
                            onClick={() => handleValidateEntity(entity.id, true)}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1.5 rounded hover:bg-red-100 text-red-700"
                            title="Retirar"
                            onClick={() => handleValidateEntity(entity.id, false)}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 lg:grid-cols-4 gap-3">
                        <div className="lg:col-span-2">
                          <label className="block text-xs text-gray-600 mb-1">Descrição</label>
                          <textarea
                            value={entity.description || entity.context || ''}
                            onChange={(e) => updateExtractedEntity(entity.id, { description: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm min-h-[68px] bg-white"
                            disabled={!canEdit}
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Responsável</label>
                          <select
                            value={hasResponsibleInOrg ? responsibleValue : ''}
                            onChange={(e) =>
                              updateExtractedEntity(
                                entity.id,
                                entity.type === 'task'
                                  ? { assignee: e.target.value }
                                  : { relatedPerson: e.target.value }
                              )
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                            disabled={!canEdit}
                          >
                            <option value="">Não atribuído</option>
                            {!hasResponsibleInOrg && responsibleValue && (
                              <option value={responsibleValue}>{responsibleValue} (fora do org)</option>
                            )}
                            {orgNodes.map((node) => (
                              <option key={node.id} value={node.name}>
                                {node.name}
                                {node.role ? ` • ${node.role}` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Prazo</label>
                            <input
                              type="date"
                              value={entity.deadline || ''}
                              onChange={(e) => updateExtractedEntity(entity.id, { deadline: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                              disabled={!canEdit || entity.type !== 'task'}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Prioridade</label>
                            <select
                              value={entity.priority || 'medium'}
                              onChange={(e) =>
                                updateExtractedEntity(entity.id, {
                                  priority: e.target.value as 'high' | 'medium' | 'low',
                                })
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                              disabled={!canEdit}
                            >
                              <option value="high">Alta</option>
                              <option value="medium">Média</option>
                              <option value="low">Baixa</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Entity Suggestions */}
          {!isAnalyzing && entitySuggestions.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h3 className="font-medium text-green-900">
                    Sugestões de Vínculos ({entitySuggestions.length})
                  </h3>
                </div>
                <button
                  onClick={() => {
                    entitySuggestions.forEach(s => toggleEntitySuggestion(s, true));
                  }}
                  className="text-sm text-green-700 hover:text-green-800 font-medium"
                >
                  Aceitar Todas
                </button>
              </div>
              {suggestedRelationships && (
                <div className="mb-3 text-xs text-green-800 bg-green-100 border border-green-200 rounded p-2">
                  Sugestões encontradas: {suggestedRelationships.projects} projeto(s), {suggestedRelationships.okrs} OKR(s), {suggestedRelationships.objectives} objetivo(s), {suggestedRelationships.departments} departamento(s), {suggestedRelationships.people} pessoa(s).
                </div>
              )}
              {suggestedRelationships && suggestedRelationships.projects === 0 && (
                <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  Nenhum projeto foi identificado automaticamente. Você pode selecionar manualmente em "Relacionamentos com BIG".
                </div>
              )}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {entitySuggestions.map((suggestion: any, index: number) => {
                  const key = `${suggestion.entityType}:${suggestion.entityId}`;
                  const isAccepted = acceptedSuggestions.has(key);
                  const confidenceColor = 
                    suggestion.confidence > 0.85 ? 'bg-green-500' :
                    suggestion.confidence > 0.7 ? 'bg-yellow-500' : 'bg-orange-500';
                  
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        isAccepted 
                          ? 'bg-green-100 border-green-300' 
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isAccepted}
                          onChange={() => toggleEntitySuggestion(suggestion)}
                          className="mt-1 w-4 h-4 text-green-600"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {suggestion.entityName}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {suggestion.entityType === 'person' ? 'Pessoa' :
                               suggestion.entityType === 'project' ? 'Projeto' :
                               suggestion.entityType === 'okr' ? 'OKR' :
                               suggestion.entityType === 'objective' ? 'Objetivo' :
                               suggestion.entityType === 'department' ? 'Departamento' : suggestion.entityType}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {suggestion.matchType === 'exact' ? 'Exato' :
                               suggestion.matchType === 'fuzzy' ? 'Aproximado' : 'Semântico'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{suggestion.context}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${confidenceColor}`}
                                style={{ width: `${suggestion.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 font-medium">
                              {(suggestion.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Metadata Form */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Metadados do Documento</h2>
              {extractedMetadata && (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  Preenchido automaticamente
                </span>
              )}
            </div>

            <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded p-3">
              <p className="font-medium text-gray-700 mb-1">Relações que serão salvas no banco:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Documento -[:BELONGS_TO_PROJECT]-&gt; Projeto</li>
                <li>Documento -[:LINKED_TO_OKR]-&gt; OKR</li>
                <li>Documento -[:SUPPORTS]-&gt; Objetivo</li>
                <li>Documento -[:BELONGS_TO]-&gt; Departamento (se selecionado)</li>
              </ul>
            </div>

            {/* Confidentiality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confidencialidade *
              </label>
              <select
                value={metadata.confidentiality}
                onChange={(e) =>
                  setMetadata((prev) => ({
                    ...prev,
                    confidentiality: e.target.value as ConfidentialityLevel,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {CONFIDENTIALITY_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label} - {level.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Summary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resumo (opcional)
              </label>
              <textarea
                value={metadata.summary || ''}
                onChange={(e) => setMetadata((prev) => ({ ...prev, summary: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Breve descrição do documento"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(metadata.tags || []).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => {
                        setMetadata((prev) => ({
                          ...prev,
                          tags: (prev.tags || []).filter((_, i) => i !== index),
                        }));
                      }}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Digite uma tag e pressione Enter"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.currentTarget;
                    const tag = input.value.trim().toLowerCase();
                    if (tag && !(metadata.tags || []).includes(tag)) {
                      setMetadata((prev) => ({
                        ...prev,
                        tags: [...(prev.tags || []), tag],
                      }));
                      input.value = '';
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Extracted Metadata Section */}
          {extractedMetadata && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Metadados Extraídos Automaticamente
                </h3>
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                  Confiança: {(extractedMetadata.confidence * 100).toFixed(0)}%
                </span>
              </div>

              {/* Canonical Data */}
              {extractedMetadata.canonicalData && Object.keys(extractedMetadata.canonicalData).length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-purple-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    Dados Canônicos do Documento
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(metadata.canonicalData || {}).map(([key, value]) => (
                      <div key={key} className="text-sm bg-gray-50 border border-gray-200 rounded p-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-700 font-medium">{key}</span>
                          <button
                            onClick={() => {
                              setMetadata((prev) => {
                                const next = { ...(prev.canonicalData || {}) };
                                delete next[key];
                                return { ...prev, canonicalData: next };
                              });
                            }}
                            className="text-red-500 hover:text-red-700"
                            title="Excluir metadado"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          value={String(value || '')}
                          onChange={(e) => {
                            const nextValue = e.target.value;
                            setMetadata((prev) => ({
                              ...prev,
                              canonicalData: {
                                ...(prev.canonicalData || {}),
                                [key]: nextValue,
                              },
                            }));
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mentioned Entities */}
              {mentionedEntities.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-purple-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    Entidades Mencionadas no Documento
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {mentionedEntities.map((entity: MentionedEntity, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                      >
                        {entity.type === 'person' && <Users className="w-3 h-3" />}
                        {entity.type === 'organization' && <Building2 className="w-3 h-3" />}
                        {entity.type === 'project' && <FolderKanban className="w-3 h-3" />}
                        {entity.name}
                        {entity.type && (
                          <span className="text-[10px] opacity-70">({entity.type})</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Relationships */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Relacionamentos com BIG
              </h2>
              {loadingSuggestions && (
                <span className="text-sm text-gray-500 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando sugestões...
                </span>
              )}
            </div>

            {/* Projects */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Projetos
                {REQUIRED_RELATIONSHIPS[metadata.type].includes('Projeto') && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              {loadingEntities ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando...
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {suggestions?.projects && suggestions.projects.length > 0 && (
                    <div className="mb-2 p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs font-medium text-blue-700 mb-1">Sugestões:</p>
                      {suggestions.projects.map((proj) => (
                        <button
                          key={proj.id}
                          onClick={() => toggleEntity(proj.id, 'project')}
                          className="block w-full text-left px-2 py-1 text-sm hover:bg-blue-100 rounded"
                        >
                          {proj.name} ({(proj.confidence * 100).toFixed(0)}%)
                        </button>
                      ))}
                    </div>
                  )}
                  {projects.map((project) => (
                    <label
                      key={project.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={metadata.linkedProjectIds.includes(project.id)}
                        onChange={() => toggleEntity(project.id, 'project')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{project.name}</p>
                        <p className="text-xs text-gray-500">
                          {project.status} • {project.department || 'Sem departamento'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* OKRs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">OKRs</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {okrs.map((okr) => (
                  <label
                    key={okr.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={metadata.linkedOkrIds.includes(okr.id)}
                      onChange={() => toggleEntity(okr.id, 'okr')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{okr.name}</p>
                      <p className="text-xs text-gray-500">{okr.objective || 'Sem objetivo'}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Objectives */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Objetivos
                {REQUIRED_RELATIONSHIPS[metadata.type].includes('Objetivo') && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {objectives.map((obj) => (
                  <label
                    key={obj.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={metadata.linkedObjectiveIds.includes(obj.id)}
                      onChange={() => toggleEntity(obj.id, 'objective')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{obj.name}</p>
                      <p className="text-xs text-gray-500">
                        {obj.department || 'Sem departamento'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Visibility Selector */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Visibilidade do Conhecimento *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: 'individual', label: 'Individual', desc: 'Só você acessa e valida', Icon: Users, border: 'border-gray-400 bg-gray-50', active: 'border-gray-600 bg-gray-100' },
                { value: 'department', label: 'Área/Depto', desc: 'Gestão da área revisa', Icon: Building2, border: 'border-blue-300 bg-blue-50', active: 'border-blue-500 bg-blue-100' },
                { value: 'corporate', label: 'Corporativo', desc: 'Diretoria revisa', Icon: Shield, border: 'border-purple-300 bg-purple-50', active: 'border-purple-500 bg-purple-100' },
              ] as const).map(({ value, label, desc, Icon, border, active }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMetadata((prev) => ({ ...prev, visibility: value }))}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    metadata.visibility === value ? active : border
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-1 ${metadata.visibility === value ? 'text-gray-800' : 'text-gray-500'}`} />
                  <p className={`text-xs font-semibold ${metadata.visibility === value ? 'text-gray-900' : 'text-gray-700'}`}>{label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-red-900 mb-1">Erros de Validação</h3>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Upload Error */}
          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{uploadError}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {uploadSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700">
                  Ingestão concluída com sucesso!
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              disabled={isUploading}
            >
              Cancelar
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading || isAnalyzing || isExtractingEntities || !metadata.title || extractedEntities.filter((e) => e.validated === true).length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Persistindo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Confirmar Ingestão
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
