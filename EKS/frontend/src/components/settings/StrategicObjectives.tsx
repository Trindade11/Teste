"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Target,
  Plus,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Calendar,
  Save,
  X
} from "lucide-react";

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
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string;
  ownerId: string;
  department: string;
}

interface Objective {
  id: string;
  title: string;
  description: string;
  status: "active" | "archived";
  targetDate: string;
  ownerId: string;
  department: string;
  okrs: OKR[];
}

// Dados agora vêm do Neo4j via API - sem mais MOCK

export function StrategicObjectives() {
  const [orgNodes, setOrgNodes] = useState<OrgChartNode[]>([]);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgError, setOrgError] = useState<string | null>(null);

  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [objectivesLoading, setObjectivesLoading] = useState(true);
  const [objectivesError, setObjectivesError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedObjective, setExpandedObjective] = useState<string | null>(null);
  const [editingObjective, setEditingObjective] = useState<string | null>(null);
  const [objectiveDraft, setObjectiveDraft] = useState<{ title: string; description: string; targetDate: string; ownerId: string; department: string }>({
    title: "",
    description: "",
    targetDate: "",
    ownerId: "",
    department: "",
  });
  const [okrFormObjectiveId, setOkrFormObjectiveId] = useState<string | null>(null);
  const [editingOkr, setEditingOkr] = useState<{ objectiveId: string; okrId: string } | null>(null);
  const [okrDraft, setOkrDraft] = useState<{ title: string; targetValue: string; currentValue: string; unit: string; deadline: string; ownerId: string; department: string }>({
    title: "",
    targetValue: "",
    currentValue: "",
    unit: "",
    deadline: "",
    ownerId: "",
    department: "",
  });
  const [showNewObjective, setShowNewObjective] = useState(false);
  const [newObjective, setNewObjective] = useState({
    title: "",
    description: "",
    targetDate: "",
    ownerId: "",
    department: "",
  });

  // Carregar organograma (users/departments)
  useEffect(() => {
    let cancelled = false;

    const loadOrg = async () => {
      setOrgLoading(true);
      setOrgError(null);
      try {
        const response = await api.getOrgChartNodes();

        if (!cancelled && response?.success && Array.isArray(response.data)) {
          setOrgNodes(response.data);
          return;
        }

        if (!cancelled) {
          setOrgNodes([]);
          setOrgError(response?.error || "Falha ao carregar organograma do backend");
        }
      } catch (error) {
        if (!cancelled) {
          setOrgNodes([]);
          setOrgError(error instanceof Error ? error.message : "Falha ao carregar organograma do backend");
        }
      } finally {
        if (!cancelled) setOrgLoading(false);
      }
    };

    void loadOrg();
    return () => {
      cancelled = true;
    };
  }, []);

  // Carregar Objectives do Neo4j
  const loadObjectives = useCallback(async () => {
    setObjectivesLoading(true);
    setObjectivesError(null);
    try {
      const response = await api.getObjectivesList();
      if (response?.success && Array.isArray(response.data)) {
        // Mapear para o formato esperado pelo componente
        const mapped: Objective[] = response.data.map((obj: any) => ({
          id: obj.id,
          title: obj.title,
          description: obj.description || "",
          status: obj.status || "active",
          targetDate: obj.targetDate || "",
          ownerId: obj.ownerId || "",
          department: obj.department || "",
          okrs: (obj.okrs || []).map((okr: any) => ({
            id: okr.id,
            title: okr.title,
            targetValue: okr.targetValue || 0,
            currentValue: okr.currentValue || 0,
            unit: okr.unit || "",
            deadline: okr.deadline || "",
            ownerId: okr.ownerId || "",
            department: okr.department || "",
          })),
        }));
        setObjectives(mapped);
      } else {
        setObjectivesError(response?.error || "Falha ao carregar objetivos");
      }
    } catch (error) {
      setObjectivesError(error instanceof Error ? error.message : "Erro ao carregar objetivos");
    } finally {
      setObjectivesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadObjectives();
  }, [loadObjectives]);

  const userOptions = useMemo(() => {
    return [...orgNodes].sort((a, b) => a.name.localeCompare(b.name));
  }, [orgNodes]);

  const departmentOptions = useMemo(() => {
    return Array.from(new Set(orgNodes.map((n) => n.department))).sort();
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

  const toggleExpand = (id: string) => {
    setExpandedObjective(expandedObjective === id ? null : id);
  };

  const getProgress = (okr: OKR) => {
    return Math.min(100, Math.round((okr.currentValue / okr.targetValue) * 100));
  };

  const getObjectiveProgress = (objective: Objective) => {
    if (objective.okrs.length === 0) return 0;
    const total = objective.okrs.reduce((sum, okr) => sum + getProgress(okr), 0);
    return Math.round(total / objective.okrs.length);
  };

  const handleAddObjective = async () => {
    if (!newObjective.title.trim()) return;
    if (!newObjective.department.trim()) return;

    setSaving(true);
    try {
      const response = await api.createObjective({
        title: newObjective.title,
        description: newObjective.description,
        targetDate: newObjective.targetDate,
        ownerId: newObjective.ownerId,
        department: newObjective.department,
      });

      if (response.success) {
        // Recarregar lista do backend para garantir consistência
        await loadObjectives();
        setNewObjective({ title: "", description: "", targetDate: "", ownerId: "", department: "" });
        setShowNewObjective(false);
      } else {
        alert(`Erro ao criar objetivo: ${response.error}`);
      }
    } catch (error) {
      alert(`Erro ao criar objetivo: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteObjective = async (id: string) => {
    if (!confirm("Tem certeza que deseja EXCLUIR permanentemente este objetivo? Todos os OKRs associados também serão excluídos. Esta ação não pode ser desfeita.")) return;

    setSaving(true);
    try {
      const response = await api.deleteObjective(id);
      if (response.success) {
        await loadObjectives();
      } else {
        alert(`Erro ao excluir objetivo: ${response.error}`);
      }
    } catch (error) {
      alert(`Erro ao excluir objetivo: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setSaving(false);
    }
  };

  const startEditObjective = (objective: Objective) => {
    setEditingObjective(objective.id);
    setObjectiveDraft({
      title: objective.title,
      description: objective.description,
      targetDate: objective.targetDate,
      ownerId: objective.ownerId,
      department: objective.department,
    });
  };

  const cancelEditObjective = () => {
    setEditingObjective(null);
    setObjectiveDraft({ title: "", description: "", targetDate: "", ownerId: "", department: "" });
  };

  const saveObjective = async (objectiveId: string) => {
    const title = objectiveDraft.title.trim();
    if (!title) {
      alert("Título é obrigatório");
      return;
    }
    if (!objectiveDraft.department.trim()) {
      alert("Área/Departamento é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const response = await api.updateObjective(objectiveId, {
        title,
        description: objectiveDraft.description,
        targetDate: objectiveDraft.targetDate,
        ownerId: objectiveDraft.ownerId,
        department: objectiveDraft.department,
      });

      if (response.success) {
        await loadObjectives();
        cancelEditObjective();
      } else {
        alert(`Erro ao atualizar objetivo: ${response.error}`);
      }
    } catch (error) {
      alert(`Erro ao atualizar objetivo: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setSaving(false);
    }
  };

  const resetOkrDraft = () => {
    setOkrDraft({ title: "", targetValue: "", currentValue: "", unit: "", deadline: "", ownerId: "", department: "" });
  };

  const startAddOkr = (objectiveId: string) => {
    const obj = objectives.find((o) => o.id === objectiveId);
    setOkrFormObjectiveId(objectiveId);
    setEditingOkr(null);
    setOkrDraft({
      title: "",
      targetValue: "",
      currentValue: "0",
      unit: "",
      deadline: "",
      ownerId: obj?.ownerId || "",
      department: obj?.department || "",
    });
  };

  const startEditOkr = (objectiveId: string, okr: OKR) => {
    setOkrFormObjectiveId(objectiveId);
    setEditingOkr({ objectiveId, okrId: okr.id });
    setOkrDraft({
      title: okr.title,
      targetValue: String(okr.targetValue),
      currentValue: String(okr.currentValue),
      unit: okr.unit,
      deadline: okr.deadline,
      ownerId: okr.ownerId,
      department: okr.department,
    });
  };

  const cancelOkrForm = () => {
    setOkrFormObjectiveId(null);
    setEditingOkr(null);
    resetOkrDraft();
  };

  const saveOkr = async (objectiveId: string) => {
    const objective = objectives.find((o) => o.id === objectiveId);
    const title = okrDraft.title.trim();
    const unit = okrDraft.unit.trim();
    const deadline = okrDraft.deadline.trim();
    const targetValue = Number(okrDraft.targetValue);
    const currentValue = Number(okrDraft.currentValue);
    const ownerId = okrDraft.ownerId || objective?.ownerId || "";
    const department = okrDraft.department || objective?.department || "";

    if (!title) {
      alert("Preencha o título do OKR.");
      return;
    }
    if (!unit) {
      alert("Preencha a unidade do OKR (ex: %, processos, insights).");
      return;
    }
    if (!deadline) {
      alert("Preencha o deadline do OKR.");
      return;
    }
    if (!department) {
      alert("Selecione a área/departamento do OKR.");
      return;
    }
    if (!Number.isFinite(targetValue) || targetValue <= 0) {
      alert("O valor alvo precisa ser um número maior que 0.");
      return;
    }
    if (!Number.isFinite(currentValue) || currentValue < 0) {
      alert("O valor atual precisa ser um número válido (>= 0).");
      return;
    }

    // Se estiver editando, por enquanto não suportamos edição (OKRs são imutáveis)
    // Seria necessário criar nova versão e arquivar a antiga
    if (editingOkr && editingOkr.objectiveId === objectiveId) {
      alert("Edição de OKR não suportada ainda. OKRs são imutáveis - crie um novo.");
      cancelOkrForm();
      return;
    }

    setSaving(true);
    try {
      const response = await api.createOkr({
        title,
        targetValue,
        currentValue,
        unit,
        deadline,
        objectiveId,
        ownerId,
        department,
      });

      if (response.success) {
        // Recarregar lista do backend para garantir consistência
        await loadObjectives();
        cancelOkrForm();
      } else {
        alert(`Erro ao criar OKR: ${response.error}`);
      }
    } catch (error) {
      alert(`Erro ao criar OKR: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteOkr = async (objectiveId: string, okrId: string) => {
    if (!confirm("Tem certeza que deseja EXCLUIR permanentemente este OKR? Esta ação não pode ser desfeita.")) return;

    setSaving(true);
    try {
      const response = await api.deleteOkr(okrId);
      if (response.success) {
        await loadObjectives();
      } else {
        alert(`Erro ao excluir OKR: ${response.error}`);
      }
    } catch (error) {
      alert(`Erro ao excluir OKR: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setSaving(false);
    }

    if (editingOkr?.objectiveId === objectiveId && editingOkr.okrId === okrId) {
      cancelOkrForm();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Objetivos Estratégicos & OKRs</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Defina os objetivos estratégicos da organização e seus Key Results mensuráveis.
          Estes objetivos guiam a relevância do conhecimento no sistema.
        </p>
      </div>

      {orgError && (
        <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
          <div className="text-sm text-red-700 dark:text-red-300">
            {orgError}
          </div>
          <div className="text-xs text-red-600 dark:text-red-400 mt-1">
            As combos de Responsável/Área dependem dos dados reais do Neo4j.
          </div>
        </Card>
      )}

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Target className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Business Intent Graph (BIG)
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Os objetivos definidos aqui formam a base do BIG - todo conhecimento ingerido
              será automaticamente vinculado aos objetivos relevantes, garantindo que o
              sistema priorize informações estrategicamente importantes.
            </p>
          </div>
        </div>
      </Card>

      {/* Loading/Error States */}
      {objectivesLoading && (
        <Card className="p-6 text-center">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Carregando objetivos do Neo4j...</p>
          </div>
        </Card>
      )}

      {objectivesError && !objectivesLoading && (
        <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
          <div className="text-sm text-red-700 dark:text-red-300">
            {objectivesError}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => loadObjectives()}
          >
            Tentar novamente
          </Button>
        </Card>
      )}

      {saving && (
        <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Salvando...</span>
        </div>
      )}

      {/* Objectives List */}
      <div className="space-y-4">
        {!objectivesLoading && !objectivesError && objectives.length === 0 && (
          <Card className="p-6 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum objetivo estratégico cadastrado ainda.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em &quot;Adicionar Objetivo Estratégico&quot; para começar.
            </p>
          </Card>
        )}
        {objectives.map((objective) => {
          const progress = getObjectiveProgress(objective);
          const isExpanded = expandedObjective === objective.id;

          return (
            <Card key={objective.id} className="overflow-hidden">
              {/* Objective Header */}
              <div
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleExpand(objective.id)}
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
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{objective.title}</h3>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs",
                        objective.status === "active"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      )}>
                        {objective.status === "active" ? "Ativo" : "Arquivado"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{objective.description}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground">
                        Resp.: {getUserName(objective.ownerId)}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground">
                        Área: {objective.department}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all rounded-full",
                            progress >= 80 ? "bg-green-500" :
                            progress >= 50 ? "bg-blue-500" :
                            progress >= 25 ? "bg-amber-500" : "bg-red-500"
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{progress}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {objective.targetDate}
                      </div>
                      <div className="mt-1">{objective.okrs.length} OKRs</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded OKRs */}
              {isExpanded && (
                <div className="border-t border-border bg-muted/20 p-4 space-y-4">
                  {editingObjective === objective.id && (
                    <div className="p-4 bg-background rounded-lg border border-border space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Editar Objetivo</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelEditObjective();
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>Título</Label>
                        <Input
                          value={objectiveDraft.title}
                          onChange={(e) => setObjectiveDraft({ ...objectiveDraft, title: e.target.value })}
                          placeholder="Ex: Expandir base de conhecimento"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Input
                          value={objectiveDraft.description}
                          onChange={(e) => setObjectiveDraft({ ...objectiveDraft, description: e.target.value })}
                          placeholder="Descreva o objetivo estratégico"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Responsável</Label>
                          <select
                            value={objectiveDraft.ownerId}
                            onChange={(e) => setObjectiveDraft({ ...objectiveDraft, ownerId: e.target.value })}
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
                          {!!objectiveDraft.ownerId && (
                            <p className="text-xs text-muted-foreground">{getUserEmail(objectiveDraft.ownerId)}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Área/Departamento</Label>
                          <select
                            value={objectiveDraft.department}
                            onChange={(e) => setObjectiveDraft({ ...objectiveDraft, department: e.target.value })}
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Data Alvo</Label>
                          <Input
                            type="date"
                            value={objectiveDraft.targetDate}
                            onChange={(e) => setObjectiveDraft({ ...objectiveDraft, targetDate: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelEditObjective();
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            saveObjective(objective.id);
                          }}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Salvar
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Key Results</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startAddOkr(objective.id);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar OKR
                    </Button>
                  </div>

                  {okrFormObjectiveId === objective.id && (
                    <div className="p-4 bg-background rounded-lg border border-border space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {editingOkr?.objectiveId === objective.id ? "Editar OKR" : "Novo OKR"}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelOkrForm();
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>Título do OKR</Label>
                        <Input
                          value={okrDraft.title}
                          onChange={(e) => setOkrDraft({ ...okrDraft, title: e.target.value })}
                          placeholder="Ex: Reduzir tempo de aprovação"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Responsável</Label>
                          <select
                            value={okrDraft.ownerId}
                            onChange={(e) => setOkrDraft({ ...okrDraft, ownerId: e.target.value })}
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
                          {!!okrDraft.ownerId && (
                            <p className="text-xs text-muted-foreground">{getUserEmail(okrDraft.ownerId)}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Área/Departamento</Label>
                          <select
                            value={okrDraft.department}
                            onChange={(e) => setOkrDraft({ ...okrDraft, department: e.target.value })}
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Valor Atual</Label>
                          <Input
                            type="number"
                            value={okrDraft.currentValue}
                            onChange={(e) => setOkrDraft({ ...okrDraft, currentValue: e.target.value })}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Valor Alvo</Label>
                          <Input
                            type="number"
                            value={okrDraft.targetValue}
                            onChange={(e) => setOkrDraft({ ...okrDraft, targetValue: e.target.value })}
                            placeholder="100"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Unidade</Label>
                          <Input
                            value={okrDraft.unit}
                            onChange={(e) => setOkrDraft({ ...okrDraft, unit: e.target.value })}
                            placeholder="% / processos / insights"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Deadline</Label>
                          <Input
                            type="date"
                            value={okrDraft.deadline}
                            onChange={(e) => setOkrDraft({ ...okrDraft, deadline: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          disabled={saving}
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelOkrForm();
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          type="button"
                          disabled={saving}
                          onClick={(e) => {
                            e.stopPropagation();
                            void saveOkr(objective.id);
                          }}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          {saving ? "Salvando..." : "Salvar"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {objective.okrs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum OKR definido ainda
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {objective.okrs.map((okr) => {
                        const okrProgress = getProgress(okr);
                        return (
                          <div
                            key={okr.id}
                            className="flex items-center gap-4 p-3 bg-background rounded-lg border border-border"
                          >
                            <TrendingUp className={cn(
                              "h-4 w-4",
                              okrProgress >= 80 ? "text-green-500" :
                              okrProgress >= 50 ? "text-blue-500" :
                              "text-amber-500"
                            )} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{okr.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[200px]">
                                  <div
                                    className={cn(
                                      "h-full rounded-full",
                                      okrProgress >= 80 ? "bg-green-500" :
                                      okrProgress >= 50 ? "bg-blue-500" : "bg-amber-500"
                                    )}
                                    style={{ width: `${okrProgress}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {okr.currentValue}/{okr.targetValue} {okr.unit}
                                </span>
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                <span>Resp.: {getUserName(okr.ownerId)}</span>
                                {!!okr.department && <span> • Área: {okr.department}</span>}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {okr.deadline}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditOkr(objective.id, okr);
                                }}
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteOkr(objective.id, okr.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Objective Actions */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditObjective(objective);
                      }}
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteObjective(objective.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* New Objective Form */}
      {showNewObjective ? (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Novo Objetivo Estratégico</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="objTitle">Título do Objetivo</Label>
              <Input
                id="objTitle"
                placeholder="Ex: Aumentar eficiência operacional"
                value={newObjective.title}
                onChange={(e) => setNewObjective({ ...newObjective, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="objDesc">Descrição</Label>
              <Input
                id="objDesc"
                placeholder="Descreva o objetivo estratégico"
                value={newObjective.description}
                onChange={(e) => setNewObjective({ ...newObjective, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="objOwnerId">Responsável</Label>
                <select
                  id="objOwnerId"
                  value={newObjective.ownerId}
                  onChange={(e) => setNewObjective({ ...newObjective, ownerId: e.target.value })}
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
                {!!newObjective.ownerId && (
                  <p className="text-xs text-muted-foreground">{getUserEmail(newObjective.ownerId)}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="objDepartment">Área/Departamento</Label>
                <select
                  id="objDepartment"
                  value={newObjective.department}
                  onChange={(e) => setNewObjective({ ...newObjective, department: e.target.value })}
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
            <div className="space-y-2">
              <Label htmlFor="objDate">Data Alvo</Label>
              <Input
                id="objDate"
                type="date"
                value={newObjective.targetDate}
                onChange={(e) => setNewObjective({ ...newObjective, targetDate: e.target.value })}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewObjective(false)}>
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button onClick={handleAddObjective} disabled={saving}>
                <Save className="h-4 w-4 mr-1" />
                {saving ? "Salvando..." : "Criar Objetivo"}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Button onClick={() => setShowNewObjective(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Objetivo Estratégico
        </Button>
      )}
    </div>
  );
}
