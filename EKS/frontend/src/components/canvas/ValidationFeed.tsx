"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Search,
  Filter,
  Check,
  X,
  AlertCircle,
  Clock,
  Users,
  FileText,
  MessageSquare,
  Mic,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  Edit3,
  Save,
  RefreshCw,
  UserCheck,
  Calendar,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

// ─── Types ───────────────────────────────────────────────────────────

type SourceType = "meeting" | "document" | "chat";
type EntityType = "task" | "risk" | "decision" | "insight" | "externalparticipant";
type ValidationStatus = "pending" | "validated" | "rejected" | "all";

interface ValidationItem {
  id: string;
  entityType: EntityType;
  value: string;
  description: string;
  priority: string | null;
  deadline: string | null;
  confidence: number;
  visibility: string;
  validated: boolean | null;
  validatedAt: string | null;
  createdAt: string;
  source: string;
  sourceType: SourceType;
  meetingId: string;
  meetingTitle: string;
  meetingOrganizer: string;
  meetingOrganizerId: string | null;
  meetingDate: string;
  assigneeId: string | null;
  assigneeName: string | null;
  relType: string | null;
}

interface OrgUser {
  id: string;
  name: string;
  role?: string;
  department?: string;
}

// ─── Config ──────────────────────────────────────────────────────────

const SOURCE_TYPE_CONFIG: Record<SourceType, { icon: typeof Mic; label: string; color: string }> = {
  meeting: { icon: Mic, label: "Reunião", color: "text-purple-500" },
  document: { icon: FileText, label: "Documento", color: "text-blue-500" },
  chat: { icon: MessageSquare, label: "Chat", color: "text-green-500" },
};

