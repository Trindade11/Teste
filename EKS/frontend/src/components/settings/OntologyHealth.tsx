"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Activity,
  BarChart3,
  RefreshCw,
  Loader2,
  AlertCircle,
  Heart,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Users,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Shield,
  Lightbulb,
  FileCheck,
  Target,
  Eye,
  CircleDot,
} from "lucide-react";

// ============================================================================
// INTERFACES
// ============================================================================

interface HealthData {
  totalNodes: number;
  totalRelationships: number;
  relsPerNode: number;
  avgTotalDegree: number;
  degree: {
    avg: number;
    p50: number;
    p90: number;
    max: number;
    min: number;
    p90p50Ratio: number;
  };
  orphans: number;
  orphanPercent: number;
  healthScore: number;
  histogram: Array<{ degree: number; count: number }>;
}

interface Supernode {
  label: string;
  name: string;
  degree: number;
  isAboveP90: boolean;
}

interface SupernodesData {
  supernodes: Supernode[];
  p90Threshold: number;
}

interface PropertyStat {
  name: string;
  filledCount: number;
  fillPercent: number;
}

interface CompletenessItem {
  label: string;
  totalNodes: number;
  properties: PropertyStat[];
  overallCompleteness: number;
}

interface TemporalData {
  growth: { newNodes7d: number; newNodes30d: number };
  growthByLabel: Array<{ label: string; count: number }>;
  staleNodes: Array<{ label: string; name: string; daysSinceUpdate: number }>;
  ageByLabel: Array<{ label: string; total: number; avgAgeDays: number }>;
  recentActivity: Array<{
    relType: string;
    from: { label: string; name: string };
    to: { label: string; name: string };
  }>;
}

interface GovernanceItem {
  id: string;
  title: string;
  category: "decision" | "risk" | "insight" | "knowledge" | "task";
  status: "pending" | "validated" | "expired" | "unlinked" | "stale";
  owner?: string;
  daysPending: number;
  linkedTo?: string;
  severity?: "low" | "medium" | "high" | "critical";
}

interface GovernanceData {
  summary: {
    decisionsAwaitingValidation: number;
    decisionsWithoutImplementation: number;
    risksWithoutMitigation: number;
    insightsWithoutAction: number;
    knowledgeWithoutValidation: number;
    staleTasksCount: number;
    governanceScore: number;
  };
  items: GovernanceItem[];
}

type HealthView = "dashboard" | "supernodes" | "properties" | "temporal" | "governance";

// ============================================================================
// COMPONENT
// ============================================================================

