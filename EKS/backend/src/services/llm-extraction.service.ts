import { env } from '../config/env';
import { logger } from '../utils/logger';

interface ExtractedEntity {
  type: 'task' | 'decision' | 'risk' | 'insight';
  value: string;
  description: string;
  confidence: number;
  context?: string;
  assignee?: string;
  relatedPerson?: string;
  deadline?: string;
  priority?: 'high' | 'medium' | 'low';
  impact?: string;
}

interface OrgContext {
  users: Array<{ name: string; jobTitle?: string; department?: string }>;
  departments: Array<{ name: string }>;
}

interface ExtractionResult {
  entities: ExtractedEntity[];
  summary: string;
  keyTopics: string[];
  processingTime: number;
}

const EXTRACTION_PROMPT = `Você é um analista sênior de inteligência organizacional. Sua missão é extrair ABSOLUTAMENTE TUDO de relevante desta transcrição de reunião.

IMPORTANTE: Seja EXAUSTIVO. É melhor extrair demais do que de menos. Esta extração servirá como memória organizacional permanente.

ATENÇÃO SOBRE CLASSIFICAÇÃO: Tópicos são apenas METADADOS para recuperação (palavras-chave). Já elementos como tarefas, riscos, decisões, insights e projetos devem ser classificados DIRETAMENTE como entidades nas suas respectivas seções abaixo. NÃO coloque ações, riscos ou decisões como tópicos — classifique-os como entidades.

## ESTRUTURA DE SAÍDA (JSON)

### 1. RESUMO EXECUTIVO (summary)
Resumo DETALHADO com 300-500 palavras cobrindo:
- Objetivo e contexto da reunião
- Todos os pontos principais discutidos
- Decisões tomadas
- Próximos passos definidos

### 2. TÓPICOS PRINCIPAIS (keyTopics) - METADADOS PARA RECUPERAÇÃO
Array SIMPLES de strings com palavras-chave e termos-chave ESPECÍFICOS desta reunião.
Estes tópicos são METADADOS que ajudarão na busca e recuperação do conteúdo.

REGRA DE OURO: Os tópicos devem ser ESPECÍFICOS o suficiente para que alguém que busque por eles encontre ESTA reunião, e não qualquer reunião genérica.

BONS tópicos (específicos, contextuais):
- Nomes de programas, projetos, produtos mencionados (ex: "programa MOVE batch 2", "OneOps")
- Ferramentas específicas com contexto (ex: "Notion AI para gestão de conhecimento")
- Conceitos-chave debatidos com contexto (ex: "contrapartida equity 3%", "qualificação de startups por IA")
- Nomes de empresas, parceiros, startups citados (ex: "Genil", "Pirelli", "Maverick")
- Processos ou metodologias específicos (ex: "pipeline de investimento", "curadoria ontológica")
- Métricas ou indicadores discutidos (ex: "OKRs Q1 2026", "adesão 100% ao programa")
- Áreas de negócio com especificidade (ex: "governança Montreal para startups")

MAUS tópicos (genéricos demais — EVITE):
- "inteligência artificial" (muito genérico, use algo como "IA generativa para qualificação de deals")
- "status de risco" (genérico, use algo como "risco de não-adesão das startups ao programa")
- "tecnologia" (sem contexto)
- "gestão" (sem especificidade)

NÃO inclua aqui: tarefas, ações, riscos, decisões ou insights — estes vão nas seções de entidades abaixo.

Mínimo 12 termos, máximo 25. Formato: array simples de strings.
Cada termo deve ter entre 2 e 8 palavras para balancear especificidade e concisão.

### 3. DECISÕES (decisions) - EXTRAIA TODAS
Qualquer escolha, definição ou direcionamento tomado:
- value: a decisão (máx 15 palavras)
- description: contexto completo, motivação, alternativas (mín 60 palavras)
- relatedPerson: nome EXATO de quem decidiu (use APENAS nomes dos participantes ou pessoas mencionadas na transcrição)
- impact: impacto esperado
- confidence: 0.6-1.0

PROCURE por frases como:
- "Vamos usar/fazer/adotar X"
- "A estratégia/direção é"
- "Decidimos/definimos que"
- "Não vamos fazer X"
- "O foco vai ser"
- "A plataforma será"

### 4. TAREFAS (tasks) - EXTRAIA TODAS (inclui action items)
Qualquer ação necessária, atribuída ou com responsável claro:
- value: título da tarefa/ação
- description: detalhamento completo (mín 50 palavras)
- assignee: nome EXATO do responsável (use APENAS nomes dos participantes ou pessoas mencionadas na transcrição) - OBRIGATÓRIO quando houver dono claro
- deadline: prazo (se mencionado)
- priority: high/medium/low
- confidence: 0.6-1.0

PROCURE por:
- "Precisamos/temos que fazer"
- "Você fica de/vai fazer"
- "Vou verificar/levantar/agendar"
- "A partir de [data]"
- "O próximo passo é"
- Ações com dono claro e prazo definido

### 6. RISCOS (risks) - EXTRAIA TODOS
Problemas, preocupações, limitações ou ameaças:
- value: título do risco
- description: descrição completa, causas, consequências, mitigações (mín 60 palavras)
- relatedPerson: nome EXATO de quem levantou (use APENAS nomes dos participantes ou pessoas mencionadas na transcrição)
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
- relatedPerson: nome EXATO de quem contribuiu (use APENAS nomes dos participantes ou pessoas mencionadas na transcrição)
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
- keyTopics: mínimo 10 termos (strings simples)
- Decisões: mínimo 4
- Tarefas: mínimo 5 (incluindo action items)
- Riscos: mínimo 3
- Insights: mínimo 4
- Entidades mencionadas: mínimo 5

Se a reunião for substantiva, você deve encontrar MAIS que isso.
LEMBRE-SE: Tudo que for ação, tarefa, risco, decisão ou insight vai como ENTIDADE, não como tópico.

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
  }, orgContext?: OrgContext): Promise<ExtractionResult> {
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

      // Inject organizational context so LLM uses REAL names and departments
      let orgContextInfo = '';
      if (orgContext) {
        if (orgContext.users.length > 0) {
          orgContextInfo += `\n## CONTEXTO ORGANIZACIONAL (USE ESTES DADOS REAIS)\n`;
          orgContextInfo += `### Colaboradores da organização:\n`;
          for (const user of orgContext.users) {
            orgContextInfo += `- ${user.name}`;
            if (user.jobTitle) orgContextInfo += ` (${user.jobTitle})`;
            if (user.department) orgContextInfo += ` — Depto: ${user.department}`;
            orgContextInfo += `\n`;
          }
        }
        if (orgContext.departments.length > 0) {
          orgContextInfo += `### Departamentos existentes:\n`;
          orgContextInfo += orgContext.departments.map(d => `- ${d.name}`).join('\n') + '\n';
        }
        orgContextInfo += `\nIMPORTANTE: Para assignee e relatedPerson, use SOMENTE nomes de pessoas reais listadas acima ou mencionadas na transcrição. NÃO invente nomes.\n\n`;
      }

      const fullPrompt = EXTRACTION_PROMPT + orgContextInfo + contextInfo + transcript;

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
      // IMPORTANTE: Cada array precisa receber o campo `type` explicitamente,
      // pois o LLM agrupa por chave JSON mas não inclui `type` nos objetos individuais.
      const entities = [
        ...(parsed.tasks || []).map((item: any) => ({ ...item, type: 'task' })),
        ...(parsed.action_items || []).map((item: any) => ({ ...item, type: 'task' })), // action_items → task
        ...(parsed.decisions || []).map((item: any) => ({ ...item, type: 'decision' })),
        ...(parsed.risks || []).map((item: any) => ({ ...item, type: 'risk' })),
        ...(parsed.insights || []).map((item: any) => ({ ...item, type: 'insight' })),
        ...(parsed.mentioned_entities || []).map((item: any) => ({ 
          ...item, 
          type: 'mentionedEntity',
          context: `${item.entityType}: ${item.description || ''} (${item.mentions || 1}x mencionado)`,
        })),
        ...(parsed.entities || []), // fallback if LLM returns entities directly
      ];

      const processingTime = Date.now() - startTime;
      
      // Log detalhado por tipo de entidade para debug
      const typeCounts: Record<string, number> = {};
      for (const e of entities) {
        typeCounts[e.type || 'unknown'] = (typeCounts[e.type || 'unknown'] || 0) + 1;
      }
      logger.info(`LLM extraction completed in ${processingTime}ms, found ${entities.length} entities: ${JSON.stringify(typeCounts)}`);

      return {
        entities,
        summary: parsed.summary || '',
        // Normalizar keyTopics para array simples de strings
        keyTopics: (parsed.keyTopics || []).map((t: any) =>
          typeof t === 'string' ? t : (t.topic || String(t))
        ),
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
