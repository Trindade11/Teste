/**
 * Document Metadata Extractor Service
 * Extracts metadata from documents using Azure OpenAI LLM
 */

import { env } from '../config/env';
import { logger } from '../utils/logger';

export type DocumentType =
  | 'contract'
  | 'report'
  | 'meeting'
  | 'process_doc'
  | 'strategic_plan'
  | 'technical_spec'
  | 'email'
  | 'note'
  | 'policy'
  | 'analysis'
  | 'manual'
  | 'proposal'
  | 'spreadsheet'
  | 'other';

export interface DocumentMetadataExtraction {
  suggestedTitle: string;
  suggestedType: DocumentType;
  suggestedTags: string[];
  summary: string;
  canonicalData: Record<string, any>;
  confidence: number;
}

export interface MentionedEntity {
  type: 'person' | 'project' | 'department' | 'organization';
  name: string;
  context: string;
  confidence: number;
}

const EXTRACTION_PROMPT = `Você é um especialista em análise de documentos corporativos. Analise o documento fornecido e extraia metadados estruturados.

## INSTRUÇÕES

1. **Título**: Identifique o título principal do documento. Se não houver título explícito, crie um título descritivo baseado no conteúdo (máx 100 caracteres).

2. **Tipo de Documento**: Classifique o documento em um dos tipos:
   - contract: Contratos, acordos formais, termos de serviço
   - report: Relatórios de progresso, análise, resultados
   - meeting: Atas de reunião, notas de reunião
   - process_doc: Documentação de processos, procedimentos, workflows
   - strategic_plan: Planejamento estratégico, roadmaps
   - technical_spec: Especificações técnicas, documentação de sistemas
   - policy: Políticas organizacionais, normas, regulamentos
   - manual: Manuais de usuário, guias, tutoriais
   - proposal: Propostas comerciais, propostas de projeto
   - analysis: Análises, estudos, pesquisas
   - spreadsheet: Planilhas com dados tabulados
   - other: Outros tipos não classificados

3. **Tags**: Gere 5-10 tags (keywords) específicas que descrevem o conteúdo. Use termos específicos, não genéricos.
   - BOM: "contrato prestação serviços", "empresa X", "Q1 2026"
   - RUIM: "documento", "importante", "negócio"

4. **Resumo**: Crie um resumo executivo de 100-200 palavras cobrindo:
   - Propósito do documento
   - Pontos principais
   - Conclusões/próximos passos (se aplicável)

5. **Entidades Mencionadas**: Identifique pessoas, projetos, departamentos e organizações mencionados no documento.

6. **Dados Canônicos**: Extraia dados específicos baseado no tipo de documento (veja seção abaixo).

## DADOS CANÔNICOS POR TIPO

### contract (Contrato)
- parties: [string] - Partes envolvidas
- value: string - Valor do contrato
- duration: string - Prazo/duração
- startDate: string - Data de início
- endDate: string - Data de término
- mainClauses: [string] - Principais cláusulas

### report (Relatório)
- period: string - Período coberto (ex: "Q1 2026")
- author: string - Responsável pelo relatório
- metrics: [{name: string, value: string}] - Métricas/KPIs mencionados
- conclusions: [string] - Principais conclusões

### meeting (Ata de Reunião)
- date: string - Data da reunião
- participants: [string] - Participantes
- decisions: [string] - Decisões tomadas
- actionItems: [string] - Action items

### policy (Política/Norma)
- scope: string - Escopo de aplicação
- effectiveDate: string - Data de vigência
- responsible: string - Responsável
- mainArticles: [string] - Principais artigos

### manual (Manual)
- version: string - Versão do manual
- targetAudience: string - Público-alvo
- mainSections: [string] - Principais seções

### proposal (Proposta)
- client: string - Cliente/destinatário
- value: string - Valor proposto
- deadline: string - Prazo de entrega
- scope: string - Escopo do trabalho

## FORMATO DE SAÍDA

Retorne APENAS um objeto JSON válido (sem markdown, sem explicações):

{
  "suggestedTitle": "string",
  "suggestedType": "contract|report|meeting|...",
  "suggestedTags": ["tag1", "tag2", ...],
  "summary": "string (100-200 palavras)",
  "mentionedEntities": [
    {
      "type": "person|project|department|organization",
      "name": "string",
      "context": "string (onde foi mencionado)",
      "confidence": 0.0-1.0
    }
  ],
  "canonicalData": {
    // Dados específicos do tipo de documento
  },
  "confidence": 0.0-1.0
}

## DOCUMENTO A ANALISAR

Nome do arquivo: {{fileName}}

Conteúdo:
{{content}}
`;

export class DocumentMetadataExtractor {
  private apiKey: string;
  private endpoint: string;
  private deploymentName: string;

  constructor() {
    this.apiKey = env.AZURE_OPENAI_KEY || '';
    this.endpoint = env.AZURE_OPENAI_ENDPOINT || '';
    this.deploymentName = env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o';
  }

  async extract(fileContent: string, fileName: string): Promise<DocumentMetadataExtraction & { mentionedEntities: MentionedEntity[] }> {
    const startTime = Date.now();

    try {
      // Limitar conteúdo para não exceder limites do LLM
      const truncatedContent = fileContent.length > 15000 
        ? fileContent.substring(0, 15000) + '\n\n[... conteúdo truncado ...]'
        : fileContent;

      const prompt = EXTRACTION_PROMPT
        .replace('{{fileName}}', fileName)
        .replace('{{content}}', truncatedContent);

      logger.info(`Extracting metadata from document: ${fileName} (${fileContent.length} chars)`);

      const response = await fetch(
        `${this.endpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=2024-02-15-preview`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.apiKey,
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: 'Você é um especialista em análise de documentos corporativos. Retorne APENAS JSON válido, sem markdown.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.3,
            max_tokens: 2000,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as any;
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content in LLM response');
      }

      // Parse JSON (remover markdown se presente)
      let jsonContent = content.trim();
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/```\n?/g, '');
      }

      const extracted = JSON.parse(jsonContent);

      const processingTime = Date.now() - startTime;
      logger.info(`Metadata extraction completed in ${processingTime}ms`);

      return {
        suggestedTitle: extracted.suggestedTitle || fileName,
        suggestedType: extracted.suggestedType || 'other',
        suggestedTags: extracted.suggestedTags || [],
        summary: extracted.summary || '',
        canonicalData: extracted.canonicalData || {},
        confidence: extracted.confidence || 0.7,
        mentionedEntities: extracted.mentionedEntities || [],
      };
    } catch (error) {
      logger.error('Error extracting document metadata:', error);
      
      // Fallback: retornar metadados básicos
      return {
        suggestedTitle: fileName.replace(/\.[^/.]+$/, ''),
        suggestedType: 'other',
        suggestedTags: [],
        summary: '',
        canonicalData: {},
        confidence: 0.0,
        mentionedEntities: [],
      };
    }
  }
}
