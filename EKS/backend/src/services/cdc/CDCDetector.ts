export interface CDCDetectionRequest {
  message: string;
  conversationId: string;
  intent: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

export interface CDCLevel {
  level: 'D0' | 'D1' | 'D2' | 'D3' | 'D4';
  signals: string[];
  maxTokens: number;
  sources: string[];
  reasoning?: string;
}

export class CDCDetector {
  async detectDepth(request: CDCDetectionRequest): Promise<string> {
    const { message, intent, conversationHistory } = request;

    // Detect signals for each depth level
    const signals = this.detectSignals(message, conversationHistory || []);

    // Determine depth level based on signals
    const level = this.determineLevel(signals, intent);

    return level;
  }

  private detectSignals(message: string, history: Array<{ role: string; content: string }>): {
    hasContinuity: boolean;
    hasDeepQuestion: boolean;
    hasContestation: boolean;
    hasTopicChange: boolean;
    conversationLength: number;
  } {
    const lowerMessage = message.toLowerCase();

    return {
      // D1: Continuity signals
      hasContinuity: history.length > 0 && (
        lowerMessage.includes('também') ||
        lowerMessage.includes('além disso') ||
        lowerMessage.includes('e sobre') ||
        lowerMessage.includes('continua')
      ),

      // D2: Deep conceptual question
      hasDeepQuestion: (
        lowerMessage.includes('por que') ||
        lowerMessage.includes('como funciona') ||
        lowerMessage.includes('explique') ||
        lowerMessage.includes('diferença entre') ||
        lowerMessage.includes('compare')
      ),

      // D3: Contestation/correction
      hasContestation: (
        lowerMessage.includes('não') && lowerMessage.includes('correto') ||
        lowerMessage.includes('errado') ||
        lowerMessage.includes('na verdade') ||
        lowerMessage.includes('mas') ||
        lowerMessage.includes('contradiz')
      ),

      // D4: Topic change
      hasTopicChange: (
        lowerMessage.includes('mudando de assunto') ||
        lowerMessage.includes('outro tema') ||
        lowerMessage.includes('agora sobre') ||
        (history.length > 0 && this.hasLowSemanticSimilarity(message, history))
      ),

      conversationLength: history.length,
    };
  }

  private determineLevel(signals: any, intent: string): 'D0' | 'D1' | 'D2' | 'D3' | 'D4' {
    // D4: Topic change - reset context
    if (signals.hasTopicChange) {
      return 'D4';
    }

    // D3: Contestation - claims and contradictions
    if (signals.hasContestation) {
      return 'D3';
    }

    // D2: Deep conceptual question
    if (signals.hasDeepQuestion || intent === 'exploration') {
      return 'D2';
    }

    // D1: Continuity within conversation
    if (signals.hasContinuity || signals.conversationLength > 2) {
      return 'D1';
    }

    // D0: Direct answer - first message or simple question
    return 'D0';
  }

  private hasLowSemanticSimilarity(message: string, history: Array<{ role: string; content: string }>): boolean {
    // Simple heuristic: check if message shares keywords with recent history
    if (history.length === 0) return false;

    const messageWords = new Set(message.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const recentMessage = history[history.length - 1].content.toLowerCase();
    const recentWords = new Set(recentMessage.split(/\s+/).filter(w => w.length > 3));

    const overlap = [...messageWords].filter(w => recentWords.has(w)).length;
    const similarity = overlap / Math.max(messageWords.size, recentWords.size);

    return similarity < 0.2; // Low similarity = topic change
  }

  getLevelConfig(level: string): { maxTokens: number; sources: string[] } {
    const configs: Record<string, { maxTokens: number; sources: string[] }> = {
      D0: { maxTokens: 500, sources: ['working_set'] },
      D1: { maxTokens: 1500, sources: ['working_set', 'episodic'] },
      D2: { maxTokens: 3000, sources: ['working_set', 'episodic', 'semantic'] },
      D3: { maxTokens: 4000, sources: ['working_set', 'episodic', 'semantic', 'claims'] },
      D4: { maxTokens: 2500, sources: ['semantic'] }, // Reset - new topic
    };

    return configs[level] || configs.D0;
  }
}
