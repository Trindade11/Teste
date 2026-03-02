import { ChunkingStrategy, SemanticChunk, DocumentMetadata } from '../types';
import { logger } from '../../../utils/logger';

interface LLMChunk {
  sequenceIndex: number;
  text: string;
  chunkType: string;
  sectionTitle?: string;
  sectionNumber?: string;
  hierarchyLevel: number;
  validFrom?: string;
  validUntil?: string;
  effectiveAt?: string;
  signedAt?: string;
  containsTable: boolean;
  tableData?: {
    headers: string[];
    rows: string[][];
  };
  keyTopics?: string[];
  estimatedImportance: string;
  reasoning: string;
}

/**
 * Intelligent Chunker - Uses LLM to read document and decide chunk boundaries semantically
 * Like a human reading and dividing content into logical parts
 */
export class IntelligentChunker implements ChunkingStrategy {
  private endpoint: string;
  private apiKey: string;
  private apiVersion: string;
  private deploymentName: string;

  constructor() {
    logger.info('🏗️ IntelligentChunker constructor called');
    
    this.endpoint = process.env.AZURE_OPENAI_ENDPOINT || '';
    this.apiKey = process.env.AZURE_OPENAI_KEY || '';
    this.apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview';
    this.deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o-mini-aion';
    
    logger.info('🔧 Azure OpenAI Configuration', {
      endpoint: this.endpoint,
      apiVersion: this.apiVersion,
      deploymentName: this.deploymentName,
      hasApiKey: !!this.apiKey,
    });
  }

  private getTypeInstructions(docType: string): string {
    const instructions: Record<string, string> = {
      'contract': `
- CONTRATOS: Preserve cláusulas inteiras como chunks separados
- Identifique: CLÁUSULA, SEÇÃO, ASSINATURAS, ANEXOS
- Cada cláusula deve ser um chunk independente
- Mantenha a numeração das cláusulas (CLÁUSULA PRIMEIRA, etc.)
- Table detection: Procure tabelas de valores, prazos, condições`,
      
      'report': `
- RELATÓRIOS: Preserve seções executivas, introduções, conclusões
- Identifique: SUMÁRIO EXECUTIVO, METODOLOGIA, RESULTADOS, RECOMENDAÇÕES
- Mantenha a estrutura hierárquica do relatório
- Separe gráficos e tabelas com metadados específicos`,
      
      'proposal': `
- PROPOSTAS: Preserve escopo, preços, prazos, condições
- Identifique: OBJETO, ESCOPO, VALOR, PRAZO, CONDIÇÕES PAGAMENTO
- Mantenha estrutura comercial clara
- Extraia tabelas de preços e cronogramas`,
      
      'meeting': `
- REUNIÕES: Preserve pauta, decisões, action items
- Identifique: PARTICIPANTES, PAUTA, DECISÕES, ACTION ITEMS
- Mantenha ordem cronológica dos tópicos
- Capture responsáveis e prazos definidos`,
      
      'technical_spec': `
- ESPECIFICAÇÕES TÉCNICAS: Preserve requisitos, especificações, validações
- Identifique: REQUISITOS, ESPECIFICAÇÕES, VALIDAÇÕES, DEPENDÊNCIAS
- Mantenha estrutura técnica detalhada
- Extraia tabelas de especificações e parâmetros`,
      
      'policy': `
- POLÍTICAS: Preserve regras, procedimentos, responsabilidades
- Identifique: POLÍTICA, PROCEDIMENTO, RESPONSABILIDADE, VIGÊNCIA
- Mantenha estrutura normativa clara
- Separe artigos e parágrafos importantes`,
      
      'manual': `
- MANUAIS: Preserve passos, avisos, segurança
- Identifique: PROCEDIMENTO, AVISO, SEGURANÇA, TROUBLESHOOTING
- Mantenha ordem sequencial dos passos
- Capture avisos e precauções separadamente`,
      
      'analysis': `
- ANÁLISES: Preserve metodologia, dados, conclusões
- Identifique: METODOLOGIA, DADOS, ANÁLISE, CONCLUSÃO
- Mantenha estrutura analógica clara
- Extraia gráficos e tabelas de dados`,
      
      'other': `
- DOCUMENTOS GENÉRICOS: Analise estrutura e divida logicamente
- Identifique títulos, seções, parágrafos importantes
- Mantenha coerência semântica entre chunks
- Detecte e separe tabelas e listas`
    };
    
    return instructions[docType] || instructions['other'];
  }

