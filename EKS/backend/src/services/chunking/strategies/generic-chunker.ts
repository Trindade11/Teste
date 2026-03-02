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
    const result: string[] = [];
    
    // 1. Split by double newlines first (paragraph boundaries)
    const paragraphs = content
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 30); // Reduced minimum for better coverage

    // 2. Process each paragraph
    for (const para of paragraphs) {
      if (para.length > 1500) {
        // Large paragraphs: split by sentences with semantic awareness
        const sentences = this.extractSentences(para);
        let currentChunk = '';
        
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > 1500 && currentChunk.length > 200) {
            result.push(currentChunk.trim());
            currentChunk = sentence;
          } else {
            currentChunk += ' ' + sentence;
          }
        }
        
        if (currentChunk.trim().length > 200) {
          result.push(currentChunk.trim());
        }
      } else if (para.length > 200) {
        // Medium paragraphs: keep as is
        result.push(para);
      }
      // Skip very short paragraphs (< 200 chars)
    }

    // 3. If still no chunks, fallback to sentence-based chunking
    if (result.length === 0) {
      const sentences = this.extractSentences(content);
      let currentChunk = '';
      
      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > 1000 && currentChunk.length > 100) {
          result.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          currentChunk += ' ' + sentence;
        }
      }
      
      if (currentChunk.trim().length > 100) {
        result.push(currentChunk.trim());
      }
    }

    return result;
  }

  private extractSentences(text: string): string[] {
    // Better sentence splitting that handles abbreviations and lists
    const sentences = text.match(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s/g) || [];
    
    if (sentences.length === 0) {
      // Fallback: split by periods
      return text.split('.').map(s => s.trim()).filter(s => s.length > 20);
    }
    
    // Build sentences from splits
    const result: string[] = [];
    let lastIndex = 0;
    
    for (const match of sentences) {
      const index = text.indexOf(match, lastIndex);
      if (index > lastIndex) {
        const sentence = text.substring(lastIndex, index).trim();
        if (sentence.length > 20) {
          result.push(sentence);
        }
      }
      lastIndex = index + match.length;
    }
    
    // Add final sentence
    if (lastIndex < text.length) {
      const finalSentence = text.substring(lastIndex).trim();
      if (finalSentence.length > 20) {
        result.push(finalSentence);
      }
    }
    
    return result;
  }
}
