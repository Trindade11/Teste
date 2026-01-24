/**
 * LLM Service - Azure OpenAI Integration
 * Used for generating metadata and insights from user data
 */

import { logger } from '../utils/logger';

interface AzureOpenAIConfig {
  endpoint: string;
  apiKey: string;
  apiVersion: string;
  deploymentName: string;
}

interface UserProfileData {
  fullName: string;
  jobTitle: string;
  company: string;
  department: string;
  profileDescription: string;
  roleDescription: string;
  departmentDescription: string;
  competencies: string[];
  primaryObjective: string;
  topChallenges: string;
}

interface UserMetadataInsights {
  personality_traits: string[];
  work_style: string;
  communication_preference: string;
  expertise_areas: string[];
  potential_needs: string[];
  collaboration_style: string;
  decision_making_profile: string;
  summary: string;
}

function getAzureConfig(): AzureOpenAIConfig {
  return {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
    apiKey: process.env.AZURE_OPENAI_KEY || '',
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview',
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o-mini-aion',
  };
}

export async function generateUserMetadataInsights(
  profileData: UserProfileData
): Promise<UserMetadataInsights | null> {
  const config = getAzureConfig();

  if (!config.endpoint || !config.apiKey) {
    logger.warn('Azure OpenAI not configured, skipping metadata generation');
    return null;
  }

  const prompt = `Analise o perfil profissional abaixo e extraia metadados estruturados sobre o usuário.

## Perfil do Usuário

**Nome:** ${profileData.fullName}
**Cargo:** ${profileData.jobTitle}
**Empresa:** ${profileData.company}
**Departamento:** ${profileData.department}

**Descrição do Perfil:**
${profileData.profileDescription}

**Descrição do Papel:**
${profileData.roleDescription}

**Descrição do Departamento:**
${profileData.departmentDescription}

**Competências Declaradas:**
${profileData.competencies.join(', ')}

**Objetivo Principal:**
${profileData.primaryObjective}

**Principais Desafios:**
${profileData.topChallenges}

---

Retorne APENAS um JSON válido (sem markdown) com a seguinte estrutura:
{
  "personality_traits": ["traço1", "traço2", "traço3"],
  "work_style": "descrição breve do estilo de trabalho",
  "communication_preference": "direto" | "detalhado" | "visual" | "colaborativo",
  "expertise_areas": ["área1", "área2", "área3"],
  "potential_needs": ["necessidade1", "necessidade2", "necessidade3"],
  "collaboration_style": "descrição breve",
  "decision_making_profile": "analítico" | "intuitivo" | "consultivo" | "delegador",
  "summary": "resumo de 2-3 frases sobre o perfil profissional"
}`;

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
          {
            role: 'system',
            content:
              'Você é um analista de perfil profissional. Analise dados e extraia insights estruturados. Responda APENAS com JSON válido, sem markdown.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Azure OpenAI error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      logger.warn('No content in Azure OpenAI response');
      return null;
    }

    // Parse JSON response (remove any markdown if present)
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const insights = JSON.parse(jsonStr) as UserMetadataInsights;

    logger.info(`Generated metadata insights for user ${profileData.fullName}`);
    return insights;
  } catch (error) {
    logger.error('Failed to generate user metadata insights:', error);
    return null;
  }
}

export async function generatePersonaSummary(
  profileData: UserProfileData
): Promise<string | null> {
  const config = getAzureConfig();

  if (!config.endpoint || !config.apiKey) {
    return null;
  }

  const prompt = `Crie um resumo profissional conciso (máximo 200 caracteres) para:

Nome: ${profileData.fullName}
Cargo: ${profileData.jobTitle}
Empresa: ${profileData.company}
Competências: ${profileData.competencies.slice(0, 3).join(', ')}
Objetivo: ${profileData.primaryObjective}

Responda APENAS com o resumo, sem aspas ou formatação.`;

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
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    return content || null;
  } catch (error) {
    logger.error('Failed to generate persona summary:', error);
    return null;
  }
}
