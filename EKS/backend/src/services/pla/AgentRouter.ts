import axios from 'axios';

export interface RoutingRequest {
  intent: any;
  contextPack: any;
  userId: string;
  message: string;
}

export interface AgentResponse {
  response: string;
  agentUsed: string;
  confidence: number;
  metadata?: any;
}

export class AgentRouter {
  private agentEndpoints: Record<string, string>;

  constructor() {
    // Agent endpoints - Python FastAPI services
    this.agentEndpoints = {
      knowledge_agent: process.env.KNOWLEDGE_AGENT_URL || 'http://localhost:8001/agents/knowledge',
      task_agent: process.env.TASK_AGENT_URL || 'http://localhost:8001/agents/task',
      document_agent: process.env.DOCUMENT_AGENT_URL || 'http://localhost:8001/agents/document',
      pla_agent: process.env.PLA_AGENT_URL || 'http://localhost:8001/agents/pla',
    };
  }

  async route(request: RoutingRequest): Promise<AgentResponse> {
    const { intent, contextPack, userId, message } = request;

    // Determine which agent to use based on intent
    const selectedAgent = this.selectAgent(intent);

    try {
      // Call the appropriate agent
      const response = await this.callAgent(selectedAgent, {
        message,
        userId,
        intent: intent.intentType,
        context: contextPack,
      });

      return {
        response: response.response || response.answer || 'Desculpe, não consegui processar sua solicitação.',
        agentUsed: selectedAgent,
        confidence: response.confidence || 0.8,
        metadata: response.metadata,
      };
    } catch (error) {
      console.error(`Agent routing error for ${selectedAgent}:`, error);
      
      // Fallback to knowledge agent
      if (selectedAgent !== 'knowledge_agent') {
        return this.fallbackToKnowledge(message, contextPack);
      }

      throw error;
    }
  }

  private selectAgent(intent: any): string {
    // Map intent type to agent
    const agentMap: Record<string, string> = {
      question: 'knowledge_agent',
      task: 'task_agent',
      document_gen: 'document_agent',
      exploration: 'knowledge_agent',
      chat: 'knowledge_agent',
    };

    // Use suggested agents if available
    if (intent.suggestedAgents && intent.suggestedAgents.length > 0) {
      return intent.suggestedAgents[0];
    }

    return agentMap[intent.intentType] || 'knowledge_agent';
  }

  private async callAgent(agentName: string, payload: any): Promise<any> {
    const endpoint = this.agentEndpoints[agentName];

    if (!endpoint) {
      throw new Error(`Agent endpoint not found: ${agentName}`);
    }

    try {
      const response = await axios.post(`${endpoint}/query`, payload, {
        timeout: 30000, // 30s timeout
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`Agent ${agentName} call failed:`, error.response?.data || error.message);
        
        // If agent is not available, return a helpful error
        if (error.code === 'ECONNREFUSED') {
          console.warn(`Agent ${agentName} is not running. Using fallback.`);
          return {
            response: `O agente ${agentName} não está disponível no momento. Usando resposta padrão.`,
            confidence: 0.3,
          };
        }
      }
      throw error;
    }
  }

  private async fallbackToKnowledge(message: string, contextPack: any): Promise<AgentResponse> {
    // Simple fallback response
    return {
      response: `Entendi sua mensagem: "${message}". No momento, os agentes especializados não estão disponíveis. Como posso ajudar?`,
      agentUsed: 'fallback',
      confidence: 0.3,
    };
  }

  async getCapabilities(): Promise<Record<string, any>> {
    return {
      knowledge_agent: {
        description: 'Busca e responde perguntas sobre conhecimento no grafo',
        capabilities: ['semantic_search', 'graph_traversal', 'citation'],
      },
      task_agent: {
        description: 'Cria e gerencia tarefas e projetos',
        capabilities: ['task_creation', 'task_update', 'task_search'],
      },
      document_agent: {
        description: 'Gera documentos estruturados',
        capabilities: ['contract_generation', 'proposal_generation', 'report_generation'],
      },
    };
  }
}
