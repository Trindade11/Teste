/**
 * PIA Service - Process Intelligence & Analysis
 * Handles process inference, mapping, and gamification
 */

import { logger } from '../utils/logger';

interface AzureOpenAIConfig {
  endpoint: string;
  apiKey: string;
  apiVersion: string;
  deploymentName: string;
}

interface OnboardingContext {
  fullName: string;
  jobTitle: string;
  department: string;
  company: string;
  roleDescription: string;
  primaryObjective: string;
  topChallenges: string;
  competencies: string[];
  departmentDescription?: string;
}

interface ProcessSuggestion {
  name: string;
  description: string;
  confidence: number;
  source: 'role_description' | 'objective' | 'challenge' | 'competency';
  department: string;
  suggestedActivities: string[];
}

interface ActivitySuggestion {
  name: string;
  description: string;
  sequenceOrder: number;
  isDecisionPoint: boolean;
  estimatedDuration: number;
  possibleHandoffs: string[];
}

interface BusinessRuleSuggestion {
  name: string;
  condition: string;
  action: string;
  confidence: number;
  sourceText: string;
}

function getAzureConfig(): AzureOpenAIConfig {
  return {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
    apiKey: process.env.AZURE_OPENAI_KEY || '',
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview',
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o-mini-aion',
  };
}

