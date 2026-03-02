/**
 * Semantic Chunker using LangChain-style semantic chunking
 * Uses sentence similarity to create meaningful chunks
 */

import { SemanticChunk, ChunkingStrategy } from '../types';

let _chunkitPromise: Promise<any> | null = null;

async function getChunkit(): Promise<(documents: any[], options: any) => Promise<any[]>> {
  if (!_chunkitPromise) {
    _chunkitPromise = import('semantic-chunking');
  }

  const mod: any = await _chunkitPromise;
  const fn = mod?.chunkit;
  if (typeof fn !== 'function') {
    throw new Error('semantic-chunking import failed: chunkit is not a function');
  }
  return fn;
}

export class SemanticChunker implements ChunkingStrategy {
  async chunk(content: string, _metadata?: any): Promise<SemanticChunk[]> {
    try {
      const chunkit = await getChunkit();

      // Prepare document for semantic-chunking library
      const documents = [{
        document_name: 'uploaded_document',
        document_text: content
      }];

      // Semantic chunking options (LangChain-style)
      const options = {
        // Core semantic parameters
        similarityThreshold: 0.5,        // Threshold for sentence similarity
        maxTokenSize: 1000,              // Max tokens per chunk
        numSimilaritySentencesLookahead: 3, // Look ahead for similarity
        
        // Dynamic thresholding
        dynamicThresholdLowerBound: 0.4,
        dynamicThresholdUpperBound: 0.8,
        
        // Chunk rebalancing
        combineChunks: true,
        combineChunksSimilarityThreshold: 0.5,
        
        // Embedding model (using lightweight ONNX model)
        onnxEmbeddingModel: 'Xenova/all-MiniLM-L6-v2',
        dtype: 'fp32',
        device: 'cpu',
        
        // Additional options
        logging: false,
        returnEmbedding: false,
        returnTokenLength: true,
        chunkPrefix: null,
        excludeChunkPrefixInResults: false
      };

      // Perform semantic chunking
      const result = await chunkit(documents, options);
      
      // Convert to our SemanticChunk format
      const chunks: SemanticChunk[] = [];
      
      // semantic-chunking returns a FLAT array of chunk objects, e.g.
      // [{ document_name, chunk_number, number_of_chunks, text, ... }, ...]
      const flatChunks: any[] = Array.isArray(result) ? result : [];
      const relevant = flatChunks
        .filter((c) => c && (c.document_name === 'uploaded_document' || !c.document_name))
        .sort((a, b) => (a.chunk_number ?? 0) - (b.chunk_number ?? 0));

      for (let i = 0; i < relevant.length; i++) {
        const c = relevant[i];
        const text = (c.text ?? '').toString().trim();
        if (!text) continue;
        chunks.push({
          text,
          chunkType: 'paragraph',
          hierarchyLevel: 1,
          sectionTitle: undefined,
          sectionNumber: undefined,
          sequenceIndex: typeof c.chunk_number === 'number' ? c.chunk_number - 1 : i,
          pageNumber: undefined,
          startOffset: undefined,
          endOffset: undefined,
        });
      }

      if (chunks.length === 0) {
        throw new Error('SemanticChunker produced 0 chunks');
      }

      // Ensure sequenceIndex is strictly 0..N-1
      chunks.sort((a, b) => a.sequenceIndex - b.sequenceIndex);
      chunks.forEach((c, idx) => (c.sequenceIndex = idx));

      return chunks;
      
    } catch (error) {
      console.error('Semantic chunking failed:', error);
      throw error;
    }
  }
}
