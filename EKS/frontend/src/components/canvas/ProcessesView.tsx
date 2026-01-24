"use client";

import { useState, useEffect } from "react";
import { 
  GitBranch, 
  Building2,
  Users,
  Network,
  RefreshCw,
  CheckCircle2,
  Circle,
  X,
  Layers,
  AlertTriangle,
  UserCheck,
  UserX,
  TrendingUp,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MermaidDiagram } from "@/components/ui/mermaid-diagram";
import { cn } from "@/lib/utils";

type MenuItemId = "overview" | "departments" | "hierarchy" | "processes";

interface MenuItem {
  id: MenuItemId;
  title: string;
  icon: React.ReactNode;
  description: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: "overview", title: "Visão Geral", icon: <Building2 className="w-4 h-4" />, description: "Estrutura organizacional" },
  { id: "departments", title: "Áreas", icon: <Layers className="w-4 h-4" />, description: "Departamentos e equipes" },
  { id: "hierarchy", title: "Hierarquia", icon: <Network className="w-4 h-4" />, description: "Organograma" },
  { id: "processes", title: "Mapeamento", icon: <GitBranch className="w-4 h-4" />, description: "Mapeamento efetivo" },
];

interface StructureData {
  organization: { name: string; userCount: number };
  departments: Array<{ name: string; memberCount: number }>;
  counts: { users: number; departments: number; organizations: number };
  hierarchyDepth: number;
}

interface MermaidData {
  mermaid: string;
  organization: string;
  departmentCount: number;
}

interface PIAStructure {
  organization: {
    name: string;
    description: string;
    type: string;
  } | null;
  departments: Array<{
    name: string;
    memberCount: number;
    hasProcesses: boolean;
  }>;
  users: {
    total: number;
    withOnboarding: number;
    withoutOnboarding: number;
  };
  mappingCoverage: {
    departmentsMapped: number;
    totalDepartments: number;
    percentageMapped: number;
  };
}

interface OnboardingUser {
  name: string;
  email: string;
  jobTitle: string;
  department: string;
  roleDescription: string;
  primaryObjective: string;
  competencies: string[];
}

