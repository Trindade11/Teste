"use client";

import { useState, useEffect } from "react";
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
  ChevronRight,
  CheckCircle2,
  BarChart3,
  Trophy,
  User,
  Clock,
  PanelLeftClose,
  PanelLeft
} from "lucide-react";
import { StrategicDashboard } from "./StrategicDashboard";
import { ProjectDetailPanel } from "./ProjectDetailPanel";
import { TaskDetailPanel } from "./TaskDetailPanel";
import { InsightDetailPanel } from "./InsightDetailPanel";

type AccessType = "estrategico" | "tatico" | "operacional";

interface GraphNode {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  variant: "primary" | "secondary" | "accent" | "muted";
}

const STRATEGIC_NODES: GraphNode[] = [
  { id: "estrategia", label: "Estratégia", icon: <Target className="w-5 h-5" />, description: "Objetivos e OKRs", variant: "primary" },
  { id: "projetos", label: "Projetos", icon: <FolderKanban className="w-5 h-5" />, description: "Iniciativas em andamento", variant: "secondary" },
  { id: "tarefas", label: "Tarefas", icon: <ListTodo className="w-5 h-5" />, description: "Entregas pendentes", variant: "accent" },
  { id: "insights", label: "Insights", icon: <Lightbulb className="w-5 h-5" />, description: "Descobertas e oportunidades", variant: "muted" },
  { id: "visao-externa", label: "Visão Externa", icon: <Eye className="w-5 h-5" />, description: "Mercado e tendências", variant: "muted" },
  { id: "validacoes", label: "Validações", icon: <CheckCircle2 className="w-5 h-5" />, description: "Feed e reconhecimento", variant: "muted" },
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
  const normalizedTypes = accessTypes.map(t => t.toLowerCase().trim());
  
  if (normalizedTypes.includes("estratégico") || normalizedTypes.includes("estrategico") || normalizedTypes.includes("strategic")) {
    return STRATEGIC_NODES;
  }
  if (normalizedTypes.includes("tático") || normalizedTypes.includes("tatico") || normalizedTypes.includes("tactical")) {
    return TACTICAL_NODES;
  }
  return OPERATIONAL_NODES;
}

function getAccessTypeLabel(accessTypes: string[]): string {
  const normalizedTypes = accessTypes.map(t => t.toLowerCase().trim());
  
  if (normalizedTypes.includes("estratégico") || normalizedTypes.includes("estrategico") || normalizedTypes.includes("strategic")) {
    return "Visão Estratégica";
  }
  if (normalizedTypes.includes("tático") || normalizedTypes.includes("tatico") || normalizedTypes.includes("tactical")) {
    return "Visão Tática";
  }
  return "Visão Operacional";
}

interface NodeSummary {
  title: string;
  description: string;
  items: { id: string; name: string; status?: string; meta?: string }[];
  emptyMessage?: string;
}

const NODE_SUMMARIES: Record<string, NodeSummary> = {
  estrategia: {
    title: "Estratégia",
    description: "Objetivos estratégicos e OKRs da organização",
    emptyMessage: "Configure seus objetivos em Configurações > Objetivos Estratégicos",
    items: [
      { id: "obj-1", name: "Aumentar eficiência operacional", status: "70%", meta: "4 OKRs vinculados" },
      { id: "obj-2", name: "Expandir base de conhecimento", status: "45%", meta: "3 OKRs vinculados" },
      { id: "obj-3", name: "Acelerar tomada de decisão", status: "30%", meta: "2 OKRs vinculados" },
    ],
  },
  projetos: {
    title: "Projetos",
    description: "Iniciativas e projetos em andamento",
    emptyMessage: "Nenhum projeto cadastrado ainda",
    items: [
      { id: "proj-1", name: "Implementação EKS", status: "em andamento", meta: "Sprint 1 de 4" },
      { id: "proj-2", name: "Mapeamento de Processos", status: "planejado", meta: "Início em Março" },
      { id: "proj-3", name: "Integração CRM", status: "em andamento", meta: "75% concluído" },
    ],
  },
  tarefas: {
    title: "Tarefas",
    description: "Atividades e entregas pendentes",
    emptyMessage: "Nenhuma tarefa pendente",
    items: [
      { id: "task-1", name: "Revisar cronograma do projeto", status: "urgente", meta: "Vence hoje" },
      { id: "task-2", name: "Preparar apresentação Q1", status: "pendente", meta: "Vence em 3 dias" },
      { id: "task-3", name: "Validar entidades da reunião", status: "pendente", meta: "2 itens" },
      { id: "task-4", name: "Atualizar documentação de processos", status: "concluído", meta: "Ontem" },
    ],
  },
  insights: {
    title: "Insights",
    description: "Descobertas e oportunidades identificadas",
    emptyMessage: "Nenhum insight capturado ainda",
    items: [
      { id: "ins-1", name: "Cliente demonstrou interesse em expansão", status: "novo", meta: "Reunião 01/02" },
      { id: "ins-2", name: "Processo de aprovação pode ser otimizado", status: "validado", meta: "Análise concluída" },
      { id: "ins-3", name: "Oportunidade de automação identificada", status: "em análise", meta: "Impacto alto" },
    ],
  },
  "visao-externa": {
    title: "Visão Externa",
    description: "Mercado, concorrência e tendências",
    emptyMessage: "Nenhuma informação de mercado cadastrada",
    items: [
      { id: "ext-1", name: "Concorrente lançou nova feature", status: "alerta", meta: "Monitorar" },
      { id: "ext-2", name: "Tendência de IA no setor", status: "oportunidade", meta: "Avaliar" },
      { id: "ext-3", name: "Nova regulamentação LGPD", status: "risco", meta: "Prazo: Jun/25" },
    ],
  },
};