  async chunk(content: string, metadata: DocumentMetadata): Promise<SemanticChunk[]> {
    logger.info('🧠 Starting intelligent LLM-based chunking', {
      contentLength: content.length,
      documentTitle: metadata?.title || 'Unknown Document',
    });

    try {
      // Call LLM to analyze and chunk the document
      const llmChunks = await this.analyzeAndChunk(content, metadata);

      if (!llmChunks || llmChunks.length === 0) {
        throw new Error('LLM returned no chunks - document analysis failed');
      }

      // Convert LLM chunks to SemanticChunk format
      const semanticChunks: SemanticChunk[] = llmChunks.map((chunk) => ({
        id: `${metadata?.id || 'doc'}-chunk-${chunk.sequenceIndex}`,
        text: chunk.text,
        textLength: chunk.text.length,
        sequenceIndex: chunk.sequenceIndex,
        chunkType: chunk.chunkType as any,
        sectionTitle: chunk.sectionTitle,
        sectionNumber: chunk.sectionNumber,
        hierarchyLevel: chunk.hierarchyLevel,
        validFrom: chunk.validFrom,
        validUntil: chunk.validUntil,
        effectiveAt: chunk.effectiveAt,
        signedAt: chunk.signedAt,
        metadata: {
          containsTable: chunk.containsTable,
          tableData: chunk.tableData,
          keyTopics: chunk.keyTopics,
          estimatedImportance: chunk.estimatedImportance as any,
          reasoning: chunk.reasoning,
        },
      }));

      logger.info('✅ Intelligent chunking completed', {
        totalChunks: semanticChunks.length,
        avgChunkSize: Math.round(semanticChunks.reduce((sum, c) => sum + c.textLength, 0) / semanticChunks.length),
        chunkTypes: this.summarizeChunkTypes(semanticChunks),
      });

      return semanticChunks;
    } catch (error) {
      logger.error('❌ Intelligent chunking failed', { error });
      throw new Error(`Intelligent chunking failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async analyzeAndChunk(content: string, metadata: DocumentMetadata): Promise<LLMChunk[]> {
    const systemPrompt = `Você é um especialista em análise documental e chunking semântico. Sua tarefa é ler um documento completo e dividi-lo em chunks (partes) lógicas e semanticamente coerentes, como uma pessoa faria ao estudar um documento.

REGRAS IMPORTANTES:
1. Leia o documento como um humano leria
2. Identifique a estrutura lógica (títulos, seções, parágrafos, tabelas, listas)
3. Cada chunk deve ser uma UNIDADE SEMÂNTICA completa e coerente
4. NÃO quebre sentenças no meio
5. NÃO crie chunks muito pequenos (mínimo 50 caracteres)
6. Tabelas devem ser chunks separados e estruturadas para recuperação
7. Títulos de seção podem ser chunks separados se forem importantes
8. Identifique hierarquia (nível 1 = título principal, 2 = seção, 3 = subseção, etc)
9. Extraia tópicos-chave de cada chunk
10. Estime a importância de cada chunk (high/medium/low)
11. Extraia temporalidade quando existir: datas de assinatura, vigência e validade (validFrom/validUntil/effectiveAt/signedAt)

TIPOS DE CHUNKS:
- title: Título principal do documento
- section: Título de seção
- paragraph: Parágrafo de conteúdo
- table: Tabela estruturada
- list: Lista de itens
- summary: Resumo ou conclusão
- other: Outros tipos

FORMATO DE SAÍDA (JSON Array):
[
  {
    "sequenceIndex": 0,
    "text": "Texto completo do chunk",
    "chunkType": "title|section|paragraph|table|list|summary|other",
    "sectionTitle": "Título da seção (se aplicável)",
    "sectionNumber": "1.1" (se aplicável),
    "hierarchyLevel": 1-5,
    "validFrom": "YYYY-MM-DD" (opcional, se inferido),
    "validUntil": "YYYY-MM-DD" (opcional, se inferido),
    "effectiveAt": "YYYY-MM-DD" (opcional, data de início de vigência/efeitos),
    "signedAt": "YYYY-MM-DD" (opcional, data de assinatura),
    "containsTable": true|false,
    "tableData": {
      "headers": ["Coluna 1", "Coluna 2"],
      "rows": [["Valor 1", "Valor 2"]]
    } (se aplicável),
    "keyTopics": ["tópico1", "tópico2"],
    "estimatedImportance": "high|medium|low",
    "reasoning": "Breve justificativa da divisão"
  }
]`;

    // Get specific instructions based on document type
    const typeInstructions = this.getTypeInstructions(metadata?.type || 'unknown');
    
    const userPrompt = `Documento para analisar e dividir em chunks:

TÍTULO: ${metadata?.title || 'Documento sem título'}
TIPO: ${metadata?.type || 'unknown'}

TEMPORALIDADE (se aplicável):
- Use datas no formato YYYY-MM-DD quando possível
- Se só houver mês/ano, use YYYY-MM
- Se só houver ano, use YYYY
- Se não houver evidência, deixe os campos temporais como null/undefined

CONTEÚDO:
${content}

INSTRUÇÕES ESPECÍFICAS PARA ESTE TIPO:
${typeInstructions}

Analise o documento acima e retorne um array JSON com os chunks divididos semanticamente.`;

    try {
      const url = `${this.endpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=${this.apiVersion}`;
      logger.info('🌐 Calling Azure OpenAI API', { url });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 16000,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Azure OpenAI error: ${response.status} - ${errorText}`);
        throw new Error(`Azure OpenAI error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as any;
      const result = data.choices?.[0]?.message?.content;
      if (!result) {
        throw new Error('LLM returned empty response');
      }

      logger.info('📥 LLM response received', { 
        responseLength: result.length,
        tokensUsed: data.usage?.total_tokens 
      });

      // Parse JSON response with robust error handling
      let parsedResult: any;
      try {
        parsedResult = JSON.parse(result);
      } catch (parseError) {
        logger.warn('Initial JSON parse failed in chunking, attempting cleanup...');
        // Tentar limpar blocos de markdown se existirem (ex: ```json ... ```)
        let cleanedContent = result
          .replace(/^```json\s*/, '')
          .replace(/^```\s*/, '')
          .replace(/\s*```$/, '')
          .trim();

        // Try to fix common JSON issues
        try {
          // Remove trailing commas before closing brackets/braces
          cleanedContent = cleanedContent.replace(/,(\s*[}\]])/g, '$1');
          // Fix truncated strings by closing quotes if needed
          cleanedContent = cleanedContent.replace(/"([^"]*?)$/g, '"$1"');
          
