"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
// Textarea removido - keyTopics agora são tags simples
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Users,
  ListTodo,
  FolderKanban,
  AlertTriangle,
  Lightbulb,
  Clock,
  Edit3,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  Tag,
  Link2,
  Loader2,
  Building2,
  Calendar,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  Database,
  GitBranch,
  Save,
  Target,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Entity types conforme specs 007, 012, 013
type EntityType = 
  | "participant" 
  | "task" 
  | "project" 
  | "risk" 
  | "decision" 
  | "insight"
  | "area"            // Área/Departamento mencionado (spec 007)
  | "deadline"        // Data/Prazo identificado
  | "followup"        // Ação de follow-up
  | "mentionedEntity"; // Organização, ferramenta, conceito mencionado

// Classificação Real vs Passageiro (spec 010)
type DataClassification = "real" | "transient";

// Nível de memória (spec 010)
type MemoryLevel = "short" | "medium" | "long";

// Visibilidade (spec 009)
type Visibility = "corporate" | "personal";

interface ExtractedEntity {
  id: string;
  type: EntityType;
  value: string;
  confidence: number;
  context?: string;
  validated: boolean | null;
  // Novos campos conforme specs
  classification: DataClassification; // Real vs Passageiro (spec 010)
  memoryLevel: MemoryLevel;           // Nível de memória (spec 010)
  visibility: Visibility;             // Corp vs Pessoal (spec 009)
  sourceRef?: string;                 // Referência ao trecho da transcrição (proveniência - spec 014)
  linkedNodeId?: string;              // ID do node existente no grafo (se vinculado)
  expiresAt?: string;                 // Data de expiração para dados passageiros
  // Campos LLM enrichment
  description?: string;               // Descrição detalhada gerada pelo LLM
  relatedPerson?: string;             // Pessoa relacionada (quem levantou, é afetado, etc.)
  impact?: string;                    // Impacto esperado/potencial
  priority?: 'high' | 'medium' | 'low'; // Prioridade/severidade
  // Match sugerido (para curador aceitar com 1 clique)
  suggestedMatch?: {
    nodeId: string;
    nodeName: string;
    nodeLabel: string;
    score: number;
    matchType: string;
  };
  // Campos de Tarefa (assignee, deadline) - aplicáveis a task
  assignee?: string;                  // Responsável pela tarefa/ação
  deadline?: string;                  // Prazo (data)
  // Campos específicos de mentionedEntity
  entityType?: 'organization' | 'tool' | 'product' | 'client' | 'person_external' | 'concept';
}

// Tipo de reunião
type MeetingType = 
  | "kickoff" 
  | "status" 
  | "planning" 
  | "review" 
  | "retrospective" 
  | "brainstorm" 
  | "alignment" 
  | "decision" 
  | "routine"
  | "other";

// Nível de confidencialidade
type ConfidentialityLevel = "normal" | "confidential" | "restricted";

interface MeetingMetadata {
  title: string;                                // Título oficial da reunião (definido pelo curador)
  date: string;
  time: string;                                 // Hora de início da reunião
  duration: string;
  organizer: string;                            // Nome do organizador
  organizerId?: string;                         // ID do organizador (User node)
  relatedProjectId: string;
  relatedProjectName: string;
  // Novos campos conforme specs
  meetingType: MeetingType;                     // Tipo de reunião
  confidentiality: ConfidentialityLevel;        // Nível de confidencialidade
  recurrence: "single" | "recurring";           // Recorrência
  linkedOkrIds?: string[];                      // OKRs relacionados
  sourceFile: string;                           // Arquivo fonte (proveniência)
  processingTimestamp: string;                  // Quando foi processado
}

interface OrgChartNode {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
  department: string;
  status: string;
}

interface ExternalParticipantNode {
  id: string;
  name: string;
  email?: string;
  organization: string;
  partnerType: 'strategic' | 'operational' | 'tactical';
  status: 'active' | 'inactive';
}

interface ExtractionResult {
  metadata: MeetingMetadata;
  entities: ExtractedEntity[];
  rawText: string;
  summary?: string;
  keyTopics?: string[];
}

const ENTITY_CONFIG: Record<EntityType, { icon: typeof Users; label: string; color: string; defaultClassification: DataClassification; defaultMemoryLevel: MemoryLevel }> = {
  participant: { 
    icon: Users, 
    label: "Participante", 
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    defaultClassification: "real",
    defaultMemoryLevel: "long"
  },
  task: { 
    icon: ListTodo, 
    label: "Tarefa", 
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    defaultClassification: "real",
    defaultMemoryLevel: "medium"
  },
  // NOTA: actionItem foi consolidado em task (tarefa) conforme Visão Estratégica
  project: { 
    icon: FolderKanban, 
    label: "Projeto", 
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    defaultClassification: "real",
    defaultMemoryLevel: "long"
  },
  risk: { 
    icon: AlertTriangle, 
    label: "Risco", 
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    defaultClassification: "real",
    defaultMemoryLevel: "medium"
  },
  decision: { 
    icon: CheckCircle, 
    label: "Decisão", 
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    defaultClassification: "real",
    defaultMemoryLevel: "long"
  },
  insight: { 
    icon: Lightbulb, 
    label: "Insight", 
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    defaultClassification: "real",
    defaultMemoryLevel: "medium"
  },
  area: { 
    icon: Building2, 
    label: "Área/Depto", 
    color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    defaultClassification: "real",
    defaultMemoryLevel: "long"
  },
  deadline: { 
    icon: Calendar, 
    label: "Prazo", 
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    defaultClassification: "real",
    defaultMemoryLevel: "medium"
  },
  followup: { 
    icon: ArrowRight, 
    label: "Follow-up", 
    color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    defaultClassification: "real",
    defaultMemoryLevel: "short"
  },
  mentionedEntity: { 
    icon: Tag, 
    label: "Entidade", 
    color: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
    defaultClassification: "real",
    defaultMemoryLevel: "long"
  },
};

const MEETING_TYPES: Record<MeetingType, string> = {
  kickoff: "Kickoff",
  status: "Status/Acompanhamento",
  planning: "Planejamento",
  review: "Revisão",
  retrospective: "Retrospectiva",
  brainstorm: "Brainstorm",
  alignment: "Alinhamento",
  decision: "Tomada de Decisão",
  routine: "Rotina",
  other: "Outro",
};

const CONFIDENTIALITY_LEVELS: Record<ConfidentialityLevel, { label: string; icon: typeof Eye; color: string }> = {
  normal: { label: "Normal", icon: Eye, color: "text-green-600" },
  confidential: { label: "Confidencial", icon: EyeOff, color: "text-amber-600" },
  restricted: { label: "Restrito", icon: Shield, color: "text-red-600" },
};

