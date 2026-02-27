/**
 * Chunker Factory
 * Creates appropriate chunking strategy based on document type
 */

import { ChunkingStrategy, DocumentType } from './types';
import { ContractChunker } from './strategies/contract-chunker';
import { ReportChunker } from './strategies/report-chunker';
import { GenericChunker } from './strategies/generic-chunker';

export class ChunkerFactory {
  static create(documentType: DocumentType): ChunkingStrategy {
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
      case 'presentation':
      case 'email':
      case 'note':
      case 'other':
      default:
        return new GenericChunker();
    }
  }
}
