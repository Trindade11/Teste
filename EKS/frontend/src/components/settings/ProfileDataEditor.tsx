"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  User, 
  Building, 
  Award, 
  Target, 
  Save, 
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Database,
} from "lucide-react";

interface ProfileData {
  fullName: string;
  email: string;
  jobRole: string;
  company: string;
  department: string;
  roleDescription: string;
  departmentDescription: string;
  profileDescription: string;
  competencies: string[];
  primaryObjective: string;
  topChallenges: string;
}

interface Neo4jProfileData {
  user: {
    userId: string;
    email: string;
    name: string;
    role: string;
    company: string;
    organizationType: string | null;
    jobTitle: string | null;
    relationshipType: string | null;
    accessTypes: string[];
    status: string | null;
    createdAt: any;
    updatedAt: any;
  };
  onboardingResponse: {
    roleDescription?: string;
    departmentDescription?: string;
    profileDescription?: string;
    competencies?: string[];
    primaryObjective?: string;
    topChallenges?: string;
    orgChartValidated?: boolean;
    createdAt?: string;
    updatedAt?: string;
    defaultVisibility?: string;
    memoryLevel?: string;
  } | null;
  department: string | null;
  organization: string | null;
  location: string | null;
}

export function ProfileDataEditor() {
  const { user } = useAuthStore();
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: "",
    email: "",
    jobRole: "",
    company: "",
    department: "",
    roleDescription: "",
    departmentDescription: "",
    profileDescription: "",
    competencies: [],
    primaryObjective: "",
    topChallenges: "",
  });

  const [originalData, setOriginalData] = useState<ProfileData | null>(null);
  const [neo4jData, setNeo4jData] = useState<Neo4jProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [competencyDraft, setCompetencyDraft] = useState("");

  useEffect(() => {
    if (!user?.email) return;
    loadProfileData();
  }, [user?.email]);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const [draftResult, neo4jResult] = await Promise.all([
        api.getOnboardingDraft(),
        api.getUserProfileData(),
      ]);

      if (neo4jResult.success && neo4jResult.data) {
        setNeo4jData(neo4jResult.data);
      } else {
        setNeo4jData(null);
      }

      const draft = draftResult.success ? draftResult.data?.draft : undefined;
      const onboardingResponse = neo4jResult.success ? neo4jResult.data?.onboardingResponse : null;

      const data: ProfileData = {
        fullName: user?.name || neo4jResult.data?.user?.name || "",
        email: user?.email || neo4jResult.data?.user?.email || "",
        jobRole: (user as any)?.jobRole || neo4jResult.data?.user?.jobTitle || "",
        company: user?.company || neo4jResult.data?.user?.company || "",
        department: (user as any)?.department || neo4jResult.data?.department || "",
        roleDescription: draft?.roleDescription ?? onboardingResponse?.roleDescription ?? "",
        departmentDescription: draft?.departmentDescription ?? onboardingResponse?.departmentDescription ?? "",
        profileDescription: draft?.profileDescription ?? onboardingResponse?.profileDescription ?? "",
        competencies: draft?.competencies ?? onboardingResponse?.competencies ?? [],
        primaryObjective: draft?.primaryObjective ?? onboardingResponse?.primaryObjective ?? "",
        topChallenges: draft?.topChallenges ?? onboardingResponse?.topChallenges ?? "",
      };

      setProfileData(data);
      setOriginalData(data);
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof ProfileData, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    setSaveStatus('idle');
  };

  const addCompetency = () => {
    const value = competencyDraft.trim();
    if (!value) return;
    setCompetencyDraft("");
    updateField("competencies", [...profileData.competencies, value]);
  };

  const updateCompetencyAt = (index: number, value: string) => {
    const nextCompetencies = [...profileData.competencies];
    nextCompetencies[index] = value;
    updateField("competencies", nextCompetencies);
  };

  const removeCompetencyAt = (index: number) => {
    updateField("competencies", profileData.competencies.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      const result = await api.saveOnboardingDraft({
        roleDescription: profileData.roleDescription,
        departmentDescription: profileData.departmentDescription,
        profileDescription: profileData.profileDescription,
        competencies: profileData.competencies,
        primaryObjective: profileData.primaryObjective,
        topChallenges: profileData.topChallenges,
      });

      if (result.success) {
        setSaveStatus('success');
        setOriginalData(profileData);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Failed to save profile data:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (originalData) {
      setProfileData(originalData);
      setSaveStatus('idle');
    }
  };

  const hasChanges = originalData && JSON.stringify(profileData) !== JSON.stringify(originalData);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Carregando dados do perfil...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Dados do Perfil</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Edite as informações coletadas durante o First-Run Onboarding
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button
              onClick={handleReset}
              variant="outline"
              className="gap-2"
              type="button"
            >
              <RotateCcw className="h-4 w-4" />
              Descartar
            </Button>
          )}
          <Button
            onClick={handleSave}
            className="gap-2"
            disabled={isSaving || !hasChanges}
            type="button"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-800">Alterações salvas com sucesso!</span>
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-800">Erro ao salvar alterações. Tente novamente.</span>
        </div>
      )}

      {/* Seção: Perfil Pessoal */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Perfil Pessoal</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label>Nome completo</Label>
              <Input
                value={profileData.fullName}
                disabled
                className="mt-1 bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Campo gerenciado pelo administrador
              </p>
            </div>

            <div>
              <Label>Email</Label>
              <Input
                value={profileData.email}
                disabled
                className="mt-1 bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Campo gerenciado pelo administrador
              </p>
            </div>

            <div>
              <Label>Função</Label>
              <Input
                value={profileData.jobRole}
                disabled
                className="mt-1 bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Campo gerenciado pelo administrador
              </p>
            </div>

            <div>
              <Label htmlFor="profileDescription">Sobre você</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-2">
                Conte brevemente sobre seu perfil e estilo de trabalho
              </p>
              <Textarea
                id="profileDescription"
                value={profileData.profileDescription}
                onChange={(e) => updateField("profileDescription", e.target.value)}
                className="min-h-[110px]"
                placeholder="Ex: Sou orientado a dados, gosto de clareza e execução..."
                maxLength={800}
              />
              <div className="text-xs text-muted-foreground text-right mt-1">
                {profileData.profileDescription.length}/800 caracteres
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Seção: Organização */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Organização</h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label>Empresa</Label>
              <Input
                value={profileData.company}
                disabled
                className="mt-1 bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Campo gerenciado pelo administrador
              </p>
            </div>

            <div>
              <Label>Departamento</Label>
              <Input
                value={profileData.department}
                disabled
                className="mt-1 bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Campo gerenciado pelo administrador
              </p>
            </div>

            <div>
              <Label htmlFor="roleDescription">Descrição da sua função na instituição</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-2">
                Descreva qual é o seu papel e responsabilidades dentro da organização
              </p>
              <Textarea
                id="roleDescription"
                value={profileData.roleDescription}
                onChange={(e) => updateField("roleDescription", e.target.value)}
                className="min-h-[100px]"
                placeholder="Ex: Sou responsável por liderar a área de processos..."
                maxLength={600}
              />
              <div className="text-xs text-muted-foreground text-right mt-1">
                {profileData.roleDescription.length}/600 caracteres
              </div>
            </div>

            <div>
              <Label htmlFor="departmentDescription">Descrição do papel da sua área na organização</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-2">
                O que a sua área representa e qual o impacto dela na organização
              </p>
              <Textarea
                id="departmentDescription"
                value={profileData.departmentDescription}
                onChange={(e) => updateField("departmentDescription", e.target.value)}
                className="min-h-[100px]"
                placeholder="Ex: A Gerência de Processos é responsável por..."
                maxLength={600}
              />
              <div className="text-xs text-muted-foreground text-right mt-1">
                {profileData.departmentDescription.length}/600 caracteres
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Seção: Competências */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Competências Profissionais</h3>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={competencyDraft}
                onChange={(e) => setCompetencyDraft(e.target.value)}
                placeholder="Adicionar competência..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetency())}
                className="flex-1"
              />
              <Button
                onClick={addCompetency}
                disabled={!competencyDraft.trim()}
                className="gap-2"
                type="button"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-2">
              {profileData.competencies.map((competency, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={competency}
                    onChange={(e) => updateCompetencyAt(index, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => removeCompetencyAt(index)}
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {profileData.competencies.length === 0 && (
                <div className="text-center text-muted-foreground py-4 border border-dashed border-border rounded-lg">
                  Nenhuma competência adicionada
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Seção: Objetivos */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Objetivos e Desafios</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="primaryObjective">Objetivo Principal</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-2">
                Qual é seu principal objetivo profissional atual?
              </p>
              <Textarea
                id="primaryObjective"
                value={profileData.primaryObjective}
                onChange={(e) => updateField("primaryObjective", e.target.value)}
                className="min-h-[100px]"
                placeholder="Ex: Implementar uma cultura de melhoria contínua..."
                maxLength={600}
              />
              <div className="text-xs text-muted-foreground text-right mt-1">
                {profileData.primaryObjective.length}/600 caracteres
              </div>
            </div>

            <div>
              <Label htmlFor="topChallenges">Principais Desafios</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-2">
                Quais são seus maiores desafios atualmente?
              </p>
              <Textarea
                id="topChallenges"
                value={profileData.topChallenges}
                onChange={(e) => updateField("topChallenges", e.target.value)}
                className="min-h-[100px]"
                placeholder="Ex: Resistência à mudança, falta de recursos..."
                maxLength={600}
              />
              <div className="text-xs text-muted-foreground text-right mt-1">
                {profileData.topChallenges.length}/600 caracteres
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Seção: Dados do Neo4j */}
      {neo4jData && (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Dados no Neo4j</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-border rounded-lg bg-muted/20 space-y-2">
                <div className="text-sm font-medium">Usuário</div>
                <div className="text-sm text-muted-foreground">{neo4jData.user.name} • {neo4jData.user.email}</div>
                <div className="text-sm text-muted-foreground">{neo4jData.user.jobTitle || '—'} • {neo4jData.department || '—'}</div>
                <div className="text-sm text-muted-foreground">{neo4jData.organization || neo4jData.user.company || '—'} • {neo4jData.location || '—'}</div>
              </div>

              <div className="p-4 border border-border rounded-lg bg-muted/20 space-y-2">
                <div className="text-sm font-medium">Onboarding</div>
                <div className="text-sm text-muted-foreground">Objetivo: {neo4jData.onboardingResponse?.primaryObjective || '—'}</div>
                <div className="text-sm text-muted-foreground">Desafio: {neo4jData.onboardingResponse?.topChallenges || '—'}</div>
              </div>
            </div>

            <div className="p-4 border border-border rounded-lg bg-muted/20">
              <div className="text-sm font-medium mb-2">Competências</div>
              <div className="flex flex-wrap gap-2">
                {(neo4jData.onboardingResponse?.competencies || []).length > 0 ? (
                  (neo4jData.onboardingResponse?.competencies || []).map((c, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 bg-muted rounded">
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
