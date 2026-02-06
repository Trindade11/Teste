"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  FolderKanban,
  Plus,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronRight,
  Calendar,
  Save,
  X,
  Link2,
  Users,
  Target,
  Brain,
  Tag,
  AlertCircle,
  DollarSign,
  Milestone,
  History,
  Loader2,
  RefreshCw,
  UserPlus,
  Search,
  Building2,
  Check,
} from "lucide-react";

interface ExternalParticipant {
  id: string;
  name: string;
  email?: string;
  organization: string;
  partnerType: 'strategic' | 'operational' | 'tactical';
  status: 'active' | 'inactive';
}

interface OrgChartNode {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  department: string;
}

interface OKR {
  id: string;
  title: string;
  objectiveId: string;
  objectiveTitle: string;
  status?: string;
  targetValue?: number;
  currentValue?: number;
}

interface TeamMember {
  userId: string;
  role: 'owner' | 'lead' | 'member' | 'stakeholder';
  addedAt: string;
}

interface MilestoneItem {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  completedAt?: string;
}

interface Budget {
  planned: number;
  spent: number;
  currency: string;
  lastUpdated: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: "draft" | "active" | "paused" | "completed" | "archived";
  phase: "initiation" | "planning" | "execution" | "monitoring" | "closing";
  priority: "low" | "medium" | "high" | "critical";
  ownerId: string;
  department: string;
  linkedOkrIds: string[];
  teamMembers: TeamMember[];
  externalParticipantIds?: string[];
  milestones: MilestoneItem[];
  budget: Budget | null;
  startDate: string;
  targetEndDate: string;
  visibility: "corporate" | "personal";
  memoryClass: "semantic" | "episodic" | "procedural" | "evaluative";
  tags: string[];
  notes: string;
  version: number;
  previousVersionId?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS = [
  { value: "draft", label: "Rascunho", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  { value: "active", label: "Ativo", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  { value: "paused", label: "Pausado", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  { value: "completed", label: "Concluído", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "archived", label: "Arquivado", color: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500" },
];

const PHASE_OPTIONS = [
  { value: "initiation", label: "Iniciação" },
  { value: "planning", label: "Planejamento" },
  { value: "execution", label: "Execução" },
  { value: "monitoring", label: "Monitoramento" },
  { value: "closing", label: "Encerramento" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Baixa", color: "bg-gray-100 text-gray-600" },
  { value: "medium", label: "Média", color: "bg-blue-100 text-blue-600" },
  { value: "high", label: "Alta", color: "bg-orange-100 text-orange-600" },
  { value: "critical", label: "Crítica", color: "bg-red-100 text-red-600" },
];

const MEMORY_CLASS_OPTIONS = [
  { value: "semantic", label: "Semântica", description: "Ontologia & Conceitos" },
  { value: "episodic", label: "Episódica", description: "Eventos & Timeline" },
  { value: "procedural", label: "Procedural", description: "Playbooks & Processos" },
  { value: "evaluative", label: "Avaliativa", description: "Lições & Insights" },
];

const TEAM_ROLE_OPTIONS = [
  { value: "owner", label: "Dono" },
  { value: "lead", label: "Líder" },
  { value: "member", label: "Membro" },
  { value: "stakeholder", label: "Stakeholder" },
];

const MILESTONE_STATUS_OPTIONS = [
  { value: "pending", label: "Pendente" },
  { value: "in_progress", label: "Em Andamento" },
  { value: "completed", label: "Concluído" },
  { value: "delayed", label: "Atrasado" },
];

export function ProjectIngestion() {
  const [orgNodes, setOrgNodes] = useState<OrgChartNode[]>([]);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgError, setOrgError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const [availableOkrs, setAvailableOkrs] = useState<OKR[]>([]);
  const [okrsLoading, setOkrsLoading] = useState(false);

  // Estados para gestão de participantes
  const [externalParticipants, setExternalParticipants] = useState<ExternalParticipant[]>([]);
  const [externalLoading, setExternalLoading] = useState(false);
  
  // Participantes selecionados
  const [selectedInternalParticipants, setSelectedInternalParticipants] = useState<string[]>([]);
  const [selectedExternalParticipants, setSelectedExternalParticipants] = useState<string[]>([]);
  
  // Buscas e dropdowns
  const [internalSearch, setInternalSearch] = useState("");
  const [externalSearch, setExternalSearch] = useState("");
  const [showInternalDropdown, setShowInternalDropdown] = useState(false);
  const [showExternalDropdown, setShowExternalDropdown] = useState(false);

  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [saving, setSaving] = useState(false);

  interface ProjectDraft {
    name: string;
    description: string;
    status: Project["status"];
    phase: Project["phase"];
    priority: Project["priority"];
    ownerId: string;
    department: string;
    linkedOkrIds: string[];
    teamMembers: TeamMember[];
    milestones: MilestoneItem[];
    budget: Budget | null;
    startDate: string;
    targetEndDate: string;
    visibility: Project["visibility"];
    memoryClass: Project["memoryClass"];
    tags: string[];
    tagInput: string;
    notes: string;
    // Temp inputs for adding team members/milestones
    newTeamMemberId: string;
    newTeamMemberRole: TeamMember["role"];
    newMilestoneTitle: string;
    newMilestoneDate: string;
  }

  const emptyDraft: ProjectDraft = {
    name: "",
    description: "",
    status: "draft",
    phase: "initiation",
    priority: "medium",
    ownerId: "",
    department: "",
    linkedOkrIds: [],
    teamMembers: [],
    milestones: [],
    budget: null,
    startDate: "",
    targetEndDate: "",
    visibility: "corporate",
    memoryClass: "procedural",
    tags: [],
    tagInput: "",
    notes: "",
    newTeamMemberId: "",
    newTeamMemberRole: "member",
    newMilestoneTitle: "",
    newMilestoneDate: "",
  };

  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(emptyDraft);

  const loadData = async () => {
    const { api } = await import("@/lib/api");

    // Load org chart
    setOrgLoading(true);
    setOrgError(null);
    try {
      const orgResponse = await api.getOrgChartNodes();
      if (orgResponse?.success && Array.isArray(orgResponse.data)) {
        setOrgNodes(orgResponse.data);
      } else {
        setOrgError(orgResponse?.error || "Falha ao carregar organograma");
      }
    } catch (error) {
      setOrgError(error instanceof Error ? error.message : "Falha ao carregar organograma");
    } finally {
      setOrgLoading(false);
    }

    // Load projects from Neo4j
    setProjectsLoading(true);
    setProjectsError(null);
    try {
      const projectsResponse = await api.getProjects();
      if (projectsResponse?.success && Array.isArray(projectsResponse.data)) {
        setProjects(projectsResponse.data);
      } else {
        setProjectsError(projectsResponse?.error || "Falha ao carregar projetos");
      }
    } catch (error) {
      setProjectsError(error instanceof Error ? error.message : "Falha ao carregar projetos");
    } finally {
      setProjectsLoading(false);
    }

    // Load OKRs from Neo4j
    setOkrsLoading(true);
    try {
      const okrsResponse = await api.getOkrsList();
      if (okrsResponse?.success && Array.isArray(okrsResponse.data)) {
        setAvailableOkrs(okrsResponse.data);
      }
    } catch (error) {
      console.error("Falha ao carregar OKRs:", error);
    } finally {
      setOkrsLoading(false);
    }

    // Load external participants
    setExternalLoading(true);
    try {
      const externalResponse = await (api as any).getExternalParticipants({ status: 'active' });
      if (externalResponse?.success && Array.isArray(externalResponse.data)) {
        setExternalParticipants(externalResponse.data);
      }
    } catch (error) {
      console.error("Falha ao carregar participantes externos:", error);
    } finally {
      setExternalLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadOrg = async () => {
      if (cancelled) return;
      await loadData();
    };

    void loadOrg();
    return () => {
      cancelled = true;
    };
  }, []);

  // Placeholder effect - removed old org-only loading
  useEffect(() => {
    // Data loading moved to loadData function
  }, []);

  const refreshData = () => {
    void loadData();
  };

  // Legacy effect stub to avoid breaking
  useEffect(() => {
    let cancelled = false;

    const loadOrgLegacy = async () => {
      // Moved to loadData
      if (cancelled) return;
    };

    void loadOrgLegacy();
    return () => {
      cancelled = true;
    };
  }, []);


  const userOptions = useMemo(() => {
    return [...orgNodes].sort((a, b) => a.name.localeCompare(b.name));
  }, [orgNodes]);

  const departmentOptions = useMemo(() => {
    return Array.from(new Set(orgNodes.map((n) => n.department).filter(Boolean))).sort();
  }, [orgNodes]);

  const userById = useMemo(() => {
    return new Map(orgNodes.map((n) => [n.id, n] as const));
  }, [orgNodes]);

  const getUserName = (userId: string) => {
    if (!userId) return "—";
    return userById.get(userId)?.name || userId;
  };

  const getUserEmail = (userId: string) => {
    if (!userId) return "";
    return userById.get(userId)?.email || "";
  };

  const getStatusInfo = (status: string) => {
    return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
  };

  const getPhaseLabel = (phase: string) => {
    return PHASE_OPTIONS.find((p) => p.value === phase)?.label || phase;
  };

  const getPriorityInfo = (priority: string) => {
    return PRIORITY_OPTIONS.find((p) => p.value === priority) || PRIORITY_OPTIONS[1];
  };

  const getMemoryClassInfo = (memoryClass: string) => {
    return MEMORY_CLASS_OPTIONS.find((m) => m.value === memoryClass) || MEMORY_CLASS_OPTIONS[0];
  };

  // Filtros para participantes
  const filteredInternalParticipants = useMemo(() => {
    if (!internalSearch.trim()) return orgNodes.slice(0, 10);
    const search = internalSearch.toLowerCase();
    return orgNodes
      .filter(n => 
        n.name.toLowerCase().includes(search) ||
        n.email.toLowerCase().includes(search) ||
        n.department.toLowerCase().includes(search)
      )
      .slice(0, 10);
  }, [orgNodes, internalSearch]);

  const filteredExternalParticipants = useMemo(() => {
    if (!externalSearch.trim()) return externalParticipants.slice(0, 10);
    const search = externalSearch.toLowerCase();
    return externalParticipants
      .filter(p => 
        p.name.toLowerCase().includes(search) ||
        p.organization.toLowerCase().includes(search) ||
        (p.email && p.email.toLowerCase().includes(search))
      )
      .slice(0, 10);
  }, [externalParticipants, externalSearch]);

  const toggleInternalParticipant = (userId: string) => {
    setSelectedInternalParticipants(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleExternalParticipant = (participantId: string) => {
    setSelectedExternalParticipants(prev =>
      prev.includes(participantId)
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  const getInternalParticipantName = (userId: string) => {
    return orgNodes.find(n => n.id === userId)?.name || userId;
  };

  const getExternalParticipantDisplay = (participantId: string) => {
    const p = externalParticipants.find(ep => ep.id === participantId);
    return p ? `${p.name} (${p.organization})` : participantId;
  };

  const toggleExpand = (id: string) => {
    setExpandedProject(expandedProject === id ? null : id);
  };

  const resetDraft = () => {
    setProjectDraft(emptyDraft);
    setSelectedInternalParticipants([]);
    setSelectedExternalParticipants([]);
    setInternalSearch("");
    setExternalSearch("");
  };

  const startNewProject = () => {
    resetDraft();
    setShowNewProject(true);
    setEditingProject(null);
  };

  const startEditProject = (project: Project) => {
    setEditingProject(project.id);
    setShowNewProject(false);
    
    // Converter teamMembers em participantes selecionados
    const internalIds = (project.teamMembers || [])
      .filter(tm => orgNodes.some(n => n.id === tm.userId))
      .map(tm => tm.userId);
    
    setSelectedInternalParticipants(internalIds);
    // Carregar participantes externos do projeto
    setSelectedExternalParticipants(project.externalParticipantIds || []);
    
    setProjectDraft({
      name: project.name,
      description: project.description,
      status: project.status,
      phase: project.phase,
      priority: project.priority,
      ownerId: project.ownerId,
      department: project.department,
      linkedOkrIds: [...(project.linkedOkrIds || [])],
      teamMembers: [...(project.teamMembers || [])],
      milestones: [...(project.milestones || [])],
      budget: project.budget,
      startDate: project.startDate,
      targetEndDate: project.targetEndDate,
      visibility: project.visibility,
      memoryClass: project.memoryClass,
      tags: [...(project.tags || [])],
      tagInput: "",
      notes: project.notes,
      newTeamMemberId: "",
      newTeamMemberRole: "member",
      newMilestoneTitle: "",
      newMilestoneDate: "",
    });
  };

  const cancelEdit = () => {
    setEditingProject(null);
    setShowNewProject(false);
    resetDraft();
  };

  const addTag = () => {
    const tag = projectDraft.tagInput.trim().toLowerCase();
    if (tag && !projectDraft.tags.includes(tag)) {
      setProjectDraft({ ...projectDraft, tags: [...projectDraft.tags, tag], tagInput: "" });
    }
  };

  const removeTag = (tag: string) => {
    setProjectDraft({ ...projectDraft, tags: projectDraft.tags.filter((t) => t !== tag) });
  };

  const toggleOkrLink = (okrId: string) => {
    if (projectDraft.linkedOkrIds.includes(okrId)) {
      setProjectDraft({ ...projectDraft, linkedOkrIds: projectDraft.linkedOkrIds.filter((id) => id !== okrId) });
    } else {
      setProjectDraft({ ...projectDraft, linkedOkrIds: [...projectDraft.linkedOkrIds, okrId] });
    }
  };

  const saveProject = async () => {
    if (!projectDraft.name.trim()) return;
    if (!projectDraft.department.trim()) return;

    setSaving(true);

    try {
      const { api } = await import("@/lib/api");

      // Preparar teamMembers a partir dos participantes selecionados
      const now = new Date().toISOString();
      const internalTeamMembers: TeamMember[] = selectedInternalParticipants.map(userId => ({
        userId,
        role: 'member' as const,
        addedAt: now,
      }));
      
      const projectData = {
        name: projectDraft.name,
        description: projectDraft.description,
        status: projectDraft.status,
        phase: projectDraft.phase,
        priority: projectDraft.priority,
        ownerId: projectDraft.ownerId,
        department: projectDraft.department,
        linkedOkrIds: projectDraft.linkedOkrIds,
        teamMembers: internalTeamMembers,
        milestones: projectDraft.milestones,
        budget: projectDraft.budget,
        startDate: projectDraft.startDate,
        targetEndDate: projectDraft.targetEndDate,
        visibility: projectDraft.visibility,
        memoryClass: projectDraft.memoryClass,
        tags: projectDraft.tags,
        notes: projectDraft.notes,
        // Participantes externos como metadado adicional
        externalParticipantIds: selectedExternalParticipants,
      };

      if (editingProject) {
        const response = await api.updateProject(editingProject, projectData);
        if (response.success && response.data) {
          setProjects((prev) =>
            prev.map((p) =>
              p.id === editingProject
                ? {
                    ...p,
                    ...response.data,
                    tags: Array.isArray(response.data.tags) ? response.data.tags : JSON.parse(response.data.tags || '[]'),
                    teamMembers: Array.isArray(response.data.teamMembers) ? response.data.teamMembers : [],
                    externalParticipantIds: response.data.externalParticipantIds || [],
                  }
                : p
            )
          );
        } else {
          console.error("Falha ao atualizar projeto:", response.error);
          alert(`Erro ao salvar projeto: ${response.error}`);
          return;
        }
      } else {
        const response = await api.createProject(projectData);
        if (response.success && response.data) {
          const newProject: Project = {
            ...response.data,
            tags: Array.isArray(response.data.tags) ? response.data.tags : JSON.parse(response.data.tags || '[]'),
            teamMembers: Array.isArray(response.data.teamMembers) ? response.data.teamMembers : JSON.parse(response.data.teamMembers || '[]'),
            milestones: Array.isArray(response.data.milestones) ? response.data.milestones : JSON.parse(response.data.milestones || '[]'),
            budget: response.data.budget ? (typeof response.data.budget === 'string' ? JSON.parse(response.data.budget) : response.data.budget) : null,
            externalParticipantIds: response.data.externalParticipantIds || [],
          };
          setProjects([newProject, ...projects]);
        } else {
          console.error("Falha ao criar projeto:", response.error);
          alert(`Erro ao criar projeto: ${response.error}`);
          return;
        }
      }

      cancelEdit();
    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
      alert(`Erro ao salvar projeto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este projeto permanentemente? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      const { api } = await import("@/lib/api");
      const response = await api.deleteProject(id);

      if (response.success) {
        setProjects(projects.filter((p) => p.id !== id));
        if (editingProject === id) {
          cancelEdit();
        }
      } else {
        console.error("Falha ao excluir projeto:", response.error);
        alert(`Erro ao excluir projeto: ${response.error}`);
      }
    } catch (error) {
      console.error("Erro ao excluir projeto:", error);
      alert(`Erro ao excluir projeto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const renderProjectForm = () => (
    <Card className="p-6 border-2 border-primary/20 bg-primary/5">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {editingProject ? "Editar Projeto" : "Novo Projeto"}
          </h3>
          <Button variant="ghost" size="sm" onClick={cancelEdit}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do Projeto *</Label>
            <Input
              value={projectDraft.name}
              onChange={(e) => setProjectDraft({ ...projectDraft, name: e.target.value })}
              placeholder="Ex: Implementação Sistema EKS"
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <textarea
              value={projectDraft.description}
              onChange={(e) => setProjectDraft({ ...projectDraft, description: e.target.value })}
              placeholder="Descreva o projeto, seus objetivos e escopo..."
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm min-h-[80px] resize-y"
            />
          </div>
        </div>

        {/* Owner & Department */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Responsável</Label>
            <select
              value={projectDraft.ownerId}
              onChange={(e) => setProjectDraft({ ...projectDraft, ownerId: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              disabled={orgLoading}
            >
              <option value="">Selecionar responsável</option>
              {userOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.department})
                </option>
              ))}
            </select>
            {!!projectDraft.ownerId && (
              <p className="text-xs text-muted-foreground">{getUserEmail(projectDraft.ownerId)}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Área/Departamento *</Label>
            <select
              value={projectDraft.department}
              onChange={(e) => setProjectDraft({ ...projectDraft, department: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              disabled={orgLoading}
            >
              <option value="">Selecionar área</option>
              {departmentOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status, Phase, Priority */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              value={projectDraft.status}
              onChange={(e) => setProjectDraft({ ...projectDraft, status: e.target.value as Project["status"] })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Fase</Label>
            <select
              value={projectDraft.phase}
              onChange={(e) => setProjectDraft({ ...projectDraft, phase: e.target.value as Project["phase"] })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            >
              {PHASE_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <select
              value={projectDraft.priority}
              onChange={(e) => setProjectDraft({ ...projectDraft, priority: e.target.value as Project["priority"] })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Data de Início</Label>
            <Input
              type="date"
              value={projectDraft.startDate}
              onChange={(e) => setProjectDraft({ ...projectDraft, startDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Data Alvo de Conclusão</Label>
            <Input
              type="date"
              value={projectDraft.targetEndDate}
              onChange={(e) => setProjectDraft({ ...projectDraft, targetEndDate: e.target.value })}
            />
          </div>
        </div>

        {/* Memory Class & Visibility */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Classe de Memória
            </Label>
            <select
              value={projectDraft.memoryClass}
              onChange={(e) => setProjectDraft({ ...projectDraft, memoryClass: e.target.value as Project["memoryClass"] })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            >
              {MEMORY_CLASS_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label} - {m.description}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Define como o conhecimento deste projeto será classificado no grafo
            </p>
          </div>
          <div className="space-y-2">
            <Label>Visibilidade</Label>
            <select
              value={projectDraft.visibility}
              onChange={(e) => setProjectDraft({ ...projectDraft, visibility: e.target.value as Project["visibility"] })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            >
              <option value="corporate">Corporativo (visível para todos)</option>
              <option value="personal">Pessoal (restrito ao responsável)</option>
            </select>
          </div>
        </div>

        {/* OKR Linking */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Vincular a OKRs (Business Intent Graph)
          </Label>
          <p className="text-xs text-muted-foreground">
            Conecte este projeto aos OKRs estratégicos para alinhar com os objetivos da organização
          </p>
          <div className="max-h-40 overflow-y-auto border border-border rounded-lg p-2 space-y-1">
            {availableOkrs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                Nenhum OKR disponível. Crie OKRs em Objetivos Estratégicos primeiro.
              </p>
            ) : (
              availableOkrs.map((okr) => (
                <label
                  key={okr.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                    projectDraft.linkedOkrIds.includes(okr.id)
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-muted"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={projectDraft.linkedOkrIds.includes(okr.id)}
                    onChange={() => toggleOkrLink(okr.id)}
                    className="rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{okr.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      Objetivo: {okr.objectiveTitle}
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Participants Section */}
        <div className="space-y-4 border-t pt-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Participantes do Projeto
          </h4>

          {/* Internal Participants */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participantes Internos (Empresa)
            </Label>
            <p className="text-xs text-muted-foreground">
              Selecione membros da equipe interna que participarão do projeto.
            </p>
            
            {/* Selected internal participants chips */}
            {selectedInternalParticipants.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedInternalParticipants.map((userId) => {
                  const user = orgNodes.find(n => n.id === userId);
                  return (
                    <span
                      key={userId}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full"
                    >
                      {user?.name || userId}
                      <button
                        type="button"
                        onClick={() => toggleInternalParticipant(userId)}
                        className="hover:text-blue-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={internalSearch}
                onChange={(e) => setInternalSearch(e.target.value)}
                onFocus={() => setShowInternalDropdown(true)}
                onBlur={() => setTimeout(() => setShowInternalDropdown(false), 200)}
                placeholder="Buscar participante por nome, email ou departamento..."
                className="pl-9"
                disabled={orgLoading}
              />
              {orgLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
              )}
            </div>

            {/* Dropdown */}
            {showInternalDropdown && filteredInternalParticipants.length > 0 && (
              <div className="border border-border rounded-lg bg-background shadow-lg max-h-48 overflow-auto">
                {filteredInternalParticipants.map((user) => {
                  const isSelected = selectedInternalParticipants.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      className={cn(
                        "w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center gap-2",
                        isSelected && "bg-blue-50 dark:bg-blue-900/20"
                      )}
                      onClick={() => toggleInternalParticipant(user.id)}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center",
                        isSelected 
                          ? "bg-blue-600 border-blue-600" 
                          : "border-border"
                      )}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{user.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {user.department} • {user.email}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* External Participants */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Participantes Externos
            </Label>
            <p className="text-xs text-muted-foreground">
              Selecione parceiros externos (estratégicos, operacionais ou táticos) envolvidos no projeto.
            </p>
            
            {/* Selected external participants chips */}
            {selectedExternalParticipants.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedExternalParticipants.map((participantId) => {
                  const participant = externalParticipants.find(p => p.id === participantId);
                  return (
                    <span
                      key={participantId}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full"
                    >
                      {participant?.name || participantId}
                      <span className="text-[10px] opacity-70">({participant?.organization})</span>
                      <button
                        type="button"
                        onClick={() => toggleExternalParticipant(participantId)}
                        className="hover:text-purple-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Search input for externals */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={externalSearch}
                onChange={(e) => setExternalSearch(e.target.value)}
                onFocus={() => setShowExternalDropdown(true)}
                onBlur={() => setTimeout(() => setShowExternalDropdown(false), 200)}
                placeholder="Buscar participante externo por nome ou organização..."
                className="pl-9"
                disabled={externalLoading}
              />
            </div>

            {/* Dropdown for externals */}
            {showExternalDropdown && filteredExternalParticipants.length > 0 && (
              <div className="border border-border rounded-lg bg-background shadow-lg max-h-48 overflow-auto">
                {filteredExternalParticipants.map((participant) => {
                  const isSelected = selectedExternalParticipants.includes(participant.id);
                  const typeLabel = participant.partnerType === 'strategic' ? 'Estratégico' : 
                                    participant.partnerType === 'tactical' ? 'Tático' : 'Operacional';
                  return (
                    <button
                      key={participant.id}
                      type="button"
                      className={cn(
                        "w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center gap-2",
                        isSelected && "bg-purple-50 dark:bg-purple-900/20"
                      )}
                      onClick={() => toggleExternalParticipant(participant.id)}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center",
                        isSelected 
                          ? "bg-purple-600 border-purple-600" 
                          : "border-border"
                      )}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{participant.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {participant.organization} • {typeLabel}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags (Ontologia)
          </Label>
          <div className="flex gap-2">
            <Input
              value={projectDraft.tagInput}
              onChange={(e) => setProjectDraft({ ...projectDraft, tagInput: e.target.value })}
              placeholder="Adicionar tag..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addTag}>
              Adicionar
            </Button>
          </div>
          {projectDraft.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {projectDraft.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted rounded-full"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>Notas do Curador</Label>
          <textarea
            value={projectDraft.notes}
            onChange={(e) => setProjectDraft({ ...projectDraft, notes: e.target.value })}
            placeholder="Observações, contexto adicional, decisões de curadoria..."
            className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm min-h-[60px] resize-y"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={cancelEdit} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => void saveProject()} disabled={!projectDraft.name.trim() || !projectDraft.department.trim() || saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? "Salvando..." : (editingProject ? "Salvar Alterações" : "Criar Projeto")}
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Injeção de Projetos</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Cadastre projetos e vincule-os aos OKRs estratégicos. O curador ontológico define
          a classificação de memória e tags para integração ao grafo de conhecimento.
        </p>
      </div>

      {orgError && (
        <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <div className="text-sm text-red-700 dark:text-red-300">{orgError}</div>
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                As combos de Responsável/Área dependem dos dados reais do Neo4j.
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Info Card */}
      <Card className="p-4 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-3">
          <FolderKanban className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
              Projetos no Business Intent Graph (BIG)
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
              Projetos são vinculados aos OKRs e classificados por classe de memória.
              O conhecimento gerado por um projeto herda seu alinhamento estratégico,
              permitindo retrieval contextualizado e insights automáticos.
            </p>
          </div>
        </div>
      </Card>

      {/* New Project Form */}
      {showNewProject && renderProjectForm()}

      {/* Add Project Button */}
      {!showNewProject && !editingProject && (
        <Button onClick={startNewProject} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Projeto
        </Button>
      )}

      {/* Projects List */}
      <div className="space-y-4">
        {projects.map((project) => {
          const isExpanded = expandedProject === project.id;
          const isEditing = editingProject === project.id;
          const statusInfo = getStatusInfo(project.status);
          const priorityInfo = getPriorityInfo(project.priority);
          const memoryClassInfo = getMemoryClassInfo(project.memoryClass);

          if (isEditing) {
            return <div key={project.id}>{renderProjectForm()}</div>;
          }

          return (
            <Card key={project.id} className="overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleExpand(project.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{project.name}</h3>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full", statusInfo.color)}>
                        {statusInfo.label}
                      </span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full", priorityInfo.color)}>
                        {priorityInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {project.description}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground">
                        Resp.: {getUserName(project.ownerId)}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground">
                        Área: {project.department || "—"}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground">
                        Fase: {getPhaseLabel(project.phase)}
                      </span>
                      {(project.linkedOkrIds?.length || 0) > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
                          <Link2 className="h-3 w-3" />
                          {project.linkedOkrIds.length} OKR(s)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditProject(project);
                      }}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        void deleteProject(project.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t bg-muted/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Datas</div>
                      <div className="text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {project.startDate || "—"} → {project.targetEndDate || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Classe de Memória</div>
                      <div className="text-sm flex items-center gap-2">
                        <Brain className="h-4 w-4 text-muted-foreground" />
                        {memoryClassInfo.label} ({memoryClassInfo.description})
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Visibilidade</div>
                      <div className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {project.visibility === "corporate" ? "Corporativo" : "Pessoal"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Tags</div>
                      <div className="flex flex-wrap gap-1">
                        {project.tags.length > 0 ? (
                          project.tags.map((tag) => (
                            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted">
                              #{tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem tags</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {project.linkedOkrIds.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs font-medium text-muted-foreground mb-2">OKRs Vinculados</div>
                      <div className="space-y-1">
                        {project.linkedOkrIds.map((okrId) => {
                          const okr = availableOkrs.find((o) => o.id === okrId);
                          return okr ? (
                            <div key={okrId} className="text-sm flex items-center gap-2">
                              <Target className="h-3 w-3 text-green-600" />
                              <span>{okr.title}</span>
                              <span className="text-xs text-muted-foreground">({okr.objectiveTitle})</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {project.notes && (
                    <div className="mt-4">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Notas do Curador</div>
                      <p className="text-sm">{project.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}

        {projects.length === 0 && (
          <Card className="p-8 text-center">
            <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium">Nenhum projeto cadastrado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em "Novo Projeto" para começar a injetar projetos no grafo de conhecimento.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
