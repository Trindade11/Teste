"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Plus,
  FileText,
  MessageSquare,
  Lightbulb,
  Search,
  Filter,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

type ContentType = "conhecimento" | "processo" | "insight" | "documento";

interface KnowledgeItem {
  id: string;
  title: string;
  type: ContentType;
  description: string;
  createdAt: string;
  tags: string[];
}

const CONTENT_TYPES: { id: ContentType; label: string; icon: React.ReactNode; description: string; color: string }[] = [
  { id: "conhecimento", label: "Conhecimento", icon: <Lightbulb className="w-5 h-5" />, description: "Fatos, definições e aprendizados", color: "bg-amber-500" },
  { id: "processo", label: "Processo", icon: <FileText className="w-5 h-5" />, description: "Fluxos e procedimentos", color: "bg-blue-500" },
  { id: "insight", label: "Insight", icon: <Sparkles className="w-5 h-5" />, description: "Descobertas e oportunidades", color: "bg-purple-500" },
  { id: "documento", label: "Documento", icon: <FileText className="w-5 h-5" />, description: "Arquivos e referências", color: "bg-emerald-500" },
];

const MOCK_ITEMS: KnowledgeItem[] = [
  { id: "1", title: "Como funciona o processo de vendas", type: "processo", description: "Descrição detalhada do fluxo de vendas da empresa", createdAt: "2025-01-30", tags: ["vendas", "comercial"] },
  { id: "2", title: "Definição de OKRs Q1 2025", type: "conhecimento", description: "Objetivos e resultados-chave do primeiro trimestre", createdAt: "2025-01-28", tags: ["estratégia", "OKR"] },
  { id: "3", title: "Oportunidade de mercado identificada", type: "insight", description: "Análise do novo segmento de clientes", createdAt: "2025-01-25", tags: ["mercado", "oportunidade"] },
];


export function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<ContentType | null>(null);

  const filteredItems = MOCK_ITEMS.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !selectedType || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleCreateNew = (type: ContentType) => {
    setCreateType(type);
    setShowCreateModal(true);
  };

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
              <h2 className="text-xl font-semibold">Base de Conhecimento</h2>
              <p className="text-sm text-muted-foreground">
                Crie, organize e explore o conhecimento da organização
              </p>
            </div>
          </div>


          {/* Search and Filter */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar conhecimento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Quick Create Cards */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Criar novo
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {CONTENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleCreateNew(type.id)}
                  className={cn(
                    "flex flex-col items-center gap-3 p-5 rounded-xl",
                    "bg-card border border-border",
                    "hover:border-primary/50 hover:shadow-md",
                    "transition-all duration-200 group"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-lg text-white",
                    type.color
                  )}>
                    {type.icon}
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm">{type.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter Pills */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setSelectedType(null)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                !selectedType 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              Todos
            </button>
            {CONTENT_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2",
                  selectedType === type.id 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {type.icon}
                {type.label}
              </button>
            ))}
          </div>

          {/* Knowledge Items List */}
          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhum item encontrado</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Comece criando seu primeiro conhecimento acima
                </p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const typeInfo = CONTENT_TYPES.find(t => t.id === item.type);
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group"
                  >
                    <div className={cn(
                      "p-2.5 rounded-lg text-white shrink-0",
                      typeInfo?.color || "bg-gray-500"
                    )}>
                      {typeInfo?.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{item.title}</h4>
                      <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                      <div className="flex gap-2 mt-2">
                        {item.tags.map((tag) => (
                          <span 
                            key={tag} 
                            className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{item.createdAt}</span>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Create Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl border border-border">
            <h3 className="text-lg font-semibold mb-4">
              Criar {CONTENT_TYPES.find(t => t.id === createType)?.label}
            </h3>
            <p className="text-muted-foreground mb-6">
              Funcionalidade em desenvolvimento. Esta área permitirá criar e registrar conhecimento diretamente no grafo Neo4j.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
