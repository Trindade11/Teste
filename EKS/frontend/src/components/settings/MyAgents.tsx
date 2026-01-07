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
  Bot, 
  Plus, 
  Settings, 
  Play, 
  Pause, 
  Edit, 
  Trash2,
  CheckCircle2,
  AlertCircle,
  Brain,
  MessageSquare,
  Target
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  type: "user-agent" | "process-agent" | "specialist-agent";
  description: string;
  status: "active" | "inactive" | "training";
  createdAt: string;
  lastUsed: string | null;
  capabilities: string[];
  configuration: {
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
  };
}

export function MyAgents() {
  const { user } = useAuthStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setIsLoading(true);
    try {
      // Mock data para demonstração - depois virá da API
      const mockAgents: Agent[] = [
        {
          id: "agent-001",
          name: "Agente Pessoal",
          type: "user-agent",
          description: "Meu agente pessoal criado durante o onboarding. Conhece meu contexto, objetivos e estilo de trabalho.",
          status: "active",
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias atrás
          lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
          capabilities: [
            "Análise de Processos",
            "Gestão de Projetos", 
            "Tomada de Decisão",
            "Comunicação Interna"
          ],
          configuration: {
            model: "gpt-4o",
            temperature: 0.7,
            maxTokens: 2000,
            systemPrompt: `Você é um agente pessoal especializado em apoiar profissionais na análise de processos e melhoria contínua. Seu estilo é orientado a dados, prático e focado em execução. Você tem conhecimento profundo sobre:

- Contexto organizacional: Empresa do usuário, departamento específico
- Perfil profissional: Analista de Processos com foco em melhoria contínua
- Objetivos atuais: Implementação de cultura de melhoria contínua e automação
- Desafios: Resistência à mudança e falta de recursos

Comunique-se de forma clara, objetiva e acionável. Sempre que possível, sugira próximos passos concretos.`
          }
        },
        {
          id: "agent-002", 
          name: "Agente de Mapeamento",
          type: "process-agent",
          description: "Especialista em mapeamento e documentação de processos organizacionais.",
          status: "inactive",
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          lastUsed: null,
          capabilities: [
            "Mapeamento de Processos",
            "Documentação BPMN",
            "Análise de Fluxos",
            "Identificação de Gargalos"
          ],
          configuration: {
            model: "gpt-4o",
            temperature: 0.3,
            maxTokens: 3000,
            systemPrompt: "Você é um especialista em mapeamento de processos. Ajude a documentar, analisar e otimizar fluxos de trabalho."
          }
        }
      ];

      setAgents(mockAgents);
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAgent = () => {
    setIsCreating(true);
    setSelectedAgent(null);
    setIsEditing(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleSaveAgent = async (agentData: Partial<Agent>) => {
    try {
      if (isCreating && agentData.name && agentData.description) {
        // Criar novo agente
        const newAgent: Agent = {
          id: `agent-${Date.now()}`,
          name: agentData.name,
          type: agentData.type || "user-agent",
          description: agentData.description,
          status: "inactive",
          createdAt: new Date().toISOString(),
          lastUsed: null,
          capabilities: agentData.capabilities || [],
          configuration: agentData.configuration || {
            model: "gpt-4o",
            temperature: 0.7,
            maxTokens: 2000,
            systemPrompt: ""
          }
        };
        setAgents(prev => [...prev, newAgent]);
      } else if (selectedAgent && !isCreating) {
        // Atualizar agente existente
        setAgents(prev => prev.map(agent => 
          agent.id === selectedAgent.id 
            ? { ...agent, ...agentData }
            : agent
        ));
      }
      
      setIsEditing(false);
      setSelectedAgent(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to save agent:', error);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      setAgents(prev => prev.filter(agent => agent.id !== agentId));
      if (selectedAgent?.id === agentId) {
        setSelectedAgent(null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to delete agent:', error);
    }
  };

  const handleToggleAgentStatus = async (agentId: string) => {
    try {
      setAgents(prev => prev.map(agent => 
        agent.id === agentId 
          ? { 
              ...agent, 
              status: agent.status === "active" ? "inactive" : "active",
              lastUsed: agent.status === "inactive" ? new Date().toISOString() : agent.lastUsed
            }
          : agent
      ));
    } catch (error) {
      console.error('Failed to toggle agent status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Carregando seus agentes...</div>
      </div>
    );
  }

  if (isEditing) {
    return <AgentEditor 
      agent={selectedAgent}
      isCreating={isCreating}
      onSave={handleSaveAgent}
      onCancel={() => {
        setIsEditing(false);
        setSelectedAgent(null);
        setIsCreating(false);
      }}
    />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Meus Agentes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie seus agentes especializados de IA
          </p>
        </div>
        <Button
          onClick={handleCreateAgent}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Agente
        </Button>
      </div>

      {agents.length === 0 ? (
        <Card className="p-8 text-center">
          <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum agente criado</h3>
          <p className="text-muted-foreground mb-4">
            Crie seu primeiro agente personalizado para começar a usar assistência especializada
          </p>
          <Button onClick={handleCreateAgent} className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Agente
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={() => handleEditAgent(agent)}
              onDelete={() => handleDeleteAgent(agent.id)}
              onToggleStatus={() => handleToggleAgentStatus(agent.id)}
              onSelect={() => setSelectedAgent(agent)}
            />
          ))}
        </div>
      )}

      {selectedAgent && !isEditing && (
        <AgentDetails 
          agent={selectedAgent}
          onEdit={() => handleEditAgent(selectedAgent)}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </div>
  );
}

// Componente para o card do agente
function AgentCard({ 
  agent, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onSelect 
}: {
  agent: Agent;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onSelect: () => void;
}) {
  const getStatusColor = (status: Agent["status"]) => {
    switch (status) {
      case "active": return "text-green-600 bg-green-50";
      case "inactive": return "text-gray-600 bg-gray-50";
      case "training": return "text-orange-600 bg-orange-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusText = (status: Agent["status"]) => {
    switch (status) {
      case "active": return "Ativo";
      case "inactive": return "Inativo";
      case "training": return "Em Treinamento";
      default: return "Desconhecido";
    }
  };

  const getTypeIcon = (type: Agent["type"]) => {
    switch (type) {
      case "user-agent": return <Brain className="h-4 w-4" />;
      case "process-agent": return <Target className="h-4 w-4" />;
      case "specialist-agent": return <MessageSquare className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  return (
    <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full min-h-[240px] overflow-hidden" onClick={onSelect}>
      <div className="space-y-4 flex flex-col h-full">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getTypeIcon(agent.type)}
            <h3 className="font-semibold">{agent.name}</h3>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(agent.status)}`}>
            {getStatusText(agent.status)}
          </span>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-3">
          {agent.description}
        </p>

        <div className="flex flex-wrap gap-1">
          {agent.capabilities.slice(0, 3).map((capability, index) => (
            <span key={index} className="text-xs px-2 py-1 bg-muted rounded">
              {capability}
            </span>
          ))}
          {agent.capabilities.length > 3 && (
            <span className="text-xs px-2 py-1 bg-muted rounded">
              +{agent.capabilities.length - 3}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Criado {new Date(agent.createdAt).toLocaleDateString('pt-BR')}</span>
          {agent.lastUsed && (
            <span>Usado {new Date(agent.lastUsed).toLocaleDateString('pt-BR')}</span>
          )}
        </div>

        <div className="mt-auto pt-2 border-t grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 items-stretch">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="gap-1 w-full min-w-0"
          >
            <Edit className="h-3 w-3" />
            Editar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); onToggleStatus(); }}
            className="gap-1 w-full min-w-0"
          >
            {agent.status === "active" ? (
              <><Pause className="h-3 w-3" /> Pausar</>
            ) : (
              <><Play className="h-3 w-3" /> Ativar</>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-destructive hover:text-destructive w-9 min-w-9 p-0"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Componente para detalhes do agente
function AgentDetails({ 
  agent, 
  onEdit, 
  onClose 
}: {
  agent: Agent;
  onEdit: () => void;
  onClose: () => void;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">{agent.name}</h3>
            <p className="text-sm text-muted-foreground">{agent.type}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={onEdit} variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Editar
          </Button>
          <Button onClick={onClose} variant="ghost">
            ×
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="font-medium mb-2">Descrição</h4>
          <p className="text-sm text-muted-foreground">{agent.description}</p>
        </div>

        <div>
          <h4 className="font-medium mb-2">Capacidades</h4>
          <div className="flex flex-wrap gap-2">
            {agent.capabilities.map((capability, index) => (
              <span key={index} className="text-sm px-3 py-1 bg-primary/10 text-primary rounded">
                {capability}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Configuração</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Modelo:</span>
              <div className="font-medium">{agent.configuration.model}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Temperature:</span>
              <div className="font-medium">{agent.configuration.temperature}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Max Tokens:</span>
              <div className="font-medium">{agent.configuration.maxTokens}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <div className="font-medium capitalize">{agent.status}</div>
            </div>
          </div>
        </div>

        {agent.configuration.systemPrompt && (
          <div>
            <h4 className="font-medium mb-2">System Prompt</h4>
            <div className="p-3 bg-muted rounded-lg text-sm font-mono max-h-40 overflow-y-auto">
              {agent.configuration.systemPrompt}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <span>Criado em:</span>
            <div className="font-medium text-foreground">
              {new Date(agent.createdAt).toLocaleDateString('pt-BR')}
            </div>
          </div>
          {agent.lastUsed && (
            <div>
              <span>Último uso:</span>
              <div className="font-medium text-foreground">
                {new Date(agent.lastUsed).toLocaleDateString('pt-BR')}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// Componente para edição/criação de agente
function AgentEditor({ 
  agent, 
  isCreating, 
  onSave, 
  onCancel 
}: {
  agent: Agent | null;
  isCreating: boolean;
  onSave: (data: Partial<Agent>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: agent?.name || "",
    type: agent?.type || "user-agent" as Agent["type"],
    description: agent?.description || "",
    capabilities: agent?.capabilities.join(", ") || "",
    model: agent?.configuration.model || "gpt-4o",
    temperature: agent?.configuration.temperature || 0.7,
    maxTokens: agent?.configuration.maxTokens || 2000,
    systemPrompt: agent?.configuration.systemPrompt || ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const agentData: Partial<Agent> = {
      name: formData.name,
      type: formData.type,
      description: formData.description,
      capabilities: formData.capabilities.split(",").map(c => c.trim()).filter(c => c),
      configuration: {
        model: formData.model,
        temperature: formData.temperature,
        maxTokens: formData.maxTokens,
        systemPrompt: formData.systemPrompt
      }
    };

    onSave(agentData);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">
          {isCreating ? "Criar Novo Agente" : "Editar Agente"}
        </h3>
        <Button onClick={onCancel} variant="ghost">
          ×
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Nome do Agente</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Agente de Processos"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Tipo</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Agent["type"] }))}
              className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="user-agent">Agente Pessoal</option>
              <option value="process-agent">Agente de Processos</option>
              <option value="specialist-agent">Agente Especialista</option>
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Descreva o propósito e especialidades deste agente..."
            rows={3}
            required
          />
        </div>

        <div>
          <Label htmlFor="capabilities">Capacidades (separadas por vírgula)</Label>
          <Input
            id="capabilities"
            value={formData.capabilities}
            onChange={(e) => setFormData(prev => ({ ...prev, capabilities: e.target.value }))}
            placeholder="Ex: Análise de Processos, Gestão de Projetos, Tomada de Decisão"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="model">Modelo</Label>
            <select
              id="model"
              value={formData.model}
              onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
              className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
          </div>

          <div>
            <Label htmlFor="temperature">Temperature</Label>
            <Input
              id="temperature"
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={formData.temperature}
              onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
            />
          </div>

          <div>
            <Label htmlFor="maxTokens">Max Tokens</Label>
            <Input
              id="maxTokens"
              type="number"
              min="100"
              max="4000"
              value={formData.maxTokens}
              onChange={(e) => setFormData(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="systemPrompt">System Prompt</Label>
          <Textarea
            id="systemPrompt"
            value={formData.systemPrompt}
            onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
            placeholder="Instruções iniciais para o agente..."
            rows={6}
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit">
            {isCreating ? "Criar Agente" : "Salvar Alterações"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