export function MeetingTranscriptIngestion() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingEntity, setEditingEntity] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para modal de edicao expandida de participante
  const [expandedEditEntity, setExpandedEditEntity] = useState<ExtractedEntity | null>(null);
  const [thesaurusCandidates, setThesaurusCandidates] = useState<Array<{ id: string; name: string; confidence: number; context?: string }>>([]);
  const [externalFormData, setExternalFormData] = useState({
    name: "",
    email: "",
    organization: "",
    partnerType: "operational" as "strategic" | "operational" | "tactical",
    role: "",
    notes: "",
  });
  const [creatingExternalParticipant, setCreatingExternalParticipant] = useState(false);
  const [externalParticipantModalError, setExternalParticipantModalError] = useState<string | null>(null);

  // Pre-meeting configuration states
  const [orgNodes, setOrgNodes] = useState<OrgChartNode[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [externalParticipants, setExternalParticipants] = useState<ExternalParticipantNode[]>([]);
  const [partnerOrganizations, setPartnerOrganizations] = useState<Array<{ name: string; participantCount: number }>>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Thesaurus para matching de speakers (Ontology-First)
  const [thesaurus, setThesaurus] = useState<Array<{
    id: string;
    canonicalName: string;
    aliases: string[];
    type: string;
    context?: string;
  }>>([]);

  // Pre-configuration states (before processing)
  const [selectedOrganizerId, setSelectedOrganizerId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  
  // Novos estados para metadados expandidos (specs 009, 010, 013)
  const [meetingType, setMeetingType] = useState<MeetingType>("other");
  const [confidentiality, setConfidentiality] = useState<ConfidentialityLevel>("normal");
  const [defaultVisibility, setDefaultVisibility] = useState<Visibility>("corporate");
  const [recurrence, setRecurrence] = useState<"single" | "recurring">("single");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [existingRecurringSeries, setExistingRecurringSeries] = useState<string[]>([]);
  
  // Estados para Data e Hora da reunião (campos obrigatórios - não disponíveis no VTT)
  const [meetingDate, setMeetingDate] = useState<string>("");
  const [meetingTime, setMeetingTime] = useState<string>("");
  
  // Estado para controlar aba ativa na seção de entidades
  const [activeEntityTab, setActiveEntityTab] = useState<EntityType | "all">("all");
  
  // Estado para keyTopics (metadados simples para recuperação)
  const [keyTopicsData, setKeyTopicsData] = useState<string[]>([]);
  const [editingKeyTopicIdx, setEditingKeyTopicIdx] = useState<number | null>(null);
  const [newTopicInput, setNewTopicInput] = useState("");

  // Load org chart and projects on mount
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const { api } = await import("@/lib/api");
        
        // Load org chart
        const orgResponse = await api.getOrgChartNodes();
        if (orgResponse?.success && Array.isArray(orgResponse.data)) {
          setOrgNodes(orgResponse.data);
        }
        
        // Load projects
        const projectsResponse = await api.getProjects();
        if (projectsResponse?.success && Array.isArray(projectsResponse.data)) {
          setProjects(projectsResponse.data.filter((p: Project) => p.status !== 'archived'));
        }
        
        // Load external participants
        const externalResponse = await (api as any).getExternalParticipants({ status: 'active' });
        if (externalResponse?.success && Array.isArray(externalResponse.data)) {
          setExternalParticipants(externalResponse.data);
        }
        
        // Load partner organizations (for combo)
        const orgsResponse = await (api as any).getPartnerOrganizations();
        if (orgsResponse?.success && Array.isArray(orgsResponse.data)) {
          setPartnerOrganizations(orgsResponse.data);
        }
        
        // Load existing recurring meeting series titles (for combo)
        try {
          const meetingsResponse = await (api as any).getMeetings({ limit: 200 });
          if (meetingsResponse?.success && Array.isArray(meetingsResponse.data)) {
            const seriesTitles = meetingsResponse.data
              .filter((m: any) => m.recurrence === 'recurring' && m.title)
              .map((m: any) => m.title as string);
            const uniqueSeries = [...new Set(seriesTitles)].sort();
            setExistingRecurringSeries(uniqueSeries);
            console.log(`[Ingestion] Recurring series loaded: ${uniqueSeries.length} series`);
          }
        } catch (err) {
          console.warn("Failed to load recurring meeting series:", err);
        }

        // Load thesaurus for speaker matching (Ontology-First principle)
        const thesaurusResponse = await api.getOntologyThesaurus();
        if (thesaurusResponse?.success && Array.isArray(thesaurusResponse.data)) {
          setThesaurus(thesaurusResponse.data);
          console.log(`[Ingestion] Thesaurus loaded: ${thesaurusResponse.data.length} entries`);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoadingData(false);
      }
    };
    void loadData();
  }, []);

  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  // Organizador selecionado (do orgChart - colaboradores internos)
  const selectedOrganizer = useMemo(() => {
    return orgNodes.find(n => n.id === selectedOrganizerId);
  }, [orgNodes, selectedOrganizerId]);

  // Normaliza string para comparacao (remove acentos, lowercase)
  const normalizeForMatch = (str: string): string => {
    return str
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
  };

  // Match speaker name from VTT against thesaurus (Ontology-First)
  const matchSpeakerToKnownPeople = (speakerName: string): {
    matched: boolean;
    candidates: Array<{ id: string; name: string; confidence: number; context?: string; source: 'thesaurus' | 'external' }>;
  } => {
    const normalizedName = normalizeForMatch(speakerName);
    const nameParts = normalizedName.split(' ').filter(p => p.length > 2);
    const candidates: Array<{ id: string; name: string; confidence: number; context?: string; source: 'thesaurus' | 'external' }> = [];
    
    console.log(`[Match] Buscando: "${speakerName}" -> normalizado: "${normalizedName}", partes: [${nameParts.join(', ')}]`);
    
    // 1. Buscar no Thesaurus (colaboradores internos)
    for (const entry of thesaurus) {
      if (entry.type !== 'Person') continue;
      
      const normalizedCanonical = normalizeForMatch(entry.canonicalName);
      const canonicalParts = normalizedCanonical.split(' ').filter(p => p.length > 2);
      
      if (normalizedCanonical === normalizedName) {
        console.log(`[Match] THESAURUS EXATO: "${speakerName}" = "${entry.canonicalName}"`);
        candidates.push({
          id: entry.id,
          name: entry.canonicalName,
          confidence: 1.0,
          context: entry.context || "Colaborador interno",
          source: 'thesaurus',
        });
        continue;
      }
      
      const matchingParts = nameParts.filter(part => 
        canonicalParts.some(cp => cp.includes(part) || part.includes(cp))
      );
      if (matchingParts.length >= 2 || (matchingParts.length === nameParts.length && nameParts.length >= 1)) {
        const conf = matchingParts.length / Math.max(nameParts.length, canonicalParts.length);
        if (conf >= 0.5) {
          console.log(`[Match] THESAURUS PARCIAL: "${speakerName}" ~ "${entry.canonicalName}" (${Math.round(conf * 100)}%)`);
          candidates.push({
            id: entry.id,
            name: entry.canonicalName,
            confidence: Math.min(0.95, conf + 0.3),
            context: entry.context || "Colaborador interno",
            source: 'thesaurus',
          });
          continue;
        }
      }
      
      for (const alias of entry.aliases) {
        const normalizedAlias = normalizeForMatch(alias);
        if (normalizedAlias === normalizedName) {
          console.log(`[Match] THESAURUS ALIAS: "${speakerName}" = alias "${alias}" de "${entry.canonicalName}"`);
          candidates.push({
            id: entry.id,
            name: entry.canonicalName,
            confidence: 0.9,
            context: entry.context || "Colaborador interno",
            source: 'thesaurus',
          });
          break;
        }
        if (normalizedName.includes(normalizedAlias) || normalizedAlias.includes(normalizedName)) {
          candidates.push({
            id: entry.id,
            name: entry.canonicalName,
            confidence: 0.7,
            context: entry.context || "Colaborador interno",
            source: 'thesaurus',
          });
          break;
        }
      }
    }
    
    // 2. Buscar nos ExternalParticipants já cadastrados
    for (const ext of externalParticipants) {
      const normalizedExtName = normalizeForMatch(ext.name);
      const extNameParts = normalizedExtName.split(' ').filter(p => p.length > 2);
      
      // Match exato
      if (normalizedExtName === normalizedName) {
        console.log(`[Match] EXTERNAL EXATO: "${speakerName}" = "${ext.name}" (${ext.organization})`);
        candidates.push({
          id: ext.id,
          name: ext.name,
          confidence: 1.0,
          context: `Pessoa externa: ${ext.organization} (${ext.partnerType})`,
          source: 'external',
        });
        continue;
      }
      
      // Match parcial por partes do nome
      const matchingParts = nameParts.filter(part => 
        extNameParts.some(ep => ep.includes(part) || part.includes(ep))
      );
      if (matchingParts.length >= 2 || (matchingParts.length === nameParts.length && nameParts.length >= 1)) {
        const conf = matchingParts.length / Math.max(nameParts.length, extNameParts.length);
        if (conf >= 0.5) {
          console.log(`[Match] EXTERNAL PARCIAL: "${speakerName}" ~ "${ext.name}" (${Math.round(conf * 100)}%)`);
          candidates.push({
            id: ext.id,
            name: ext.name,
            confidence: Math.min(0.95, conf + 0.3),
            context: `Pessoa externa: ${ext.organization} (${ext.partnerType})`,
            source: 'external',
          });
          continue;
        }
      }
      
      // Match por primeiro nome + sobrenome (comum em VTT ter nome parcial)
      if (nameParts.length >= 1 && extNameParts.length >= 2) {
        const firstNameMatch = nameParts[0] === extNameParts[0];
        const lastNameMatch = nameParts.length > 1 && extNameParts.includes(nameParts[nameParts.length - 1]);
        if (firstNameMatch && (nameParts.length === 1 || lastNameMatch)) {
          console.log(`[Match] EXTERNAL PRIMEIRO/ULTIMO NOME: "${speakerName}" ~ "${ext.name}"`);
          candidates.push({
            id: ext.id,
            name: ext.name,
            confidence: 0.85,
            context: `Pessoa externa: ${ext.organization} (${ext.partnerType})`,
            source: 'external',
          });
        }
      }
    }
    
    // Sort by confidence descending
    candidates.sort((a, b) => b.confidence - a.confidence);
    
    // Remove duplicates (keep highest confidence)
    const seen = new Set<string>();
    const uniqueCandidates = candidates.filter(c => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
    
    const result = {
      matched: uniqueCandidates.length > 0 && uniqueCandidates[0].confidence >= 0.7,
      candidates: uniqueCandidates.slice(0, 5),
    };
    
    console.log(`[Match] Resultado para "${speakerName}": matched=${result.matched}, candidatos=${result.candidates.length}`);
    if (result.candidates.length > 0) {
      console.log(`[Match] Melhor candidato: "${result.candidates[0].name}" (${Math.round(result.candidates[0].confidence * 100)}%) [${result.candidates[0].source}]`);
    }
    
    return result;
  };

  // Parser VTT para formato Teams
  const parseVTTContent = (content: string): {
    speakers: Array<{ name: string; speakCount: number }>;
    segments: Array<{ speaker: string; text: string; startTime: string; endTime: string }>;
    duration: string;
    rawTranscript: string;
  } => {
    const lines = content.split('\n');
    const segments: Array<{ speaker: string; text: string; startTime: string; endTime: string }> = [];
    const speakerCounts: Record<string, number> = {};
    let lastEndTime = "00:00:00.000";
    
    let currentTimestamp = { start: "", end: "" };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip WEBVTT header and empty lines
      if (!line || line === "WEBVTT" || line.startsWith("NOTE")) continue;
      
      // Check for timestamp line (format: 00:00:04.817 --> 00:00:06.097)
      const timestampMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/);
      if (timestampMatch) {
        currentTimestamp = { start: timestampMatch[1], end: timestampMatch[2] };
        lastEndTime = timestampMatch[2];
        continue;
      }
      
      // Check for speaker tag (format: <v Speaker Name>text</v>)
      const speakerMatch = line.match(/<v\s+([^>]+)>([^<]*)<\/v>/);
      if (speakerMatch && currentTimestamp.start) {
        const speaker = speakerMatch[1].trim();
        const text = speakerMatch[2].trim();
        
        if (speaker && text) {
          segments.push({
            speaker,
            text,
            startTime: currentTimestamp.start,
            endTime: currentTimestamp.end,
          });
          
          speakerCounts[speaker] = (speakerCounts[speaker] || 0) + 1;
        }
      }
    }
    
    // Build speakers list sorted by speak count
    const speakers = Object.entries(speakerCounts)
      .map(([name, speakCount]) => ({ name, speakCount }))
      .sort((a, b) => b.speakCount - a.speakCount);
    
    // Calculate duration from last timestamp
    const durationParts = lastEndTime.split(':');
    const duration = `${durationParts[0]}:${durationParts[1]}:${durationParts[2].split('.')[0]}`;
    
    // Build raw transcript
    const rawTranscript = segments
      .map(s => `[${s.startTime}] ${s.speaker}: ${s.text}`)
      .join('\n');
    
    return { speakers, segments, duration, rawTranscript };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validExtensions = [".vtt", ".txt", ".docx", ".doc"];
      const isValid = validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));
      
      if (!isValid) {
        setError("Por favor, selecione um arquivo de transcrição válido (.vtt, .txt, .docx)");
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);

    try {
      // Read file content
      const fileContent = await file.text();
      
      // Parse VTT if it's a VTT file
      let parsedVTT: ReturnType<typeof parseVTTContent> | null = null;
      if (file.name.toLowerCase().endsWith('.vtt')) {
        parsedVTT = parseVTTContent(fileContent);
        console.log(`[VTT Parser] Found ${parsedVTT.speakers.length} speakers, ${parsedVTT.segments.length} segments`);
      }

      // Build speaker entities from VTT with thesaurus matching (identificacao automatica)
      // Colaboradores conhecidos sao AUTO-MATCHED, nao precisam validacao
      const speakerEntities: ExtractedEntity[] = [];
      if (parsedVTT) {
        for (const speaker of parsedVTT.speakers) {
          // Try to match against thesaurus (internos) e external participants (externos conhecidos)
          const matchResult = matchSpeakerToKnownPeople(speaker.name);
          const isAutoMatched = matchResult.matched && matchResult.candidates[0].confidence >= 0.9;
          const bestCandidate = matchResult.candidates[0];
          
          // Determina contexto baseado na fonte do match
          let context = `Pessoa externa? - ${speaker.speakCount} falas`;
          if (isAutoMatched && bestCandidate) {
            context = bestCandidate.context 
              ? `${bestCandidate.context} - ${speaker.speakCount} falas`
              : `Pessoa conhecida - ${speaker.speakCount} falas`;
          }
          
          speakerEntities.push({
            id: `speaker-${speakerEntities.length}`,
            type: "participant",
            value: isAutoMatched ? bestCandidate.name : speaker.name,
            confidence: matchResult.matched ? bestCandidate.confidence : 0.5,
            context,
            validated: true, // Todas entidades validadas por padrão - curador rejeita as incorretas
            classification: "real",
            memoryLevel: "long",
            visibility: defaultVisibility,
            linkedNodeId: matchResult.matched ? bestCandidate.id : undefined,
            sourceRef: isAutoMatched 
              ? `auto-match:${bestCandidate.source}:${bestCandidate.id}` 
              : `vtt:speaker`,
          });
        }
      }

      // Entidades adicionais (projeto selecionado pelo curador)
      const additionalEntities: ExtractedEntity[] = [];

      // Add project entity if project was selected
      if (selectedProject) {
        additionalEntities.push({
          id: "proj-1",
          type: "project",
          value: selectedProject.name,
          confidence: 1.0,
          context: "Projeto relacionado",
          validated: true,
          classification: "real",
          memoryLevel: "long",
          visibility: defaultVisibility,
          linkedNodeId: selectedProject.id,
          sourceRef: `project:${selectedProject.id}`,
        });
      }

      // Fase 2 - Integrar Azure OpenAI para extrair tarefas, decisoes, riscos, insights
      const llmEntities: ExtractedEntity[] = [];
      let meetingSummary = "";
      let keyTopics: string[] = [];
      
      if (parsedVTT?.rawTranscript) {
        try {
          console.log(`[LLM Extraction] Starting extraction for ${parsedVTT.rawTranscript.length} chars...`);
          const { api } = await import("@/lib/api");
          // Não passar nome do arquivo para evitar que LLM extraia termos do título
          // Passar apenas informações mínimas necessárias
          const extractionResponse = await (api as any).extractFromTranscript({
            transcript: parsedVTT.rawTranscript,
            meetingContext: {
              // Não incluir title para evitar extração de termos do nome do arquivo
              project: selectedProject?.name, // Para evitar duplicação
              // Não incluir participants - já processados separadamente
            },
          });
          
          if (extractionResponse?.success && extractionResponse.data) {
            const { entities, summary, keyTopics: topics, processingTime } = extractionResponse.data;
            console.log(`[LLM Extraction] Completed in ${processingTime}ms, found ${entities?.length || 0} entities`);
            console.log(`[LLM Extraction] Summary length: ${summary?.length || 0} chars`);
            console.log(`[LLM Extraction] KeyTopics count: ${topics?.length || 0}`);
            console.log(`[LLM Extraction] Summary preview: "${(summary || '').slice(0, 100)}..."`);
            // Log detalhado dos tipos de entidades recebidos do backend
            if (Array.isArray(entities)) {
              const typeCounts: Record<string, number> = {};
              for (const e of entities) {
                typeCounts[e.type || 'SEM_TIPO'] = (typeCounts[e.type || 'SEM_TIPO'] || 0) + 1;
              }
              console.log(`[LLM Extraction] Entity types received:`, typeCounts);
            }
            
            meetingSummary = summary || "";
            // keyTopics são metadados simples (array de strings) para recuperação
            if (Array.isArray(topics)) {
              keyTopics = topics.map((t: any) =>
                typeof t === 'string' ? t : (t.topic || String(t))
              );
            } else {
              keyTopics = [];
            }
            console.log(`[LLM Extraction] KeyTopics (${keyTopics.length}):`, keyTopics);
            
            // Convert LLM entities to ExtractedEntity format
            for (const entity of entities || []) {
              console.log(`[LLM Entity] Processing:`, entity);
              
              // Map actionItem → task (consolidação: "Ação" e "Tarefa" agora são "Tarefa")
              let mappedType = entity.type as string;
              if (mappedType === 'actionItem' || mappedType === 'action_item') {
                mappedType = 'task';
              }
              
              // Validate entity type
              const validTypes: EntityType[] = ["task", "decision", "risk", "insight", "mentionedEntity"];
              if (!validTypes.includes(mappedType as EntityType)) {
                console.warn(`[LLM Entity] Invalid type "${entity.type}" (mapped: "${mappedType}"), skipping entity:`, entity);
                continue;
              }
              
              // Build context from various fields
              const contextParts: string[] = [];
              if (entity.assignee) contextParts.push(`Responsável: ${entity.assignee}`);
              if (entity.relatedPerson) contextParts.push(`Relacionado: ${entity.relatedPerson}`);
              if (entity.deadline) contextParts.push(`Prazo: ${entity.deadline}`);
              
              llmEntities.push({
                id: `llm-${llmEntities.length}`,
                type: mappedType as EntityType,
                value: entity.value,
                confidence: entity.confidence,
                context: entity.context || contextParts.join(' | ') || undefined,
                validated: true, // Validadas por padrão - curador rejeita as incorretas
                classification: "real",
                memoryLevel: entity.type === "insight" ? "long" : "medium",
                visibility: defaultVisibility,
                sourceRef: `llm:azure-openai`,
                // Novos campos LLM
                description: entity.description,
                assignee: entity.assignee,               // Responsável (para tasks)
                relatedPerson: entity.relatedPerson || entity.assignee, // Pessoa relacionada (decisions/risks/insights)
                deadline: entity.deadline,               // Prazo (para tasks)
                impact: entity.impact,
                priority: entity.priority,
              });
            }
          }
        } catch (llmError) {
          console.error(`[LLM Extraction] Failed:`, llmError);
          console.error(`[LLM Extraction] Error stack:`, llmError instanceof Error ? llmError.stack : 'No stack');
          // Continue without LLM entities - não é crítico
        }
      }

      // Fase 3 - Usar EntityMatchingAgent para verificar entidades no grafo
      // Isso substitui os hardcodes por matching inteligente com thesaurus
      let filteredLlmEntities = [...llmEntities];
      
      // Extrair entidades do tipo mentionedEntity para matching
      const mentionedEntities = llmEntities.filter(e => e.type === 'mentionedEntity');
      
      if (mentionedEntities.length > 0) {
        try {
          console.log(`[EntityMatching] Matching ${mentionedEntities.length} entities...`);
          const { api } = await import("@/lib/api");
          const matchResponse = await api.matchEntities(mentionedEntities.map(e => e.value));
          
          if (matchResponse.success && matchResponse.data) {
            console.log(`[EntityMatching] Got ${matchResponse.data.length} match results`);
            
            // Atualizar entidades com informações de matching
            filteredLlmEntities = llmEntities.map(entity => {
              if (entity.type !== 'mentionedEntity') return entity;
              
              const matchResult = matchResponse.data?.find(m => m.input_term === entity.value);
              if (!matchResult) return entity;
              
              // Se encontrou match com alta confiança, vincular ao node existente
              if (matchResult.found && matchResult.best_match && matchResult.best_match.score >= 0.9) {
                console.log(`[EntityMatching] "${entity.value}" -> linked to "${matchResult.best_match.node.name}" (${matchResult.best_match.score.toFixed(2)})`);
                return {
                  ...entity,
                  linkedNodeId: matchResult.best_match.node.id,
                  value: matchResult.best_match.node.name, // Usar nome canônico
                  confidence: matchResult.best_match.score,
                  context: `${entity.context} | Vinculado a: ${matchResult.best_match.node.label}`,
                  validated: true, // Auto-validar se match alto
                };
              }
              
              // Se match médio (>=0.6), sugerir com dados estruturados para o curador aceitar
              if (matchResult.found && matchResult.best_match && matchResult.best_match.score >= 0.6) {
                console.log(`[EntityMatching] "${entity.value}" -> suggestion: ${matchResult.best_match.node.name} (${matchResult.best_match.score.toFixed(2)})`);
                return {
                  ...entity,
                  suggestedMatch: {
                    nodeId: matchResult.best_match.node.id,
                    nodeName: matchResult.best_match.node.name,
                    nodeLabel: matchResult.best_match.node.label,
                    score: matchResult.best_match.score,
                    matchType: matchResult.best_match.match_type,
                  },
                };
              }
              
              return entity;
            });
            
            // Filtrar entidades que são a própria organização (label Organization com match alto)
            filteredLlmEntities = filteredLlmEntities.filter(entity => {
              if (entity.type !== 'mentionedEntity') return true;
              
              const matchResult = matchResponse.data?.find(m => m.input_term === entity.value);
              if (matchResult?.best_match?.node.label === 'Organization' && matchResult.best_match.score >= 0.8) {
                // Verificar se é a organização dona (já existe no grafo como Organization)
                // Manter apenas se for organização EXTERNA
                const isOwnerOrg = ['cocreateai', 'cocreate', 'cvc'].some(org => 
                  matchResult.best_match!.node.name.toLowerCase().includes(org)
                );
                if (isOwnerOrg) {
                  console.log(`[EntityMatching] Filtering out owner org: "${entity.value}"`);
                  return false;
                }
              }
              return true;
            });
          }
        } catch (matchError) {
          console.warn(`[EntityMatching] Failed, continuing with basic filter:`, matchError);
          // Fallback: filtro básico se o agente não estiver disponível
          const normalizeForCompare = (s: string) => s.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          filteredLlmEntities = llmEntities.filter(entity => {
            const entityValueNorm = normalizeForCompare(entity.value);
            const ownerOrgs = ['cocreateai', 'cocreate', 'cvc'];
            if (ownerOrgs.some(org => entityValueNorm.includes(org))) return false;
            return true;
          });
        }
      }
      
      // Filtrar duplicatas do projeto selecionado (sempre fazer isso)
      const normalizeForCompare = (s: string) => s.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const projectNameNorm = selectedProject ? normalizeForCompare(selectedProject.name) : '';
      if (projectNameNorm) {
        filteredLlmEntities = filteredLlmEntities.filter(entity => {
          const entityValueNorm = normalizeForCompare(entity.value);
          if (entityValueNorm.includes(projectNameNorm) || projectNameNorm.includes(entityValueNorm)) {
            console.log(`[Filter] Removendo duplicata do projeto: "${entity.value}"`);
            return false;
          }
          return true;
        });
      }
      
      console.log(`[Filter] Entidades LLM: ${llmEntities.length} -> ${filteredLlmEntities.length} após matching/filtro`);

      // Build result with VTT data + LLM entities
      const extractionResult: ExtractionResult = {
        metadata: {
          title: recurrence === "recurring"
            ? (meetingTitle || file.name.replace(/\.[^/.]+$/, ""))
            : file.name.replace(/\.[^/.]+$/, ""),
          date: meetingDate || new Date().toISOString().split("T")[0],
          time: meetingTime || "00:00",
          duration: parsedVTT?.duration || "00:00:00",
          organizer: selectedOrganizer?.name || "A ser definido",
          organizerId: selectedOrganizerId || undefined,
          relatedProjectId: selectedProjectId || "",
          relatedProjectName: selectedProject?.name || "",
          // Novos campos de metadados (specs 009, 013, 014)
          meetingType: meetingType,
          confidentiality: confidentiality,
          recurrence: recurrence,
          linkedOkrIds: [], // A ser implementado
          sourceFile: file.name,
          processingTimestamp: new Date().toISOString(),
        },
        entities: [...speakerEntities, ...additionalEntities, ...filteredLlmEntities],
        rawText: parsedVTT?.rawTranscript || fileContent.slice(0, 5000),
        summary: meetingSummary,
        keyTopics,
      };

      console.log(`[Ingestion] Result: ${extractionResult.entities.length} entities, duration: ${extractionResult.metadata.duration}`);
      setResult(extractionResult);
      // Atualizar estado de keyTopics para edição
      setKeyTopicsData(keyTopics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar arquivo");
    } finally {
      setProcessing(false);
    }
  };

  const handleValidateEntity = (entityId: string, validated: boolean) => {
    if (!result) return;
    
    setResult({
      ...result,
      entities: result.entities.map(e => 
        e.id === entityId ? { ...e, validated } : e
      ),
    });
  };

  // Aceitar match sugerido pelo EntityMatchingAgent (1-click linking)
  const handleAcceptSuggestedMatch = (entityId: string) => {
    if (!result) return;
    setResult({
      ...result,
      entities: result.entities.map(e => {
        if (e.id !== entityId || !e.suggestedMatch) return e;
        return {
          ...e,
          linkedNodeId: e.suggestedMatch.nodeId,
          value: e.suggestedMatch.nodeName, // Usar nome canônico do grafo
          confidence: Math.max(e.confidence, e.suggestedMatch.score),
          validated: true,
          sourceRef: `manual-link:${e.suggestedMatch.nodeLabel}:${e.suggestedMatch.nodeId}`,
          context: e.context ? `${e.context} | Vinculado a: ${e.suggestedMatch.nodeLabel}` : `Vinculado a: ${e.suggestedMatch.nodeLabel}`,
          suggestedMatch: undefined, // Limpar sugestão após aceitar
        };
      }),
    });
  };

  // Rejeitar match sugerido (manter como nova entidade)
  const handleRejectSuggestedMatch = (entityId: string) => {
    if (!result) return;
    setResult({
      ...result,
      entities: result.entities.map(e =>
        e.id === entityId ? { ...e, suggestedMatch: undefined } : e
      ),
    });
  };

  const handleEditEntity = (entityId: string, newValue: string) => {
    if (!result) return;
    
    setResult({
      ...result,
      entities: result.entities.map(e => 
        e.id === entityId ? { ...e, value: newValue, validated: true } : e
      ),
    });
    setEditingEntity(null);
  };

  // Atualiza campo individual de uma entidade (assignee, deadline, etc.)
  const handleUpdateEntityField = (entityId: string, field: keyof ExtractedEntity, value: string) => {
    if (!result) return;
    
    setResult({
      ...result,
      entities: result.entities.map(e => 
        e.id === entityId ? { ...e, [field]: value } : e
      ),
    });
  };

  // Abre modal de edicao expandida para participante
  const handleOpenExpandedEdit = (entity: ExtractedEntity) => {
    if (entity.type !== "participant") return;
    
    // Busca candidatos do thesaurus para vinculacao
    const matchResult = matchSpeakerToKnownPeople(entity.value);
    setThesaurusCandidates(matchResult.candidates);
    
    // Inicializa form de pessoa externa com nome do speaker
    setExternalFormData({
      name: entity.value,
      email: "",
      organization: "",
      partnerType: "operational",
      role: "",
      notes: `Identificado na reuniao: ${result?.metadata.title || ""}`,
    });
    setExternalParticipantModalError(null);
    
    setExpandedEditEntity(entity);
  };

  // Vincula participante a um thesaurus existente
  const handleLinkToThesaurus = (entityId: string, thesaurusEntry: { id: string; name: string }) => {
    if (!result) return;
    
    setResult({
      ...result,
      entities: result.entities.map(e => 
        e.id === entityId ? { 
          ...e, 
          value: thesaurusEntry.name,
          linkedNodeId: thesaurusEntry.id,
          confidence: 1.0,
          context: `Vinculado manualmente a: ${thesaurusEntry.name}`,
          validated: true,
          sourceRef: `manual-link:${thesaurusEntry.id}`,
        } : e
      ),
    });
    setExpandedEditEntity(null);
  };

  // Cria pessoa externa a partir do form
  const handleCreateExternalParticipant = async (entityId: string) => {
    if (!result) return;
    if (!externalFormData.name.trim() || !externalFormData.organization.trim()) {
      setExternalParticipantModalError("Nome e Organização são obrigatórios.");
      return;
    }

    setCreatingExternalParticipant(true);
    setExternalParticipantModalError(null);
    try {
      const { api } = await import("@/lib/api");
      const response = await (api as any).createExternalParticipant({
        name: externalFormData.name.trim(),
        email: externalFormData.email?.trim() || undefined,
        organization: externalFormData.organization.trim(),
        partnerType: externalFormData.partnerType,
        role: externalFormData.role?.trim() || undefined,
        notes: externalFormData.notes?.trim() || undefined,
      });

      if (!response?.success || !response?.data?.id) {
        throw new Error(response?.error || "Falha ao criar participante externo");
      }

      const created = response.data;

      setExternalParticipants((prev) => [
        ...prev,
        {
          id: created.id,
          name: created.name,
          email: created.email || undefined,
          organization: created.organization,
          partnerType: created.partnerType,
          status: created.status || "active",
        },
      ]);

      setResult({
        ...result,
        entities: result.entities.map((e) =>
          e.id === entityId
            ? {
                ...e,
                value: created.name,
                linkedNodeId: created.id,
                confidence: 1.0,
                context: `Pessoa externa: ${created.organization} (${created.partnerType})`,
                validated: true,
                sourceRef: `external-participants:${created.id}`,
              }
            : e
        ),
      });

      setExpandedEditEntity(null);
    } catch (err) {
      setExternalParticipantModalError(err instanceof Error ? err.message : "Erro ao criar participante externo");
    } finally {
      setCreatingExternalParticipant(false);
    }
  };

  const handleSaveToGraph = async () => {
    if (!result) return;

    const validatedEntities = result.entities.filter(e => e.validated === true);
    
    if (validatedEntities.length === 0) {
      setError("Nenhuma entidade foi validada. Valide pelo menos uma entidade antes de salvar.");
      return;
    }

    // Filtrar apenas dados "Real" para persistência no grafo principal (spec 010)
    const realEntities = validatedEntities.filter(e => e.classification === "real");
    const transientEntities = validatedEntities.filter(e => e.classification === "transient");

    // Construir payload para API conforme specs 012 (Curation), 013 (Ingestion), 014 (Provenance)
    const ingestionPayload = {
      // Metadados da reunião (spec 013 - IngestionItem)
      ingestionItem: {
        sourceType: "meeting_transcript",
        sourceRef: result.metadata.sourceFile,
        meetingMetadata: {
          ...result.metadata,
          participantCount: validatedEntities.filter(e => e.type === "participant").length,
        },
      },
      
      // Node :Meeting a ser criado
      meetingNode: {
        title: result.metadata.title,
        date: result.metadata.date,
        duration: result.metadata.duration,
        organizer: result.metadata.organizer,
        meetingType: result.metadata.meetingType,
        confidentiality: result.metadata.confidentiality,
        recurrence: result.metadata.recurrence,
        sourceFile: result.metadata.sourceFile,
        processedAt: result.metadata.processingTimestamp,
        // Campos de resumo extraídos pelo LLM
        summary: result.summary || "",
        keyTopics: keyTopicsData.length > 0 ? keyTopicsData : (result.keyTopics || []), // string[] - metadados para recuperação
      },

      // Entidades Real para grafo principal (spec 010, 012)
      entities: realEntities.map(e => ({
        type: e.type,
        value: e.value,
        confidence: e.confidence,
        visibility: e.visibility,         // spec 009
        memoryLevel: e.memoryLevel,        // spec 010
        classification: e.classification,  // spec 010
        sourceRef: e.sourceRef,            // spec 014 - proveniência
        linkedNodeId: e.linkedNodeId,      // Vinculação com node existente
        context: e.context,
        // Campos adicionais para entidades (tasks, decisions, risks, insights)
        description: e.description || e.context || '',
        assignee: e.assignee || e.relatedPerson || '',
        relatedPerson: e.relatedPerson || '',
        deadline: e.deadline || '',
        priority: e.priority || 'medium',
        impact: e.impact || '',
        // Tipo específico para mentionedEntity (organization, tool, product, client, etc.)
        entityType: e.entityType,
      })),

      // Relacionamentos a serem criados (spec 007, 014)
      relationships: [
        // Meeting -> Project (se houver)
        ...(result.metadata.relatedProjectId ? [{
          from: "meeting",
          to: result.metadata.relatedProjectId,
          type: "RELATED_TO_PROJECT",
        }] : []),
        
        // Knowledge -> Meeting (EXTRACTED_FROM - spec 014)
        ...realEntities.map(e => ({
          from: e.id,
          to: "meeting",
          type: "EXTRACTED_FROM",
          properties: {
            confidence: e.confidence,
            sourceRef: e.sourceRef,
          },
        })),
      ],

      // Dados passageiros (apenas log, não persistir no grafo principal - spec 010)
      transientData: transientEntities.map(e => ({
        type: e.type,
        value: e.value,
        context: e.context,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
      })),

      // Curation job (spec 012)
      curationJob: {
        sourceType: "meeting_transcript",
        sourceRef: result.metadata.sourceFile,
        status: "approved", // Já validado pelo curador
        priority: result.metadata.confidentiality === "restricted" ? "high" : "medium",
        summary: `Reunião "${result.metadata.title}" - ${realEntities.length} entidades extraídas`,
      },
    };

    console.log("Payload de ingestão (conforme specs 007, 010, 012, 013, 014):", ingestionPayload);
    
    setProcessing(true);
    setError(null);
    try {
      const { api } = await import("@/lib/api");
      const response = await (api as any).ingestMeeting(ingestionPayload);
      
      if (!response?.success) {
        throw new Error(response?.error || "Falha ao ingerir reunião no grafo");
      }
      
      const { meetingId, entitiesLinked } = response.data;
      
      alert(
        `✅ Ingestão concluída!\n\n` +
        `• Meeting ID: ${meetingId}\n` +
        `• ${entitiesLinked} participantes vinculados\n` +
        `• ${realEntities.length} entidades processadas\n` +
        `• ${transientEntities.length} dados passageiros registrados\n` +
        `• Meeting node criado: "${result.metadata.title}"\n\n` +
        `A reunião foi salva no grafo e pode ser visualizada no GraphNavigator.`
      );
      
      handleReset();
    } catch (err) {
      console.error("Erro na ingestão:", err);
      setError(err instanceof Error ? err.message : "Erro ao salvar no grafo");
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setSelectedOrganizerId("");
    setSelectedProjectId("");
    // Reset novos campos
    setMeetingType("other");
    setConfidentiality("normal");
    setDefaultVisibility("corporate");
    setRecurrence("single");
    setMeetingTitle("");
    setActiveEntityTab("all");
    // Reset campos de Data/Hora
    setMeetingDate("");
    setMeetingTime("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Função para alterar visibilidade de uma entidade (spec 009)
  const handleToggleVisibility = (entityId: string) => {
    if (!result) return;
    setResult({
      ...result,
      entities: result.entities.map(e =>
        e.id === entityId
          ? { ...e, visibility: e.visibility === "corporate" ? "personal" : "corporate" }
          : e
      ),
    });
  };

  // Função para expandir/colapsar entidade para ver descrição detalhada
  const handleToggleExpand = (entityId: string) => {
    setExpandedEntities(prev => {
      const next = new Set(prev);
      if (next.has(entityId)) {
        next.delete(entityId);
      } else {
        next.add(entityId);
      }
      return next;
    });
  };

  // Função para alterar classificação Real/Passageiro (spec 010)
  const handleToggleClassification = (entityId: string) => {
    if (!result) return;
    setResult({
      ...result,
      entities: result.entities.map(e =>
        e.id === entityId
          ? { ...e, classification: e.classification === "real" ? "transient" : "real" }
          : e
      ),
    });
  };

  // Contadores por tipo de entidade
  const entityCounts = useMemo((): Partial<Record<EntityType, number>> => {
    if (!result) return {};
    return result.entities.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {} as Partial<Record<EntityType, number>>);
  }, [result]);

  // Entidades filtradas pela aba ativa
  const filteredEntities = useMemo(() => {
    if (!result) return [];
    if (activeEntityTab === "all") return result.entities;
    return result.entities.filter(e => e.type === activeEntityTab);
  }, [result, activeEntityTab]);

  const validatedCount = result?.entities.filter(e => e.validated === true).length || 0;
  const rejectedCount = result?.entities.filter(e => e.validated === false).length || 0;
  const pendingCount = result?.entities.filter(e => e.validated === null).length || 0;

  return (
    <div className="space-y-6 min-w-0 overflow-hidden">
      <div>
        <h2 className="text-xl font-semibold">Ingestão de Transcrições de Reunião</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Importe transcrições de reuniões (Teams, Zoom, etc.) para extrair conhecimento automaticamente.
        </p>
      </div>

      {/* Pre-configuration Card */}
      <Card className="p-6 overflow-hidden">
        <div className="space-y-4 min-w-0">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Configuração Prévia</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Preencha informações que você já conhece sobre a reunião. Isso melhora a precisão da extração.
          </p>

          {/* Row 1: Organizador e Tipo de Reunião */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Organizador/Responsável *
              </Label>
              <select
                value={selectedOrganizerId}
                onChange={(e) => setSelectedOrganizerId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                disabled={loadingData}
              >
                <option value="">Selecione o responsável...</option>
                {orgNodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.name} {node.department ? `(${node.department})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Tipo de Reunião
              </Label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value as MeetingType)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              >
                {Object.entries(MEETING_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Data e Hora (obrigatórios - não disponíveis no VTT) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data da Reunião *
              </Label>
              <Input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Hora de Início *
              </Label>
              <Input
                type="time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Row 3: Project and Confidentiality */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Projeto Relacionado
              </Label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                disabled={loadingData}
              >
                <option value="">Nenhum projeto específico</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.department})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shield className={cn("h-4 w-4", CONFIDENTIALITY_LEVELS[confidentiality].color)} />
                Confidencialidade
              </Label>
              <select
                value={confidentiality}
                onChange={(e) => setConfidentiality(e.target.value as ConfidentialityLevel)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              >
                {Object.entries(CONFIDENTIALITY_LEVELS).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Recorrência */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Recorrência
              </Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRecurrence("single");
                  }}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                    recurrence === "single"
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  Única
                </button>
                <button
                  type="button"
                  onClick={() => setRecurrence("recurring")}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                    recurrence === "recurring"
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  Recorrente
                </button>
              </div>
            </div>
            {/* Título da Reunião Recorrente - aparece quando Recorrente é selecionado */}
            {recurrence === "recurring" && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Título da Reunião *
                </Label>
                {existingRecurringSeries.length > 0 ? (
                  <>
                    <select
                      value={existingRecurringSeries.includes(meetingTitle) ? meetingTitle : "__NEW__"}
                      onChange={(e) => {
                        if (e.target.value !== "__NEW__") {
                          setMeetingTitle(e.target.value);
                        } else {
                          setMeetingTitle("");
                        }
                      }}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    >
                      {existingRecurringSeries.map((series) => (
                        <option key={series} value={series}>{series}</option>
                      ))}
                      <option value="__NEW__">+ Digitar novo título...</option>
                    </select>
                    {!existingRecurringSeries.includes(meetingTitle) && (
                      <Input
                        type="text"
                        value={meetingTitle}
                        onChange={(e) => setMeetingTitle(e.target.value)}
                        placeholder="Ex: Board Semanal, Daily Standup..."
                        className="w-full mt-2"
                      />
                    )}
                  </>
                ) : (
                  <Input
                    type="text"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    placeholder="Ex: Board Semanal, Daily Standup, Revisão Mensal..."
                    className="w-full"
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  Título oficial que agrupa todas as ocorrências desta reunião recorrente.
                </p>
              </div>
            )}
          </div>

          {/* Nota: Participantes serão identificados automaticamente pelo parser VTT */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Participantes e entidades serão <strong>identificados automaticamente</strong> do arquivo e validados após o processamento.</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Upload Card */}
      <Card className="p-6 overflow-hidden">
        <div className="space-y-4 min-w-0">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Upload de Transcrição</h3>
          </div>

          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".vtt,.txt,.docx,.doc"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!file ? (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Arraste um arquivo de transcrição ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatos suportados: .vtt (Teams), .txt, .docx
                  </p>
                </div>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Selecionar Arquivo
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <FileText className="h-12 w-12 mx-auto text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleProcess} disabled={processing}>
                    {processing ? "Processando..." : "Extrair Entidades"}
                  </Button>
                  <Button variant="outline" onClick={handleReset} disabled={processing}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Entidades identificadas automaticamente (conforme specs 007, 012, 013):</strong></p>
            <p>Participantes, Tarefas, Ações, Projetos, Áreas, Riscos, Decisões, Insights, Prazos, Follow-ups</p>
          </div>
        </div>
      </Card>

      {/* Extraction Results */}
      {result && (
        <>
          {/* Metadata */}
          <Card className="p-6 overflow-hidden">
            <div className="space-y-4 min-w-0">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Metadados da Reunião</h3>
              </div>

              <div className="mb-2">
                <p className="text-xs text-muted-foreground">Título</p>
                <p className="font-semibold text-base">{result.metadata.title}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="font-medium">{result.metadata.date}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duração</p>
                  <p className="font-medium">{result.metadata.duration}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Organizador</p>
                  <p className="font-medium">{result.metadata.organizer}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Tipo de Reunião
                  </p>
                  <p className="font-medium">{MEETING_TYPES[result.metadata.meetingType]}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Shield className={cn("h-3 w-3", CONFIDENTIALITY_LEVELS[result.metadata.confidentiality].color)} />
                    Confidencialidade
                  </p>
                  <p className={cn("font-medium", CONFIDENTIALITY_LEVELS[result.metadata.confidentiality].color)}>
                    {CONFIDENTIALITY_LEVELS[result.metadata.confidentiality].label}
                  </p>
                </div>
                {result.metadata.recurrence === "recurring" && (
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <GitBranch className="h-3 w-3" />
                      Recorrência
                    </p>
                    <p className="font-medium">Recorrente</p>
                  </div>
                )}
              </div>
              
              {/* Summary and Key Topics (LLM extraction) */}
              {(result.summary || (keyTopicsData.length > 0 ? keyTopicsData : result.keyTopics)?.length) && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  {result.summary && (
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <FileText className="h-3 w-3" />
                        Resumo (extraído por IA)
                      </p>
                      <p className="text-sm bg-muted/50 p-3 rounded-lg break-words overflow-hidden">{result.summary}</p>
                    </div>
                  )}
                  {((keyTopicsData.length > 0 ? keyTopicsData : result.keyTopics) || []).length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                        <Tag className="h-3 w-3" />
                        Tópicos Principais — metadados para recuperação ({(keyTopicsData.length > 0 ? keyTopicsData : result.keyTopics || []).length})
                      </p>
                      <div className="flex flex-wrap gap-2 items-center">
                        {keyTopicsData.map((topic, i) => (
                          <div key={i} className="group inline-flex items-center">
                            {editingKeyTopicIdx === i ? (
                              <Input
                                value={topic}
                                onChange={(e) => {
                                  const updated = [...keyTopicsData];
                                  updated[i] = e.target.value;
                                  setKeyTopicsData(updated);
                                }}
                                className="h-7 text-xs w-[180px]"
                                onBlur={() => {
                                  // Remover se ficou vazio
                                  if (!keyTopicsData[i]?.trim()) {
                                    setKeyTopicsData(keyTopicsData.filter((_, idx) => idx !== i));
                                  }
                                  setEditingKeyTopicIdx(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    if (!keyTopicsData[i]?.trim()) {
                                      setKeyTopicsData(keyTopicsData.filter((_, idx) => idx !== i));
                                    }
                                    setEditingKeyTopicIdx(null);
                                  }
                                  if (e.key === 'Escape') {
                                    setEditingKeyTopicIdx(null);
                                  }
                                }}
                                autoFocus
                              />
                            ) : (
                              <Badge
                                variant="secondary"
                                className="text-xs cursor-pointer transition-colors hover:bg-accent pr-1 gap-1"
                                onClick={() => setEditingKeyTopicIdx(i)}
                                title="Clique para editar"
                              >
                                {topic}
                                <button
                                  className="ml-1 opacity-40 hover:opacity-100 hover:text-red-500 transition-opacity rounded-full p-0.5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setKeyTopicsData(keyTopicsData.filter((_, idx) => idx !== i));
                                  }}
                                  title="Remover tópico"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            )}
                          </div>
                        ))}
                        {/* Adicionar novo tópico */}
                        <div className="inline-flex items-center gap-1">
                          <Input
                            value={newTopicInput}
                            onChange={(e) => setNewTopicInput(e.target.value)}
                            placeholder="+ adicionar..."
                            className="h-7 text-xs w-[120px] border-dashed"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newTopicInput.trim()) {
                                setKeyTopicsData([...keyTopicsData, newTopicInput.trim()]);
                                setNewTopicInput("");
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Provenance Info (spec 014) */}
              <div className="mt-4 pt-4 border-t border-border overflow-hidden">
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap min-w-0">
                  <Database className="h-3 w-3 shrink-0" />
                  <span className="truncate">Proveniência: {result.metadata.sourceFile}</span>
                  <span className="shrink-0">•</span>
                  <span className="shrink-0">Processado em: {new Date(result.metadata.processingTimestamp).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Validation Summary */}
          <Card className="p-6 overflow-hidden">
            <div className="space-y-4 min-w-0">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Validação de Entidades</h3>
                </div>
                <div className="flex gap-2 text-sm flex-wrap">
                  <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded whitespace-nowrap">
                    ✓ {validatedCount} validadas
                  </span>
                  <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded whitespace-nowrap">
                    ✗ {rejectedCount} rejeitadas
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 rounded whitespace-nowrap">
                    ? {pendingCount} pendentes
                  </span>
                </div>
              </div>

              {/* Resumo: Auto-matched vs Pendentes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span><strong>{result.entities.filter(e => e.sourceRef?.startsWith('auto-match')).length}</strong> colaboradores auto-identificados</span>
                  </p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span><strong>{pendingCount}</strong> entidades aguardando validacao</span>
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Colaboradores conhecidos foram validados automaticamente. Revise projetos, pessoas externas, tarefas e riscos abaixo.
                Use <strong>Confirmar</strong> ou <strong>Retirar</strong> para cada entidade.
              </p>

              {/* Entity Type Tabs */}
              <div className="flex flex-wrap gap-2 pb-2 border-b border-border">
                <button
                  type="button"
                  onClick={() => setActiveEntityTab("all")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
                    activeEntityTab === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  Todas ({result.entities.length})
                </button>
                {(Object.entries(ENTITY_CONFIG) as [EntityType, typeof ENTITY_CONFIG[EntityType]][]).map(([type, config]) => {
                  const count = entityCounts[type] || 0;
                  if (count === 0) return null;
                  const Icon = config.icon;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setActiveEntityTab(type)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1",
                        activeEntityTab === type
                          ? config.color
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {config.label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Entity List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto overflow-x-hidden">
                {filteredEntities.map((entity) => {
                  const config = ENTITY_CONFIG[entity.type];
                  const Icon = config.icon;
                  return (
                    <div
                      key={entity.id}
                      className={cn(
                        "p-3 rounded-lg border transition-colors overflow-hidden",
                        entity.validated === true && "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
                        entity.validated === false && "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800 opacity-60",
                        entity.validated === null && "bg-muted/30 border-border"
                      )}
                    >
                      {/* Row 1: Type badge, value, confidence, validation buttons */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={cn("px-2 py-1 rounded text-xs flex items-center gap-1", config.color)}>
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </span>
                        
                        <div className="flex-1 min-w-0">
                          {editingEntity === entity.id ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 px-2 py-1 border rounded text-sm bg-background"
                                autoFocus
                              />
                              <Button size="sm" variant="ghost" onClick={() => handleEditEntity(entity.id, editValue)}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingEntity(null)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <p className="font-medium truncate">{entity.value}</p>
                          )}
                        </div>

                        {/* Confidence badge */}
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded shrink-0",
                          entity.confidence >= 0.9 ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400" :
                          entity.confidence >= 0.75 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400" :
                          "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
                        )}>
                          {Math.round(entity.confidence * 100)}%
                        </span>
                        
                        {/* Graph link indicator for participants and mentionedEntities */}
                        {(entity.type === "participant" || entity.type === "mentionedEntity") && !entity.suggestedMatch && (
                          <span
                            className={cn(
                              "text-xs px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1",
                              entity.linkedNodeId 
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                                : "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400"
                            )} 
                            title={entity.linkedNodeId ? "Vinculado ao grafo" : "Não vinculado - será criado novo node"}
                          >
                            <Link2 className="h-3 w-3" />
                            {entity.linkedNodeId ? "Vinculado" : "Novo"}
                          </span>
                        )}

                        {/* Suggested match - 1-click accept for curator */}
                        {entity.suggestedMatch && !entity.linkedNodeId && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleAcceptSuggestedMatch(entity.id)}
                              className="text-xs px-2 py-0.5 rounded flex items-center gap-1 bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-900/70 transition-colors border border-sky-300 dark:border-sky-700"
                              title={`Vincular a "${entity.suggestedMatch.nodeName}" (${entity.suggestedMatch.nodeLabel}) — ${Math.round(entity.suggestedMatch.score * 100)}% confiança`}
                            >
                              <Link2 className="h-3 w-3" />
                              <span className="max-w-[180px] truncate">→ {entity.suggestedMatch.nodeName}</span>
                              <span className="opacity-70">{Math.round(entity.suggestedMatch.score * 100)}%</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectSuggestedMatch(entity.id)}
                              className="text-xs px-1 py-0.5 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                              title="Ignorar sugestão — manter como nova entidade"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}

                        {entity.validated === null ? (
                          <div className="flex items-center gap-1 shrink-0">
                            {entity.type === "participant" && !entity.linkedNodeId && (
                              <Button size="sm" variant="ghost" onClick={() => handleOpenExpandedEdit(entity)} title="Vincular ou criar pessoa externa">
                                <Users className="h-4 w-4 text-blue-600" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => entity.type === "participant" ? handleOpenExpandedEdit(entity) : setEditingEntity(entity.id)} title={entity.type === "participant" ? "Editar detalhes / Vincular" : "Editar nome"}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleValidateEntity(entity.id, true)} title="Confirmar">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleValidateEntity(entity.id, false)} title="Retirar">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => handleValidateEntity(entity.id, !entity.validated)} title="Alterar validação">
                            {entity.validated ? <X className="h-4 w-4 text-red-600" /> : <Check className="h-4 w-4 text-green-600" />}
                          </Button>
                        )}
                      </div>

                      {/* Row 2: Context, Responsável (para ações), Tipo (para entidades) */}
                      <div className="mt-2 flex items-center gap-2 text-xs flex-wrap min-w-0">
                        {/* Expand button for entities with description */}
                        {entity.description && (
                          <button
                            type="button"
                            onClick={() => handleToggleExpand(entity.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            title={expandedEntities.has(entity.id) ? "Colapsar" : "Ver detalhamento"}
                          >
                            {expandedEntities.has(entity.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        )}

                        {/* Responsável inline removido - mantido apenas na seção expandida */}

                        {/* Tipo de entidade editável para mentionedEntity */}
                        {entity.type === "mentionedEntity" && (
                          <div className="flex items-center gap-1 shrink-0">
                            <select
                              value={entity.entityType || "organization"}
                              onChange={(e) => {
                                const newType = e.target.value as any;
                                handleUpdateEntityField(entity.id, "entityType", newType);
                                // Se selecionou pessoa externa, abrir form de participante externo
                                if (newType === "person_external") {
                                  // Inicializar dados do form com o nome da entidade
                                  setExternalFormData({
                                    name: entity.value,
                                    role: "",
                                    organization: "",
                                    email: "",
                                    notes: "",
                                  });
                                  setExpandedEditEntity(entity);
                                }
                              }}
                              className="px-2 py-0.5 text-xs border rounded bg-background"
                              title="Tipo de entidade"
                            >
                              <option value="organization">Organização</option>
                              <option value="tool">Ferramenta</option>
                              <option value="product">Produto</option>
                              <option value="client">Cliente</option>
                              <option value="person_external">Pessoa Externa</option>
                              <option value="concept">Conceito</option>
                            </select>
                          </div>
                        )}
                        
                        {/* Context text: exibir apenas para participant e mentionedEntity */}
                        {(entity.type === "participant" || entity.type === "mentionedEntity") && entity.context && (
                          <p className="text-muted-foreground flex-1 min-w-0 truncate basis-full sm:basis-auto break-all">{entity.context}</p>
                        )}
                        
                        {/* Priority badge */}
                        {entity.priority && (
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-xs font-medium shrink-0",
                            entity.priority === "high" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                            entity.priority === "medium" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                            entity.priority === "low" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          )}>
                            {entity.priority === "high" ? "Alta" : entity.priority === "medium" ? "Média" : "Baixa"}
                          </span>
                        )}
                        
                        {/* Classification toggle (spec 010) */}
                        <button
                          type="button"
                          onClick={() => handleToggleClassification(entity.id)}
                          className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium transition-colors",
                            entity.classification === "real"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                          )}
                          title={entity.classification === "real" ? "Dado Real (permanente)" : "Dado Passageiro (temporário)"}
                        >
                          {entity.classification === "real" ? "Real" : "Passageiro"}
                        </button>

                        {/* Visibility toggle (spec 009) */}
                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(entity.id)}
                          className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium transition-colors flex items-center gap-1",
                            entity.visibility === "corporate"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          )}
                          title={entity.visibility === "corporate" ? "Visível para organização" : "Visível apenas para você"}
                        >
                          {entity.visibility === "corporate" ? <Building2 className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                          {entity.visibility === "corporate" ? "Corp" : "Pessoal"}
                        </button>

                        {/* Memory level indicator */}
                        <span className="text-muted-foreground" title={`Nível de memória: ${entity.memoryLevel}`}>
                          {entity.memoryLevel === "long" ? "🔒" : entity.memoryLevel === "medium" ? "⏳" : "💨"}
                        </span>

                        {/* Source reference (provenance) */}
                        {entity.sourceRef && (
                          <span className="text-muted-foreground" title={`Fonte: ${entity.sourceRef}`}>
                            <Database className="h-3 w-3 inline" />
                          </span>
                        )}
                      </div>

                      {/* Row 3: Expanded description (LLM enrichment) */}
                      {expandedEntities.has(entity.id) && entity.description && (
                        <div className="mt-3 pt-3 border-t border-dashed border-border/50 space-y-2">
                          <div className="bg-muted/30 p-3 rounded-lg">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Descrição Detalhada</p>
                            <textarea
                              value={entity.description || ""}
                              onChange={(e) => handleUpdateEntityField(entity.id, "description", e.target.value)}
                              className="text-sm leading-relaxed w-full bg-transparent border border-border/50 rounded p-2 focus:ring-1 focus:ring-primary focus:border-primary resize-y min-h-[60px]"
                              rows={3}
                            />
                          </div>
                          
                          {/* Related info grid */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                            {/* Responsável - combo para task/decision/risk/insight */}
                            {["task", "decision", "risk", "insight"].includes(entity.type) && (
                              <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded">
                                <p className="text-muted-foreground mb-1">Responsável</p>
                                <select
                                  value={(() => {
                                    const val = entity.type === "task" ? entity.assignee : entity.relatedPerson;
                                    return val && orgNodes.some((n) => n.name === val) ? val : "";
                                  })()}
                                  onChange={(e) => {
                                    const field = entity.type === "task" ? "assignee" : "relatedPerson";
                                    handleUpdateEntityField(entity.id, field, e.target.value);
                                  }}
                                  className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-gray-900"
                                >
                                  <option value="">Selecionar...</option>
                                  {orgNodes.map((n) => (
                                    <option key={n.id} value={n.name}>
                                      {n.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {/* Prazo - editável para Tarefa */}
                            {entity.type === "task" && (
                              <div className="bg-orange-50 dark:bg-orange-950/30 p-2 rounded">
                                <p className="text-muted-foreground mb-1">Prazo</p>
                                <input
                                  type="date"
                                  value={entity.deadline || ""}
                                  onChange={(e) => handleUpdateEntityField(entity.id, "deadline", e.target.value)}
                                  className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-gray-900"
                                />
                              </div>
                            )}
                            {/* Impacto */}
                            {entity.impact && (
                              <div className="bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
                                <p className="text-muted-foreground">Impacto</p>
                                <p className="font-medium">{entity.impact}</p>
                              </div>
                            )}
                            {/* Prioridade */}
                            {entity.priority && (
                              <div className={cn(
                                "p-2 rounded",
                                entity.priority === "high" && "bg-red-50 dark:bg-red-950/30",
                                entity.priority === "medium" && "bg-amber-50 dark:bg-amber-950/30",
                                entity.priority === "low" && "bg-green-50 dark:bg-green-950/30"
                              )}>
                                <p className="text-muted-foreground">Prioridade</p>
                                <select
                                  value={entity.priority || "medium"}
                                  onChange={(e) => handleUpdateEntityField(entity.id, "priority", e.target.value)}
                                  className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-gray-900"
                                >
                                  <option value="high">🔴 Alta</option>
                                  <option value="medium">🟡 Média</option>
                                  <option value="low">🟢 Baixa</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={handleReset}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveToGraph}
                  disabled={validatedCount === 0}
                  title={validatedCount === 0 ? "Valide pelo menos uma entidade para salvar" : `Salvar ${validatedCount} de ${result.entities.length} entidades validadas`}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar {validatedCount} de {result.entities.length} Entidades
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}
      {/* Modal de Edicao Expandida para Participantes */}
      {expandedEditEntity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Vincular Participante</h3>
              <Button size="sm" variant="ghost" onClick={() => setExpandedEditEntity(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {externalParticipantModalError && (
                <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">
                  {externalParticipantModalError}
                </div>
              )}
              {/* Nome identificado */}
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Nome identificado no VTT:</p>
                <p className="font-medium">{expandedEditEntity.value}</p>
              </div>

              {/* Opcao 1: Vincular a thesaurus existente */}
              {thesaurusCandidates.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Vincular a colaborador existente:</Label>
                  <div className="space-y-1 max-h-40 overflow-y-auto border rounded-lg p-2">
                    {thesaurusCandidates.map((candidate) => (
                      <button
                        key={candidate.id}
                        type="button"
                        onClick={() => handleLinkToThesaurus(expandedEditEntity.id, candidate)}
                        className="w-full flex items-center justify-between p-2 hover:bg-muted rounded-lg transition-colors text-left"
                      >
                        <div>
                          <p className="font-medium text-sm">{candidate.name}</p>
                          {candidate.context && (
                            <p className="text-xs text-muted-foreground">{candidate.context}</p>
                          )}
                        </div>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded",
                          candidate.confidence >= 0.9 ? "bg-green-100 text-green-700" :
                          candidate.confidence >= 0.7 ? "bg-amber-100 text-amber-700" :
                          "bg-gray-100 text-gray-700"
                        )}>
                          {Math.round(candidate.confidence * 100)}%
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Separador */}
              <div className="flex items-center gap-2 py-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">ou</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Opcao 2: Criar como pessoa externa - Layout igual ExternalParticipantsManager */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Criar como pessoa externa:</Label>
                
                {/* Row 1: Nome | Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ext-name" className="text-sm font-medium">Nome *</Label>
                    <Input
                      id="ext-name"
                      value={externalFormData.name}
                      onChange={(e) => setExternalFormData({ ...externalFormData, name: e.target.value })}
                      placeholder="Nome completo"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ext-email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="ext-email"
                      type="email"
                      value={externalFormData.email}
                      onChange={(e) => setExternalFormData({ ...externalFormData, email: e.target.value })}
                      placeholder="email@empresa.com"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Row 2: Organizacao | Cargo */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ext-org" className="text-sm font-medium">Organização *</Label>
                    <Input
                      id="ext-org"
                      list="partner-organizations"
                      value={externalFormData.organization}
                      onChange={(e) => setExternalFormData({ ...externalFormData, organization: e.target.value })}
                      placeholder="Selecione ou digite nova..."
                      className="mt-1"
                    />
                    <datalist id="partner-organizations">
                      {partnerOrganizations.map((org) => (
                        <option key={org.name} value={org.name}>
                          {org.name} ({org.participantCount} participantes)
                        </option>
                      ))}
                    </datalist>
                    {partnerOrganizations.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {partnerOrganizations.length} organizações parceiras cadastradas
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="ext-role" className="text-sm font-medium">Cargo</Label>
                    <Input
                      id="ext-role"
                      value={externalFormData.role}
                      onChange={(e) => setExternalFormData({ ...externalFormData, role: e.target.value })}
                      placeholder="Ex: Diretor, Gerente..."
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Tipo de Parceria - Botoes visuais */}
                <div>
                  <Label className="text-sm font-medium">Tipo de Parceria *</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setExternalFormData({ ...externalFormData, partnerType: "strategic" })}
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors",
                        externalFormData.partnerType === "strategic"
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "border-border hover:border-blue-300 hover:bg-muted"
                      )}
                    >
                      <Target className="h-5 w-5" />
                      <span className="text-sm font-medium">Estratégico</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setExternalFormData({ ...externalFormData, partnerType: "operational" })}
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors",
                        externalFormData.partnerType === "operational"
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "border-border hover:border-blue-300 hover:bg-muted"
                      )}
                    >
                      <Building2 className="h-5 w-5" />
                      <span className="text-sm font-medium">Operacional</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setExternalFormData({ ...externalFormData, partnerType: "tactical" })}
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors",
                        externalFormData.partnerType === "tactical"
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "border-border hover:border-blue-300 hover:bg-muted"
                      )}
                    >
                      <ListTodo className="h-5 w-5" />
                      <span className="text-sm font-medium">Tático</span>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {externalFormData.partnerType === "strategic" && "Parceiros de longo prazo e alto impacto"}
                    {externalFormData.partnerType === "operational" && "Parceiros do dia-a-dia operacional"}
                    {externalFormData.partnerType === "tactical" && "Parceiros para projetos específicos"}
                  </p>
                </div>

                {/* Observacoes */}
                <div>
                  <Label htmlFor="ext-notes" className="text-sm font-medium">Observações</Label>
                  <textarea
                    id="ext-notes"
                    value={externalFormData.notes}
                    onChange={(e) => setExternalFormData({ ...externalFormData, notes: e.target.value })}
                    placeholder="Informações adicionais sobre o participante..."
                    className="mt-1 w-full px-3 py-2 border rounded-md text-sm bg-background min-h-[80px] resize-none"
                  />
                </div>

                {/* Botoes de acao */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setExpandedEditEntity(null)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => handleCreateExternalParticipant(expandedEditEntity.id)}
                    disabled={creatingExternalParticipant || !externalFormData.name || !externalFormData.organization}
                  >
                    {creatingExternalParticipant ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      "Criar Participante"
                    )}
                  </Button>
                </div>
              </div>

            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
