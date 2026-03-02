export interface IntentClassificationRequest {
  message: string;
  userId: string;
  conversationId: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

export interface UserIntent {
  intentType: 'question' | 'task' | 'document_gen' | 'exploration' | 'chat';
  confidence: number;
  entities: string[];
  requiresTeam: boolean;
  suggestedAgents: string[];
  reasoning?: string;
}

export class IntentClassifier {
  async classify(request: IntentClassificationRequest): Promise<UserIntent> {
    const systemPrompt = `You are an intent classification expert for a Personal Lead Agent (PLA).

Analyze the user's message and classify it into one of these intent types:
- **question**: User is asking for information or clarification
- **task**: User wants to create, update, or manage tasks
- **document_gen**: User wants to generate or create a document
- **exploration**: User is exploring the knowledge base or learning
- **chat**: General conversation or social interaction

Also determine:
1. Confidence score (0.0 to 1.0)
2. Entities mentioned (projects, people, processes, etc.)
3. Whether this requires a team of agents (complex multi-step tasks)
4. Which specialized agents would be best suited

Respond in JSON format:
{
  "intentType": "question|task|document_gen|exploration|chat",
  "confidence": 0.0-1.0,
  "entities": ["entity1", "entity2"],
  "requiresTeam": false,
  "suggestedAgents": ["knowledge_agent", "task_agent"],
  "reasoning": "Brief explanation"
}`;

    const userPrompt = `User message: "${request.message}"

${request.conversationHistory ? `Recent conversation context:\n${request.conversationHistory.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}` : ''}

Classify this intent.`;

    try {
      const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT || '';
      const azureKey = process.env.AZURE_OPENAI_KEY || '';
      const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o-mini-aion';
      const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview';

      const url = `${azureEndpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': azureKey,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`Azure OpenAI error: ${response.status}`);
      }

      const data = await response.json() as any;
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content in response');
      }

      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      
      return {
        intentType: parsed.intentType || 'chat',
        confidence: parsed.confidence || 0.5,
        entities: parsed.entities || [],
        requiresTeam: parsed.requiresTeam || false,
        suggestedAgents: parsed.suggestedAgents || ['knowledge_agent'],
        reasoning: parsed.reasoning,
      };
    } catch (error) {
      console.error('Intent classification error:', error);
      
      // Fallback: simple heuristic classification
      return this.fallbackClassification(request.message);
    }
  }

  private fallbackClassification(message: string): UserIntent {
    const lowerMessage = message.toLowerCase();

    // Document generation keywords
    if (
      lowerMessage.includes('criar documento') ||
      lowerMessage.includes('gerar relatório') ||
      lowerMessage.includes('escrever contrato') ||
      lowerMessage.includes('fazer proposta')
    ) {
      return {
        intentType: 'document_gen',
        confidence: 0.7,
        entities: [],
        requiresTeam: false,
        suggestedAgents: ['document_agent'],
      };
    }

    // Task keywords
    if (
      lowerMessage.includes('tarefa') ||
      lowerMessage.includes('criar task') ||
      lowerMessage.includes('agendar') ||
      lowerMessage.includes('fazer lembrete')
    ) {
      return {
        intentType: 'task',
        confidence: 0.7,
        entities: [],
        requiresTeam: false,
        suggestedAgents: ['task_agent'],
      };
    }

    // Question keywords
    if (
      lowerMessage.includes('?') ||
      lowerMessage.startsWith('qual') ||
      lowerMessage.startsWith('como') ||
      lowerMessage.startsWith('quando') ||
      lowerMessage.startsWith('onde') ||
      lowerMessage.startsWith('por que')
    ) {
      return {
        intentType: 'question',
        confidence: 0.6,
        entities: [],
        requiresTeam: false,
        suggestedAgents: ['knowledge_agent'],
      };
    }

    // Default to chat
    return {
      intentType: 'chat',
      confidence: 0.5,
      entities: [],
      requiresTeam: false,
      suggestedAgents: ['knowledge_agent'],
    };
  }
}
