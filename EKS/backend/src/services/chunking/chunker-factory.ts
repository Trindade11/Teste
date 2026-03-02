/**
 * Chunker Factory
 * Creates appropriate chunking strategy based on document type
 */

import { ChunkingStrategy, DocumentType } from './types';
import { IntelligentChunker } from './strategies/intelligent-chunker';
import { logger } from '../../utils/logger';

export class ChunkerFactory {
  static create(documentType: DocumentType): ChunkingStrategy {
    logger.info(`🏭 ChunkerFactory.create called with type: ${documentType}`);
    
    // Use IntelligentChunker for all document types
    // LLM reads and decides semantic boundaries like a human
    const chunker = new IntelligentChunker();
    logger.info(`✅ Created IntelligentChunker instance`);
    return chunker;
    
    // Legacy fallback (commented out for now)
    /*
    switch (documentType) {
      case 'contract':
        return new ContractChunker();
      
      case 'report':
      case 'analysis':
      case 'strategic_plan':
        return new ReportChunker();
      
      case 'meeting':
      case 'process_doc':
      case 'technical_spec':
      case 'policy':
      case 'email':
      case 'note':
      case 'other':
      default:
        return new GenericChunker();
    }
    */
  }
}
