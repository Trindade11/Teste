"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  Plus,
  Search,
  Edit3,
  Trash2,
  Building2,
  UserCheck,
  UserX,
  AlertCircle,
  Loader2,
  X,
  Check,
  RefreshCw,
  Briefcase,
  Target,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PartnerType = "strategic" | "operational" | "tactical";
type ParticipantStatus = "active" | "inactive";

interface ExternalParticipant {
  id: string;
  name: string;
  email?: string;
  organization: string;
  partnerType: PartnerType;
  role?: string;
  notes?: string;
  status: ParticipantStatus;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  email: string;
  organization: string;
  partnerType: PartnerType;
  role: string;
  notes: string;
}

const PARTNER_TYPE_CONFIG: Record<PartnerType, { label: string; icon: typeof Target; color: string; description: string }> = {
  strategic: {
    label: "Estratégico",
    icon: Target,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    description: "Parceiros de alto nível com impacto estratégico",
  },
  operational: {
    label: "Operacional",
    icon: Settings,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    description: "Parceiros do dia-a-dia operacional",
  },
  tactical: {
    label: "Tático",
    icon: Briefcase,
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
    description: "Parceiros para projetos específicos",
  },
};

const initialFormData: FormData = {
  name: "",
  email: "",
  organization: "",
  partnerType: "operational",
  role: "",
  notes: "",
};

export function ExternalParticipantsManager() {
  const [participants, setParticipants] = useState<ExternalParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<PartnerType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<ParticipantStatus | "all">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<ExternalParticipant | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load participants
  const loadParticipants = async () => {
    setLoading(true);
    setError(null);
    try {
      const { api } = await import("@/lib/api");
      const response = await (api as any).getExternalParticipants();
      if (response.success && Array.isArray(response.data)) {
        setParticipants(response.data);
      } else {
        throw new Error(response.error || "Falha ao carregar participantes");
      }
    } catch (err) {
      console.error("Failed to load external participants:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParticipants();
  }, []);

  // Filter participants
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const matchesSearch =
        !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = filterType === "all" || p.partnerType === filterType;
      const matchesStatus = filterStatus === "all" || p.status === filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [participants, searchTerm, filterType, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const total = participants.length;
    const active = participants.filter((p) => p.status === "active").length;
    const byType = {
      strategic: participants.filter((p) => p.partnerType === "strategic").length,
      operational: participants.filter((p) => p.partnerType === "operational").length,
      tactical: participants.filter((p) => p.partnerType === "tactical").length,
    };
    return { total, active, inactive: total - active, byType };
  }, [participants]);

  // Open modal for create
  const handleCreate = () => {
    setEditingParticipant(null);
    setFormData(initialFormData);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleEdit = (participant: ExternalParticipant) => {
    setEditingParticipant(participant);
    setFormData({
      name: participant.name,
      email: participant.email || "",
      organization: participant.organization,
      partnerType: participant.partnerType,
      role: participant.role || "",
      notes: participant.notes || "",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Save (create or update)
  const handleSave = async () => {
    if (!formData.name.trim()) {
      setFormError("Nome é obrigatório");
      return;
    }
    if (!formData.organization.trim()) {
      setFormError("Organização é obrigatória");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const { api } = await import("@/lib/api");

      if (editingParticipant) {
        const response = await (api as any).updateExternalParticipant(editingParticipant.id, formData);
        if (!response.success) {
          throw new Error(response.error || "Falha ao atualizar");
        }
      } else {
        const response = await (api as any).createExternalParticipant(formData);
        if (!response.success) {
          throw new Error(response.error || "Falha ao criar");
        }
      }

      setIsModalOpen(false);
      loadParticipants();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  // Delete (soft)
  const handleDelete = async (id: string) => {
    try {
      const { api } = await import("@/lib/api");
      const response = await (api as any).deleteExternalParticipant(id);
      if (!response.success) {
        throw new Error(response.error || "Falha ao desativar");
      }
      setDeleteConfirmId(null);
      loadParticipants();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao desativar");
    }
  };

  // Reactivate
  const handleReactivate = async (id: string) => {
    try {
      const { api } = await import("@/lib/api");
      const response = await (api as any).reactivateExternalParticipant(id);
      if (!response.success) {
        throw new Error(response.error || "Falha ao reativar");
      }
      loadParticipants();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao reativar");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Participantes Externos</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie parceiros estratégicos, operacionais e táticos que participam de reuniões.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.byType.strategic}</p>
              <p className="text-xs text-muted-foreground">Estratégicos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.byType.operational + stats.byType.tactical}</p>
              <p className="text-xs text-muted-foreground">Operacionais/Táticos</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, organização ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as PartnerType | "all")}
              className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
            >
              <option value="all">Todos os tipos</option>
              <option value="strategic">Estratégico</option>
              <option value="operational">Operacional</option>
              <option value="tactical">Tático</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ParticipantStatus | "all")}
              className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadParticipants} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Participante
            </Button>
          </div>
        </div>
      </Card>

      {/* Error display */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </Card>
      )}

      {/* Participants List */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              {participants.length === 0
                ? "Nenhum participante externo cadastrado"
                : "Nenhum resultado encontrado para os filtros aplicados"}
            </p>
            {participants.length === 0 && (
              <Button onClick={handleCreate} variant="outline" className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Cadastrar primeiro participante
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredParticipants.map((participant) => {
              const typeConfig = PARTNER_TYPE_CONFIG[participant.partnerType];
              const TypeIcon = typeConfig.icon;

              return (
                <div
                  key={participant.id}
                  className={cn(
                    "p-4 hover:bg-muted/50 transition-colors",
                    participant.status === "inactive" && "opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={cn("p-2 rounded-lg border", typeConfig.color)}>
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium truncate">{participant.name}</h4>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full border", typeConfig.color)}>
                            {typeConfig.label}
                          </span>
                          {participant.status === "inactive" && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                              Inativo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5" />
                          <span className="truncate">{participant.organization}</span>
                        </div>
                        {participant.email && (
                          <p className="text-xs text-muted-foreground mt-0.5">{participant.email}</p>
                        )}
                        {participant.role && (
                          <p className="text-xs text-muted-foreground mt-0.5">Cargo: {participant.role}</p>
                        )}
                        {participant.notes && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{participant.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {participant.status === "inactive" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReactivate(participant.id)}
                          title="Reativar"
                        >
                          <RefreshCw className="h-4 w-4 text-green-600" />
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(participant)}
                            title="Editar"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          {deleteConfirmId === participant.id ? (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(participant.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirmId(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmId(participant.id)}
                              title="Desativar"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingParticipant ? "Editar Participante" : "Novo Participante Externo"}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@empresa.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="organization">Organização *</Label>
                  <Input
                    id="organization"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="Nome da empresa parceira"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Cargo</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Ex: Diretor, Gerente..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Parceria *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(PARTNER_TYPE_CONFIG) as [PartnerType, typeof PARTNER_TYPE_CONFIG[PartnerType]][]).map(
                    ([type, config]) => {
                      const Icon = config.icon;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, partnerType: type })}
                          className={cn(
                            "flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors",
                            formData.partnerType === type
                              ? config.color
                              : "bg-background border-border hover:bg-muted"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-xs font-medium">{config.label}</span>
                        </button>
                      );
                    }
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {PARTNER_TYPE_CONFIG[formData.partnerType].description}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informações adicionais sobre o participante..."
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background resize-none h-20 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : editingParticipant ? (
                  "Salvar Alterações"
                ) : (
                  "Criar Participante"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
