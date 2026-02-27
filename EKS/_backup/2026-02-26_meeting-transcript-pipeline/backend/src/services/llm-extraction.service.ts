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

const EXTRACTION_PROMPT = `Voc├¬ ├® um analista s├¬nior de intelig├¬ncia organizacional. Sua miss├úo ├® extrair ABSOLUTAMENTE TUDO de relevante desta transcri├º├úo de reuni├úo.

IMPORTANTE: Seja EXAUSTIVO. ├ë melhor extrair demais do que de menos. Esta extra├º├úo servir├í como mem├│ria organizacional permanente.

ATEN├ç├âO SOBRE CLASSIFICA├ç├âO: T├│picos s├úo apenas METADADOS para recupera├º├úo (palavras-chave). J├í elementos como tarefas, riscos, decis├Áes, insights e projetos devem ser classificados DIRETAMENTE como entidades nas suas respectivas se├º├Áes abaixo. N├âO coloque a├º├Áes, riscos ou decis├Áes como t├│picos ÔÇö classifique-os como entidades.

## ESTRUTURA DE SA├ìDA (JSON)

### 1. RESUMO EXECUTIVO (summary)
Resumo DETALHADO com 300-500 palavras cobrindo:
- Objetivo e contexto da reuni├úo
- Todos os pontos principais discutidos
- Decis├Áes tomadas
- Pr├│ximos passos definidos

### 2. T├ôPICOS PRINCIPAIS (keyTopics) - METADADOS PARA RECUPERA├ç├âO
Array SIMPLES de strings com palavras-chave e termos-chave ESPEC├ìFICOS desta reuni├úo.
Estes t├│picos s├úo METADADOS que ajudar├úo na busca e recupera├º├úo do conte├║do.

REGRA DE OURO: Os t├│picos devem ser ESPEC├ìFICOS o suficiente para que algu├®m que busque por eles encontre ESTA reuni├úo, e n├úo qualquer reuni├úo gen├®rica.

BONS t├│picos (espec├¡ficos, contextuais):
- Nomes de programas, projetos, produtos mencionados (ex: "programa MOVE batch 2", "OneOps")
- Ferramentas espec├¡ficas com contexto (ex: "Notion AI para gest├úo de conhecimento")
- Conceitos-chave debatidos com contexto (ex: "contrapartida equity 3%", "qualifica├º├úo de startups por IA")
- Nomes de empresas, parceiros, startups citados (ex: "Genil", "Pirelli", "Maverick")
- Processos ou metodologias espec├¡ficos (ex: "pipeline de investimento", "curadoria ontol├│gica")
- M├®tricas ou indicadores discutidos (ex: "OKRs Q1 2026", "ades├úo 100% ao programa")
- ├üreas de neg├│cio com especificidade (ex: "governan├ºa Montreal para startups")

MAUS t├│picos (gen├®ricos demais ÔÇö EVITE):
- "intelig├¬ncia artificial" (muito gen├®rico, use algo como "IA generativa para qualifica├º├úo de deals")
- "status de risco" (gen├®rico, use algo como "risco de n├úo-ades├úo das startups ao programa")
- "tecnologia" (sem contexto)
- "gest├úo" (sem especificidade)

N├âO inclua aqui: tarefas, a├º├Áes, riscos, decis├Áes ou insights ÔÇö estes v├úo nas se├º├Áes de entidades abaixo.

M├¡nimo 12 termos, m├íximo 25. Formato: array simples de strings.
Cada termo deve ter entre 2 e 8 palavras para balancear especificidade e concis├úo.

### 3. DECIS├òES (decisions) - EXTRAIA TODAS
Qualquer escolha, defini├º├úo ou direcionamento tomado:
- value: a decis├úo (m├íx 15 palavras)
- description: contexto completo, motiva├º├úo, alternativas (m├¡n 60 palavras)
- relatedPerson: nome EXATO de quem decidiu (use APENAS nomes dos participantes ou pessoas mencionadas na transcri├º├úo)
- impact: impacto esperado
- confidence: 0.6-1.0

PROCURE por frases como:
- "Vamos usar/fazer/adotar X"
- "A estrat├®gia/dire├º├úo ├®"
- "Decidimos/definimos que"
- "N├úo vamos fazer X"
- "O foco vai ser"
- "A plataforma ser├í"

### 4. TAREFAS (tasks) - EXTRAIA TODAS (inclui action items)
Qualquer a├º├úo necess├íria, atribu├¡da ou com respons├ível claro:
- value: t├¡tulo da tarefa/a├º├úo
- description: detalhamento completo (m├¡n 50 palavras)
- assignee: nome EXATO do respons├ível (use APENAS nomes dos participantes ou pessoas mencionadas na transcri├º├úo) - OBRIGAT├ôRIO quando houver dono claro
- deadline: prazo (se mencionado)
- priority: high/medium/low
- confidence: 0.6-1.0

PROCURE por:
- "Precisamos/temos que fazer"
- "Voc├¬ fica de/vai fazer"
- "Vou verificar/levantar/agendar"
- "A partir de [data]"
- "O pr├│ximo passo ├®"
- A├º├Áes com dono claro e prazo definido

### 6. RISCOS (risks) - EXTRAIA TODOS
Problemas, preocupa├º├Áes, limita├º├Áes ou amea├ºas:
- value: t├¡tulo do risco
- description: descri├º├úo completa, causas, consequ├¬ncias, mitiga├º├Áes (m├¡n 60 palavras)
- relatedPerson: nome EXATO de quem levantou (use APENAS nomes dos participantes ou pessoas mencionadas na transcri├º├úo)
- priority: high/medium/low
- impact: impacto potencial
- confidence: 0.6-1.0

PROCURE por:
- "O problema/desafio ├®"
- "A dificuldade/limita├º├úo"
- "Isso afasta/prejudica"
- "Falta de X"
- "N├úo conseguimos/n├úo temos"
- "Governan├ºa dificulta"

### 7. INSIGHTS (insights) - EXTRAIA TODOS
Aprendizados, oportunidades, observa├º├Áes estrat├®gicas:
- value: t├¡tulo do insight
- description: explica├º├úo completa, import├óncia, aplica├º├úo (m├¡n 60 palavras)
- relatedPerson: nome EXATO de quem contribuiu (use APENAS nomes dos participantes ou pessoas mencionadas na transcri├º├úo)
- impact: impacto potencial
- confidence: 0.6-1.0

PROCURE por:
- "O que funciona/funcionou bem"
- "Uma oportunidade seria"
- "Aprendemos/percebemos que"
- "O mercado/cliente quer"
- "A vantagem ├®"
- "Transfer├¬ncia de conhecimento"

### 8. ENTIDADES MENCIONADAS (mentioned_entities)
Pessoas EXTERNAS, empresas, produtos, ferramentas, clientes:
- value: nome exato
- entityType: person_external | organization | product | tool | client
- description: contexto da men├º├úo
- mentions: vezes citado
- confidence: 0.6-1.0

EXTRAIR:
- Clientes potenciais (ex: Pirelli)
- Produtos discutidos (ex: Maverick, OneOps)
- Especialistas externos (ex: Rafael, Bruno)
- Ferramentas espec├¡ficas (ex: Notion, Monday, Gemini, ChatGPT)
- Empresas parceiras/concorrentes

N├âO EXTRAIR:
- Participantes da reuni├úo
- Projeto/empresa do contexto

## METAS DE EXTRA├ç├âO (seja agressivo)
- keyTopics: m├¡nimo 10 termos (strings simples)
- Decis├Áes: m├¡nimo 4
- Tarefas: m├¡nimo 5 (incluindo action items)
- Riscos: m├¡nimo 3
- Insights: m├¡nimo 4
- Entidades mencionadas: m├¡nimo 5

Se a reuni├úo for substantiva, voc├¬ deve encontrar MAIS que isso.
LEMBRE-SE: Tudo que for a├º├úo, tarefa, risco, decis├úo ou insight vai como ENTIDADE, n├úo como t├│pico.

Responda APENAS com JSON v├ílido.

TRANSCRI├ç├âO:
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
        summary: 'Extra├º├úo LLM n├úo configurada',
        keyTopics: [],
        processingTime: 0,
      };
    }

    try {
      // Build context-aware prompt
      let contextInfo = '';
      if (meetingContext) {
        if (meetingContext.title) contextInfo += `T├¡tulo: ${meetingContext.title}\n`;
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
          orgContextInfo += `### Colaboradores da organiza├º├úo:\n`;
          for (const user of orgContext.users) {
            orgContextInfo += `- ${user.name}`;
            if (user.jobTitle) orgContextInfo += ` (${user.jobTitle})`;
            if (user.department) orgContextInfo += ` ÔÇö Depto: ${user.department}`;
            orgContextInfo += `\n`;
          }
        }
        if (orgContext.departments.length > 0) {
          orgContextInfo += `### Departamentos existentes:\n`;
          orgContextInfo += orgContext.departments.map(d => `- ${d.name}`).join('\n') + '\n';
        }
        orgContextInfo += `\nIMPORTANTE: Para assignee e relatedPerson, use SOMENTE nomes de pessoas reais listadas acima ou mencionadas na transcri├º├úo. N├âO invente nomes.\n\n`;
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
              content: 'Voc├¬ ├® um assistente que extrai informa├º├Áes estruturadas de transcri├º├Áes de reuni├Áes. Responda sempre em JSON v├ílido.',
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
      // pois o LLM agrupa por chave JSON mas n├úo inclui `type` nos objetos individuais.
      const entities = [
        ...(parsed.tasks || []).map((item: any) => ({ ...item, type: 'task' })),
        ...(parsed.action_items || []).map((item: any) => ({ ...item, type: 'task' })), // action_items ÔåÆ task
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
        summary: 'Erro na extra├º├úo',
        keyTopics: [],
        processingTime: Date.now() - startTime,
      };
    }
  }
}

export const llmExtractionService = new LLMExtractionService();
