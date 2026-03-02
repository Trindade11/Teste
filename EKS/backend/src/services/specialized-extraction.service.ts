import axios from 'axios';
import { logger } from '../utils/logger';
import { DocumentType } from '../types/document.types';

const AGENTS_API_URL = process.env.AGENTS_API_URL || 'http://localhost:8001';

interface ExtractionContext {
  id: string;
  title: string;
  type: DocumentType;
  author?: string;
  validFrom?: string;
  validUntil?: string;
  effectiveAt?: string;
  signedAt?: string;
}

/**
 * Specialized Extraction Service
 * Routes extraction to appropriate Python agents based on document type
 */
export class SpecializedExtractionService {
  private agentsApiUrl: string;

  constructor(agentsApiUrl: string = AGENTS_API_URL) {
    this.agentsApiUrl = agentsApiUrl;
  }

  /**
   * Extract using specialized agent for contract documents
   */
  async extractFromContract(content: string, context: ExtractionContext): Promise<any> {
    try {
      const response = await axios.post(
        `${this.agentsApiUrl}/extract/contract`,
        {
          content,
          context,
        },
        {
          timeout: 60000, // 60s timeout for contract analysis
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error extracting from contract:', error);
      throw new Error('Failed to extract contract data');
    }
  }

  /**
   * Extract using specialized agent for proposal documents
   */
  async extractFromProposal(content: string, context: ExtractionContext): Promise<any> {
    try {
      const response = await axios.post(
        `${this.agentsApiUrl}/extract/proposal`,
        {
          content,
          context,
        },
        {
          timeout: 60000,
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error extracting from proposal:', error);
      throw new Error('Failed to extract proposal data');
    }
  }

  /**
   * Extract using specialized agent for meeting documents
   */
  async extractFromMeeting(content: string, context: ExtractionContext): Promise<any> {
    try {
      const response = await axios.post(
        `${this.agentsApiUrl}/extract/meeting`,
        {
          content,
          context,
        },
        {
          timeout: 60000,
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error extracting from meeting:', error);
      throw new Error('Failed to extract meeting data');
    }
  }

  /**
   * Extract using specialized agent for report documents
   */
  async extractFromReport(content: string, context: ExtractionContext): Promise<any> {
    try {
      const response = await axios.post(
        `${this.agentsApiUrl}/extract/report`,
        {
          content,
          context,
        },
        {
          timeout: 60000,
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error extracting from report:', error);
      throw new Error('Failed to extract report data');
    }
  }

  /**
   * Generic light extraction (insights + decisions only)
   */
  async extractGeneric(content: string, context: ExtractionContext): Promise<any> {
    try {
      const response = await axios.post(
        `${this.agentsApiUrl}/extract/generic`,
        {
          content,
          context,
        },
        {
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error extracting generic:', error);
      throw new Error('Failed to extract generic data');
    }
  }

  /**
   * Route extraction to appropriate specialist based on document type
   */
  async extractByType(
    content: string,
    context: ExtractionContext
  ): Promise<any> {
    const { type } = context;

    logger.info(`Routing extraction for document type: ${type}`);

    switch (type) {
      case 'contract':
        return this.extractFromContract(content, context);
      case 'proposal':
        return this.extractFromProposal(content, context);
      case 'meeting':
        return this.extractFromMeeting(content, context);
      case 'report':
        return this.extractFromReport(content, context);
      case 'analysis':
      case 'other':
        return this.extractGeneric(content, context);
      default:
        logger.warn(`No specialized agent for type: ${type}, using generic`);
        return this.extractGeneric(content, context);
    }
  }

  /**
   * Check if agents API is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.agentsApiUrl}/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      logger.warn('Agents API not available:', error);
      return false;
    }
  }
}

export const specializedExtractionService = new SpecializedExtractionService();
