"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Network,
  TreePine,
  BookText,
  Database,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Loader2,
  AlertCircle,
  Eye,
  Users,
  Target,
  FolderKanban,
  FileText,
  Brain,
  Building2,
  Link2,
  Hash,
  Layers,
  BarChart3,
  ArrowRight,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";

// ============================================================================
// INTERFACES
// ============================================================================

interface NodeLabel {
  label: string;
  count: number;
  description: string;
}

interface RelationshipType {
  type: string;
  count: number;
  description: string;
}

interface OntologyStats {
  totalNodes: number;
  totalRelationships: number;
  nodeLabels: NodeLabel[];
  relationshipTypes: RelationshipType[];
  lastUpdated: string;
}

interface TaxonomyNode {
  id: string;
  name: string;
  type: string;
  level: number;
  children: TaxonomyNode[];
  properties: Record<string, unknown>;
}

interface ThesaurusEntry {
  id: string;
  canonicalName: string;
  aliases: string[];
  type: string;
  context: string;
}

interface IngestionSource {
  name: string;
  description: string;
  nodeTypes: string[];
  relationshipTypes: string[];
  nodeCount: number;
  lastIngestion: string | null;
}

interface SchemaPattern {
  from: string[];
  relationship: string;
  to: string[];
}

// ============================================================================
// VIEW TYPES
// ============================================================================

type ViewType = "overview" | "taxonomy" | "thesaurus" | "ingestion" | "schema";

