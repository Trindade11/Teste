/**
 * Semantic Chunking Types
 * Defines interfaces for structure-based document chunking
 */

export type ChunkType = 
  | 'section' 
  | 'subsection' 
  | 'paragraph' 
  | 'clause' 
  | 'subclause'
  | 'table' 
  | 'list'
  | 'annex'
  | 'header'
  | 'footer';

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

export interface SemanticChunk {
  text: string;
  chunkType: ChunkType;
  hierarchyLevel: number;
  sectionNumber?: string;
  sectionTitle?: string;
  sequenceIndex: number;
  pageNumber?: number;
  startOffset?: number;
  endOffset?: number;
}

export interface EnrichedChunk extends SemanticChunk {
  id: string;
  documentId: string;
  textLength: number;
  tokenCount?: number;
  summary?: string;
  keyEntities?: string[];
  topics?: string[];
  clearanceLevel?: number;
  containsSensitiveData?: boolean;
  sensitiveDataTypes?: string[];
  embedding?: number[];
}

export interface ChunkingStrategy {
  chunk(content: string, metadata?: any): SemanticChunk[];
}

export interface StructureNode {
  type: 'heading' | 'paragraph' | 'list' | 'table' | 'code';
  level?: number;
  text: string;
  children?: StructureNode[];
  metadata?: Record<string, any>;
}

export interface DocumentStructure {
  title?: string;
  sections: StructureNode[];
  tableOfContents?: Array<{
    level: number;
    title: string;
    pageNumber?: number;
  }>;
}