const DEFAULT_COLORS = {
  primary: '#3b82f6',
  secondary: '#6366f1',
  accent: '#8b5cf6',
  muted: '#64748b',
};

interface ValidatedItem {
  id: string;
  type: "task" | "decision" | "knowledge" | "insight" | "risk";
  value: string;
  source: string;
  validatedBy: string;
  validatedAt: string;
}

const MOCK_VALIDATED_ITEMS: ValidatedItem[] = [
  { id: "v1", type: "task", value: "Revisar cronograma do projeto", source: "Reunião Q1", validatedBy: "Carlos Silva", validatedAt: "há 5min" },
  { id: "v2", type: "decision", value: "Expandir para região Sul no Q2", source: "Análise de Mercado", validatedBy: "Maria Santos", validatedAt: "há 15min" },
  { id: "v3", type: "knowledge", value: "Processo de onboarding leva 2 semanas", source: "Chat", validatedBy: "João Pedro", validatedAt: "há 1h" },
  { id: "v4", type: "insight", value: "Clientes preferem assinatura mensal", source: "Reunião Comercial", validatedBy: "Ana Costa", validatedAt: "há 2h" },
  { id: "v5", type: "risk", value: "Atraso por dependências externas", source: "Reunião Q1", validatedBy: "Carlos Silva", validatedAt: "há 3h" },
];

