import { IntentClassifier } from './IntentClassifier';
import { AgentRouter } from './AgentRouter';
import { TeamComposer } from './TeamComposer';
import { CDCDetector } from '../cdc/CDCDetector';
import { RetrievalPlanner } from '../cdc/RetrievalPlanner';
import { ContextPackBuilder } from '../cdc/ContextPackBuilder';
import { AgentContextInitializer } from './AgentContextInitializer';

export interface PLARequest {
  userId: string;
  conversationId: string;
  message: string;
  activeContext?: string[];
  sessionId?: string;
}

export interface UserIntent {
  intentType: 'question' | 'task' | 'document_gen' | 'exploration' | 'chat';
  confidence: number;
  entities: string[];
  requiresTeam: boolean;
  suggestedAgents: string[];
  cdcLevel?: string;
}

export interface PLAResponse {
  response: string;
  intent: UserIntent;
  cdcLevel: string;
  agentsUsed: string[];
  contextUsed: any;
  generatedDocument?: string;
  conversationId: string;
  messageId: string;
}

export class PLAOrchestrator {
  private intentClassifier: IntentClassifier;
  private agentRouter: AgentRouter;
  private teamComposer: TeamComposer;
  private cdcDetector: CDCDetector;
  private retrievalPlanner: RetrievalPlanner;
  private contextPackBuilder: ContextPackBuilder;

  constructor() {
    this.intentClassifier = new IntentClassifier();
    this.agentRouter = new AgentRouter();
    this.teamComposer = new TeamComposer();
    this.cdcDetector = new CDCDetector();
    this.retrievalPlanner = new RetrievalPlanner();
    this.contextPackBuilder = new ContextPackBuilder();
  }

  async orchestrate(request: PLARequest): Promise<PLAResponse> {
    try {
      // Step 1: Classify user intent
      const intent = await this.intentClassifier.classify({
        message: request.message,
        userId: request.userId,
        conversationId: request.conversationId,
      });

      // Step 2: Detect CDC depth level
      const cdcLevel = await this.cdcDetector.detectDepth({
        message: request.message,
        conversationId: request.conversationId,
        intent: intent.intentType,
      });

      // Step 3: Build retrieval plan based on CDC level
      const retrievalPlan = await this.retrievalPlanner.buildPlan({
        cdcLevel,
        intent,
        userId: request.userId,
        activeContext: request.activeContext,
      });

      // Step 4: Build context pack
      const contextPack = await this.contextPackBuilder.build({
        retrievalPlan,
        userId: request.userId,
        conversationId: request.conversationId,
      });

      // Step 5: Route to appropriate agent(s)
      let response: string;
      let agentsUsed: string[];

      if (intent.requiresTeam) {
        // Compose and execute team
        const teamResult = await this.teamComposer.executeTeam({
          intent,
          contextPack,
          userId: request.userId,
        });
        response = teamResult.response;
        agentsUsed = teamResult.agentsUsed;
      } else {
        // Route to single agent
        const agentResult = await this.agentRouter.route({
          intent,
          contextPack,
          userId: request.userId,
          message: request.message,
        });
        response = agentResult.response;
        agentsUsed = [agentResult.agentUsed];
      }

      // Step 6: Return structured response
      return {
        response,
        intent,
        cdcLevel,
        agentsUsed,
        contextUsed: contextPack,
        conversationId: request.conversationId,
        messageId: `msg-${Date.now()}`,
        generatedDocument: undefined, // Will be set if document_gen intent
      };
    } catch (error) {
      console.error('PLA Orchestrator error:', error);
      throw new Error(`Failed to orchestrate request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAgentCapabilities(): Promise<Record<string, any>> {
    return this.agentRouter.getCapabilities();
  }

  async getUserProfile(userId: string): Promise<any> {
    // TODO: Fetch from Neo4j AIProfile/PKP
    return {
      userId,
      preferences: {},
      learningHistory: [],
    };
  }
}