          parsedResult = JSON.parse(cleanedContent);
        } catch (retryError) {
          logger.error('Failed to parse LLM JSON response after cleanup', { 
            originalLength: result.length,
            cleanedLength: cleanedContent.length,
            originalStart: result.substring(0, 200),
            cleanedStart: cleanedContent.substring(0, 200),
            error: retryError instanceof Error ? retryError.message : 'Unknown error'
          });
          logger.warn('Falling back to basic chunking due to invalid LLM JSON response');
          const fallbackChunks: LLMChunk[] = this.basicFallbackChunking(content);
          if (fallbackChunks.length === 0) {
            throw new Error('LLM returned invalid JSON and fallback chunking produced no chunks');
          }
          return fallbackChunks;
        }
      }

      // Extract chunks from multiple possible response shapes
      // Possible shapes we have seen:
      // - [ { ... } ]
      // - { chunks: [ ... ] }
      // - { result: [ ... ] } OR { result: { chunks: [ ... ] } }
      // - { data: { chunks: [ ... ] } }
      // - { result: "[...]" } (stringified JSON)
      const extractChunks = (value: any): any[] => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (Array.isArray(value.chunks)) return value.chunks;

        const candidates = [value.result, value.data, value.output];
        for (const c of candidates) {
          if (!c) continue;
          if (Array.isArray(c)) return c;
          if (Array.isArray(c?.chunks)) return c.chunks;
          if (typeof c === 'string') {
            try {
              const parsed = JSON.parse(c);
              const inner = extractChunks(parsed);
              if (inner.length > 0) return inner;
            } catch {
              // ignore
            }
          }
        }
        return [];
      };

      const chunks = extractChunks(parsedResult);

      // If LLM returned a valid JSON object but without chunks, do a safe fallback
      if (!Array.isArray(chunks) || chunks.length === 0) {
        logger.warn('LLM returned no chunks in response; falling back to basic chunking', {
          responseShape: typeof parsedResult,
        });

        const fallbackChunks: LLMChunk[] = this.basicFallbackChunking(content);
        if (fallbackChunks.length === 0) {
          throw new Error('LLM returned no chunks in response');
        }
        return fallbackChunks;
      }

      // Validate and clean chunks
      const validatedChunks: LLMChunk[] = chunks.map((chunk: any, index: number) => ({
        sequenceIndex: chunk.sequenceIndex ?? index,
        text: chunk.text || '',
        chunkType: chunk.chunkType || 'other',
        sectionTitle: chunk.sectionTitle,
        sectionNumber: chunk.sectionNumber,
        hierarchyLevel: chunk.hierarchyLevel || 1,
        validFrom: typeof chunk.validFrom === 'string' && chunk.validFrom.trim().length > 0 ? chunk.validFrom.trim() : undefined,
        validUntil: typeof chunk.validUntil === 'string' && chunk.validUntil.trim().length > 0 ? chunk.validUntil.trim() : undefined,
        effectiveAt: typeof chunk.effectiveAt === 'string' && chunk.effectiveAt.trim().length > 0 ? chunk.effectiveAt.trim() : undefined,
        signedAt: typeof chunk.signedAt === 'string' && chunk.signedAt.trim().length > 0 ? chunk.signedAt.trim() : undefined,
        containsTable: chunk.containsTable || false,
        tableData: chunk.tableData,
        keyTopics: chunk.keyTopics || [],
        estimatedImportance: chunk.estimatedImportance || 'medium',
        reasoning: chunk.reasoning || 'No reasoning provided',
      }));

      // Filter out empty chunks
      const nonEmptyChunks = validatedChunks.filter(c => c.text.length >= 10);

      if (nonEmptyChunks.length === 0) {
        logger.warn('All chunks are empty after validation; falling back to basic chunking');
        const fallbackChunks: LLMChunk[] = this.basicFallbackChunking(content);
        if (fallbackChunks.length === 0) {
          throw new Error('All chunks are empty after validation');
        }
        return fallbackChunks;
      }

      return nonEmptyChunks;
    } catch (error) {
      logger.error('LLM chunking analysis failed', { error });
      throw error;
    }
  }

  private basicFallbackChunking(content: string): LLMChunk[] {
    const text = (content || '').trim();
    if (!text) return [];

    // Prefer paragraph-based splitting, then merge small parts
    const rawParts = text
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    const parts: string[] = [];
    let buffer = '';
    const flush = () => {
      const b = buffer.trim();
      if (b) parts.push(b);
      buffer = '';
    };

    for (const p of rawParts.length > 0 ? rawParts : [text]) {
      if ((buffer + '\n\n' + p).length < 800) {
        buffer = buffer ? `${buffer}\n\n${p}` : p;
      } else {
        flush();
        buffer = p;
      }
    }
    flush();

    // If still only one huge part, do a coarse fixed-size split
    const finalParts: string[] = [];
    for (const p of parts) {
      if (p.length <= 5000) {
        finalParts.push(p);
        continue;
      }
      for (let i = 0; i < p.length; i += 5000) {
        finalParts.push(p.slice(i, i + 5000));
      }
    }

    return finalParts.map((p, idx) => ({
      sequenceIndex: idx,
      text: p,
      chunkType: idx === 0 ? 'title' : 'paragraph',
      sectionTitle: undefined,
      sectionNumber: undefined,
      hierarchyLevel: idx === 0 ? 1 : 2,
      validFrom: undefined,
      validUntil: undefined,
      effectiveAt: undefined,
      signedAt: undefined,
      containsTable: false,
      tableData: undefined,
      keyTopics: [],
      estimatedImportance: 'medium',
      reasoning: 'Fallback chunking used because LLM returned no usable chunks',
    }));
  }

  private summarizeChunkTypes(chunks: SemanticChunk[]): Record<string, number> {
    const summary: Record<string, number> = {};
    chunks.forEach(chunk => {
      summary[chunk.chunkType] = (summary[chunk.chunkType] || 0) + 1;
    });
    return summary;
  }
}