export function OntologyHealth() {
  const [activeView, setActiveView] = useState<HealthView>("dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [health, setHealth] = useState<HealthData | null>(null);
  const [supernodes, setSupernodes] = useState<SupernodesData | null>(null);
  const [completeness, setCompleteness] = useState<CompletenessItem[]>([]);
  const [temporal, setTemporal] = useState<TemporalData | null>(null);
  const [expandedLabels, setExpandedLabels] = useState<Set<string>>(new Set());

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const { api } = await import("@/lib/api");

    try {
      const healthRes = await api.getOntologyHealth();
      if (healthRes.success) setHealth(healthRes.data);

      const supernodesRes = await api.getOntologyHealthSupernodes(15);
      if (supernodesRes.success) setSupernodes(supernodesRes.data);

      const completenessRes = await api.getOntologyHealthCompleteness();
      if (completenessRes.success) setCompleteness(completenessRes.data || []);

      const temporalRes = await api.getOntologyHealthTemporal();
      if (temporalRes.success) setTemporal(temporalRes.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao carregar dados de saúde"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-500";
    if (score >= 6) return "text-yellow-500";
    if (score >= 4) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return "bg-emerald-500/10 border-emerald-500/30";
    if (score >= 6) return "bg-yellow-500/10 border-yellow-500/30";
    if (score >= 4) return "bg-orange-500/10 border-orange-500/30";
    return "bg-red-500/10 border-red-500/30";
  };

  const getMetricStatus = (
    value: number,
    goodMin: number,
    goodMax: number
  ): "good" | "warn" | "bad" => {
    if (value >= goodMin && value <= goodMax) return "good";
    if (value < goodMin * 0.5 || value > goodMax * 2) return "bad";
    return "warn";
  };

  const StatusIcon = ({ status }: { status: "good" | "warn" | "bad" }) => {
    if (status === "good")
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (status === "warn")
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const toggleLabel = (label: string) => {
    setExpandedLabels((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  // ============================================================================
  // VIEWS
  // ============================================================================

  const views: { id: HealthView; label: string; icon: React.ReactNode }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <Activity className="h-4 w-4" />,
    },
    {
      id: "supernodes",
      label: "Supernós",
      icon: <Zap className="h-4 w-4" />,
    },
    {
      id: "properties",
      label: "Propriedades",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      id: "temporal",
      label: "Temporal",
      icon: <Clock className="h-4 w-4" />,
    },
    {
      id: "governance",
      label: "Governança",
      icon: <Shield className="h-4 w-4" />,
    },
  ];

  // ============================================================================
  // RENDER: DASHBOARD
  // ============================================================================

  const renderDashboard = () => {
    if (!health) return null;

    const maxBarCount = Math.max(...health.histogram.map((h) => h.count), 1);

    return (
      <div className="space-y-6">
        {/* Health Score */}
        <Card
          className={cn(
            "p-6 border-2",
            getScoreBg(health.healthScore)
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground font-medium">
                Health Score
              </div>
              <div
                className={cn(
                  "text-5xl font-bold mt-1",
                  getScoreColor(health.healthScore)
                )}
              >
                {health.healthScore}
                <span className="text-lg text-muted-foreground font-normal">
                  /10
                </span>
              </div>
            </div>
            <Heart
              className={cn(
                "h-12 w-12",
                getScoreColor(health.healthScore)
              )}
            />
          </div>
        </Card>

        {/* Vital Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            label="R/N"
            value={health.relsPerNode}
            description="Relações por nó"
            status={getMetricStatus(health.relsPerNode, 1, 3)}
          />
          <MetricCard
            label="p50"
            value={health.degree.p50}
            description="Mediana de grau"
            status="good"
          />
          <MetricCard
            label="p90"
            value={health.degree.p90}
            description="Percentil 90"
            status={getMetricStatus(health.degree.p90, 1, 10)}
          />
          <MetricCard
            label="p90/p50"
            value={health.degree.p90p50Ratio}
            description="Concentração"
            status={getMetricStatus(health.degree.p90p50Ratio, 0, 5)}
          />
          <MetricCard
            label="Max"
            value={health.degree.max}
            description="Grau máximo"
            status={
              health.degree.max > health.degree.avg * 10 ? "warn" : "good"
            }
          />
          <MetricCard
            label="Órfãos"
            value={`${health.orphanPercent}%`}
            description={`${health.orphans} nós isolados`}
            status={getMetricStatus(100 - health.orphanPercent, 90, 100)}
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Total de Nós
            </div>
            <div className="text-3xl font-bold">{health.totalNodes}</div>
          </Card>
          <Card className="p-5">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Total de Relações
            </div>
            <div className="text-3xl font-bold">
              {health.totalRelationships}
            </div>
          </Card>
        </div>

        {/* Degree Histogram */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Distribuição de Grau
          </h3>
          <div className="space-y-1.5">
            {health.histogram.map((bar) => (
              <div key={bar.degree} className="flex items-center gap-3">
                <div className="w-12 text-right text-xs text-muted-foreground font-mono">
                  {bar.degree}
                </div>
                <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden relative">
                  <div
                    className={cn(
                      "h-full rounded-sm transition-all",
                      bar.degree === health.degree.p50
                        ? "bg-blue-500"
                        : bar.degree === Math.round(health.degree.p90)
                        ? "bg-orange-500"
                        : bar.degree === health.degree.max
                        ? "bg-red-500"
                        : "bg-primary/60"
                    )}
                    style={{
                      width: `${(bar.count / maxBarCount) * 100}%`,
                    }}
                  />
                </div>
                <div className="w-10 text-xs text-muted-foreground font-mono text-right">
                  {bar.count}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-6 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-blue-500 rounded-sm inline-block" />{" "}
              p50 ({health.degree.p50})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-orange-500 rounded-sm inline-block" />{" "}
              p90 ({health.degree.p90})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-500 rounded-sm inline-block" />{" "}
              Max ({health.degree.max})
            </span>
          </div>
        </Card>
      </div>
    );
  };

  // ============================================================================
  // RENDER: SUPERNODES
  // ============================================================================

  const renderSupernodes = () => {
    if (!supernodes) return null;

    return (
      <div className="space-y-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Top Supernós</h3>
              <p className="text-sm text-muted-foreground">
                Nós mais conectados do grafo (threshold p90:{" "}
                {supernodes.p90Threshold})
              </p>
            </div>
            <Zap className="h-6 w-6 text-yellow-500" />
          </div>

          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-[40px,1fr,100px,80px,80px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
              <span>#</span>
              <span>Nome</span>
              <span>Tipo</span>
              <span className="text-right">Grau</span>
              <span className="text-center">Status</span>
            </div>

            {supernodes.supernodes.map((node, i) => {
              const maxDeg =
                supernodes.supernodes[0]?.degree || 1;
              return (
                <div
                  key={`${node.label}-${node.name}-${i}`}
                  className="grid grid-cols-[40px,1fr,100px,80px,80px] gap-2 px-3 py-2.5 rounded-lg hover:bg-muted/50 items-center"
                >
                  <span className="text-sm font-mono text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium truncate">
                    {node.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground w-fit">
                    {node.label}
                  </span>
                  <div className="text-right">
                    <span className="text-sm font-bold">{node.degree}</span>
                    <div
                      className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden"
                    >
                      <div
                        className={cn(
                          "h-full rounded-full",
                          node.isAboveP90
                            ? "bg-orange-500"
                            : "bg-primary/60"
                        )}
                        style={{
                          width: `${(node.degree / maxDeg) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-center">
                    {node.isAboveP90 ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/30">
                        &gt; p90
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                        Normal
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  };

  // ============================================================================
  // RENDER: PROPERTIES (Completeness)
  // ============================================================================

  const renderProperties = () => {
    if (!completeness.length) {
      return (
        <Card className="p-8 text-center text-muted-foreground">
          Nenhum dado de completude disponível
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Completude de propriedades por label — quanto mais verde, mais
          preenchido
        </div>

        {completeness.map((item) => {
          const isExpanded = expandedLabels.has(item.label);
          return (
            <Card key={item.label} className="overflow-hidden">
              <button
                type="button"
                onClick={() => toggleLabel(item.label)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">
                    ({item.totalNodes} nós)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        item.overallCompleteness >= 80
                          ? "bg-emerald-500"
                          : item.overallCompleteness >= 50
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      )}
                      style={{
                        width: `${item.overallCompleteness}%`,
                      }}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-sm font-bold w-12 text-right",
                      item.overallCompleteness >= 80
                        ? "text-emerald-500"
                        : item.overallCompleteness >= 50
                        ? "text-yellow-500"
                        : "text-red-500"
                    )}
                  >
                    {item.overallCompleteness}%
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-4 border-t">
                  <div className="space-y-2 mt-3">
                    {item.properties.map((prop) => (
                      <div
                        key={prop.name}
                        className="flex items-center gap-3"
                      >
                        <span className="w-40 text-xs font-mono text-muted-foreground truncate">
                          {prop.name}
                        </span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              prop.fillPercent >= 80
                                ? "bg-emerald-500/70"
                                : prop.fillPercent >= 50
                                ? "bg-yellow-500/70"
                                : prop.fillPercent > 0
                                ? "bg-red-500/70"
                                : "bg-muted"
                            )}
                            style={{
                              width: `${prop.fillPercent}%`,
                            }}
                          />
                        </div>
                        <span className="w-16 text-xs text-right text-muted-foreground">
                          {prop.filledCount}/{item.totalNodes}
                        </span>
                        <span className="w-10 text-xs font-medium text-right">
                          {prop.fillPercent}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    );
  };

  // ============================================================================
  // MOCK DATA (fallback quando propriedades temporais ainda não existem)
  // ============================================================================

  const MOCK_TEMPORAL: TemporalData = {
    growth: { newNodes7d: 23, newNodes30d: 87 },
    growthByLabel: [
      { label: "Knowledge", count: 34 },
      { label: "Document", count: 22 },
      { label: "Chunk", count: 15 },
      { label: "Message", count: 8 },
      { label: "User", count: 5 },
      { label: "Task", count: 3 },
    ],
    staleNodes: [
      { label: "Company", name: "Alocc Gestão Patrimonial", daysSinceUpdate: 92 },
      { label: "Department", name: "Diretoria Financeira", daysSinceUpdate: 78 },
      { label: "Objective", name: "Aumentar captação líquida", daysSinceUpdate: 65 },
      { label: "User", name: "Carlos Mendes", daysSinceUpdate: 54 },
      { label: "OKR", name: "Retenção acima de 95%", daysSinceUpdate: 45 },
      { label: "Project", name: "Portal do Investidor", daysSinceUpdate: 38 },
      { label: "Knowledge", name: "Política de Compliance", daysSinceUpdate: 31 },
      { label: "Document", name: "Ata Reunião Diretoria", daysSinceUpdate: 22 },
    ],
    ageByLabel: [
      { label: "Company", total: 1, avgAgeDays: 120 },
      { label: "Department", total: 5, avgAgeDays: 95 },
      { label: "User", total: 18, avgAgeDays: 88 },
      { label: "Objective", total: 6, avgAgeDays: 72 },
      { label: "OKR", total: 12, avgAgeDays: 60 },
      { label: "Project", total: 8, avgAgeDays: 45 },
      { label: "Knowledge", total: 42, avgAgeDays: 30 },
      { label: "Document", total: 35, avgAgeDays: 25 },
      { label: "Chunk", total: 210, avgAgeDays: 20 },
      { label: "Message", total: 156, avgAgeDays: 12 },
    ],
    recentActivity: [
      { relType: "EXTRACTED_FROM", from: { label: "Knowledge", name: "Política ESG" }, to: { label: "Document", name: "Relatório Anual 2024" } },
      { relType: "SUPPORTS", from: { label: "Knowledge", name: "Análise de Risco" }, to: { label: "Objective", name: "Governança robusta" } },
      { relType: "MENTIONS", from: { label: "Document", name: "Ata Comitê Invest." }, to: { label: "User", name: "Ana Beatriz" } },
      { relType: "LINKED_TO_OKR", from: { label: "Project", name: "CRM Integrado" }, to: { label: "OKR", name: "NPS > 80" } },
      { relType: "MEMBER_OF", from: { label: "User", name: "Rafael Lima" }, to: { label: "Department", name: "Tecnologia" } },
      { relType: "HAS_CHUNK", from: { label: "Document", name: "Manual Operacional" }, to: { label: "Chunk", name: "chunk-0042" } },
      { relType: "BELONGS_TO", from: { label: "Knowledge", name: "Fluxo de Caixa" }, to: { label: "Department", name: "Financeiro" } },
      { relType: "MEASURED_BY", from: { label: "Objective", name: "Eficiência operacional" }, to: { label: "OKR", name: "Reduzir custo 15%" } },
      { relType: "GENERATES", from: { label: "Conversation", name: "Chat Strategy" }, to: { label: "Knowledge", name: "Insights Q4" } },
      { relType: "REPORTS_TO", from: { label: "User", name: "Mariana Costa" }, to: { label: "User", name: "João Diretor" } },
    ],
  };

  // ============================================================================
  // RENDER: TEMPORAL
  // ============================================================================

  const renderTemporal = () => {
    const hasRealData =
      temporal &&
      (temporal.growth.newNodes7d > 0 ||
        temporal.growth.newNodes30d > 0 ||
        temporal.growthByLabel.length > 0 ||
        temporal.staleNodes.length > 0 ||
        temporal.ageByLabel.length > 0 ||
        temporal.recentActivity.length > 0);

    const data = hasRealData ? temporal! : MOCK_TEMPORAL;
    const isDemo = !hasRealData;

    return (
      <div className="space-y-6">
        {/* Demo Banner */}
        {isDemo && (
          <Card className="p-4 border-2 border-amber-500/30 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-amber-700 dark:text-amber-400">
                  Dados de Demonstração
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  As propriedades temporais (<code className="text-xs bg-muted px-1 rounded">createdAt</code>,{" "}
                  <code className="text-xs bg-muted px-1 rounded">updatedAt</code>) ainda não foram
                  adicionadas aos nós do grafo. Os dados abaixo são simulados para
                  demonstrar o que será exibido quando as propriedades temporais estiverem populadas.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Growth Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className={cn("p-5", isDemo && "opacity-90")}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-medium text-muted-foreground">
                Últimos 7 dias
              </span>
              {isDemo && <DemoBadge />}
            </div>
            <div className="text-3xl font-bold">
              +{data.growth.newNodes7d}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                nós
              </span>
            </div>
          </Card>
          <Card className={cn("p-5", isDemo && "opacity-90")}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-muted-foreground">
                Últimos 30 dias
              </span>
              {isDemo && <DemoBadge />}
            </div>
            <div className="text-3xl font-bold">
              +{data.growth.newNodes30d}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                nós
              </span>
            </div>
          </Card>
        </div>

        {/* Growth by Label */}
        {data.growthByLabel.length > 0 && (
          <Card className={cn("p-5", isDemo && "opacity-90")}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-semibold">
                Crescimento por Tipo (30d)
              </h3>
              {isDemo && <DemoBadge />}
            </div>
            <div className="space-y-2">
              {data.growthByLabel.map((item) => {
                const maxCount = data.growthByLabel[0]?.count || 1;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-3"
                  >
                    <span className="w-32 text-sm truncate">{item.label}</span>
                    <div className="flex-1 h-4 bg-muted rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-blue-500/60 rounded-sm"
                        style={{
                          width: `${(item.count / maxCount) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="w-10 text-sm font-mono text-right">
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Stale Nodes */}
        {data.staleNodes.length > 0 && (
          <Card className={cn("p-5", isDemo && "opacity-90")}>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg font-semibold">
                Nós Mais Antigos sem Atualização
              </h3>
              {isDemo && <DemoBadge />}
            </div>
            <div className="space-y-1">
              {data.staleNodes.map((node, i) => (
                <div
                  key={`${node.label}-${node.name}-${i}`}
                  className="flex items-center gap-3 px-2 py-2 rounded hover:bg-muted/30"
                >
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {node.label}
                  </span>
                  <span className="text-sm flex-1 truncate">{node.name}</span>
                  <span
                    className={cn(
                      "text-xs font-mono",
                      node.daysSinceUpdate > 60
                        ? "text-red-500"
                        : node.daysSinceUpdate > 30
                        ? "text-orange-500"
                        : "text-muted-foreground"
                    )}
                  >
                    {node.daysSinceUpdate}d
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Age by Label */}
        {data.ageByLabel.length > 0 && (
          <Card className={cn("p-5", isDemo && "opacity-90")}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-semibold">
                Idade Média por Tipo
              </h3>
              {isDemo && <DemoBadge />}
            </div>
            <div className="space-y-2">
              {data.ageByLabel.map((item) => {
                const maxAge = data.ageByLabel[0]?.avgAgeDays || 1;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 px-2 py-1.5"
                  >
                    <div className="flex items-center gap-2 w-40">
                      <span className="text-sm">{item.label}</span>
                      <span className="text-xs text-muted-foreground">
                        ({item.total})
                      </span>
                    </div>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          item.avgAgeDays > 90
                            ? "bg-red-500/60"
                            : item.avgAgeDays > 60
                            ? "bg-orange-500/60"
                            : item.avgAgeDays > 30
                            ? "bg-yellow-500/60"
                            : "bg-emerald-500/60"
                        )}
                        style={{
                          width: `${(item.avgAgeDays / maxAge) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-mono w-12 text-right">
                      {item.avgAgeDays}d
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Recent Activity */}
        {data.recentActivity.length > 0 && (
          <Card className={cn("p-5", isDemo && "opacity-90")}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-semibold">
                Atividade Recente
              </h3>
              {isDemo && <DemoBadge />}
            </div>
            <div className="space-y-1.5">
              {data.recentActivity.map((act, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/30 text-sm"
                >
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {act.from.label}
                  </span>
                  <span className="truncate max-w-[120px]">
                    {act.from.name}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs font-mono text-primary/80">
                    {act.relType}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {act.to.label}
                  </span>
                  <span className="truncate max-w-[120px]">
                    {act.to.name}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  };

  // ============================================================================
  // MOCK DATA: GOVERNANCE
  // ============================================================================

  const MOCK_GOVERNANCE: GovernanceData = {
    summary: {
      decisionsAwaitingValidation: 4,
      decisionsWithoutImplementation: 3,
      risksWithoutMitigation: 2,
      insightsWithoutAction: 5,
      knowledgeWithoutValidation: 8,
      staleTasksCount: 6,
      governanceScore: 52,
    },
    items: [
      { id: "gov-1", title: "Migrar processos de aprovação para workflow digital", category: "decision", status: "pending", owner: "Carlos Silva", daysPending: 18, linkedTo: "Objetivo: Eficiência operacional" },
      { id: "gov-2", title: "Adotar política ESG para novos investimentos", category: "decision", status: "pending", owner: "Diretoria", daysPending: 32, severity: "high" },
      { id: "gov-3", title: "Reestruturar equipe de compliance", category: "decision", status: "expired", owner: "João Pedro", daysPending: 45 },
      { id: "gov-4", title: "Contratar consultor de dados", category: "decision", status: "pending", owner: "Ana Costa", daysPending: 12, linkedTo: "Projeto: Implementação EKS" },
      { id: "gov-5", title: "Dependência do módulo de IA para insights", category: "risk", status: "unlinked", severity: "high", daysPending: 30, linkedTo: "Objetivo: Acelerar decisão" },
      { id: "gov-6", title: "Baixa adesão ao onboarding da plataforma", category: "risk", status: "unlinked", severity: "critical", daysPending: 22 },
      { id: "gov-7", title: "Processo de aprovação pode ser automatizado", category: "insight", status: "pending", daysPending: 15, linkedTo: "OKR: Automatizar 50 processos" },
      { id: "gov-8", title: "Clientes demonstram interesse em expansão", category: "insight", status: "stale", daysPending: 40 },
      { id: "gov-9", title: "Área comercial gera 60% do conhecimento episódico", category: "insight", status: "pending", daysPending: 8 },
      { id: "gov-10", title: "Oportunidade de cross-sell no segmento PJ", category: "insight", status: "stale", daysPending: 55 },
      { id: "gov-11", title: "Modelo de score de risco para carteira", category: "insight", status: "pending", daysPending: 5, linkedTo: "Projeto: CRM Integrado" },
      { id: "gov-12", title: "Política de Compliance v2", category: "knowledge", status: "pending", daysPending: 28, owner: "Compliance" },
      { id: "gov-13", title: "Manual Operacional - Seção Financeira", category: "knowledge", status: "pending", daysPending: 35, owner: "Operações" },
      { id: "gov-14", title: "Fluxo de Aprovação de Crédito", category: "knowledge", status: "stale", daysPending: 60, owner: "Crédito" },
      { id: "gov-15", title: "Guia de Integração de Novos Colaboradores", category: "knowledge", status: "pending", daysPending: 14, owner: "RH" },
      { id: "gov-16", title: "Base de Perguntas Frequentes - Atendimento", category: "knowledge", status: "pending", daysPending: 42, owner: "Suporte" },
      { id: "gov-17", title: "Documentação API Partners", category: "knowledge", status: "stale", daysPending: 70, owner: "Tecnologia" },
      { id: "gov-18", title: "Procedimento de Backup e DR", category: "knowledge", status: "pending", daysPending: 20, owner: "Infraestrutura" },
      { id: "gov-19", title: "Glossário de Termos Financeiros", category: "knowledge", status: "pending", daysPending: 10, owner: "Gestão" },
      { id: "gov-20", title: "Implementar dashboard de acompanhamento", category: "task", status: "stale", daysPending: 25, owner: "João Pedro", linkedTo: "Projeto: Implementação EKS" },
      { id: "gov-21", title: "Revisar taxonomia de documentos", category: "task", status: "pending", daysPending: 18, owner: "Paula Mendes" },
      { id: "gov-22", title: "Configurar alertas de SLA", category: "task", status: "stale", daysPending: 33, owner: "Ana Costa" },
      { id: "gov-23", title: "Mapear processos área Comercial", category: "task", status: "pending", daysPending: 10, owner: "Maria Santos", linkedTo: "OKR: Documentar 100 processos" },
      { id: "gov-24", title: "Treinar equipe no uso da plataforma", category: "task", status: "stale", daysPending: 44, owner: "Carlos Silva" },
      { id: "gov-25", title: "Validar dados importados do CRM", category: "task", status: "pending", daysPending: 7, owner: "Rafael Lima" },
    ],
  };

  // ============================================================================
  // RENDER: GOVERNANCE
  // ============================================================================

  const renderGovernance = () => {
    const gov = MOCK_GOVERNANCE;
    const { summary } = gov;

    const categoryConfig: Record<
      GovernanceItem["category"],
      { label: string; icon: React.ReactNode; color: string; bgColor: string }
    > = {
      decision: {
        label: "Decisões",
        icon: <Target className="h-4 w-4" />,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-500/10 border-blue-500/30",
      },
      risk: {
        label: "Riscos",
        icon: <AlertTriangle className="h-4 w-4" />,
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-500/10 border-red-500/30",
      },
      insight: {
        label: "Insights",
        icon: <Lightbulb className="h-4 w-4" />,
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-500/10 border-amber-500/30",
      },
      knowledge: {
        label: "Conhecimentos",
        icon: <FileCheck className="h-4 w-4" />,
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-500/10 border-emerald-500/30",
      },
      task: {
        label: "Tarefas",
        icon: <CircleDot className="h-4 w-4" />,
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-500/10 border-purple-500/30",
      },
    };

    const statusConfig: Record<
      GovernanceItem["status"],
      { label: string; color: string; dotColor: string }
    > = {
      pending: { label: "Aguardando", color: "text-amber-600", dotColor: "bg-amber-500" },
      validated: { label: "Validado", color: "text-emerald-600", dotColor: "bg-emerald-500" },
      expired: { label: "Expirado", color: "text-red-600", dotColor: "bg-red-500" },
      unlinked: { label: "Sem vínculo", color: "text-orange-600", dotColor: "bg-orange-500" },
      stale: { label: "Obsoleto", color: "text-gray-500", dotColor: "bg-gray-400" },
    };

    const severityColors: Record<string, string> = {
      low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };

    const getScoreColor = (score: number) => {
      if (score >= 80) return "text-emerald-500";
      if (score >= 60) return "text-yellow-500";
      if (score >= 40) return "text-orange-500";
      return "text-red-500";
    };

    const getScoreBg = (score: number) => {
      if (score >= 80) return "bg-emerald-500/10 border-emerald-500/30";
      if (score >= 60) return "bg-yellow-500/10 border-yellow-500/30";
      if (score >= 40) return "bg-orange-500/10 border-orange-500/30";
      return "bg-red-500/10 border-red-500/30";
    };

    const categories: GovernanceItem["category"][] = [
      "decision",
      "risk",
      "insight",
      "knowledge",
      "task",
    ];

    return (
      <div className="space-y-6">
        {/* Demo Banner */}
        <Card className="p-4 border-2 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-amber-700 dark:text-amber-400">
                Dados de Demonstração
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Esta aba monitora o <strong>cuidado da informação</strong>: decisões
                sem implementação, riscos sem mitigação, insights sem ação, conhecimentos
                sem validação. Os dados abaixo são simulados até a integração com o grafo.
              </p>
            </div>
          </div>
        </Card>

        {/* Governance Score */}
        <Card
          className={cn(
            "p-6 border-2",
            getScoreBg(summary.governanceScore)
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground font-medium">
                Governance Score
              </div>
              <div
                className={cn(
                  "text-5xl font-bold mt-1",
                  getScoreColor(summary.governanceScore)
                )}
              >
                {summary.governanceScore}
                <span className="text-lg text-muted-foreground font-normal">
                  /100
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Quanto maior, melhor o cuidado da informação organizacional
              </p>
            </div>
            <Shield
              className={cn(
                "h-12 w-12",
                getScoreColor(summary.governanceScore)
              )}
            />
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="p-3 border border-blue-500/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Decisões</span>
              <Target className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {summary.decisionsAwaitingValidation}
            </div>
            <div className="text-[10px] text-muted-foreground">aguardando validação</div>
          </Card>

          <Card className="p-3 border border-orange-500/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Sem ação</span>
              <Eye className="h-3.5 w-3.5 text-orange-500" />
            </div>
            <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
              {summary.decisionsWithoutImplementation}
            </div>
            <div className="text-[10px] text-muted-foreground">decisões sem implementar</div>
          </Card>

          <Card className="p-3 border border-red-500/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Riscos</span>
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            </div>
            <div className="text-xl font-bold text-red-600 dark:text-red-400">
              {summary.risksWithoutMitigation}
            </div>
            <div className="text-[10px] text-muted-foreground">sem mitigação</div>
          </Card>

          <Card className="p-3 border border-amber-500/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Insights</span>
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
              {summary.insightsWithoutAction}
            </div>
            <div className="text-[10px] text-muted-foreground">sem ação vinculada</div>
          </Card>

          <Card className="p-3 border border-emerald-500/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Conhecimentos</span>
              <FileCheck className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {summary.knowledgeWithoutValidation}
            </div>
            <div className="text-[10px] text-muted-foreground">sem validação humana</div>
          </Card>

          <Card className="p-3 border border-purple-500/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Tarefas</span>
              <CircleDot className="h-3.5 w-3.5 text-purple-500" />
            </div>
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {summary.staleTasksCount}
            </div>
            <div className="text-[10px] text-muted-foreground">estagnadas</div>
          </Card>
        </div>

        {/* Items by Category */}
        {categories.map((cat) => {
          const catItems = gov.items.filter((item) => item.category === cat);
          if (catItems.length === 0) return null;
          const config = categoryConfig[cat];
          const isExpanded = expandedLabels.has(`gov-${cat}`);

          return (
            <Card key={cat} className="overflow-hidden">
              <button
                type="button"
                onClick={() => toggleLabel(`gov-${cat}`)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={cn("flex items-center gap-2", config.color)}>
                    {config.icon}
                    <span className="font-medium">{config.label}</span>
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {catItems.length} itens
                  </span>
                  <DemoBadge />
                </div>
                <div className="flex items-center gap-2">
                  {catItems.filter((i) => i.status === "expired" || i.status === "stale").length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/30">
                      {catItems.filter((i) => i.status === "expired" || i.status === "stale").length} atenção
                    </span>
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-4 border-t">
                  <div className="space-y-1.5 mt-3">
                    {catItems.map((item) => {
                      const sConf = statusConfig[item.status];
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/30 transition-colors"
                        >
                          <span className={cn("w-2 h-2 rounded-full flex-shrink-0", sConf.dotColor)} />
                          <span className="text-sm flex-1 truncate">{item.title}</span>
                          {item.severity && (
                            <span
                              className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                                severityColors[item.severity]
                              )}
                            >
                              {item.severity}
                            </span>
                          )}
                          {item.owner && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {item.owner}
                            </span>
                          )}
                          {item.linkedTo && (
                            <span className="text-xs text-primary/70 flex items-center gap-1 max-w-[140px] truncate">
                              <ArrowRight className="h-3 w-3 flex-shrink-0" />
                              {item.linkedTo}
                            </span>
                          )}
                          <span
                            className={cn(
                              "text-xs font-mono flex-shrink-0",
                              item.daysPending > 30
                                ? "text-red-500"
                                : item.daysPending > 14
                                ? "text-orange-500"
                                : "text-muted-foreground"
                            )}
                          >
                            {item.daysPending}d
                          </span>
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0",
                              sConf.color,
                              "bg-muted"
                            )}
                          >
                            {sConf.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-500" />
            Saúde Ontológica
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Métricas dinâmicas, temporais e de qualidade do grafo
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Atualizar
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="p-4 border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </Card>
      )}

      {/* View Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        {views.map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => setActiveView(view.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
              activeView === view.id
                ? "bg-background text-foreground shadow-sm font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {view.icon}
            {view.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && !health && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Content */}
      {!loading || health ? (
        <>
          {activeView === "dashboard" && renderDashboard()}
          {activeView === "supernodes" && renderSupernodes()}
          {activeView === "properties" && renderProperties()}
          {activeView === "temporal" && renderTemporal()}
          {activeView === "governance" && renderGovernance()}
        </>
      ) : null}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function MetricCard({
  label,
  value,
  description,
  status,
}: {
  label: string;
  value: number | string;
  description: string;
  status: "good" | "warn" | "bad";
}) {
  const statusColors = {
    good: "border-emerald-500/30",
    warn: "border-yellow-500/30",
    bad: "border-red-500/30",
  };

  return (
    <Card className={cn("p-3 border", statusColors[status])}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground font-medium">
          {label}
        </span>
        {status === "good" && (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        )}
        {status === "warn" && (
          <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
        )}
        {status === "bad" && <XCircle className="h-3.5 w-3.5 text-red-500" />}
      </div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">
        {description}
      </div>
    </Card>
  );
}

function DemoBadge() {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-medium uppercase tracking-wider">
      demo
    </span>
  );
}