const ENTITY_TYPE_CONFIG: Record<EntityType, { icon: typeof Users; label: string; color: string }> = {
  task: { icon: Clock, label: "Tarefa", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  risk: { icon: AlertCircle, label: "Risco", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  decision: { icon: Check, label: "Decisão", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  insight: { icon: Sparkles, label: "Insight", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" },
  externalparticipant: { icon: Users, label: "Part. Externo", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
};

const PRIORITY_OPTIONS = [
  { value: "critical", label: "Crítica", color: "text-red-600" },
  { value: "high", label: "Alta", color: "text-orange-600" },
  { value: "medium", label: "Média", color: "text-amber-600" },
  { value: "low", label: "Baixa", color: "text-green-600" },
];

const STATUS_TABS: { value: ValidationStatus; label: string }[] = [
  { value: "pending", label: "Pendentes" },
  { value: "validated", label: "Validados" },
  { value: "rejected", label: "Rejeitados" },
  { value: "all", label: "Todos" },
];

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Format a date string (e.g. "2026-02-06") to Brazilian format "06/02/2026"
 */
function formatDateBR(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    // Handle ISO date strings and plain date strings
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

// ─── Component ───────────────────────────────────────────────────────

export function ValidationFeed() {
  // ─── Auth ─────────────────────────────────────────────────────
  const currentUser = useAuthStore((state) => state.user);

  // ─── State ─────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [allValidations, setAllValidations] = useState<ValidationItem[]>([]);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [selectedSource, setSelectedSource] = useState<SourceType | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<EntityType | null>(null);
  const [statusFilter, setStatusFilter] = useState<ValidationStatus>("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [assigneeDropdownId, setAssigneeDropdownId] = useState<string | null>(null);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  // ─── Editable fields (local draft) ────────────────────────────
  const [editDrafts, setEditDrafts] = useState<Record<string, Partial<ValidationItem>>>({});

  // ─── Data Loading ──────────────────────────────────────────────

  const loadValidations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getValidations({ status: statusFilter });
      if (response.success && response.data) {
        const items = (response.data as ValidationItem[])
          .filter(item => ['task', 'risk', 'decision', 'insight', 'externalparticipant'].includes(item.entityType));

        // Default unassigned entities: keep names from backend, resolve organizer if needed
        const processed = items.map(item => ({
          ...item,
          assigneeName: item.assigneeName || null,
          assigneeId: item.assigneeId || null,
        }));

        setAllValidations(processed);
      }
    } catch (err) {
      console.error('Failed to load validations:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const loadOrgUsers = useCallback(async () => {
    try {
      const response = await api.getOrgChartNodes();
      if (response.success && response.data) {
        // /orgchart/nodes already returns only User nodes — no need to filter by type
        const users = response.data.map((node: any) => ({
          id: node.id,
          name: node.name || '',
          role: node.role || '',
          department: node.department || '',
        }));
        setOrgUsers(users);
      }
    } catch (err) {
      console.error('Failed to load org users:', err);
    }
  }, []);

  useEffect(() => {
    loadValidations();
  }, [loadValidations]);

  useEffect(() => {
    loadOrgUsers();
  }, [loadOrgUsers]);

  // Close assignee dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(e.target as Node)) {
        setAssigneeDropdownId(null);
        setAssigneeSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Filter by logged-in user's responsibility ────────────────

  /**
   * Show items based on user's role in the meeting:
   * 1. Meeting organizer sees ALL entities from their meetings (tasks, risks, decisions,
   *    insights, and external participants) — they need the full picture.
   * 2. Non-organizer collaborators only see items directly assigned to them.
   */
  const validations = useMemo(() => {
    if (!currentUser) return allValidations;

    return allValidations.filter(item => {
      // Check if current user is the meeting organizer
      const isOrganizer =
        (item.meetingOrganizerId && item.meetingOrganizerId === currentUser.userId) ||
        (!item.meetingOrganizerId && item.meetingOrganizer &&
          item.meetingOrganizer.toLowerCase() === currentUser.name.toLowerCase());

      // Organizer sees ALL items from their meetings
      if (isOrganizer) return true;

      // Non-organizer: only see items directly assigned to them
      if (item.assigneeId && item.assigneeId === currentUser.userId) return true;

      return false;
    });
  }, [allValidations, currentUser]);

  // ─── Handlers ──────────────────────────────────────────────────

  const getDraft = (id: string): Partial<ValidationItem> => editDrafts[id] || {};

  const updateDraft = (id: string, field: string, value: string | null) => {
    setEditDrafts(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleValidate = async (id: string, approved: boolean) => {
    setSaving(id);
    try {
      await api.updateValidation(id, { validated: approved });
      setAllValidations(prev => prev.filter(p => p.id !== id));
      setExpandedId(null);
      setEditingId(null);
    } catch (err) {
      console.error('Failed to validate:', err);
    } finally {
      setSaving(null);
    }
  };

  const handleValidateAll = async () => {
    const pendingIds = filteredValidations.map(v => v.id);
    if (pendingIds.length === 0) return;
    setSaving('bulk');
    try {
      await api.bulkValidate(pendingIds, true);
      setAllValidations(prev => prev.filter(p => !pendingIds.includes(p.id)));
    } catch (err) {
      console.error('Failed to bulk validate:', err);
    } finally {
      setSaving(null);
    }
  };

  const handleSaveEdits = async (id: string) => {
    const draft = getDraft(id);
    if (Object.keys(draft).length === 0) {
      setEditingId(null);
      return;
    }

    setSaving(id);
    try {
      const updates: any = {};
      if (draft.description !== undefined) updates.description = draft.description;
      if (draft.priority !== undefined) updates.priority = draft.priority;
      if (draft.deadline !== undefined) updates.deadline = draft.deadline;
      if (draft.assigneeId !== undefined) updates.assigneeId = draft.assigneeId;

      // IMPORTANT: Do NOT include 'validated' in updates when saving edits.
      // If the user changed the assignee, it's a reassignment, not a validation.
      // The validation status must NOT change.
      await api.updateValidation(id, updates);

      // If assignee was changed to a different person, remove from current user's list
      const isReassignment = draft.assigneeId !== undefined && draft.assigneeId !== currentUser?.userId;

      if (isReassignment) {
        // Item was reassigned to another person — remove from this user's view
        setAllValidations(prev => prev.filter(v => v.id !== id));
      } else {
        // Update local state with edited fields
        setAllValidations(prev => prev.map(v =>
          v.id === id ? { ...v, ...draft } : v
        ));
      }

      setEditDrafts(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setEditingId(null);
    } catch (err) {
      console.error('Failed to save edits:', err);
    } finally {
      setSaving(null);
    }
  };

  const handleAssigneeSelect = (itemId: string, user: OrgUser) => {
    updateDraft(itemId, 'assigneeId', user.id);
    updateDraft(itemId, 'assigneeName', user.name);
    setAssigneeDropdownId(null);
    setAssigneeSearch("");
  };

  // ─── Resolve assignee display name ────────────────────────────

  /**
   * Get the display name for an item's responsible person.
   * Priority: draft value > backend assigneeName > meetingOrganizer (for unassigned) > 'Não atribuído'
   */
  const getAssigneeDisplayName = (item: ValidationItem): string => {
    const draft = getDraft(item.id);
    if (draft.assigneeName) return draft.assigneeName as string;
    if (item.assigneeName) return item.assigneeName;
    if (item.meetingOrganizer) return `${item.meetingOrganizer} (organizador)`;
    return 'Não atribuído';
  };

  // ─── Filtering ─────────────────────────────────────────────────

  const filteredValidations = validations.filter(item => {
    const matchesSearch =
      item.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = !selectedSource || item.sourceType === selectedSource;
    const matchesEntity = !selectedEntity || item.entityType === selectedEntity;
    return matchesSearch && matchesSource && matchesEntity;
  });

  const groupedBySource = filteredValidations.reduce((acc, item) => {
    const key = item.meetingTitle || item.source || 'Reunião';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, ValidationItem[]>);

  const entityCounts = validations.reduce((acc, item) => {
    acc[item.entityType] = (acc[item.entityType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // ─── Render helpers ────────────────────────────────────────────

  const getEffectiveValue = (item: ValidationItem, field: keyof ValidationItem) => {
    const draft = getDraft(item.id);
    return (draft as any)[field] !== undefined ? (draft as any)[field] : item[field];
  };

  const filteredOrgUsers = orgUsers.filter(u =>
    u.name.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  const renderPriorityBadge = (priority: string | null) => {
    if (!priority) return <span className="text-xs text-muted-foreground italic">Sem prioridade</span>;
    const opt = PRIORITY_OPTIONS.find(p => p.value === priority);
    return (
      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full bg-muted", opt?.color)}>
        {opt?.label || priority}
      </span>
    );
  };

  // ─── Render ────────────────────────────────────────────────────

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
        <div className="p-6 border-b border-border bg-card/50 backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                Feed de Validação
                {validations.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-sm">
                    {validations.length}
                  </span>
                )}
              </h2>
              <p className="text-sm text-muted-foreground">
                {currentUser
                  ? `Itens sob sua responsabilidade, ${currentUser.name.split(' ')[0]}`
                  : 'Revise e valide tarefas, decisões, riscos e insights extraídos'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadValidations()}
                disabled={loading}
              >
                <RefreshCw className={cn("w-4 h-4 mr-1", loading && "animate-spin")} />
                Atualizar
              </Button>
              {statusFilter === 'pending' && filteredValidations.length > 0 && (
                <Button
                  onClick={handleValidateAll}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={saving === 'bulk'}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Validar Todos ({filteredValidations.length})
                </Button>
              )}
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-1 mb-4 p-1 bg-muted rounded-lg w-fit">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                  statusFilter === tab.value
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por conteúdo, fonte ou descrição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Source Type Filter */}
          <div className="flex gap-2 flex-wrap mb-3">
            <button
              onClick={() => setSelectedSource(null)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                !selectedSource
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              Todas as fontes
            </button>
            {(Object.keys(SOURCE_TYPE_CONFIG) as SourceType[]).map((type) => {
              const config = SOURCE_TYPE_CONFIG[type];
              const Icon = config.icon;
              const count = validations.filter(p => p.sourceType === type).length;
              if (count === 0) return null;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedSource(selectedSource === type ? null : type)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2",
                    selectedSource === type
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5", selectedSource !== type && config.color)} />
                  {config.label}
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-xs",
                    selectedSource === type ? "bg-primary-foreground/20" : "bg-muted-foreground/20"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Entity Type Filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedEntity(null)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                !selectedEntity
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              Todos os tipos
            </button>
            {(Object.keys(ENTITY_TYPE_CONFIG) as EntityType[]).map(type => {
              const config = ENTITY_TYPE_CONFIG[type];
              const Icon = config.icon;
              const count = entityCounts[type] || 0;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedEntity(selectedEntity === type ? null : type)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2",
                    selectedEntity === type
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {config.label}
                  {count > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-xs bg-muted-foreground/20">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-10 h-10 mx-auto text-muted-foreground animate-spin mb-4" />
              <p className="text-muted-foreground">Carregando validações...</p>
            </div>
          ) : filteredValidations.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-medium">
                {statusFilter === 'pending' ? 'Nenhuma validação pendente' : 'Nenhum item encontrado'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {statusFilter === 'pending'
                  ? 'Todos os itens foram validados! 🎉'
                  : 'Tente ajustar os filtros.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Info Banner */}
              {statusFilter === 'pending' && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    <strong>Valide o conteúdo:</strong> Confirme se as informações extraídas estão corretas.
                    Edite campos se necessário antes de validar. Ao reassignar o responsável, o item será transferido.
                  </p>
                </div>
              )}

              {/* Grouped by Meeting Title */}
              {Object.entries(groupedBySource).map(([meetingTitle, items]) => {
                const sourceType = items[0].sourceType;
                const sourceConfig = SOURCE_TYPE_CONFIG[sourceType];
                const SourceIcon = sourceConfig.icon;
                const meetingDateFormatted = formatDateBR(items[0].meetingDate);

                return (
                  <div key={meetingTitle} className="space-y-3">
                    {/* Source / Meeting Header */}
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground border-b border-border pb-2">
                      <SourceIcon className={cn("w-4 h-4", sourceConfig.color)} />
                      <span className="font-semibold text-foreground">{meetingTitle}</span>
                      {meetingDateFormatted && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {meetingDateFormatted}
                        </span>
                      )}
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                        {items.length} {items.length === 1 ? 'item' : 'itens'}
                      </span>
                    </div>

                    {/* Validation Cards */}
                    {items.map((item) => {
                      const config = ENTITY_TYPE_CONFIG[item.entityType];
                      if (!config) return null;
                      const Icon = config.icon;
                      const isExpanded = expandedId === item.id;
                      const isEditing = editingId === item.id;
                      const isSaving = saving === item.id;

                      const assigneeDisplayName = getAssigneeDisplayName(item);
                      const effectiveDescription = getEffectiveValue(item, 'description') as string;
                      const effectivePriority = getEffectiveValue(item, 'priority') as string | null;
                      const effectiveDeadline = getEffectiveValue(item, 'deadline') as string | null;

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "flex flex-col rounded-xl bg-card border transition-all overflow-hidden",
                            item.validated === true && "border-green-300 dark:border-green-800",
                            item.validated === false && "border-red-300 dark:border-red-800",
                            item.validated === null && "border-border hover:border-primary/30",
                          )}
                        >
                          {/* Card Header */}
                          <div
                            className="flex items-start gap-4 p-4 cursor-pointer"
                            onClick={() => {
                              setExpandedId(isExpanded ? null : item.id);
                              if (isExpanded) {
                                setEditingId(null);
                                setAssigneeDropdownId(null);
                              }
                            }}
                          >
                            <div className={cn("p-2 rounded-lg shrink-0", config.color)}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={cn("px-2 py-0.5 rounded text-xs font-medium", config.color)}>
                                  {config.label}
                                </span>
                                <span className={cn(
                                  "text-xs px-1.5 py-0.5 rounded",
                                  item.confidence >= 0.85 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                  item.confidence >= 0.7 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                )}>
                                  {Math.round(item.confidence * 100)}% confiança
                                </span>
                                {renderPriorityBadge(effectivePriority)}
                                {item.validated === true && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    ✓ Validado
                                  </span>
                                )}
                                {item.validated === false && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                    ✗ Rejeitado
                                  </span>
                                )}
                              </div>
                              <p className="font-medium text-sm">{item.value}</p>
                              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                                {/* Responsável (não se aplica a Part. Externo) */}
                                {item.entityType !== 'externalparticipant' ? (
                                  <span className="flex items-center gap-1">
                                    <UserCheck className="w-3 h-3" />
                                    <strong className="text-foreground/80">{assigneeDisplayName}</strong>
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                    <Users className="w-3 h-3" />
                                    <strong>Validação do organizador</strong>
                                  </span>
                                )}
                                {/* Prazo (somente se existir e não for Part. Externo) */}
                                {effectiveDeadline && item.entityType !== 'externalparticipant' && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Prazo: {formatDateBR(effectiveDeadline)}
                                  </span>
                                )}
                                {/* Origem: título da reunião + data */}
                                <span className="flex items-center gap-1 ml-auto">
                                  <Mic className="w-3 h-3 text-purple-400" />
                                  <span className="truncate max-w-[200px]">
                                    {item.meetingTitle || item.source}
                                  </span>
                                  {item.meetingDate && (
                                    <span className="text-muted-foreground/70">
                                      ({formatDateBR(item.meetingDate)})
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {statusFilter === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 h-8 w-8 p-0"
                                    title="Validar"
                                    disabled={isSaving}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleValidate(item.id, true);
                                    }}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0"
                                    title="Rejeitar"
                                    disabled={isSaving}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleValidate(item.id, false);
                                    }}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              <ChevronDown className={cn(
                                "w-4 h-4 text-muted-foreground transition-transform",
                                isExpanded && "rotate-180"
                              )} />
                            </div>
                          </div>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-0 border-t border-border bg-muted/30">
                              <div className="pt-4 space-y-4">
                                {/* Meeting origin info */}
                                <div className="flex items-center gap-3 p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs">
                                  <Mic className="w-4 h-4 text-purple-500 shrink-0" />
                                  <div className="flex-1">
                                    <span className="font-medium text-purple-700 dark:text-purple-300">
                                      Origem: {item.meetingTitle || item.source}
                                    </span>
                                    {item.meetingDate && (
                                      <span className="ml-2 text-purple-600 dark:text-purple-400">
                                        — Reunião em {formatDateBR(item.meetingDate)}
                                      </span>
                                    )}
                                    {item.meetingOrganizer && (
                                      <span className="ml-2 text-purple-600/70 dark:text-purple-400/70">
                                        (org: {item.meetingOrganizer})
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Description */}
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                    Descrição Detalhada
                                  </label>
                                  {isEditing ? (
                                    <textarea
                                      className="w-full p-2 rounded-lg border border-border bg-background text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
                                      value={effectiveDescription}
                                      onChange={(e) => updateDraft(item.id, 'description', e.target.value)}
                                    />
                                  ) : (
                                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-lg">
                                      {effectiveDescription || <em className="italic">Sem descrição</em>}
                                    </p>
                                  )}
                                </div>

                                {/* Editable fields grid (not for ExternalParticipant) */}
                                {item.entityType !== 'externalparticipant' && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  {/* Responsável */}
                                  <div className="relative" ref={assigneeDropdownId === item.id ? assigneeDropdownRef : undefined}>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                      <UserCheck className="w-3 h-3" />
                                      Responsável
                                    </label>
                                    {isEditing ? (
                                      <div>
                                        <button
                                          type="button"
                                          className="w-full p-2 rounded-lg border border-border bg-background text-sm text-left flex items-center justify-between hover:border-primary/40 transition-colors"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setAssigneeDropdownId(assigneeDropdownId === item.id ? null : item.id);
                                            setAssigneeSearch("");
                                          }}
                                        >
                                          <span className={cn(
                                            "font-medium",
                                            assigneeDisplayName === 'Não atribuído' ? "text-muted-foreground italic" : "text-foreground"
                                          )}>
                                            {assigneeDisplayName}
                                          </span>
                                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                        </button>
                                        {assigneeDropdownId === item.id && (
                                          <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-hidden">
                                            <div className="p-2 border-b border-border">
                                              <input
                                                type="text"
                                                placeholder="Buscar colaborador..."
                                                value={assigneeSearch}
                                                onChange={(e) => setAssigneeSearch(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-full px-2 py-1.5 text-sm rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                                                autoFocus
                                              />
                                            </div>
                                            <div className="overflow-auto max-h-36">
                                              {filteredOrgUsers.length === 0 ? (
                                                <p className="text-xs text-muted-foreground p-3 text-center">
                                                  Nenhum colaborador encontrado
                                                </p>
                                              ) : (
                                                filteredOrgUsers.map(user => {
                                                  const isCurrentAssignee =
                                                    (getDraft(item.id).assigneeId || item.assigneeId) === user.id;
                                                  return (
                                                    <button
                                                      key={user.id}
                                                      type="button"
                                                      className={cn(
                                                        "w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors flex items-center justify-between",
                                                        isCurrentAssignee && "bg-primary/5"
                                                      )}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAssigneeSelect(item.id, user);
                                                      }}
                                                    >
                                                      <div>
                                                        <span className="font-medium">{user.name}</span>
                                                        {user.role && (
                                                          <span className="text-xs text-muted-foreground ml-2">
                                                            {user.role}
                                                          </span>
                                                        )}
                                                      </div>
                                                      {isCurrentAssignee && (
                                                        <Check className="w-3.5 h-3.5 text-green-600" />
                                                      )}
                                                    </button>
                                                  );
                                                })
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-sm font-medium p-2 bg-muted/50 rounded-lg">
                                        {assigneeDisplayName}
                                      </p>
                                    )}
                                  </div>

                                  {/* Prioridade */}
                                  <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                      <Flag className="w-3 h-3" />
                                      Prioridade
                                    </label>
                                    {isEditing ? (
                                      <select
                                        className="w-full p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        value={effectivePriority || ''}
                                        onChange={(e) => updateDraft(item.id, 'priority', e.target.value || null)}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <option value="">Sem prioridade</option>
                                        {PRIORITY_OPTIONS.map(opt => (
                                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                      </select>
                                    ) : (
                                      <div className="p-2 bg-muted/50 rounded-lg">
                                        {renderPriorityBadge(effectivePriority)}
                                      </div>
                                    )}
                                  </div>

                                  {/* Prazo */}
                                  <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      Prazo
                                    </label>
                                    {isEditing ? (
                                      <input
                                        type="date"
                                        className="w-full p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        value={effectiveDeadline || ''}
                                        onChange={(e) => updateDraft(item.id, 'deadline', e.target.value || null)}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    ) : (
                                      <p className="text-sm p-2 bg-muted/50 rounded-lg">
                                        {effectiveDeadline
                                          ? formatDateBR(effectiveDeadline)
                                          : <em className="italic text-muted-foreground">Sem prazo definido</em>
                                        }
                                      </p>
                                    )}
                                  </div>
                                </div>
                                )}

                                {/* ExternalParticipant info banner */}
                                {item.entityType === 'externalparticipant' && (
                                  <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
                                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                                    <div>
                                      <p className="font-medium text-blue-700 dark:text-blue-300">
                                        Participante externo identificado
                                      </p>
                                      <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-0.5">
                                        Confirme se este participante externo foi corretamente identificado na reunião.
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Reassignment notice (not for ExternalParticipant) */}
                                {item.entityType !== 'externalparticipant' && isEditing && getDraft(item.id).assigneeId && getDraft(item.id).assigneeId !== currentUser?.userId && (
                                  <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                                    <Users className="w-4 h-4 shrink-0" />
                                    <span>
                                      Ao salvar, este item será <strong>transferido</strong> para{' '}
                                      <strong>{getDraft(item.id).assigneeName}</strong>.
                                      O status de validação não será alterado.
                                    </span>
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-2 border-t border-border">
                                  {isEditing ? (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSaveEdits(item.id);
                                        }}
                                        disabled={isSaving}
                                        className="bg-blue-600 hover:bg-blue-700"
                                      >
                                        <Save className="w-4 h-4 mr-1" />
                                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingId(null);
                                          setEditDrafts(prev => {
                                            const next = { ...prev };
                                            delete next[item.id];
                                            return next;
                                          });
                                        }}
                                      >
                                        Cancelar
                                      </Button>
                                    </>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingId(item.id);
                                      }}
                                    >
                                      <Edit3 className="w-4 h-4 mr-1" />
                                      Editar
                                    </Button>
                                  )}

                                  <div className="flex-1" />

                                  {statusFilter === 'pending' && (
                                    <>
                                      <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700"
                                        disabled={isSaving}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleValidate(item.id, true);
                                        }}
                                      >
                                        <Check className="w-4 h-4 mr-1" />
                                        Validar
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                                        disabled={isSaving}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleValidate(item.id, false);
                                        }}
                                      >
                                        <X className="w-4 h-4 mr-1" />
                                        Rejeitar
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
