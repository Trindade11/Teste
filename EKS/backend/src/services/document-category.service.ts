import { DocumentType } from '../types/document.types';

/**
 * Document Processing Categories
 * Defines how each document type should be processed
 */
export type ProcessingCategory = 'rich_extraction' | 'knowledge_base' | 'generic';

export interface CategoryConfig {
  category: ProcessingCategory;
  requiresSpecialist: boolean;
  specialistAgent?: string;
  extractEntities: boolean;
  chunkingStrategy: 'semantic' | 'fixed';
  estimatedProcessingTime: number; // seconds
}

/**
 * Document Category Service
 * Routes document types to appropriate processing pipelines
 */
export class DocumentCategoryService {
  private static readonly CATEGORY_MAP: Record<DocumentType, CategoryConfig> = {
    // RICH EXTRACTION - High business value, structured entities
    contract: {
      category: 'rich_extraction',
      requiresSpecialist: true,
      specialistAgent: 'contract_extraction_agent',
      extractEntities: true,
      chunkingStrategy: 'semantic',
      estimatedProcessingTime: 45,
    },
    proposal: {
      category: 'rich_extraction',
      requiresSpecialist: true,
      specialistAgent: 'proposal_extraction_agent',
      extractEntities: true,
      chunkingStrategy: 'semantic',
      estimatedProcessingTime: 40,
    },
    meeting: {
      category: 'rich_extraction',
      requiresSpecialist: true,
      specialistAgent: 'meeting_extraction_agent',
      extractEntities: true,
      chunkingStrategy: 'semantic',
      estimatedProcessingTime: 35,
    },
    report: {
      category: 'rich_extraction',
      requiresSpecialist: true,
      specialistAgent: 'report_extraction_agent',
      extractEntities: true,
      chunkingStrategy: 'semantic',
      estimatedProcessingTime: 40,
    },

    // KNOWLEDGE BASE - Reference documents, no entity extraction
    technical_spec: {
      category: 'knowledge_base',
      requiresSpecialist: false,
      extractEntities: false,
      chunkingStrategy: 'fixed',
      estimatedProcessingTime: 10,
    },
    policy: {
      category: 'knowledge_base',
      requiresSpecialist: false,
      extractEntities: false,
      chunkingStrategy: 'fixed',
      estimatedProcessingTime: 10,
    },
    manual: {
      category: 'knowledge_base',
      requiresSpecialist: false,
      extractEntities: false,
      chunkingStrategy: 'fixed',
      estimatedProcessingTime: 10,
    },

    // GENERIC - Light extraction (insights + decisions only)
    analysis: {
      category: 'generic',
      requiresSpecialist: false,
      extractEntities: true,
      chunkingStrategy: 'fixed',
      estimatedProcessingTime: 20,
    },
    other: {
      category: 'generic',
      requiresSpecialist: false,
      extractEntities: true,
      chunkingStrategy: 'fixed',
      estimatedProcessingTime: 20,
    },

    // Legacy types (fallback to generic)
    process_doc: {
      category: 'generic',
      requiresSpecialist: false,
      extractEntities: true,
      chunkingStrategy: 'semantic',
      estimatedProcessingTime: 25,
    },
    strategic_plan: {
      category: 'generic',
      requiresSpecialist: false,
      extractEntities: true,
      chunkingStrategy: 'semantic',
      estimatedProcessingTime: 30,
    },
    email: {
      category: 'generic',
      requiresSpecialist: false,
      extractEntities: true,
      chunkingStrategy: 'fixed',
      estimatedProcessingTime: 15,
    },
    note: {
      category: 'generic',
      requiresSpecialist: false,
      extractEntities: true,
      chunkingStrategy: 'fixed',
      estimatedProcessingTime: 15,
    },
    spreadsheet: {
      category: 'generic',
      requiresSpecialist: false,
      extractEntities: true,
      chunkingStrategy: 'semantic',
      estimatedProcessingTime: 25,
    },
  };

  /**
   * Get processing category for document type
   */
  static getCategory(type: DocumentType): ProcessingCategory {
    return this.CATEGORY_MAP[type]?.category || 'generic';
  }

  /**
   * Get full configuration for document type
   */
  static getConfig(type: DocumentType): CategoryConfig {
    return this.CATEGORY_MAP[type] || this.CATEGORY_MAP.other;
  }

  /**
   * Check if document type requires specialist agent
   */
  static requiresSpecialist(type: DocumentType): boolean {
    return this.CATEGORY_MAP[type]?.requiresSpecialist || false;
  }

  /**
   * Get specialist agent name for document type
   */
  static getSpecialistAgent(type: DocumentType): string | null {
    return this.CATEGORY_MAP[type]?.specialistAgent || null;
  }

  /**
   * Check if document type should extract entities
   */
  static shouldExtractEntities(type: DocumentType): boolean {
    return this.CATEGORY_MAP[type]?.extractEntities || false;
  }

  /**
   * Get chunking strategy for document type
   */
  static getChunkingStrategy(type: DocumentType): 'semantic' | 'fixed' {
    return this.CATEGORY_MAP[type]?.chunkingStrategy || 'fixed';
  }

  /**
   * Get types by category
   */
  static getTypesByCategory(category: ProcessingCategory): DocumentType[] {
    return Object.entries(this.CATEGORY_MAP)
      .filter(([_, config]) => config.category === category)
      .map(([type]) => type as DocumentType);
  }

  /**
   * Get human-readable description of processing
   */
  static getProcessingDescription(type: DocumentType): string {
    const config = this.getConfig(type);
    const category = config.category;

    switch (category) {
      case 'rich_extraction':
        return `Extração completa com agente especializado (${config.estimatedProcessingTime}s)`;
      case 'knowledge_base':
        return `Base de conhecimento - chunking fixo, sem extração de entidades (${config.estimatedProcessingTime}s)`;
      case 'generic':
        return `Extração genérica de insights e decisões (${config.estimatedProcessingTime}s)`;
      default:
        return 'Processamento padrão';
    }
  }
}
