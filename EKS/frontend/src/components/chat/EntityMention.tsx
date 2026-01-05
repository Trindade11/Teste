"use client"

import React, { useState, useEffect } from 'react';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem, CommandGroup } from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { EntityType, Projeto, Processo, Pessoa, Agente } from '@/types/chat';
import { FolderKanban, GitBranch, User, Bot } from 'lucide-react';

interface EntityMentionProps {
  isOpen: boolean;
  onSelect: (entity: { id: string; type: EntityType; name: string }) => void;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement>;
}

// Mock data - SUBSTITUA por chamadas à sua API Neo4j
const mockProjetos: Projeto[] = [
  { id: 'proj_1', nome: 'Sistema de Chat', descricao: 'Implementação do chat template', status: 'Em Andamento' },
  { id: 'proj_2', nome: 'Dashboard Analytics', descricao: 'Dashboard de análise de dados', status: 'Planejado' },
  { id: 'proj_3', nome: 'API Integration', descricao: 'Integração com APIs externas', status: 'Concluído' },
];

const mockProcessos: Processo[] = [
  { id: 'proc_1', nome: 'Onboarding Cliente', tipo: 'Cadastro', responsavel: 'Maria Silva' },
  { id: 'proc_2', nome: 'Validação de Documentos', tipo: 'Análise', responsavel: 'João Santos' },
  { id: 'proc_3', nome: 'Aprovação de Crédito', tipo: 'Financeiro', responsavel: 'Ana Costa' },
];

const mockPessoas: Pessoa[] = [
  { id: 'pessoa_1', nome: 'Maria Silva', cargo: 'Gerente de Projetos', email: 'maria@example.com' },
  { id: 'pessoa_2', nome: 'João Santos', cargo: 'Analista de Sistemas', email: 'joao@example.com' },
  { id: 'pessoa_3', nome: 'Ana Costa', cargo: 'Desenvolvedora', email: 'ana@example.com' },
];

const mockAgentes: Agente[] = [
  { id: 'agent_1', nome: 'Assistente Financeiro', tipo: 'Especializado', modelo: 'GPT-4' },
  { id: 'agent_2', nome: 'Analista de Dados', tipo: 'Analítico', modelo: 'Claude-3' },
  { id: 'agent_3', nome: 'Suporte Técnico', tipo: 'Geral', modelo: 'GPT-3.5' },
];

export function EntityMention({ isOpen, onSelect, onClose, triggerRef }: EntityMentionProps) {
  const [search, setSearch] = useState('');
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadEntities();
    }
  }, [isOpen]);

  const loadEntities = async () => {
    setLoading(true);
    try {
      setProjetos(mockProjetos);
      setProcessos(mockProcessos);
      setPessoas(mockPessoas);
      setAgentes(mockAgentes);
    } catch (error) {
      console.error('Erro ao carregar entidades:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjetos = projetos.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  );
  
  const filteredProcessos = processos.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  );
  
  const filteredPessoas = pessoas.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  );
  
  const filteredAgentes = agentes.filter(a =>
    a.nome.toLowerCase().includes(search.toLowerCase())
  );

  const hasResults = filteredProjetos.length > 0 || 
                    filteredProcessos.length > 0 || 
                    filteredPessoas.length > 0 || 
                    filteredAgentes.length > 0;

  return (
    <Popover open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <PopoverTrigger asChild>
        <div ref={triggerRef as React.RefObject<HTMLDivElement>} />
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[400px]" align="start">
        <Command className="rounded-lg border shadow-md">
          <CommandInput
            placeholder="Buscar projetos, processos, pessoas, agentes..."
            value={search}
            onValueChange={setSearch}
            className="border-0 focus:ring-0 text-sm"
          />
          <CommandList className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                Carregando...
              </div>
            ) : !hasResults ? (
              <CommandEmpty>Nenhuma entidade encontrada</CommandEmpty>
            ) : (
              <>
                {filteredProjetos.length > 0 && (
                  <CommandGroup heading="Projetos">
                    {filteredProjetos.map((projeto) => (
                      <CommandItem
                        key={projeto.id}
                        value={projeto.nome}
                        onSelect={() => {
                          onSelect({ id: projeto.id, type: 'projeto', name: projeto.nome });
                          onClose();
                        }}
                        className="flex flex-col items-start px-3 py-2 hover:bg-accent cursor-pointer"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <FolderKanban className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">{projeto.nome}</span>
                        </div>
                        {projeto.descricao && (
                          <span className="text-xs text-muted-foreground ml-6">
                            {projeto.descricao}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {filteredProcessos.length > 0 && (
                  <CommandGroup heading="Processos">
                    {filteredProcessos.map((processo) => (
                      <CommandItem
                        key={processo.id}
                        value={processo.nome}
                        onSelect={() => {
                          onSelect({ id: processo.id, type: 'processo', name: processo.nome });
                          onClose();
                        }}
                        className="flex flex-col items-start px-3 py-2 hover:bg-accent cursor-pointer"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <GitBranch className="h-4 w-4 text-green-500" />
                          <span className="font-medium">{processo.nome}</span>
                        </div>
                        {processo.tipo && (
                          <span className="text-xs text-muted-foreground ml-6">
                            {processo.tipo} • {processo.responsavel}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {filteredPessoas.length > 0 && (
                  <CommandGroup heading="Pessoas">
                    {filteredPessoas.map((pessoa) => (
                      <CommandItem
                        key={pessoa.id}
                        value={pessoa.nome}
                        onSelect={() => {
                          onSelect({ id: pessoa.id, type: 'pessoa', name: pessoa.nome });
                          onClose();
                        }}
                        className="flex flex-col items-start px-3 py-2 hover:bg-accent cursor-pointer"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <User className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">{pessoa.nome}</span>
                        </div>
                        {pessoa.cargo && (
                          <span className="text-xs text-muted-foreground ml-6">
                            {pessoa.cargo}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {filteredAgentes.length > 0 && (
                  <CommandGroup heading="Agentes">
                    {filteredAgentes.map((agente) => (
                      <CommandItem
                        key={agente.id}
                        value={agente.nome}
                        onSelect={() => {
                          onSelect({ id: agente.id, type: 'agente', name: agente.nome });
                          onClose();
                        }}
                        className="flex flex-col items-start px-3 py-2 hover:bg-accent cursor-pointer"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Bot className="h-4 w-4 text-orange-500" />
                          <span className="font-medium">{agente.nome}</span>
                        </div>
                        {agente.tipo && (
                          <span className="text-xs text-muted-foreground ml-6">
                            {agente.tipo} • {agente.modelo}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

