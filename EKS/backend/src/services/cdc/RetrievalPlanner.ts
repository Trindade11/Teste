import { CDCDetector } from './CDCDetector';

export interface RetrievalPlanRequest {
  cdcLevel: string;
  intent: any;
  userId: string;
  activeContext?: string[];
}

export interface RetrievalPlan {
  cdcLevel: string;
  maxTokens: number;
  sources: string[];
  strategies: string[];
  filters: {
    userId?: string;
    visibility?: string[];
    timeRange?: string;
  };
}

export class RetrievalPlanner {
  private cdcDetector: CDCDetector;

  constructor() {
    this.cdcDetector = new CDCDetector();
  }

  async buildPlan(request: RetrievalPlanRequest): Promise<RetrievalPlan> {
    const { cdcLevel, intent, userId, activeContext } = request;

    // Get level configuration
    const levelConfig = this.cdcDetector.getLevelConfig(cdcLevel);

    // Determine retrieval strategies based on intent and level
    const strategies = this.selectStrategies(intent, cdcLevel);

    // Build filters
    const filters = this.buildFilters(userId, intent);

    return {
      cdcLevel,
      maxTokens: levelConfig.maxTokens,
      sources: levelConfig.sources,
      strategies,
      filters,
    };
  }

  private selectStrategies(intent: any, cdcLevel: string): string[] {
    const strategies: string[] = [];

    // Always include working set for recent context
    if (cdcLevel !== 'D4') {
      strategies.push('working_set');
    }

    // Semantic search for deeper levels
    if (['D2', 'D3', 'D4'].includes(cdcLevel)) {
      strategies.push('semantic_search');
    }

    // Graph traversal for exploration
    if (intent.intentType === 'exploration' || intent.intentType === 'question') {
      strategies.push('graph_traversal');
    }

    // Entity lookup if entities mentioned
    if (intent.entities && intent.entities.length > 0) {
      strategies.push('entity_lookup');
    }

    return strategies;
  }

  private buildFilters(userId: string, intent: any): any {
    return {
      userId,
      visibility: ['individual', 'department', 'corporate'],
      timeRange: this.getTimeRange(intent),
    };
  }

  private getTimeRange(intent: any): string {
    // Default to recent for most intents
    if (intent.intentType === 'task') {
      return 'last_30d';
    }

    if (intent.intentType === 'exploration') {
      return 'all_time';
    }

    return 'last_7d';
  }
}