const VIEW_TABS = [
  { id: "overview" as ViewType, label: "Visão Geral", icon: Eye },
  { id: "taxonomy" as ViewType, label: "Taxonomia", icon: TreePine },
  { id: "thesaurus" as ViewType, label: "Tesauro", icon: BookText },
  { id: "ingestion" as ViewType, label: "Fontes de Injeção", icon: Database },
  { id: "schema" as ViewType, label: "Schema do Grafo", icon: Network },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getNodeIcon = (type: string) => {
  const icons: Record<string, typeof Users> = {
    User: Users,
    Department: Building2,
    Company: Building2,
    Objective: Target,
    OKR: Target,
    Project: FolderKanban,
    Knowledge: Brain,
    Document: FileText,
    Root: Layers,
  };
  return icons[type] || Hash;
};

const getNodeColor = (type: string) => {
  const colors: Record<string, string> = {
    User: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    Department: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
    Company: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30",
    Objective: "text-green-600 bg-green-100 dark:bg-green-900/30",
    OKR: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30",
    Project: "text-pink-600 bg-pink-100 dark:bg-pink-900/30",
    Knowledge: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
    Document: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
    Root: "text-gray-600 bg-gray-100 dark:bg-gray-800",
  };
  return colors[type] || "text-gray-600 bg-gray-100 dark:bg-gray-800";
};

// ============================================================================
// COMPONENT
// ============================================================================

export function OntologyViewer() {
  const [activeView, setActiveView] = useState<ViewType>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [stats, setStats] = useState<OntologyStats | null>(null);
  const [taxonomy, setTaxonomy] = useState<TaxonomyNode[]>([]);
  const [thesaurus, setThesaurus] = useState<ThesaurusEntry[]>([]);
  const [ingestionSources, setIngestionSources] = useState<IngestionSource[]>([]);
  const [schemaPatterns, setSchemaPatterns] = useState<SchemaPattern[]>([]);

  // UI states
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [thesaurusFilter, setThesaurusFilter] = useState("");
  const [thesaurusTypeFilter, setThesaurusTypeFilter] = useState<string>("all");

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const { api } = await import("@/lib/api");

    try {
      // Load stats
      const statsResponse = await api.getOntologyStats();
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      // Load taxonomy
      const taxonomyResponse = await api.getOntologyTaxonomy();
      if (taxonomyResponse.success) {
        setTaxonomy(taxonomyResponse.data || []);
        // Expand root nodes by default
        const rootIds = new Set<string>((taxonomyResponse.data || []).map((n: TaxonomyNode) => n.id));
        setExpandedNodes(rootIds);
      }

      // Load thesaurus
      const thesaurusResponse = await api.getOntologyThesaurus();
      if (thesaurusResponse.success) {
        setThesaurus(thesaurusResponse.data || []);
      }

      // Load ingestion sources
      const ingestionResponse = await api.getOntologyIngestionSources();
      if (ingestionResponse.success) {
        setIngestionSources(ingestionResponse.data || []);
      }

      // Load schema
      const schemaResponse = await api.getOntologySchema();
      if (schemaResponse.success && schemaResponse.data?.patterns) {
        setSchemaPatterns(schemaResponse.data.patterns || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar dados da ontologia");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderTaxonomyNode = (node: TaxonomyNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const Icon = getNodeIcon(node.type);
    const colorClass = getNodeColor(node.type);

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            "flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors",
            depth > 0 && "ml-4"
          )}
          style={{ marginLeft: depth * 16 }}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )
          ) : (
            <div className="w-4" />
          )}

          <div className={cn("p-1 rounded", colorClass)}>
            <Icon className="h-3.5 w-3.5" />
          </div>

          <span className="text-sm font-medium truncate">{node.name}</span>

          <span className="text-xs text-muted-foreground ml-auto">
            {node.type}
          </span>
        </div>

        {hasChildren && isExpanded && (
          <div className="border-l border-border ml-4">
            {node.children.map((child) => renderTaxonomyNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // VIEW: OVERVIEW
  // ============================================================================

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Hash className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.totalNodes || 0}</div>
              <div className="text-xs text-muted-foreground">Nós no Grafo</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Link2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.totalRelationships || 0}</div>
              <div className="text-xs text-muted-foreground">Relacionamentos</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Layers className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.nodeLabels?.length || 0}</div>
              <div className="text-xs text-muted-foreground">Tipos de Nó</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Network className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.relationshipTypes?.length || 0}</div>
              <div className="text-xs text-muted-foreground">Tipos de Relação</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Node Labels */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Tipos de Nós (Labels)
        </h3>
        <div className="space-y-2">
          {stats?.nodeLabels?.map((label) => {
            const Icon = getNodeIcon(label.label);
            const colorClass = getNodeColor(label.label);
            return (
              <div key={label.label} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                <div className={cn("p-1.5 rounded", colorClass)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{label.label}</div>
                  <div className="text-xs text-muted-foreground truncate">{label.description}</div>
                </div>
                <div className="text-sm font-semibold text-muted-foreground">
                  {label.count}
                </div>
              </div>
            );
          })}
          {(!stats?.nodeLabels || stats.nodeLabels.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum tipo de nó encontrado
            </p>
          )}
        </div>
      </Card>

      {/* Relationship Types */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Tipos de Relacionamentos
        </h3>
        <div className="space-y-2">
          {stats?.relationshipTypes?.map((rel) => (
            <div key={rel.type} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
              <div className="p-1.5 rounded bg-gray-100 dark:bg-gray-800">
                <ArrowRight className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm font-medium">{rel.type}</div>
                <div className="text-xs text-muted-foreground truncate">{rel.description}</div>
              </div>
              <div className="text-sm font-semibold text-muted-foreground">
                {rel.count}
              </div>
            </div>
          ))}
          {(!stats?.relationshipTypes || stats.relationshipTypes.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum tipo de relacionamento encontrado
            </p>
          )}
        </div>
      </Card>
    </div>
  );

  // ============================================================================
  // VIEW: TAXONOMY
  // ============================================================================

  const renderTaxonomy = () => (
    <div className="space-y-4">
      <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <TreePine className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Taxonomia Hierárquica
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Visualização hierárquica dos conceitos organizacionais, estratégicos e de projetos.
              Clique nos nós para expandir/recolher.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        {taxonomy.length > 0 ? (
          <div className="space-y-1">
            {taxonomy.map((node) => renderTaxonomyNode(node))}
          </div>
        ) : (
          <div className="text-center py-8">
            <TreePine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Nenhuma estrutura taxonômica encontrada.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Injete dados (organograma, OKRs, projetos) para construir a taxonomia.
            </p>
          </div>
        )}
      </Card>
    </div>
  );

  // ============================================================================
  // VIEW: THESAURUS
  // ============================================================================

  const filteredThesaurus = thesaurus.filter((entry) => {
    const matchesSearch =
      !thesaurusFilter ||
      entry.canonicalName.toLowerCase().includes(thesaurusFilter.toLowerCase()) ||
      entry.aliases.some((a) => a.toLowerCase().includes(thesaurusFilter.toLowerCase()));
    const matchesType = thesaurusTypeFilter === "all" || entry.type === thesaurusTypeFilter;
    return matchesSearch && matchesType;
  });

  const thesaurusTypes = Array.from(new Set(thesaurus.map((e) => e.type))).sort();

  const renderThesaurus = () => (
    <div className="space-y-4">
      <Card className="p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <BookText className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              Tesauro de Termos
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Dicionário de termos canônicos e seus sinônimos/apelidos. Use para padronizar
              nomenclatura e facilitar buscas semânticas.
            </p>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar termo ou sinônimo..."
            value={thesaurusFilter}
            onChange={(e) => setThesaurusFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={thesaurusTypeFilter}
          onChange={(e) => setThesaurusTypeFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
        >
          <option value="all">Todos os tipos</option>
          {thesaurusTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Entries */}
      <Card className="divide-y divide-border">
        {filteredThesaurus.length > 0 ? (
          filteredThesaurus.map((entry) => {
            const Icon = getNodeIcon(entry.type);
            const colorClass = getNodeColor(entry.type);
            return (
              <div key={entry.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn("p-1.5 rounded mt-0.5", colorClass)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{entry.canonicalName}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {entry.type} • {entry.context}
                    </div>
                    {entry.aliases.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.aliases.map((alias) => (
                          <span
                            key={alias}
                            className="text-xs px-2 py-0.5 bg-muted rounded-full"
                          >
                            {alias}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <BookText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              {thesaurusFilter ? "Nenhum termo encontrado para esta busca." : "Nenhum termo no tesauro."}
            </p>
          </div>
        )}
      </Card>
    </div>
  );

  // ============================================================================
  // VIEW: INGESTION SOURCES
  // ============================================================================

  const renderIngestion = () => (
    <div className="space-y-4">
      <Card className="p-4 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
        <div className="flex items-start gap-3">
          <Database className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              Fontes de Injeção
            </p>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              Cada pipeline de injeção contribui com diferentes tipos de nós e relacionamentos
              para o grafo de conhecimento. Veja o status de cada fonte.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ingestionSources.map((source) => (
          <Card key={source.name} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold">{source.name}</h3>
              <span className="text-lg font-bold text-primary">
                {source.nodeCount}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {source.description}
            </p>

            <div className="space-y-2">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Tipos de Nó</div>
                <div className="flex flex-wrap gap-1">
                  {source.nodeTypes.map((type) => (
                    <span key={type} className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Relacionamentos</div>
                <div className="flex flex-wrap gap-1">
                  {source.relationshipTypes.map((type) => (
                    <span key={type} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}

        {ingestionSources.length === 0 && (
          <Card className="p-8 text-center col-span-2">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Nenhuma fonte de injeção configurada.
            </p>
          </Card>
        )}
      </div>
    </div>
  );

  // ============================================================================
  // VIEW: SCHEMA
  // ============================================================================

  const renderSchema = () => (
    <div className="space-y-4">
      <Card className="p-4 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-3">
          <Network className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
              Schema do Grafo Neo4j
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
              Padrões de relacionamento detectados no grafo. Mostra como os diferentes
              tipos de nós estão conectados.
            </p>
          </div>
        </div>
      </Card>

      {/* Schema Patterns */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-4">Padrões de Relacionamento</h3>
        <div className="space-y-2">
          {schemaPatterns.length > 0 ? (
            schemaPatterns.map((pattern, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 font-mono text-sm">
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-700 dark:text-blue-300">
                  {Array.isArray(pattern.from) ? pattern.from.join(", ") : pattern.from}
                </span>
                <span className="text-muted-foreground">-[</span>
                <span className="text-green-600 font-semibold">{pattern.relationship}</span>
                <span className="text-muted-foreground">]-&gt;</span>
                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 rounded text-purple-700 dark:text-purple-300">
                  {Array.isArray(pattern.to) ? pattern.to.join(", ") : pattern.to}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Execute uma query no Neo4j para detectar padrões.
            </p>
          )}
        </div>
      </Card>

      {/* Visual Graph Placeholder */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Distribuição por Tipo
        </h3>
        <div className="space-y-3">
          {stats?.nodeLabels?.slice(0, 8).map((label) => {
            const percentage = stats.totalNodes > 0 ? (label.count / stats.totalNodes) * 100 : 0;
            const colorClass = getNodeColor(label.label);
            return (
              <div key={label.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{label.label}</span>
                  <span className="text-muted-foreground">{label.count} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", colorClass.split(" ")[1])}
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">Ontologia do Projeto</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize a estrutura ontológica, taxonomia, tesauro e fontes de injeção do grafo de conhecimento.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

      {error && (
        <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                Verifique a conexão com o Neo4j.
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* View Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg overflow-x-auto">
        {VIEW_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                activeView === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {loading ? (
        <Card className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Carregando ontologia...</p>
        </Card>
      ) : (
        <>
          {activeView === "overview" && renderOverview()}
          {activeView === "taxonomy" && renderTaxonomy()}
          {activeView === "thesaurus" && renderThesaurus()}
          {activeView === "ingestion" && renderIngestion()}
          {activeView === "schema" && renderSchema()}
        </>
      )}
    </div>
  );
}
