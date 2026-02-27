import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
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

interface DocumentMetadata {
  title: string;
  type: DocumentType;
  confidentiality: ConfidentialityLevel;
  memoryClass?: MemoryClass;
  linkedProjectIds: string[];
  linkedOkrIds: string[];
  linkedObjectiveIds: string[];
  linkedProcessId?: string;
  departmentId?: string;
  tags: string[];
  summary?: string;
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

const DOCUMENT_TYPES: { value: DocumentType; label: string; description: string }[] = [
  { value: 'contract', label: 'Contrato', description: 'Contratos e acordos formais' },
  { value: 'report', label: 'Relatório', description: 'Relatórios de progresso, análise, etc.' },
  { value: 'meeting', label: 'Ata de Reunião', description: 'Registro de reuniões' },
  { value: 'process_doc', label: 'Documentação de Processo', description: 'Processos e procedimentos' },
  { value: 'strategic_plan', label: 'Plano Estratégico', description: 'Planejamento estratégico' },
  { value: 'technical_spec', label: 'Especificação Técnica', description: 'Documentação técnica' },
  { value: 'policy', label: 'Política/Norma', description: 'Políticas organizacionais' },
  { value: 'manual', label: 'Manual', description: 'Manuais de usuário, guias' },
  { value: 'proposal', label: 'Proposta', description: 'Propostas comerciais, de projeto' },
  { value: 'analysis', label: 'Análise/Estudo', description: 'Análises e estudos' },
  { value: 'email', label: 'Email', description: 'Emails importantes' },
  { value: 'note', label: 'Nota', description: 'Notas e anotações' },
  { value: 'spreadsheet', label: 'Planilha', description: 'Dados tabulados (sem macros)' },
  { value: 'other', label: 'Outro', description: 'Outros tipos de documento' },
];

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
    linkedProjectIds: [],
    linkedOkrIds: [],
    linkedObjectiveIds: [],
    tags: [],
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Linkable entities
  const [projects, setProjects] = useState<LinkableEntity[]>([]);
  const [okrs, setOkrs] = useState<LinkableEntity[]>([]);
  const [objectives, setObjectives] = useState<LinkableEntity[]>([]);
  const [processes, setProcesses] = useState<LinkableEntity[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);

  // Preprocessing & Auto-extraction
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedMetadata, setExtractedMetadata] = useState<any>(null);
  const [entitySuggestions, setEntitySuggestions] = useState<any[]>([]);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<string>>(new Set());

  // Suggestions (legacy - for manual suggestion)
  const [suggestions, setSuggestions] = useState<{
    projects: Array<{ id: string; name: string; confidence: number }>;
    okrs: Array<{ id: string; title: string; confidence: number }>;
    objectives: Array<{ id: string; title: string; confidence: number }>;
  } | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Load linkable entities
  const loadEntities = useCallback(async () => {
    setLoadingEntities(true);
    try {
      const response = await api.getLinkableEntities();
      if (response.success && response.data) {
        const entities = response.data.entities as LinkableEntity[];
        setProjects(entities.filter((e) => e.type === 'project'));
        setOkrs(entities.filter((e) => e.type === 'okr'));
        setObjectives(entities.filter((e) => e.type === 'objective'));
        setProcesses(entities.filter((e) => e.type === 'process'));
      }
    } catch (error) {
      console.error('Failed to load entities:', error);
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

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      if (!metadata.title) {
        setMetadata((prev) => ({ ...prev, title: droppedFile.name.replace(/\.[^/.]+$/, '') }));
      }
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
    setEntitySuggestions([]);
    setAcceptedSuggestions(new Set());

    try {
      const response = await api.preprocessDocument(file);
      
      if (response.success && response.data) {
        const { suggestedMetadata, suggestedEntities } = response.data;
        
        // Store extracted metadata
        setExtractedMetadata(suggestedMetadata);
        setEntitySuggestions(suggestedEntities || []);
        
        // Auto-fill metadata fields
        setMetadata((prev) => ({
          ...prev,
          title: suggestedMetadata.title || prev.title,
          type: suggestedMetadata.type || prev.type,
          tags: suggestedMetadata.tags || prev.tags,
          summary: suggestedMetadata.summary || prev.summary,
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
    } catch (error) {
      console.error('Failed to analyze document:', error);
    } finally {
      setIsAnalyzing(false);
    }
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
      const response = await api.uploadDocument(file, metadata);

      if (response.success) {
        setUploadSuccess(true);
        setTimeout(() => {
          resetForm();
        }, 2000);
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
      linkedProjectIds: [],
      linkedOkrIds: [],
      linkedObjectiveIds: [],
      tags: [],
    });
    setUploadSuccess(false);
    setUploadError(null);
    setValidationErrors([]);
    setSuggestions(null);
  };

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
              onClick={() => setFile(null)}
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

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                type="text"
                value={metadata.title}
                onChange={(e) => setMetadata((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nome do documento"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Documento *
              </label>
              <select
                value={metadata.type}
                onChange={(e) =>
                  setMetadata((prev) => ({ ...prev, type: e.target.value as DocumentType }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
              {REQUIRED_RELATIONSHIPS[metadata.type].length > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Relacionamentos obrigatórios:{' '}
                  {REQUIRED_RELATIONSHIPS[metadata.type].join(', ')}
                </p>
              )}
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
          </div>

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
                  Documento enviado com sucesso! Redirecionando...
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
              disabled={isUploading || !metadata.title}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Fazer Upload
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
