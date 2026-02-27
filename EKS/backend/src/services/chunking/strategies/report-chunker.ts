/**
 * Report Chunker
 * Specialized chunking for reports based on sections and subsections
 */

import { SemanticChunk, ChunkingStrategy } from '../types';
import { StructureDetector } from '../structure-detector';

export class ReportChunker implements ChunkingStrategy {
  private detector = new StructureDetector();

  chunk(content: string): SemanticChunk[] {
    const chunks: SemanticChunk[] = [];
    let sequenceIndex = 0;

    // Detect document structure
    const structure = this.detector.detect(content);

    // Convert structure to chunks
    for (const section of structure.sections) {
      if (section.type === 'heading') {
        // Collect all content under this heading
        const sectionText = this.collectSectionText(section);
        
        chunks.push({
          text: sectionText,
          chunkType: section.level === 1 ? 'section' : 'subsection',
          hierarchyLevel: section.level || 1,
          sectionTitle: section.text,
          sectionNumber: this.extractSectionNumber(section.text),
          sequenceIndex: sequenceIndex++,
        });

        // Process children as separate chunks if they're headings
        if (section.children) {
          for (const child of section.children) {
            if (child.type === 'heading') {
              const childText = this.collectSectionText(child);
              chunks.push({
                text: childText,
                chunkType: 'subsection',
                hierarchyLevel: child.level || 2,
                sectionTitle: child.text,
                sectionNumber: this.extractSectionNumber(child.text),
                sequenceIndex: sequenceIndex++,
              });
            }
          }
        }
      } else if (section.type === 'table') {
        // Tables are separate chunks
        chunks.push({
          text: section.text,
          chunkType: 'table',
          hierarchyLevel: 1,
          sequenceIndex: sequenceIndex++,
        });
      } else if (section.type === 'paragraph' && section.text.length > 100) {
        // Standalone paragraphs (if not under a heading)
        chunks.push({
          text: section.text,
          chunkType: 'paragraph',
          hierarchyLevel: 1,
          sequenceIndex: sequenceIndex++,
        });
      }
    }

    // If no structure detected, fall back to paragraph chunking
    if (chunks.length === 0) {
      return this.fallbackChunking(content);
    }

    return chunks;
  }

  private collectSectionText(node: any): string {
    let text = node.text + '\n\n';

    if (node.children) {
      for (const child of node.children) {
        if (child.type === 'heading') {
          // Don't include child headings in parent text
          continue;
        }
        text += child.text + '\n';
      }
    }

    return text.trim();
  }

  private extractSectionNumber(title: string): string | undefined {
    // Extract section number from title
    // Examples: "1. Introduction", "2.1 Methodology", "3.2.1 Data Collection"
    const match = title.match(/^(\d+(?:\.\d+)*)\s/);
    return match ? match[1] : undefined;
  }

  private fallbackChunking(content: string): SemanticChunk[] {
    const chunks: SemanticChunk[] = [];
    
    // Split by double newlines (paragraphs)
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 100);

    for (let i = 0; i < paragraphs.length; i++) {
      chunks.push({
        text: paragraphs[i].trim(),
        chunkType: 'paragraph',
        hierarchyLevel: 1,
        sequenceIndex: i,
      });
    }

    return chunks;
  }
}