async function callAzureOpenAI(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const config = getAzureConfig();

  if (!config.endpoint || !config.apiKey) {
    logger.warn('Azure OpenAI not configured');
    return null;
  }

  try {
    const url = `${config.endpoint}/openai/deployments/${config.deploymentName}/chat/completions?api-version=${config.apiVersion}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.apiKey,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Azure OpenAI error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    logger.error('Azure OpenAI call failed:', error);
    return null;
  }
}

/**
 * Infer processes from onboarding data
 */
export async function inferProcessesFromOnboarding(
  context: OnboardingContext
): Promise<ProcessSuggestion[]> {
  const systemPrompt = `Você é um especialista em mapeamento de processos organizacionais.
Analise o perfil profissional fornecido e infira os principais processos que esta pessoa provavelmente executa ou participa.

Retorne APENAS um JSON válido (sem markdown) com array de processos sugeridos.
Cada processo deve ter: name, description, confidence (0.0-1.0), source, department, suggestedActivities (array de nomes de atividades).

Foque em processos reais e específicos do cargo/área, não genéricos.`;

  const userPrompt = `## Perfil Profissional

**Nome:** ${context.fullName}
**Cargo:** ${context.jobTitle}
**Departamento:** ${context.department}
**Empresa:** ${context.company} (corretora de investimentos)

**Descrição do Papel:**
${context.roleDescription}

**Objetivo Principal:**
${context.primaryObjective}

**Principais Desafios:**
${context.topChallenges}

**Competências:**
${context.competencies.join(', ')}

${context.departmentDescription ? `**Sobre o Departamento:** ${context.departmentDescription}` : ''}

---

Infira 3-5 processos principais que esta pessoa executa. Retorne JSON:
[
  {
    "name": "Nome do Processo",
    "description": "Descrição breve",
    "confidence": 0.85,
    "source": "role_description",
    "department": "${context.department}",
    "suggestedActivities": ["Atividade 1", "Atividade 2", "Atividade 3"]
  }
]`;

  const response = await callAzureOpenAI(systemPrompt, userPrompt);

  if (!response) {
    logger.warn('Failed to infer processes from onboarding');
    return getDefaultProcessSuggestions(context);
  }

  try {
    const jsonStr = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const suggestions = JSON.parse(jsonStr) as ProcessSuggestion[];
    logger.info(`Inferred ${suggestions.length} processes for ${context.fullName}`);
    return suggestions;
  } catch (error) {
    logger.error('Failed to parse process suggestions:', error);
    return getDefaultProcessSuggestions(context);
  }
}

/**
 * Default process suggestions based on common patterns
 */
function getDefaultProcessSuggestions(context: OnboardingContext): ProcessSuggestion[] {
  const defaults: ProcessSuggestion[] = [];

  // Based on job title patterns
  const jobTitle = context.jobTitle.toLowerCase();

  if (jobTitle.includes('ceo') || jobTitle.includes('diretor')) {
    defaults.push({
      name: 'Planejamento Estratégico',
      description: 'Definição de diretrizes, metas e prioridades organizacionais',
      confidence: 0.7,
      source: 'role_description',
      department: context.department,
      suggestedActivities: ['Análise de cenário', 'Definição de metas', 'Comunicação de diretrizes'],
    });
    defaults.push({
      name: 'Reunião de Alinhamento Executivo',
      description: 'Alinhamento periódico com lideranças das áreas',
      confidence: 0.65,
      source: 'objective',
      department: context.department,
      suggestedActivities: ['Preparar pauta', 'Conduzir reunião', 'Documentar decisões'],
    });
  }

  if (jobTitle.includes('trading') || jobTitle.includes('trader') || jobTitle.includes('operador')) {
    defaults.push({
      name: 'Execução de Ordens',
      description: 'Execução de ordens de compra e venda de ativos',
      confidence: 0.8,
      source: 'role_description',
      department: context.department,
      suggestedActivities: ['Receber ordem', 'Analisar mercado', 'Executar', 'Confirmar'],
    });
  }

  if (jobTitle.includes('compliance') || jobTitle.includes('risco')) {
    defaults.push({
      name: 'Monitoramento de Conformidade',
      description: 'Verificação de aderência a normas regulatórias',
      confidence: 0.75,
      source: 'role_description',
      department: context.department,
      suggestedActivities: ['Coletar dados', 'Analisar desvios', 'Reportar', 'Remediar'],
    });
  }

  if (jobTitle.includes('backoffice') || jobTitle.includes('operações')) {
    defaults.push({
      name: 'Liquidação de Operações',
      description: 'Processamento e liquidação de operações financeiras',
      confidence: 0.75,
      source: 'role_description',
      department: context.department,
      suggestedActivities: ['Receber operação', 'Validar dados', 'Liquidar', 'Conciliar'],
    });
  }

  // Generic if nothing matched
  if (defaults.length === 0) {
    defaults.push({
      name: 'Atividades do Cargo',
      description: `Processos principais executados por ${context.jobTitle}`,
      confidence: 0.5,
      source: 'role_description',
      department: context.department,
      suggestedActivities: ['A definir'],
    });
  }

  return defaults;
}

/**
 * Detail activities for a specific process
 */
export async function detailProcessActivities(
  processName: string,
  processDescription: string,
  context: OnboardingContext
): Promise<ActivitySuggestion[]> {
  const systemPrompt = `Você é um especialista em mapeamento de processos.
Detalhe as atividades de um processo organizacional.

Retorne APENAS JSON válido com array de atividades.
Cada atividade: name, description, sequenceOrder, isDecisionPoint, estimatedDuration (minutos), possibleHandoffs.`;

  const userPrompt = `## Processo a Detalhar

**Processo:** ${processName}
**Descrição:** ${processDescription}

**Contexto do Executor:**
- Cargo: ${context.jobTitle}
- Departamento: ${context.department}
- Empresa: ${context.company} (corretora de investimentos)

Detalhe 4-8 atividades sequenciais. Identifique pontos de decisão e possíveis handoffs (para quais áreas/cargos).

JSON esperado:
[
  {
    "name": "Nome da Atividade",
    "description": "O que é feito",
    "sequenceOrder": 1,
    "isDecisionPoint": false,
    "estimatedDuration": 30,
    "possibleHandoffs": ["Cargo/Área que recebe"]
  }
]`;

  const response = await callAzureOpenAI(systemPrompt, userPrompt);

  if (!response) {
    return [];
  }

  try {
    const jsonStr = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr) as ActivitySuggestion[];
  } catch (error) {
    logger.error('Failed to parse activity suggestions:', error);
    return [];
  }
}

/**
 * Extract business rules from process/activity descriptions
 */
export async function extractBusinessRules(
  processName: string,
  activities: string[],
  additionalContext: string
): Promise<BusinessRuleSuggestion[]> {
  const systemPrompt = `Você é um especialista em análise de regras de negócio.
Extraia regras de negócio implícitas de descrições de processos.

Retorne APENAS JSON válido com array de regras.
Cada regra: name, condition (IF), action (THEN), confidence, sourceText.

Foque em regras claras e acionáveis, não suposições genéricas.`;

  const userPrompt = `## Processo

**Nome:** ${processName}

**Atividades:**
${activities.map((a, i) => `${i + 1}. ${a}`).join('\n')}

**Contexto Adicional:**
${additionalContext}

Extraia regras de negócio (se existirem). Exemplo:
[
  {
    "name": "Regra de Aprovação por Valor",
    "condition": "valor da operação > R$ 1.000.000",
    "action": "requer aprovação do Compliance",
    "confidence": 0.85,
    "sourceText": "trecho que originou a regra"
  }
]

Se não houver regras claras, retorne [].`;

  const response = await callAzureOpenAI(systemPrompt, userPrompt);

  if (!response) {
    return [];
  }

  try {
    const jsonStr = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr) as BusinessRuleSuggestion[];
  } catch (error) {
    logger.error('Failed to parse business rules:', error);
    return [];
  }
}

/**
 * Get organizational structure summary
 */
export interface OrganizationalStructure {
  organization: {
    name: string;
    description: string;
    type: string;
  } | null;
  departments: Array<{
    name: string;
    memberCount: number;
    hasProcesses: boolean;
  }>;
  users: {
    total: number;
    withOnboarding: number;
    withoutOnboarding: number;
  };
  mappingCoverage: {
    departmentsMapped: number;
    totalDepartments: number;
    percentageMapped: number;
  };
}
