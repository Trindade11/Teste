/**
 * Generic Chunker
 * Fallback chunking strategy for documents without specific structure
 */

import { SemanticChunk, ChunkingStrategy } from '../types';
import { StructureDetector } from '../structure-detector';

export class GenericChunker implements ChunkingStrategy {
  private detector = new StructureDetector();

  chunk(content: string): SemanticChunk[] {
    const chunks: SemanticChunk[] = [];
    let sequenceIndex = 0;

    // Try to detect structure first
    const structure = this.detector.detect(content);

    if (structure.sections.length > 0) {
      // Use detected structure
      for (const section of structure.sections) {
        chunks.push({
          text: this.nodeToText(section),
          chunkType: section.type === 'heading' ? 'section' : 'paragraph',
          hierarchyLevel: section.level || 1,
          sectionTitle: section.type === 'heading' ? section.text : undefined,
          sequenceIndex: sequenceIndex++,
        });
      }
    } else {
      // Fall back to paragraph-based chunking
      const paragraphs = this.extractParagraphs(content);
      
      for (const paragraph of paragraphs) {
        chunks.push({
          text: paragraph,
          chunkType: 'paragraph',
          hierarchyLevel: 1,
          sequenceIndex: sequenceIndex++,
        });
      }
    }

    return chunks;
  }

  private nodeToText(node: any): string {
    let text = node.text;
    if (node.children) {
      for (const child of node.children) {
        text += '\n' + this.nodeToText(child);
      }
    }
    return text;
  }

  private extractParagraphs(content: string): string[] {
    // Split by double newlines
    const paragraphs = content
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 50); // Minimum paragraph length

    // If paragraphs are too large (>2000 chars), split them further
    const result: string[] = [];
    for (const para of paragraphs) {
      if (para.length > 2000) {
        // Split by sentences
        const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
        let currentChunk = '';
        
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > 2000 && currentChunk.length > 0) {
            result.push(currentChunk.trim());
            currentChunk = sentence;
          } else {
            currentChunk += sentence;
          }
        }
        
        if (currentChunk.trim().length > 0) {
          result.push(currentChunk.trim());
        }
      } else {
        result.push(para);
      }
    }

    return result;
  }
}
