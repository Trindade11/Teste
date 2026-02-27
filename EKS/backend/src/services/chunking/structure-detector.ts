/**
 * Structure Detector
 * Detects document structure from plain text using heuristics
 */

import { DocumentStructure, StructureNode } from './types';

export class StructureDetector {
  /**
   * Detect document structure from plain text
   */
  detect(content: string): DocumentStructure {
    const lines = content.split('\n');
    const sections: StructureNode[] = [];
    let currentSection: StructureNode | null = null;
    let currentSubsection: StructureNode | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) continue;

      // Detect headings
      const heading = this.detectHeading(trimmed, lines[i + 1]);
      if (heading) {
        const node: StructureNode = {
          type: 'heading',
          level: heading.level,
          text: heading.text,
          children: [],
        };

        if (heading.level === 1) {
          currentSection = node;
          currentSubsection = null;
          sections.push(node);
        } else if (heading.level === 2 && currentSection) {
          currentSubsection = node;
          currentSection.children = currentSection.children || [];
          currentSection.children.push(node);
        } else if (heading.level === 3 && currentSubsection) {
          currentSubsection.children = currentSubsection.children || [];
          currentSubsection.children.push(node);
        } else {
          sections.push(node);
        }
        continue;
      }

      // Detect lists
      if (this.isListItem(trimmed)) {
        const listNode: StructureNode = {
          type: 'list',
          text: trimmed,
        };

        if (currentSubsection) {
          currentSubsection.children = currentSubsection.children || [];
          currentSubsection.children.push(listNode);
        } else if (currentSection) {
          currentSection.children = currentSection.children || [];
          currentSection.children.push(listNode);
        } else {
          sections.push(listNode);
        }
        continue;
      }

      // Regular paragraph
      const paragraphNode: StructureNode = {
        type: 'paragraph',
        text: trimmed,
      };

      if (currentSubsection) {
        currentSubsection.children = currentSubsection.children || [];
        currentSubsection.children.push(paragraphNode);
      } else if (currentSection) {
        currentSection.children = currentSection.children || [];
        currentSection.children.push(paragraphNode);
      } else {
        sections.push(paragraphNode);
      }
    }

    return { sections };
  }

  /**
   * Detect if line is a heading
   */
  private detectHeading(line: string, nextLine?: string): { level: number; text: string } | null {
    // Markdown style: # Heading
    const mdMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (mdMatch) {
      return {
        level: mdMatch[1].length,
        text: mdMatch[2].trim(),
      };
    }

    // Numbered sections: 1. Title, 1.1 Subtitle, 1.1.1 Sub-subtitle
    const numberedMatch = line.match(/^(\d+(?:\.\d+)*)\.\s+(.+)$/);
    if (numberedMatch) {
      const depth = numberedMatch[1].split('.').length;
      return {
        level: Math.min(depth, 3),
        text: line.trim(),
      };
    }

    // ALL CAPS (short lines only, likely titles)
    if (line === line.toUpperCase() && line.length < 100 && /[A-Z]/.test(line)) {
      // Check if next line is underlined (=== or ---)
      if (nextLine && /^[=\-]{3,}$/.test(nextLine.trim())) {
        return {
          level: nextLine.trim()[0] === '=' ? 1 : 2,
          text: line,
        };
      }
      return {
        level: 1,
        text: line,
      };
    }

    // Contract patterns: CLÁUSULA PRIMEIRA, CLÁUSULA 1
    const clauseMatch = line.match(/^(CLÁUSULA|ARTIGO|SEÇÃO|CAPÍTULO)\s+(PRIMEIRA?|SEGUNDA?|TERCEIRA?|\d+)/i);
    if (clauseMatch) {
      return {
        level: 1,
        text: line,
      };
    }

    return null;
  }

  /**
   * Detect if line is a list item
   */
  private isListItem(line: string): boolean {
    // Bullet points: -, *, •
    if (/^[-*•]\s+/.test(line)) return true;

    // Numbered lists: 1), a), i), (1), (a)
    if (/^(\d+|[a-z]|[ivxlcdm]+)[).]\s+/i.test(line)) return true;
    if (/^\((\d+|[a-z]|[ivxlcdm]+)\)\s+/i.test(line)) return true;

    return false;
  }

  /**
   * Extract table of contents from structure
   */
  extractTOC(structure: DocumentStructure): Array<{ level: number; title: string }> {
    const toc: Array<{ level: number; title: string }> = [];

    const traverse = (nodes: StructureNode[], level: number = 0) => {
      for (const node of nodes) {
        if (node.type === 'heading') {
          toc.push({
            level: node.level || level,
            title: node.text,
          });
        }
        if (node.children) {
          traverse(node.children, level + 1);
        }
      }
    };

    traverse(structure.sections);
    return toc;
  }
}
