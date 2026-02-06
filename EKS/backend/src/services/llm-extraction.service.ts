import { env } from '../config/env';
import { logger } from '../utils/logger';

interface ExtractedEntity {
  type: 'task' | 'decision' | 'risk' | 'insight' | 'action_item';
  value: string;
  description: string;
  confidence: number;
  context?: string;
  assignee?: string;
  relatedPerson?: string;
  relatedArea?: string;
  deadline?: string;
  priority?: 'high' | 'medium' | 'low';
  impact?: string;
}

interface ExtractionResult {
  entities: ExtractedEntity[];
  summary: string;
  keyTopics: Array<{ topic: string; description: string; relevance: number }>;
  processingTime: number;
}

const EXTRACTION_PROMPT = `Você é um analista sênior de inteligência organizacional. Sua missão é extrair ABSOLUTAMENTE TUDO de relevante desta transcrição de reunião.

IMPORTANTE: Seja EXAUSTIVO. É melhor extrair demais do que de menos. Esta extração servirá como memória organizacional permanente.

## ESTRUTURA DE SAÍDA (JSON)

### 1. RESUMO EXECUTIVO (summary)
Resumo DETALHADO com 300-500 palavras cobrindo:
- Objetivo e contexto da reunião
- Todos os pontos principais discutidos
- Decisões tomadas
- Próximos passos definidos

### 2. TÓPICOS PRINCIPAIS (keyTopics) - MÍNIMO 8 TÓPICOS
Para CADA assunto substantivo discutido:
- topic: nome do tópico (2-5 palavras)
- description: explicação detalhada (3-4 frases)
- relevance: 0.0 a 1.0

### 3. DECISÕES (decisions) - EXTRAIA TODAS
Qualquer escolha, definição ou direcionamento tomado:
- value: a decisão (máx 15 palavras)
- description: contexto completo, motivação, alternativas (mín 60 palavras)
- relatedPerson: quem decidiu
- relatedArea: área impactada
- impact: impacto esperado
- confidence: 0.6-1.0

PROCURE por frases como:
- "Vamos usar/fazer/adotar X"
- "A estratégia/direção é"
- "Decidimos/definimos que"
- "Não vamos fazer X"
- "O foco vai ser"
- "A plataforma será"

### 4. TAREFAS (tasks) - EXTRAIA TODAS
Qualquer ação necessária ou atribuída:
- value: título da tarefa
- description: detalhamento completo (mín 50 palavras)
- assignee: responsável (se identificável)
- relatedArea: área envolvida
- deadline: prazo (se mencionado)
- priority: high/medium/low
- confidence: 0.6-1.0

PROCURE por:
- "Precisamos/temos que fazer"
- "Você fica de/vai fazer"
- "Vou verificar/levantar/agendar"
- "A partir de [data]"
- "O próximo passo é"

### 5. ACTION ITEMS (action_items) - COM RESPONSÁVEL
Ações específicas com dono claro:
- value: ação específica
- description: detalhamento
- assignee: responsável (OBRIGATÓRIO)
- deadline: prazo
- priority: urgência
- confidence: 0.7-1.0

### 6. RISCOS (risks) - EXTRAIA TODOS
Problemas, preocupações, limitações ou ameaças:
- value: título do risco
- description: descrição completa, causas, consequências, mitigações (mín 60 palavras)
- relatedPerson: quem levantou
- relatedArea: área afetada
- priority: high/medium/low
- impact: impacto potencial
- confidence: 0.6-1.0

PROCURE por:
- "O problema/desafio é"
- "A dificuldade/limitação"
- "Isso afasta/prejudica"
- "Falta de X"
- "Não conseguimos/não temos"
- "Governança dificulta"

### 7. INSIGHTS (insights) - EXTRAIA TODOS
Aprendizados, oportunidades, observações estratégicas:
- value: título do insight
- description: explicação completa, importância, aplicação (mín 60 palavras)
- relatedPerson: quem contribuiu
- relatedArea: área beneficiada
- impact: impacto potencial
- confidence: 0.6-1.0

PROCURE por:
- "O que funciona/funcionou bem"
- "Uma oportunidade seria"
- "Aprendemos/percebemos que"
- "O mercado/cliente quer"
- "A vantagem é"
- "Transferência de conhecimento"

### 8. ENTIDADES MENCIONADAS (mentioned_entities)
Pessoas EXTERNAS, empresas, produtos, ferramentas, clientes:
- value: nome exato
- entityType: person_external | organization | product | tool | client
- description: contexto da menção
- mentions: vezes citado
- confidence: 0.6-1.0

EXTRAIR:
- Clientes potenciais (ex: Pirelli)
- Produtos discutidos (ex: Maverick, OneOps)
- Especialistas externos (ex: Rafael, Bruno)
- Ferramentas específicas (ex: Notion, Monday, Gemini, ChatGPT)
- Empresas parceiras/concorrentes

NÃO EXTRAIR:
- Participantes da reunião
- Projeto/empresa do contexto

## METAS DE EXTRAÇÃO (seja agressivo)
- Decisões: mínimo 4
- Tasks + Action Items: mínimo 5
- Riscos: mínimo 3
- Insights: mínimo 4
- Entidades: mínimo 5

Se a reunião for substantiva, você deve encontrar MAIS que isso.

Responda APENAS com JSON válido.

TRANSCRIÇÃO:
`;

