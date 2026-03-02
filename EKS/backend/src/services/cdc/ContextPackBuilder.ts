import neo4j from 'neo4j-driver';

export interface ContextPackRequest {
  retrievalPlan: any;
  userId: string;
  conversationId: string;
}

export interface ContextPack {
  cdcLevel: string;
  workingSet?: any[];
  episodic?: any[];
  semantic?: any[];
  claims?: any[];
  totalTokens: number;
  metadata: {
    retrievedAt: string;
    sources: string[];
    filters: any;
  };
}

export class ContextPackBuilder {
  private getDriver() {
    const uri = process.env.NEO4J_URI || 'neo4j+s://8b5d3f0b.databases.neo4j.io';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || '';
    return neo4j.driver(uri, neo4j.auth.basic(user, password));
  }

  private async executeQuery(query: string, params: any): Promise<any> {
    const driver = this.getDriver();
    const session = driver.session();
    try {
      const result = await session.run(query, params);
      return result;
    } finally {
      await session.close();
      await driver.close();
    }
  }

  async build(request: ContextPackRequest): Promise<ContextPack> {
    const { retrievalPlan, userId, conversationId } = request;

    const pack: ContextPack = {
      cdcLevel: retrievalPlan.cdcLevel,
      totalTokens: 0,
      metadata: {
        retrievedAt: new Date().toISOString(),
        sources: retrievalPlan.sources,
        filters: retrievalPlan.filters,
      },
    };

    // Build each source based on retrieval plan
    for (const source of retrievalPlan.sources) {
      switch (source) {
        case 'working_set':
          pack.workingSet = await this.getWorkingSet(userId, conversationId);
          break;
        case 'episodic':
          pack.episodic = await this.getEpisodicMemory(userId, conversationId);
          break;
        case 'semantic':
          pack.semantic = await this.getSemanticContext(userId, retrievalPlan);
          break;
        case 'claims':
          pack.claims = await this.getClaims(userId);
          break;
      }
    }

    // Estimate total tokens
    pack.totalTokens = this.estimateTokens(pack);

    return pack;
  }

  private async getWorkingSet(userId: string, conversationId: string): Promise<any[]> {
    // Get recent messages from current conversation
    try {
      const query = `
        MATCH (c:Conversation {id: $conversationId})-[:HAS_MESSAGE]->(m:Message)
        WHERE m.userId = $userId
        RETURN m
        ORDER BY m.createdAt DESC
        LIMIT 5
      `;

      const result = await this.executeQuery(query, { conversationId, userId });
      return result.records.map((r: any) => r.get('m').properties);
    } catch (error) {
      console.error('Error getting working set:', error);
      return [];
    }
  }

  private async getEpisodicMemory(userId: string, conversationId: string): Promise<any[]> {
    // Get recent conversations and interactions
    try {
      const query = `
        MATCH (u:User {id: $userId})-[:PARTICIPATED_IN]->(c:Conversation)
        WHERE c.id <> $conversationId
        MATCH (c)-[:HAS_MESSAGE]->(m:Message)
        RETURN m, c
        ORDER BY m.createdAt DESC
        LIMIT 10
      `;

      const result = await this.executeQuery(query, { userId, conversationId });
      return result.records.map((r: any) => ({
        message: r.get('m').properties,
        conversation: r.get('c').properties,
      }));
    } catch (error) {
      console.error('Error getting episodic memory:', error);
      return [];
    }
  }

  private async getSemanticContext(userId: string, retrievalPlan: any): Promise<any[]> {
    // Get relevant knowledge from semantic search
    // This would use vector embeddings in production
    try {
      const query = `
        MATCH (k:Knowledge)
        WHERE k.visibility IN $visibility
        RETURN k
        ORDER BY k.createdAt DESC
        LIMIT 5
      `;

      const result = await this.executeQuery(query, {
        visibility: retrievalPlan.filters.visibility,
      });
      return result.records.map((r: any) => r.get('k').properties);
    } catch (error) {
      console.error('Error getting semantic context:', error);
      return [];
    }
  }

  private async getClaims(userId: string): Promise<any[]> {
    // Get claims and decisions for fact-checking
    try {
      const query = `
        MATCH (d:Decision)
        WHERE d.visibility IN ['corporate', 'department']
        RETURN d
        ORDER BY d.createdAt DESC
        LIMIT 5
      `;

      const result = await this.executeQuery(query, {});
      return result.records.map((r: any) => r.get('d').properties);
    } catch (error) {
      console.error('Error getting claims:', error);
      return [];
    }
  }

  private estimateTokens(pack: ContextPack): number {
    // Simple estimation: ~4 chars per token
    let totalChars = 0;

    const countItems = (items: any[] | undefined) => {
      if (!items) return 0;
      return items.reduce((sum, item) => {
        return sum + JSON.stringify(item).length;
      }, 0);
    };

    totalChars += countItems(pack.workingSet);
    totalChars += countItems(pack.episodic);
    totalChars += countItems(pack.semantic);
    totalChars += countItems(pack.claims);

    return Math.ceil(totalChars / 4);
  }
}