export function ProcessesView({ onClose }: { onClose?: () => void }) {
  const [currentItem, setCurrentItem] = useState<MenuItemId>("overview");
  const [structureData, setStructureData] = useState<StructureData | null>(null);
  const [mermaidData, setMermaidData] = useState<MermaidData | null>(null);
  const [piaData, setPiaData] = useState<PIAStructure | null>(null);
  const [onboardingUsers, setOnboardingUsers] = useState<OnboardingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStructureData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

      const [overviewRes, mermaidRes, piaRes, onboardingRes] = await Promise.all([
        fetch(`${apiUrl}/structure/overview`, { headers }),
        fetch(`${apiUrl}/structure/mermaid`, { headers }),
        fetch(`${apiUrl}/pia/organizational-structure`, { headers }),
        fetch(`${apiUrl}/pia/onboarding-summary`, { headers })
      ]);

      if (piaRes.status === 401) {
        setError('Sessão expirada. Por favor, faça login novamente.');
        return;
      }

      if (!piaRes.ok) {
        const errorText = await piaRes.text();
        console.error('PIA Error:', piaRes.status, errorText);
        setError(`Erro ao carregar PIA: ${piaRes.status} - ${piaRes.statusText}`);
        return;
      }

      const piaJson = await piaRes.json();
      if (piaJson.success) {
        setPiaData(piaJson.data);
      } else {
        console.error('PIA API Error:', piaJson.error);
        setError(`Erro na API PIA: ${piaJson.error}`);
      }

      if (onboardingRes.ok) {
        const onboardingJson = await onboardingRes.json();
        if (onboardingJson.success) setOnboardingUsers(onboardingJson.data.users || []);
      }

      if (overviewRes.ok) {
        const overviewJson = await overviewRes.json();
        if (overviewJson.success) setStructureData(overviewJson.data);
      }

      if (mermaidRes.ok) {
        const mermaidJson = await mermaidRes.json();
        if (mermaidJson.success) setMermaidData(mermaidJson.data);
      }

      if (piaRes.ok) {
        const piaJson = await piaRes.json();
        if (piaJson.success) setPiaData(piaJson.data);
      }

      if (onboardingRes.ok) {
        const onboardingJson = await onboardingRes.json();
        if (onboardingJson.success) setOnboardingUsers(onboardingJson.data.users || []);
      }
    } catch (err) {
      setError('Erro ao carregar dados da estrutura');
      console.error('Structure load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStructureData();
  }, []);

  const getMenuTitle = () => MENU_ITEMS.find(m => m.id === currentItem)?.title || "";

  return (
    <div className="relative h-full w-full overflow-hidden bg-muted/30">
      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Main Container - Same frame as OnboardingWizard */}
      <div className="relative h-full w-full p-4">
        <div className="h-full w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <span className="font-semibold truncate">Estrutura Organizacional</span>
                {(piaData?.users?.total ?? structureData?.counts?.users) !== undefined && (
                  <Badge variant="secondary" className="text-xs">
                    {piaData?.users?.total ?? structureData?.counts?.users ?? 0} colaboradores
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Seção atual: {getMenuTitle()}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => loadStructureData()} title="Atualizar">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden flex">
            
            {/* Sidebar Menu - Same style as OnboardingWizard Roadmap */}
            <div className="w-72 border-r border-border bg-muted/30 p-4 overflow-y-auto">
              <div className="text-xs font-medium text-muted-foreground mb-3">
                Navegação
              </div>
              <div className="space-y-1">
                {MENU_ITEMS.map((item) => {
                  const isActive = item.id === currentItem;
                  const hasData = item.id === "overview"
                    ? !!piaData
                    : item.id === "departments"
                      ? (piaData?.departments?.length || 0) > 0
                      : true;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentItem(item.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-colors cursor-pointer",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {hasData ? (
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm truncate block">{item.title}</span>
                        <span className="text-[10px] text-muted-foreground truncate block">{item.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Stats Card */}
              {structureData && (
                <div className="mt-4 rounded-lg border border-border bg-card p-3">
                  <div className="text-xs font-medium mb-2">Resumo</div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Organização:</span>
                      <span className="font-medium text-foreground">{piaData?.organization?.name || structureData.organization.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Colaboradores:</span>
                      <span className="font-medium text-foreground">{piaData?.users?.total ?? structureData.counts.users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Departamentos:</span>
                      <span className="font-medium text-foreground">{piaData?.mappingCoverage?.totalDepartments ?? structureData.counts.departments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Níveis hierárquicos:</span>
                      <span className="font-medium text-foreground">{structureData.hierarchyDepth || '—'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Carregando estrutura...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={loadStructureData}>
                      Tentar novamente
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Overview */}
                  {currentItem === "overview" && (
                    <div className="max-w-4xl space-y-6">
                      <div>
                        <h2 className="text-xl font-semibold mb-2">Visão Geral da Estrutura</h2>
                        <p className="text-sm text-muted-foreground">
                          Visualização macro da organização baseada nos dados ingeridos.
                        </p>
                      </div>

                      {/* Mermaid Diagram */}
                      {mermaidData?.mermaid && (
                        <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background p-6">
                          <div className="text-sm font-medium text-primary mb-4">📊 Estrutura Organizacional</div>
                          <MermaidDiagram chart={mermaidData.mermaid} />
                        </div>
                      )}

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="rounded-lg border bg-card p-4">
                          <div className="flex items-center gap-2 text-primary mb-1">
                            <Building2 className="w-4 h-4" />
                            <span className="text-xs font-medium">Organização</span>
                          </div>
                          <div className="text-lg font-bold">{piaData?.organization?.name || structureData?.organization.name || '—'}</div>
                        </div>
                        <div className="rounded-lg border bg-card p-4">
                          <div className="flex items-center gap-2 text-blue-500 mb-1">
                            <Users className="w-4 h-4" />
                            <span className="text-xs font-medium">Colaboradores</span>
                          </div>
                          <div className="text-lg font-bold">{piaData?.users?.total ?? structureData?.counts.users ?? 0}</div>
                        </div>
                        <div className="rounded-lg border bg-card p-4">
                          <div className="flex items-center gap-2 text-green-500 mb-1">
                            <Layers className="w-4 h-4" />
                            <span className="text-xs font-medium">Departamentos</span>
                          </div>
                          <div className="text-lg font-bold">{piaData?.mappingCoverage?.totalDepartments ?? structureData?.counts.departments ?? 0}</div>
                        </div>
                        <div className="rounded-lg border bg-card p-4">
                          <div className="flex items-center gap-2 text-green-600 mb-1">
                            <UserCheck className="w-4 h-4" />
                            <span className="text-xs font-medium">Onboardings</span>
                          </div>
                          <div className="text-lg font-bold">{piaData?.users?.withOnboarding ?? 0}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Departments */}
                  {currentItem === "departments" && (
                    <div className="max-w-4xl space-y-6">
                      <div>
                        <h2 className="text-xl font-semibold mb-2">Áreas e Departamentos</h2>
                        <p className="text-sm text-muted-foreground">
                          Departamentos mapeados a partir da ingestão inicial.
                        </p>
                      </div>

                      <div className="space-y-2">
                        {piaData?.departments.map((dept, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Layers className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{dept.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {dept.memberCount} membro{dept.memberCount !== 1 ? 's' : ''}
                              </div>
                            </div>
                            <Badge variant="secondary">{dept.memberCount}</Badge>
                          </div>
                        ))}

                        {(!piaData?.departments || piaData.departments.length === 0) && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Nenhum departamento encontrado</p>
                            <p className="text-xs">Execute a ingestão de dados para mapear áreas</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Hierarchy */}
                  {currentItem === "hierarchy" && (
                    <div className="max-w-4xl space-y-6">
                      <div>
                        <h2 className="text-xl font-semibold mb-2">Hierarquia Organizacional</h2>
                        <p className="text-sm text-muted-foreground">
                          Estrutura hierárquica baseada nos relacionamentos REPORTS_TO.
                        </p>
                      </div>

                      <div className="rounded-xl border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-background p-6">
                        <div className="text-sm font-medium text-blue-500 mb-4">🏛️ Organograma</div>
                        <div className="text-center text-muted-foreground py-8">
                          <Network className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="text-sm">Visualização de hierarquia em desenvolvimento</p>
                          <p className="text-xs mt-1">Profundidade atual: {structureData?.hierarchyDepth || 0} níveis</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Processes */}
                  {currentItem === "processes" && (
                    <div className="max-w-4xl space-y-6">
                      <div>
                        <h2 className="text-xl font-semibold mb-2">Mapeamento</h2>
                        <p className="text-sm text-muted-foreground">
                          Cobertura de mapeamento e ponto de partida para o mapeamento efetivo.
                        </p>
                      </div>

                      {/* Cobertura de Mapeamento */}
                      {piaData && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="rounded-lg border bg-card p-4">
                            <div className="flex items-center gap-2 text-blue-500 mb-2">
                              <Users className="w-4 h-4" />
                              <span className="text-xs font-medium">Usuários</span>
                            </div>
                            <div className="text-2xl font-bold">{piaData.users.total}</div>
                            <div className="flex items-center gap-2 mt-2 text-xs">
                              <UserCheck className="w-3 h-3 text-green-500" />
                              <span className="text-green-600">{piaData.users.withOnboarding} com onboarding</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <UserX className="w-3 h-3 text-orange-500" />
                              <span className="text-orange-600">{piaData.users.withoutOnboarding} pendentes</span>
                            </div>
                          </div>

                          <div className="rounded-lg border bg-card p-4">
                            <div className="flex items-center gap-2 text-green-500 mb-2">
                              <Layers className="w-4 h-4" />
                              <span className="text-xs font-medium">Departamentos</span>
                            </div>
                            <div className="text-2xl font-bold">{piaData.mappingCoverage.totalDepartments}</div>
                            <div className="mt-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Cobertura</span>
                                <span className="font-medium">{piaData.mappingCoverage.percentageMapped}%</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-green-500 transition-all"
                                  style={{ width: `${piaData.mappingCoverage.percentageMapped}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="rounded-lg border bg-card p-4">
                            <div className="flex items-center gap-2 text-purple-500 mb-2">
                              <TrendingUp className="w-4 h-4" />
                              <span className="text-xs font-medium">Progresso</span>
                            </div>
                            <div className="text-2xl font-bold">
                              {piaData.users.total > 0 
                                ? Math.round((piaData.users.withOnboarding / piaData.users.total) * 100) 
                                : 0}%
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                              Onboardings completos
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Usuários com Onboarding Completo */}
                      <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background p-6">
                        <div className="flex items-center gap-2 text-sm font-medium text-primary mb-4">
                          <Sparkles className="w-4 h-4" />
                          Colaboradores com Onboarding Completo
                        </div>
                        
                        {onboardingUsers.length > 0 ? (
                          <div className="space-y-3">
                            {onboardingUsers.map((user, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                              >
                                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                                  <UserCheck className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{user.name}</span>
                                    <Badge variant="secondary" className="text-[10px]">
                                      {user.department}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground">{user.jobTitle}</div>
                                  {user.roleDescription && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                      {user.roleDescription}
                                    </p>
                                  )}
                                  {user.competencies?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {user.competencies.slice(0, 3).map((comp, i) => (
                                        <Badge key={i} variant="outline" className="text-[10px]">
                                          {comp}
                                        </Badge>
                                      ))}
                                      {user.competencies.length > 3 && (
                                        <Badge variant="outline" className="text-[10px]">
                                          +{user.competencies.length - 3}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <UserX className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Nenhum onboarding completo ainda</p>
                            <p className="text-xs">Os colaboradores precisam completar o First-Run Onboarding</p>
                          </div>
                        )}
                      </div>

                      {/* Departamentos e Status de Mapeamento */}
                      {piaData?.departments && piaData.departments.length > 0 && (
                        <div>
                          <div className="text-sm font-medium mb-3">Departamentos</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {piaData.departments.map((dept, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                              >
                                <div className={cn(
                                  "p-2 rounded-lg",
                                  dept.hasProcesses ? "bg-green-500/10" : "bg-muted"
                                )}>
                                  <Layers className={cn(
                                    "w-4 h-4",
                                    dept.hasProcesses ? "text-green-500" : "text-muted-foreground"
                                  )} />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{dept.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {dept.memberCount} membro{dept.memberCount !== 1 ? 's' : ''}
                                  </div>
                                </div>
                                {dept.hasProcesses ? (
                                  <Badge className="bg-green-500/10 text-green-600 text-[10px]">
                                    Mapeado
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-[10px]">
                                    Pendente
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Próximos Passos */}
                      <div className="rounded-lg border border-border bg-muted/30 p-4">
                        <div className="text-xs font-medium mb-2">💡 Próximo Passo: Mapeamento Efetivo</div>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• Colaboradores com onboarding podem iniciar mapeamento de processos</li>
                          <li>• Sistema sugere processos baseado no papel e objetivos</li>
                          <li>• Mapeamentos se conectam entre departamentos automaticamente</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