const VALIDATION_TYPE_CONFIG: Record<ValidatedItem["type"], { label: string; color: string }> = {
  task: { label: "Tarefa", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  decision: { label: "Decisão", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  knowledge: { label: "Conhecimento", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
  insight: { label: "Insight", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  risk: { label: "Risco", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

function isValidColor(color: string): boolean {
  if (!color) return false;
  // Check if it's a valid hex or hsl color that's not too light
  if (color.startsWith('#')) {
    // Check if hex color is not too light (e.g., #f5f5f5 would be too light)
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 230; // Reject very light colors
  }
  if (color.includes('hsl')) {
    // Check if HSL lightness is not too high
    const match = color.match(/\d+\.?\d*%/g);
    if (match && match.length >= 2) {
      const lightness = parseFloat(match[1]);
      return lightness < 85; // Reject if lightness > 85%
    }
  }
  return true;
}

function getNodeStyle(variant: GraphNode["variant"], themeColors: { primary: string; secondary: string; accent: string }) {
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

  // Use fallback if color is invalid or too light
  const finalColor = isValidColor(color) ? color : fallback;
  return { backgroundColor: finalColor, borderColor: finalColor };
}

 function ValidationsDashboard() {
   const total = MOCK_VALIDATED_ITEMS.length;
   const byType = MOCK_VALIDATED_ITEMS.reduce<Record<ValidatedItem["type"], number>>(
     (acc, item) => {
       acc[item.type] = (acc[item.type] || 0) + 1;
       return acc;
     },
     { task: 0, decision: 0, knowledge: 0, insight: 0, risk: 0 }
   );

   const typeOrder: ValidatedItem["type"][] = ["task", "decision", "knowledge", "insight", "risk"];
   const typeRows = typeOrder
     .map((type) => ({ type, count: byType[type], config: VALIDATION_TYPE_CONFIG[type] }))
     .filter((t) => t.count > 0);

   const impactScore = (byType.decision * 3) + (byType.risk * 3) + (byType.insight * 2) + (byType.knowledge * 2) + (byType.task * 1);

   const byUser = MOCK_VALIDATED_ITEMS.reduce<Record<string, number>>((acc, item) => {
     acc[item.validatedBy] = (acc[item.validatedBy] || 0) + 1;
     return acc;
   }, {});
   const topValidators = Object.entries(byUser)
     .sort((a, b) => b[1] - a[1])
     .slice(0, 3);

   const topValidator = topValidators[0];

   const maxTypeCount = Math.max(1, ...typeRows.map(t => t.count));

   return (
     <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
       <div className="p-6 border-b border-border bg-card/50 backdrop-blur">
         <div className="flex items-center justify-between">
           <div>
             <h2 className="text-2xl font-bold flex items-center gap-2">
               <CheckCircle2 className="w-7 h-7 text-green-500" />
               Validações Recentes
             </h2>
             <p className="text-muted-foreground mt-1">
               Feed de curadoria e reconhecimento do trabalho do time
             </p>
           </div>
           <div className="text-right">
             <div className="text-3xl font-bold">{total}</div>
             <div className="text-xs text-muted-foreground">validações no feed</div>
           </div>
         </div>
       </div>

       <div className="flex-1 overflow-auto p-6">
         <div className="grid grid-cols-12 gap-6">
           <div className="col-span-4 space-y-6">
             <div className="p-5 rounded-xl border bg-card/80 backdrop-blur">
               <h3 className="text-sm font-semibold text-muted-foreground mb-3">SINAIS</h3>
               <div className="grid grid-cols-2 gap-3">
                 <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                   <div className="flex items-center justify-between">
                     <span className="text-xs text-muted-foreground">Impacto</span>
                     <BarChart3 className="w-4 h-4 text-muted-foreground" />
                   </div>
                   <div className="text-2xl font-bold mt-1">{impactScore}</div>
                   <div className="text-[10px] text-muted-foreground">score (mock)</div>
                 </div>
                 <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                   <div className="flex items-center justify-between">
                     <span className="text-xs text-muted-foreground">Top validador</span>
                     <Trophy className="w-4 h-4 text-amber-500" />
                   </div>
                   <div className="text-sm font-semibold mt-1 truncate">{topValidator ? topValidator[0] : "-"}</div>
                   <div className="text-[10px] text-muted-foreground">{topValidator ? `${topValidator[1]} validações` : "Sem dados"}</div>
                 </div>
               </div>
             </div>

             <div className="p-5 rounded-xl border bg-card/80 backdrop-blur">
               <h3 className="text-sm font-semibold text-muted-foreground mb-3">POR TIPO</h3>
               <div className="space-y-3">
                 {typeRows.map(({ type, count, config }) => (
                   <div key={type}>
                     <div className="flex items-center justify-between mb-1">
                       <span className={cn("text-xs px-2 py-0.5 rounded", config.color)}>{config.label}</span>
                       <span className="text-xs font-semibold">{count}</span>
                     </div>
                     <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                       <div
                         className="h-full rounded-full"
                         style={{
                           width: `${Math.round((count / maxTypeCount) * 100)}%`,
                           backgroundColor: type === "task" ? "#22c55e" : type === "decision" ? "#f59e0b" : type === "knowledge" ? "#06b6d4" : type === "insight" ? "#a855f7" : "#ef4444",
                         }}
                       />
                     </div>
                   </div>
                 ))}
               </div>
             </div>

             <div className="p-5 rounded-xl border bg-card/80 backdrop-blur">
               <h3 className="text-sm font-semibold text-muted-foreground mb-3">TOP VALIDADORES</h3>
               <div className="space-y-2">
                 {topValidators.length === 0 ? (
                   <p className="text-sm text-muted-foreground">Sem dados</p>
                 ) : (
                   topValidators.map(([name, count]) => (
                     <div key={name} className="flex items-center justify-between">
                       <div className="flex items-center gap-2 min-w-0">
                         <User className="w-4 h-4 text-muted-foreground" />
                         <span className="text-sm truncate">{name}</span>
                       </div>
                       <span className="text-sm font-semibold">{count}</span>
                     </div>
                   ))
                 )}
               </div>
             </div>
           </div>

           <div className="col-span-8">
             <div className="p-5 rounded-xl border bg-card/80 backdrop-blur">
               <h3 className="text-lg font-semibold mb-4">Feed</h3>
               <div className="space-y-3">
                 {MOCK_VALIDATED_ITEMS.map((item) => {
                   const config = VALIDATION_TYPE_CONFIG[item.type];
                   return (
                     <div
                       key={item.id}
                       className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border"
                     >
                       <div className="flex items-center justify-between gap-3">
                         <div className="min-w-0">
                           <div className="flex items-center gap-2 mb-1">
                             <span className={cn("text-[10px] px-1.5 py-0.5 rounded", config.color)}>
                               {config.label}
                             </span>
                             <span className="text-[10px] text-muted-foreground truncate">{item.source}</span>
                           </div>
                           <p className="text-sm font-medium line-clamp-2">{item.value}</p>
                         </div>
                         <div className="text-right text-[10px] text-muted-foreground shrink-0">
                           <div className="flex items-center gap-1 justify-end">
                             <User className="w-3 h-3" />
                             <span>{item.validatedBy}</span>
                           </div>
                           <div className="flex items-center gap-1 justify-end">
                             <Clock className="w-3 h-3" />
                             <span>{item.validatedAt}</span>
                           </div>
                         </div>
                       </div>
                     </div>
                   );
                 })}
               </div>
             </div>
           </div>
         </div>
       </div>
     </div>
   );
 }

export function GraphNavigator() {
  const { user } = useAuthStore();
  const { config: themeConfig } = useThemeStore();
  const [accessTypes, setAccessTypes] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [nodeSummary, setNodeSummary] = useState<NodeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuCollapsed, setMenuCollapsed] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const response = await api.getUserProfileData();
        if (response.success && response.data) {
          const roleFromStore = (user?.role || '') as string;
          const roleFromProfile = (response.data.user?.role || '') as string;
          const role = roleFromStore || roleFromProfile;
          const roleNormalized = String(role).toLowerCase().trim();
          const isAdmin = roleNormalized.includes('admin') || roleNormalized.includes('administrador');

          const apiAccessTypes = response.data.user.accessTypes || [];
          const merged = isAdmin ? Array.from(new Set(["Estratégico", ...apiAccessTypes])) : apiAccessTypes;
          setAccessTypes(merged);
          return;
        }

        // Fallback: se não conseguiu carregar profile-data, admin ainda deve ver visão estratégica
        const roleNormalized = String(user?.role || '').toLowerCase().trim();
        if (roleNormalized.includes('admin') || roleNormalized.includes('administrador')) {
          setAccessTypes(["Estratégico"]);
        }
      } catch (error) {
        console.error("Failed to load user profile:", error);

        // Fallback em erro: admin ainda deve ver visão estratégica
        const roleNormalized = String(user?.role || '').toLowerCase().trim();
        if (roleNormalized.includes('admin') || roleNormalized.includes('administrador')) {
          setAccessTypes(["Estratégico"]);
        }
      } finally {
        setLoading(false);
      }
    }
    loadUserProfile();
  }, [user?.role]);

  const nodes = getNodesForAccessType(accessTypes);
  const viewLabel = getAccessTypeLabel(accessTypes);

  // Ao entrar em Visão Estratégica, já abre direto no primeiro item (Estratégia)
  useEffect(() => {
    if (loading) return;
    if (selectedNode) return;
    if (viewLabel !== "Visão Estratégica") return;

    const defaultNode = nodes.find(n => n.id === "estrategia") ?? nodes[0];
    if (defaultNode) {
      handleNodeClick(defaultNode);
    }
  }, [loading, nodes, selectedNode, viewLabel]);

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    setSelectedProjectId(null); // Limpa projeto selecionado ao mudar de nó
    setSelectedTaskId(null); // Limpa tarefa selecionada ao mudar de nó
    setSelectedInsightId(null); // Limpa insight selecionado ao mudar de nó
    const summary = NODE_SUMMARIES[node.id] || {
      title: node.label,
      description: node.description,
      items: [],
      emptyMessage: "Nenhum dado disponível",
    };
    setNodeSummary(summary);
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/30">
        <div className="animate-pulse text-muted-foreground">Carregando navegação...</div>
      </div>
    );
  }

  // NOVO LAYOUT: Menu vertical à esquerda (15-20%) + Conteúdo expandido (80-85%)
  return (
    <div className="h-full w-full overflow-hidden bg-muted/30 relative">
      {/* Grid Background sutil */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 h-full flex">
        {/* Menu Vertical à Esquerda - Compacto */}
        <div className={cn(
          "h-full flex flex-col border-r border-border bg-card/80 backdrop-blur transition-all duration-300",
          menuCollapsed ? "w-16" : "w-56"
        )}>
          {/* Header do Menu */}
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

          {/* Itens do Menu Vertical */}
          <div className="flex-1 p-2 space-y-1 overflow-auto">
            {nodes.map((node) => (
              <button
                key={node.id}
                onClick={() => handleNodeClick(node)}
                className={cn(
                  "w-full flex items-center gap-3 p-2.5 rounded-lg transition-all",
                  "hover:bg-muted/80",
                  selectedNode?.id === node.id 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-foreground/80",
                  menuCollapsed && "justify-center"
                )}
                title={menuCollapsed ? node.label : undefined}
              >
                <div className={cn(
                  "shrink-0 flex items-center justify-center rounded-lg p-1.5",
                  selectedNode?.id === node.id 
                    ? "bg-white/20" 
                    : "bg-muted/50"
                )}
                style={selectedNode?.id === node.id ? undefined : getNodeStyle(node.variant, themeConfig.colors)}
                >
                  <div className={selectedNode?.id === node.id ? "text-current" : "text-white"}>
                    {node.icon}
                  </div>
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

          {/* Footer com info */}
          {!menuCollapsed && (
            <div className="p-3 border-t border-border">
              <p className="text-[10px] text-muted-foreground text-center">
                {nodes.length} categorias disponíveis
              </p>
            </div>
          )}
        </div>

        {/* Conteúdo Principal - Expandido (80%+) */}
        <div className="flex-1 h-full overflow-hidden">
          {/* Renderizar dashboard específico baseado no nó selecionado */}
          {selectedNode?.id === "estrategia" ? (
            <StrategicDashboard />
          ) : selectedNode?.id === "validacoes" ? (
            <ValidationsDashboard />
          ) : selectedNode?.id === "projetos" && selectedProjectId ? (
            <ProjectDetailPanel 
              projectId={selectedProjectId} 
              onClose={() => setSelectedProjectId(null)} 
            />
          ) : selectedNode?.id === "tarefas" && selectedTaskId ? (
            <TaskDetailPanel 
              taskId={selectedTaskId} 
              onClose={() => setSelectedTaskId(null)} 
            />
          ) : selectedNode?.id === "insights" && selectedInsightId ? (
            <InsightDetailPanel 
              insightId={selectedInsightId} 
              onClose={() => setSelectedInsightId(null)} 
            />
          ) : selectedNode && nodeSummary ? (
            /* Visualização padrão para outros nós */
            <div className="h-full flex flex-col bg-card/50">
              {/* Header do Conteúdo */}
              <div className="p-6 border-b border-border bg-card/80 backdrop-blur">
                <div className="flex items-center gap-4">
                  <div 
                    className="p-3 rounded-xl"
                    style={getNodeStyle(selectedNode.variant, themeConfig.colors)}
                  >
                    <div className="text-white">{selectedNode.icon}</div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{nodeSummary.title}</h3>
                    <p className="text-sm text-muted-foreground">{nodeSummary.description}</p>
                  </div>
                </div>
              </div>

              {/* Conteúdo em Grid */}
              <div className="flex-1 p-6 overflow-auto">
                {nodeSummary.items.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">{nodeSummary.emptyMessage}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {nodeSummary.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl border bg-card/80 hover:bg-card hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => {
                          if (selectedNode?.id === "projetos") {
                            setSelectedProjectId(item.id);
                          } else if (selectedNode?.id === "tarefas") {
                            setSelectedTaskId(item.id);
                          } else if (selectedNode?.id === "insights") {
                            setSelectedInsightId(item.id);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium">{item.name}</p>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                        </div>
                        <div className="flex items-center gap-2">
                          {item.status && (
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              item.status === "concluído" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                              item.status === "em andamento" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                              item.status === "planejado" && "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
                              item.status === "urgente" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                              item.status === "pendente" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                              item.status === "novo" && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
                              item.status === "validado" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                              item.status === "em análise" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                              item.status === "alerta" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                              item.status === "oportunidade" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                              item.status === "risco" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                              item.status.includes("%") && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            )}>
                              {item.status}
                            </span>
                          )}
                          {item.meta && (
                            <span className="text-xs text-muted-foreground">
                              {item.meta}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Info de dados do Neo4j */}
                <div className="mt-6 p-4 rounded-lg border border-dashed border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    Dados serão sincronizados do Neo4j
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              Selecione uma categoria no menu
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
