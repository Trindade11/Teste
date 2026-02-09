"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Target,
  FolderKanban,
  Lightbulb,
  Eye,
  ListTodo,
  CheckCircle2,
  PanelLeft,
  PanelLeftClose,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Clock,
  Shield,
} from "lucide-react";
import { ExecutiveConsolidatedView } from "./ExecutiveConsolidatedView";
import { ExecutiveDecisionsView } from "./ExecutiveDecisionsView";
import { ExecutiveRisksView } from "./ExecutiveRisksView";

interface GraphNode {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  variant: "primary" | "secondary" | "accent" | "muted";
}

// Estrutura reformulada: Cockpit Executivo orientado a decisões
// Baseado em "objetos de gestão" (não taxonomia corporativa)
// Hierarquia fixa: Decisões → Riscos → OKRs → Projetos → Insights → Mudanças
const STRATEGIC_NODES: GraphNode[] = [
  { 
    id: "consolidado", 
    label: "Visão Consolidada", 
    icon: <BarChart3 className="w-5 h-5" />, 
    description: "Dashboard executivo geral", 
    variant: "primary" 
  },
  { 
    id: "decisoes", 
    label: "Decisões Pendentes", 
    icon: <CheckCircle2 className="w-5 h-5" />, 
    description: "Decisões que precisam de atenção", 
    variant: "primary" 
  },
  { 
    id: "riscos", 
    label: "Riscos Emergentes", 
    icon: <AlertTriangle className="w-5 h-5" />, 
    description: "Riscos críticos e bloqueios", 
    variant: "secondary" 
  },
  { 
    id: "okrs-risco", 
    label: "OKRs em Risco", 
    icon: <Target className="w-5 h-5" />, 
    description: "Objetivos com desvios ou atrasos", 
    variant: "accent" 
  },
  { 
    id: "projetos-criticos", 
    label: "Projetos Críticos", 
    icon: <FolderKanban className="w-5 h-5" />, 
    description: "Projetos bloqueados ou atrasados", 
    variant: "secondary" 
  },
  { 
    id: "insights-prioritarios", 
    label: "Insights Prioritários", 
    icon: <Lightbulb className="w-5 h-5" />, 
    description: "Descobertas de alto impacto", 
    variant: "muted" 
  },
  { 
    id: "mudancas", 
    label: "Mudanças Recentes", 
    icon: <TrendingUp className="w-5 h-5" />, 
    description: "O que mudou desde a última vez", 
    variant: "muted" 
  },
];

const TACTICAL_NODES: GraphNode[] = [
  { id: "projetos", label: "Projetos", icon: <FolderKanban className="w-5 h-5" />, description: "Projetos da sua área", variant: "primary" },
  { id: "tarefas", label: "Tarefas", icon: <ListTodo className="w-5 h-5" />, description: "Atividades pendentes", variant: "secondary" },
  { id: "insights", label: "Insights", icon: <Lightbulb className="w-5 h-5" />, description: "Descobertas relevantes", variant: "accent" },
];

const OPERATIONAL_NODES: GraphNode[] = [
  { id: "tarefas", label: "Minhas Tarefas", icon: <ListTodo className="w-5 h-5" />, description: "O que fazer hoje", variant: "primary" },
  { id: "projetos", label: "Meus Projetos", icon: <FolderKanban className="w-5 h-5" />, description: "Projetos que participo", variant: "secondary" },
];

function getNodesForAccessType(accessTypes: string[]): GraphNode[] {
  const normalizedTypes = accessTypes.map((t) => t.toLowerCase().trim());

  if (normalizedTypes.includes("estratégico") || normalizedTypes.includes("estrategico") || normalizedTypes.includes("strategic")) {
    return STRATEGIC_NODES;
  }
  if (normalizedTypes.includes("tático") || normalizedTypes.includes("tatico") || normalizedTypes.includes("tactical")) {
    return TACTICAL_NODES;
  }
  return OPERATIONAL_NODES;
}

function getAccessTypeLabel(accessTypes: string[]): string {
  const normalizedTypes = accessTypes.map((t) => t.toLowerCase().trim());

  if (normalizedTypes.includes("estratégico") || normalizedTypes.includes("estrategico") || normalizedTypes.includes("strategic")) {
    return "Cockpit Executivo";
  }
  if (normalizedTypes.includes("tático") || normalizedTypes.includes("tatico") || normalizedTypes.includes("tactical")) {
    return "Visão Tática V2";
  }
  return "Visão Operacional V2";
}

const DEFAULT_COLORS = {
  primary: "#3b82f6",
  secondary: "#6366f1",
  accent: "#8b5cf6",
  muted: "#64748b",
};

function isValidColor(color: string): boolean {
  if (!color) return false;
  if (color.startsWith("#")) {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 230;
  }
  return true;
}

