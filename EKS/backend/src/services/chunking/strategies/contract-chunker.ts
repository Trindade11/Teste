/**
 * Contract Chunker
 * Specialized chunking for legal contracts based on clauses and subclauses
 */

import { SemanticChunk, ChunkingStrategy } from '../types';

export class ContractChunker implements ChunkingStrategy {
  chunk(content: string): SemanticChunk[] {
    const chunks: SemanticChunk[] = [];
    let sequenceIndex = 0;

    // Detect main clauses
    const clauses = this.extractClauses(content);

    for (const clause of clauses) {
      // Main clause chunk
      chunks.push({
        text: clause.fullText,
        chunkType: 'clause',
        hierarchyLevel: 1,
        sectionNumber: clause.number,
        sectionTitle: clause.title,
        sequenceIndex: sequenceIndex++,
      });

      // Extract subclauses
      const subclauses = this.extractSubclauses(clause.fullText);
      for (const subclause of subclauses) {
        chunks.push({
          text: subclause.text,
          chunkType: 'subclause',
          hierarchyLevel: 2,
          sectionNumber: subclause.number,
          sectionTitle: subclause.title || '',
          sequenceIndex: sequenceIndex++,
        });
      }
    }

    // If no clauses found, fall back to paragraph chunking
    if (chunks.length === 0) {
      return this.fallbackChunking(content);
    }

    return chunks;
  }

  private extractClauses(content: string): Array<{
    number: string;
    title: string;
    fullText: string;
  }> {
    const clauses: Array<{ number: string; title: string; fullText: string }> = [];

    // Pattern 1: CLÁUSULA PRIMEIRA - TÍTULO
    const pattern1 = /CLÁUSULA\s+(PRIMEIRA|SEGUNDA|TERCEIRA|QUARTA|QUINTA|SEXTA|SÉTIMA|OITAVA|NONA|DÉCIMA|[A-Z]+)\s*[-–—:]\s*([^\n]+)/gi;
    
    // Pattern 2: CLÁUSULA 1 - TÍTULO or CLÁUSULA 1. TÍTULO
    const pattern2 = /CLÁUSULA\s+(\d+)\s*[.:\-–—]\s*([^\n]+)/gi;

    // Pattern 3: Simple numbered clauses: 1. TÍTULO
    const pattern3 = /^(\d+)\.\s+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][^\n]{10,100})$/gim;

    const patterns = [pattern1, pattern2, pattern3];
    const matches: Array<{ index: number; number: string; title: string }> = [];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        matches.push({
          index: match.index,
          number: match[1],
          title: match[2].trim(),
        });
      }
    }

    // Sort by position in document
    matches.sort((a, b) => a.index - b.index);

    // Extract full text for each clause
    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const next = matches[i + 1];
      
      const startIndex = current.index;
      const endIndex = next ? next.index : content.length;
      const fullText = content.substring(startIndex, endIndex).trim();

      clauses.push({
        number: current.number,
        title: current.title,
        fullText,
      });
    }

    return clauses;
  }

  private extractSubclauses(clauseText: string): Array<{
    number: string;
    title: string;
    text: string;
  }> {
    const subclauses: Array<{ number: string; title: string; text: string }> = [];

    // Pattern 1: Numbered subclauses: 1.1, 1.2, 1.1.1
    const pattern1 = /(\d+\.\d+(?:\.\d+)?)\s*[-–—:]?\s*([^\n]*)/g;
    
    // Pattern 2: Letter subclauses: a), b), c)
    const pattern2 = /([a-z])\)\s+([^\n]+)/gi;
    
    // Pattern 3: Roman numerals: i), ii), iii)
    const pattern3 = /([ivxlcdm]+)\)\s+([^\n]+)/gi;

    const patterns = [pattern1, pattern2, pattern3];

    for (const regex of patterns) {
      let match;
      while ((match = regex.exec(clauseText)) !== null) {
        const number = match[1];
        const title = match[2]?.trim() || '';
        
        // Extract text until next subclause or end
        const startIndex = match.index;
        let endIndex = clauseText.length;
        
        // Find next subclause
        const remaining = clauseText.substring(startIndex + match[0].length);
        const nextMatch = remaining.match(/\n\s*(\d+\.\d+|[a-z]\)|[ivxlcdm]+\))/);
        if (nextMatch && nextMatch.index !== undefined) {
          endIndex = startIndex + match[0].length + nextMatch.index;
        }
        
        const text = clauseText.substring(startIndex, endIndex).trim();
        
        // Only add if text is substantial (more than just the number)
        if (text.length > number.length + 10) {
          subclauses.push({ number, title, text });
        }
      }
    }

    return subclauses;
  }

  private fallbackChunking(content: string): SemanticChunk[] {
    const chunks: SemanticChunk[] = [];
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 50);

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
