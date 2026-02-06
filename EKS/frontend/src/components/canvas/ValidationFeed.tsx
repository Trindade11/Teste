"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";

type SourceType = "meeting" | "document" | "chat";
type EntityType = "participant" | "task" | "project" | "risk" | "decision" | "knowledge" | "insight";

interface PendingValidation {
  id: string;
  source: string;
  sourceType: SourceType;
  entityType: EntityType;
  value: string;
  context: string;
  confidence: number;
  createdAt: string;
}

const SOURCE_TYPE_CONFIG: Record<SourceType, { icon: typeof Mic; label: string; color: string }> = {
  meeting: { icon: Mic, label: "Reunião", color: "text-purple-500" },
  document: { icon: FileText, label: "Documento", color: "text-blue-500" },
  chat: { icon: MessageSquare, label: "Chat", color: "text-green-500" },
};

const ENTITY_TYPE_CONFIG: Record<EntityType, { icon: typeof Users; label: string; color: string }> = {
  participant: { icon: Users, label: "Participante", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  task: { icon: Clock, label: "Tarefa", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  project: { icon: FileText, label: "Projeto", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  risk: { icon: AlertCircle, label: "Risco", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  decision: { icon: Check, label: "Decisão", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  knowledge: { icon: Sparkles, label: "Conhecimento", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
  insight: { icon: Sparkles, label: "Insight", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" },
};

const MOCK_PENDING_VALIDATIONS: PendingValidation[] = [
  { 
    id: "pv1", 
    source: "Reunião de Planejamento Q1", 
    sourceType: "meeting", 
    entityType: "task", 
    value: "Revisar cronograma do projeto até sexta-feira", 
    context: "João mencionou durante a discussão de prioridades", 
    confidence: 0.85, 
    createdAt: "2025-02-01" 
  },
  { 
    id: "pv2", 
    source: "Reunião de Planejamento Q1", 
    sourceType: "meeting", 
    entityType: "participant", 
    value: "Carlos Mendes", 
    context: "Identificado como participante ativo na reunião", 
    confidence: 0.72, 
    createdAt: "2025-02-01" 
  },
  { 
    id: "pv3", 
    source: "Reunião de Planejamento Q1", 
    sourceType: "meeting", 
    entityType: "risk", 
    value: "Atraso na entrega devido a dependências externas", 
    context: "Risco levantado por Maria durante análise de cronograma", 
    confidence: 0.78, 
    createdAt: "2025-02-01" 
  },
  { 
    id: "pv4", 
    source: "Análise de Mercado.docx", 
    sourceType: "document", 
    entityType: "decision", 
    value: "Expandir para região Sul no Q2", 
    context: "Decisão estratégica documentada na seção 3.2", 
    confidence: 0.92, 
    createdAt: "2025-01-31" 
  },
  { 
    id: "pv5", 
    source: "Chat com Assistente", 
    sourceType: "chat", 
    entityType: "knowledge", 
    value: "Processo de onboarding leva em média 2 semanas", 
    context: "Informação fornecida pelo usuário durante conversa", 
    confidence: 0.88, 
    createdAt: "2025-01-30" 
  },
  { 
    id: "pv6", 
    source: "Reunião Comercial", 
    sourceType: "meeting", 
    entityType: "insight", 
    value: "Clientes preferem modelo de assinatura mensal", 
    context: "Padrão identificado nas discussões com time comercial", 
    confidence: 0.75, 
    createdAt: "2025-01-29" 
  },
];

export function ValidationFeed() {
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingValidations, setPendingValidations] = useState<PendingValidation[]>(MOCK_PENDING_VALIDATIONS);
  const [selectedSource, setSelectedSource] = useState<SourceType | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<EntityType | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleValidate = (id: string, approved: boolean) => {
    if (approved) {
      // TODO: Call API to save to Neo4j
      console.log("Approved:", id);
    } else {
      console.log("Rejected:", id);
    }
    setPendingValidations(prev => prev.filter(p => p.id !== id));
  };

  const handleValidateAll = () => {
    // TODO: Call API to save all to Neo4j
    console.log("Approved all:", pendingValidations.map(p => p.id));
    setPendingValidations([]);
  };

  const filteredValidations = pendingValidations.filter(item => {
    const matchesSearch = 
      item.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.context.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = !selectedSource || item.sourceType === selectedSource;
    const matchesEntity = !selectedEntity || item.entityType === selectedEntity;
    return matchesSearch && matchesSource && matchesEntity;
  });

  const groupedBySource = filteredValidations.reduce((acc, item) => {
    if (!acc[item.source]) {
      acc[item.source] = [];
    }
    acc[item.source].push(item);
    return acc;
  }, {} as Record<string, PendingValidation[]>);

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
                {pendingValidations.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-sm">
                    {pendingValidations.length}
                  </span>
                )}
              </h2>
              <p className="text-sm text-muted-foreground">
                Revise e valide informações extraídas de reuniões, documentos e conversas
              </p>
            </div>
            {pendingValidations.length > 0 && (
              <Button 
                onClick={handleValidateAll}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Validar Todos ({pendingValidations.length})
              </Button>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar validações pendentes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {/* Source Type Filter */}
          <div className="flex gap-2 flex-wrap">
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
              const count = pendingValidations.filter(p => p.sourceType === type).length;
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
                  {count > 0 && (
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-full text-xs",
                      selectedSource === type ? "bg-primary-foreground/20" : "bg-muted-foreground/20"
                    )}>
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
          {filteredValidations.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-medium">Nenhuma validação pendente</p>
              <p className="text-sm text-muted-foreground mt-1">
                Todos os itens foram validados! 🎉
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Info Banner */}
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  <strong>Revise com atenção:</strong> Itens validados serão adicionados ao grafo de conhecimento. 
                  Itens rejeitados serão descartados.
                </p>
              </div>

              {/* Grouped by Source */}
              {Object.entries(groupedBySource).map(([source, items]) => {
                const sourceType = items[0].sourceType;
                const sourceConfig = SOURCE_TYPE_CONFIG[sourceType];
                const SourceIcon = sourceConfig.icon;
                
                return (
                  <div key={source} className="space-y-3">
                    {/* Source Header */}
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <SourceIcon className={cn("w-4 h-4", sourceConfig.color)} />
                      <span>{source}</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                        {items.length} {items.length === 1 ? 'item' : 'itens'}
                      </span>
                    </div>

                    {/* Items */}
                    {items.map((item) => {
                      const config = ENTITY_TYPE_CONFIG[item.entityType];
                      const Icon = config.icon;
                      const isExpanded = expandedId === item.id;
                      
                      return (
                        <div
                          key={item.id}
                          className="flex flex-col rounded-xl bg-card border border-border hover:border-primary/30 transition-all overflow-hidden"
                        >
                          <div 
                            className="flex items-start gap-4 p-4 cursor-pointer"
                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          >
                            <div className={cn("p-2 rounded-lg shrink-0", config.color)}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={cn("px-2 py-0.5 rounded text-xs", config.color)}>
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
                                <span className="text-xs text-muted-foreground">{item.createdAt}</span>
                              </div>
                              <p className="font-medium">{item.value}</p>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{item.context}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
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
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleValidate(item.id, false);
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                              <ChevronDown className={cn(
                                "w-4 h-4 text-muted-foreground transition-transform",
                                isExpanded && "rotate-180"
                              )} />
                            </div>
                          </div>
                          
                          {/* Expanded Content */}
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-0 border-t border-border bg-muted/30">
                              <div className="pt-3">
                                <p className="text-sm font-medium mb-1">Contexto completo:</p>
                                <p className="text-sm text-muted-foreground">{item.context}</p>
                                <div className="mt-3 flex gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => handleValidate(item.id, true)}
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Validar e Adicionar ao Grafo
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => handleValidate(item.id, false)}
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Rejeitar
                                  </Button>
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
