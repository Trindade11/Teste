import { ChunkingStrategy, SemanticChunk, DocumentMetadata } from '../types';
import { logger } from '../../../utils/logger';
import axios from 'axios';

interface PydanticChunk {
  sequence_index: number;
  text: string;
  metadata: {
    chunk_type: string;
    section_title?: string;
    section_number?: string;
    hierarchy_level: number;
    contains_table: boolean;
    table_data?: {
      headers: string[];
      rows: string[][];
    };
    key_topics: string[];
    estimated_importance: string;
    reasoning: string;
  };
}

interface PydanticResponse {
  chunks: PydanticChunk[];
  total_chunks: number;
  document_summary: string;
  processing_notes: string;
}

/**
 * Pydantic AI Chunker - Uses Python agent with structured validation
 * More robust than direct LLM calls with better error handling
 */
export class PydanticChunker implements ChunkingStrategy {
  private agentsUrl: string;

  constructor() {
    this.agentsUrl = process.env.AGENTS_SERVICE_URL || 'http://localhost:8000';
  }

  async chunk(content: string, metadata: DocumentMetadata): Promise<SemanticChunk[]> {
    logger.info('🤖 Starting Pydantic AI chunking', {
      contentLength: content.length,
      documentTitle: metadata.title,
      agentsUrl: this.agentsUrl,
    });

    try {
      // Call the Python agent
      const response = await axios.post<PydanticResponse>(
        `${this.agentsUrl}/chunk-document`,
        {
          title: metadata.title,
          doc_type: metadata.type,
          content: content,
          author: metadata.author,
        },
        {
          timeout: 120000, // 2 minutes timeout
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const pydanticResult = response.data;

      if (!pydanticResult.chunks || pydanticResult.chunks.length === 0) {
        throw new Error('Pydantic AI returned no chunks');
      }

      logger.info('✅ Pydantic AI chunking completed', {
        totalChunks: pydanticResult.total_chunks,
        documentSummary: pydanticResult.document_summary,
        processingNotes: pydanticResult.processing_notes,
      });

      // Convert Pydantic chunks to SemanticChunk format
      const semanticChunks: SemanticChunk[] = pydanticResult.chunks.map((chunk) => ({
        id: `${metadata.id}-chunk-${chunk.sequence_index}`,
        text: chunk.text,
        textLength: chunk.text.length,
        sequenceIndex: chunk.sequence_index,
        chunkType: this.mapChunkType(chunk.metadata.chunk_type),
        sectionTitle: chunk.metadata.section_title,
        sectionNumber: chunk.metadata.section_number,
        hierarchyLevel: chunk.metadata.hierarchy_level,
        metadata: {
          containsTable: chunk.metadata.contains_table,
          tableData: chunk.metadata.table_data,
          keyTopics: chunk.metadata.key_topics,
          estimatedImportance: chunk.metadata.estimated_importance,
          reasoning: chunk.metadata.reasoning,
        },
      }));

      // Log chunk analysis
      this.logChunkAnalysis(semanticChunks, pydanticResult);

      return semanticChunks;
    } catch (error) {
      logger.error('❌ Pydantic AI chunking failed', { error });
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Pydantic AI agents service not running. Start the agents service first.');
        }
        if (error.response) {
          throw new Error(`Pydantic AI error: ${error.response.status} - ${error.response.data}`);
        }
      }
      
      throw new Error(`Pydantic AI chunking failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private mapChunkType(pydanticType: string): any {
    const typeMap: Record<string, string> = {
      'title': 'title',
      'section': 'section',
      'paragraph': 'paragraph',
      'table': 'table',
      'list': 'list',
      'summary': 'summary',
      'other': 'other',
    };
    return typeMap[pydanticType] || 'other';
  }

  private logChunkAnalysis(chunks: SemanticChunk[], pydanticResult: PydanticResponse): void {
    const chunkTypes: Record<string, number> = {};
    const importanceLevels: Record<string, number> = {};
    const tableCount = chunks.filter(c => c.metadata?.containsTable).length;
    const tinyChunks = chunks.filter(c => c.textLength < 50);
    const hugeChunks = chunks.filter(c => c.textLength > 2000);

    // Count chunk types
    chunks.forEach(chunk => {
      chunkTypes[chunk.chunkType] = (chunkTypes[chunk.chunkType] || 0) + 1;
    });

    // Count importance levels
    chunks.forEach(chunk => {
      const importance = chunk.metadata?.estimatedImportance || 'medium';
      importanceLevels[importance] = (importanceLevels[importance] || 0) + 1;
    });

    logger.info('📊 Pydantic AI Chunk Analysis:', {
      totalChunks: chunks.length,
      chunkTypes,
      importanceLevels,
      tableCount,
      tinyChunks: tinyChunks.length,
      hugeChunks: hugeChunks.length,
      avgChunkSize: Math.round(chunks.reduce((sum, c) => sum + c.textLength, 0) / chunks.length),
    });

    // Warnings for quality issues
    if (tinyChunks.length > 0) {
      logger.warn(`⚠️  ${tinyChunks.length} tiny chunks detected (<50 chars)`);
    }
    if (hugeChunks.length > 0) {
      logger.warn(`⚠️  ${hugeChunks.length} huge chunks detected (>2000 chars)`);
    }
    if (tinyChunks.length === 0 && hugeChunks.length === 0) {
      logger.info('✅ All chunks have optimal size (50-2000 chars)');
    }
  }
}
