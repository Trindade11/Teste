import { AgentRouter } from './AgentRouter';

export interface TeamExecutionRequest {
  intent: any;
  contextPack: any;
  userId: string;
}

export interface TeamExecutionResult {
  response: string;
  agentsUsed: string[];
  executionPlan: any[];
  results: any[];
}

export class TeamComposer {
  private agentRouter: AgentRouter;

  constructor() {
    this.agentRouter = new AgentRouter();
  }

  async executeTeam(request: TeamExecutionRequest): Promise<TeamExecutionResult> {
    const { intent, contextPack, userId } = request;

    // Build execution plan
    const executionPlan = this.buildExecutionPlan(intent);

    const results: any[] = [];
    const agentsUsed: string[] = [];

    // Execute agents sequentially
    for (const step of executionPlan) {
      try {
        const result = await this.agentRouter.route({
          intent: { ...intent, intentType: step.intentType },
          contextPack: {
            ...contextPack,
            previousResults: results, // Pass previous results as context
          },
          userId,
          message: step.message,
        });

        results.push(result);
        agentsUsed.push(result.agentUsed);
      } catch (error) {
        console.error(`Team step ${step.agent} failed:`, error);
        results.push({
          error: true,
          message: `Falha ao executar ${step.agent}`,
        });
      }
    }

    // Synthesize final response
    const finalResponse = this.synthesizeResponse(results);

    return {
      response: finalResponse,
      agentsUsed: [...new Set(agentsUsed)], // Unique agents
      executionPlan,
      results,
    };
  }

  private buildExecutionPlan(intent: any): any[] {
    const plan: any[] = [];

    // Example: If user wants to create a project with tasks
    if (intent.intentType === 'task' && intent.entities.includes('projeto')) {
      plan.push({
        agent: 'knowledge_agent',
        intentType: 'question',
        message: 'Buscar informações sobre projetos similares',
      });
      plan.push({
        agent: 'task_agent',
        intentType: 'task',
        message: 'Criar estrutura do projeto',
      });
    }

    // Example: Complex document generation
    if (intent.intentType === 'document_gen' && intent.requiresTeam) {
      plan.push({
        agent: 'knowledge_agent',
        intentType: 'question',
        message: 'Buscar dados relevantes para o documento',
      });
      plan.push({
        agent: 'document_agent',
        intentType: 'document_gen',
        message: 'Gerar documento com dados coletados',
      });
    }

    // If no specific plan, use suggested agents
    if (plan.length === 0 && intent.suggestedAgents) {
      plan.push({
        agent: intent.suggestedAgents[0],
        intentType: intent.intentType,
        message: 'Executar ação principal',
      });
    }

    return plan;
  }

  private synthesizeResponse(results: any[]): string {
    if (results.length === 0) {
      return 'Nenhum resultado foi gerado pela equipe de agentes.';
    }

    // If last result has a response, use it
    const lastResult = results[results.length - 1];
    if (lastResult.response) {
      return lastResult.response;
    }

    // Otherwise, combine all responses
    const responses = results
      .filter(r => r.response && !r.error)
      .map(r => r.response);

    if (responses.length === 0) {
      return 'Não foi possível processar sua solicitação com a equipe de agentes.';
    }

    return responses.join('\n\n');
  }
}
