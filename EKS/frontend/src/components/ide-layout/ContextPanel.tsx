'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Database,
  Sparkles,
  Plus,
  X,
  FileText,
  User,
  FolderKanban,
  GitBranch,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useContextStore } from '@/stores/useContextStore';

interface ContextPanelProps {
  activeTab: 'search' | 'active';
  onTabChange: (tab: 'search' | 'active') => void;
}

export function ContextPanel({ activeTab, onTabChange }: ContextPanelProps) {
  const {
    searchQuery,
    searchType,
    searchResults,
    activeContext,
    isSearching,
    setSearchQuery,
    setSearchType,
    performSearch,
    addToContext,
    removeFromContext,
    clearContext,
    estimateTokens,
  } = useContextStore();

  const handleSearch = () => {
    performSearch();
  };

  const handleAddToContext = (item: any) => {
    addToContext(item);
  };

  const handleRemoveFromContext = (id: string) => {
    removeFromContext(id);
  };

  const handleClearContext = () => {
    if (confirm('Limpar todo o contexto?')) {
      clearContext();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'project':
        return FolderKanban;
      case 'person':
        return User;
      case 'process':
        return GitBranch;
      case 'document':
      case 'knowledge':
      case 'website':
        return FileText;
      default:
        return FileText;
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as any)} className="h-full flex flex-col">
        <div className="border-b bg-card px-4 py-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search" className="gap-2">
              <Search className="h-4 w-4" />
              Buscar Contexto
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2">
              <Database className="h-4 w-4" />
              Contexto Ativo
              {activeContext.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeContext.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Search Tab */}
          <TabsContent value="search" className="h-full m-0 p-4 space-y-4">
            {/* Search Type Toggle */}
            <div className="flex gap-2">
              <Button
                variant={searchType === 'deterministic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSearchType('deterministic')}
                className="flex-1"
                disabled={isSearching}
              >
                <Database className="h-4 w-4 mr-2" />
                Determinística (@entidades)
              </Button>
              <Button
                variant={searchType === 'semantic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSearchType('semantic')}
                className="flex-1"
                disabled={isSearching}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Semântica (similaridade)
              </Button>
            </div>

            {/* Search Input */}
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  searchType === 'deterministic'
                    ? 'Digite Projeto, Pessoa, Processo... (sugestões aparecem automaticamente)'
                    : 'Digite texto livre para busca semântica...'
                }
                onKeyDown={(e) => e.key === 'Enter' && !isSearching && handleSearch()}
                disabled={isSearching}
              />
              <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Search Results */}
            <ScrollArea className="flex-1 h-[calc(100%-120px)]">
              <div className="space-y-2">
                {searchResults.length === 0 ? (
                  <Card className="p-8 text-center text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum resultado. Faça uma busca para adicionar contexto.</p>
                  </Card>
                ) : (
                  searchResults.map((item) => {
                    const Icon = getIcon(item.type);
                    return (
                      <Card key={item.id} className="p-3 hover:bg-accent transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm">{item.title}</span>
                              {item.relevance && (
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(item.relevance * 100)}%
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {item.preview}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAddToContext(item)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Active Context Tab */}
          <TabsContent value="active" className="h-full m-0 p-4 space-y-4">
            {/* Context Stats */}
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium">{activeContext.length}</span> itens
                  <span className="text-muted-foreground mx-2">•</span>
                  <span className="font-medium">~{estimateTokens()}</span> tokens
                </div>
                {activeContext.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearContext}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Tudo
                  </Button>
                )}
              </div>
            </Card>

            {/* Active Context Items */}
            <ScrollArea className="flex-1 h-[calc(100%-100px)]">
              <div className="space-y-2">
                {activeContext.length === 0 ? (
                  <Card className="p-8 text-center text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum contexto adicionado.</p>
                    <p className="text-xs mt-2">
                      Adicione itens da aba "Buscar Contexto"
                    </p>
                  </Card>
                ) : (
                  activeContext.map((item) => {
                    const Icon = getIcon(item.type);
                    return (
                      <Card key={item.id} className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm">{item.title}</span>
                              <Badge variant="secondary" className="text-xs">
                                {item.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {item.preview}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveFromContext(item.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