export class LLMExtractionService {
  private endpoint: string;
  private apiKey: string;
  private deploymentName: string;
  private apiVersion: string;

  constructor() {
    this.endpoint = env.AZURE_OPENAI_ENDPOINT || '';
    this.apiKey = env.AZURE_OPENAI_KEY || '';
    this.deploymentName = env.AZURE_OPENAI_DEPLOYMENT_NAME;
    this.apiVersion = env.AZURE_OPENAI_API_VERSION;
  }

  isConfigured(): boolean {
    return !!(this.endpoint && this.apiKey);
  }

  async extractFromTranscript(transcript: string, meetingContext?: {
    title?: string;
    project?: string;
    participants?: string[];
  }): Promise<ExtractionResult> {
    const startTime = Date.now();

    if (!this.isConfigured()) {
      logger.warn('Azure OpenAI not configured, returning empty extraction');
      return {
        entities: [],
        summary: 'Extração LLM não configurada',
        keyTopics: [],
        processingTime: 0,
      };
    }

    try {
      // Build context-aware prompt
      let contextInfo = '';
      if (meetingContext) {
        if (meetingContext.title) contextInfo += `Título: ${meetingContext.title}\n`;
        if (meetingContext.project) contextInfo += `Projeto: ${meetingContext.project}\n`;
        if (meetingContext.participants?.length) {
          contextInfo += `Participantes: ${meetingContext.participants.join(', ')}\n`;
        }
        contextInfo += '\n';
      }

      const fullPrompt = EXTRACTION_PROMPT + contextInfo + transcript;

      // Limit transcript to avoid token limits (approx 100k chars ~ 25k tokens)
      const truncatedPrompt = fullPrompt.slice(0, 100000);

      const url = `${this.endpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=${this.apiVersion}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'Você é um assistente que extrai informações estruturadas de transcrições de reuniões. Responda sempre em JSON válido.',
            },
            {
              role: 'user',
              content: truncatedPrompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 8000,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Azure OpenAI error: ${response.status} - ${errorText}`);
        throw new Error(`Azure OpenAI API error: ${response.status}`);
      }

      const data = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content in Azure OpenAI response');
      }

      // Parse JSON response
      logger.info(`LLM raw response: ${content.slice(0, 500)}...`);
      const parsed = JSON.parse(content);
      logger.info(`LLM parsed keys: ${Object.keys(parsed).join(', ')}`);

      // Combine all entity types into single array
      const entities = [
        ...(parsed.tasks || []),
        ...(parsed.decisions || []),
        ...(parsed.risks || []),
        ...(parsed.insights || []),
        ...(parsed.action_items || []).map((item: any) => ({ ...item, type: 'actionItem' })),
        ...(parsed.mentioned_entities || []).map((item: any) => ({ 
          ...item, 
          type: 'mentionedEntity',
          context: `${item.entityType}: ${item.description || ''} (${item.mentions || 1}x mencionado)`,
        })),
        ...(parsed.entities || []), // fallback if LLM returns entities directly
      ];

      const processingTime = Date.now() - startTime;
      logger.info(`LLM extraction completed in ${processingTime}ms, found ${entities.length} entities`);

      return {
        entities,
        summary: parsed.summary || '',
        keyTopics: parsed.keyTopics || [],
        processingTime,
      };
    } catch (error) {
      logger.error('LLM extraction failed:', error);
      return {
        entities: [],
        summary: 'Erro na extração',
        keyTopics: [],
        processingTime: Date.now() - startTime,
      };
    }
  }
}

export const llmExtractionService = new LLMExtractionService();