function getNodeStyle(
  variant: GraphNode["variant"],
  themeColors: { primary: string; secondary: string; accent: string }
) {
  let color: string;
  let fallback: string;

  switch (variant) {
    case "primary":
      color = themeColors.primary;
      fallback = DEFAULT_COLORS.primary;
      break;
    case "secondary":
      color = themeColors.secondary;
      fallback = DEFAULT_COLORS.secondary;
      break;
    case "accent":
      color = themeColors.accent;
      fallback = DEFAULT_COLORS.accent;
      break;
    case "muted":
    default:
      return { backgroundColor: DEFAULT_COLORS.muted, borderColor: DEFAULT_COLORS.muted };
  }

  const finalColor = isValidColor(color) ? color : fallback;
  return { backgroundColor: finalColor, borderColor: finalColor };
}

export function GraphNavigatorV2() {
  const { user } = useAuthStore();
  const { config: themeConfig } = useThemeStore();

  const [accessTypes, setAccessTypes] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuCollapsed, setMenuCollapsed] = useState(false);

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const response = await api.getUserProfileData();
        if (response.success && response.data) {
          const roleFromStore = (user?.role || "") as string;
          const roleFromProfile = (response.data.user?.role || "") as string;
          const role = roleFromStore || roleFromProfile;
          const roleNormalized = String(role).toLowerCase().trim();
          const isAdmin = roleNormalized.includes("admin") || roleNormalized.includes("administrador");

          const apiAccessTypes = response.data.user.accessTypes || [];
          const merged = isAdmin ? Array.from(new Set(["Estratégico", ...apiAccessTypes])) : apiAccessTypes;
          setAccessTypes(merged);
          return;
        }

        const roleNormalized = String(user?.role || "").toLowerCase().trim();
        if (roleNormalized.includes("admin") || roleNormalized.includes("administrador")) {
          setAccessTypes(["Estratégico"]);
        }
      } catch {
        const roleNormalized = String(user?.role || "").toLowerCase().trim();
        if (roleNormalized.includes("admin") || roleNormalized.includes("administrador")) {
          setAccessTypes(["Estratégico"]);
        }
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, [user?.role]);

  const nodes = useMemo(() => getNodesForAccessType(accessTypes), [accessTypes]);
  const viewLabel = useMemo(() => getAccessTypeLabel(accessTypes), [accessTypes]);

  // Ao entrar em Cockpit Executivo, abre direto na Visão Consolidada (dashboard executivo)
  useEffect(() => {
    if (loading) return;
    if (selectedNode) return;
    const defaultNode = nodes.find((n) => n.id === "consolidado") ?? nodes[0];
    if (defaultNode) setSelectedNode(defaultNode);
  }, [loading, nodes, selectedNode]);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/30">
        <div className="animate-pulse text-muted-foreground">Carregando navegação...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden bg-muted/30 relative">
      <div className="relative z-10 h-full flex">
        {/* Menu Vertical à Esquerda */}
        <div
          className={cn(
            "h-full flex flex-col border-r border-border bg-card/80 backdrop-blur transition-all duration-300",
            menuCollapsed ? "w-16" : "w-56"
          )}
        >
          <div className="p-3 border-b border-border flex items-center justify-between">
            {!menuCollapsed && (
              <div>
                <h2 className="text-sm font-semibold">{viewLabel}</h2>
                <p className="text-[10px] text-muted-foreground">Navegação</p>
              </div>
            )}
            <button
              onClick={() => setMenuCollapsed(!menuCollapsed)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              title={menuCollapsed ? "Expandir menu" : "Recolher menu"}
            >
              {menuCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex-1 p-2 space-y-1 overflow-auto">
            {nodes.map((node) => (
              <button
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className={cn(
                  "w-full flex items-center gap-3 p-2.5 rounded-lg transition-all",
                  "hover:bg-muted/80",
                  selectedNode?.id === node.id ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/80",
                  menuCollapsed && "justify-center"
                )}
                title={menuCollapsed ? node.label : undefined}
              >
                <div
                  className={cn(
                    "shrink-0 flex items-center justify-center rounded-lg p-1.5",
                    selectedNode?.id === node.id ? "bg-white/20" : "bg-muted/50"
                  )}
                  style={selectedNode?.id === node.id ? undefined : getNodeStyle(node.variant, themeConfig.colors)}
                >
                  <div className={selectedNode?.id === node.id ? "text-current" : "text-white"}>{node.icon}</div>
                </div>
                {!menuCollapsed && (
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-medium truncate">{node.label}</div>
                    <div className="text-[10px] text-current/60 truncate">{node.description}</div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 h-full overflow-hidden bg-card/50">
          {selectedNode?.id === "consolidado" ? (
            <ExecutiveConsolidatedView />
          ) : selectedNode?.id === "decisoes" ? (
            <ExecutiveDecisionsView />
          ) : selectedNode?.id === "riscos" ? (
            <ExecutiveRisksView />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
              <div className="text-center">
                <p className="mb-2">Selecione uma categoria no menu</p>
                <p className="text-xs">Ou comece pela Visão Consolidada</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


