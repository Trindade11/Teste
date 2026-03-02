import neo4j from 'neo4j-driver';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const NEO4J_URI = process.env.NEO4J_URI || 'neo4j+ssc://af132785.databases.neo4j.io';
const NEO4J_USER = process.env.NEO4J_USERNAME || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || '';

const elementId = '4:631bf805-7668-426f-8901-e98b5b044da2:203';

console.log('🔌 Conectando ao Neo4j:', NEO4J_URI);

async function reconstructDocument() {
  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  const session = driver.session();

  try {
    console.log('🔍 Buscando documento...');
    
    // Get document info
    const docResult = await session.run(
      `MATCH (d:Document) 
       WHERE elementId(d) = $elementId
       RETURN d.id AS docId, d.title AS title, d.sourceFile AS sourceFile, 
              d.chunkCount AS chunkCount, d.format AS format`,
      { elementId }
    );

    if (docResult.records.length === 0) {
      console.error('❌ Documento não encontrado');
      return;
    }

    const docRecord = docResult.records[0];
    const docId = docRecord.get('docId');
    const title = docRecord.get('title');
    const sourceFile = docRecord.get('sourceFile');
    const chunkCount = docRecord.get('chunkCount');

    console.log(`📄 Documento: ${title}`);
    console.log(`📁 Arquivo original: ${sourceFile}`);
    console.log(`🔢 Chunks esperados: ${chunkCount}`);

    // Get all chunks ordered by sequence
    console.log('\n🔍 Buscando chunks...');
    const chunksResult = await session.run(
      `MATCH (d:Document {id: $docId})-[:HAS_CHUNK]->(c:Chunk)
       RETURN c.id AS id, c.text AS text, c.textLength AS textLength,
              c.sequenceIndex AS sequenceIndex, c.chunkType AS chunkType,
              c.hierarchyLevel AS hierarchyLevel, c.sectionTitle AS sectionTitle
       ORDER BY c.sequenceIndex`,
      { docId }
    );

    const chunks = chunksResult.records.map(r => ({
      id: r.get('id'),
      text: r.get('text'),
      textLength: r.get('textLength'),
      sequenceIndex: r.get('sequenceIndex'),
      chunkType: r.get('chunkType'),
      hierarchyLevel: r.get('hierarchyLevel'),
      sectionTitle: r.get('sectionTitle'),
    }));

    console.log(`✅ ${chunks.length} chunks recuperados\n`);

    // Analyze chunks
    const emptyChunks = chunks.filter(c => !c.text || c.text.trim().length === 0);
    const specialCharsIssues = chunks.filter(c => 
      c.text && (c.text.includes('�') || c.text.includes('\ufffd'))
    );

    const analysis = {
      totalChunks: chunks.length,
      expectedChunks: chunkCount,
      chunkSizes: chunks.map(c => c.textLength),
      avgChunkSize: chunks.reduce((sum, c) => sum + c.textLength, 0) / chunks.length || 0,
      minChunkSize: chunks.length > 0 ? Math.min(...chunks.map(c => c.textLength)) : 0,
      maxChunkSize: chunks.length > 0 ? Math.max(...chunks.map(c => c.textLength)) : 0,
      emptyChunks: emptyChunks.length,
      specialCharsIssues: specialCharsIssues.length,
    };

    console.log('📊 ANÁLISE DOS CHUNKS:');
    console.log('═══════════════════════════════════════');
    console.log(`Total de chunks: ${analysis.totalChunks}`);
    console.log(`Chunks esperados: ${analysis.expectedChunks}`);
    console.log(`Tamanho médio: ${Math.round(analysis.avgChunkSize)} chars`);
    console.log(`Tamanho mínimo: ${analysis.minChunkSize} chars`);
    console.log(`Tamanho máximo: ${analysis.maxChunkSize} chars`);
    console.log(`Chunks vazios: ${analysis.emptyChunks}`);
    console.log(`Chunks com problemas de encoding: ${analysis.specialCharsIssues}`);
    console.log('═══════════════════════════════════════\n');

    if (emptyChunks.length > 0) {
      console.log('⚠️  CHUNKS VAZIOS:');
      emptyChunks.forEach(c => {
        console.log(`  - Chunk ${c.sequenceIndex}: "${c.text}"`);
      });
      console.log('');
    }

    if (specialCharsIssues.length > 0) {
      console.log('⚠️  PROBLEMAS DE ENCODING:');
      specialCharsIssues.slice(0, 5).forEach(c => {
        const preview = c.text.substring(0, 100).replace(/\n/g, ' ');
        console.log(`  - Chunk ${c.sequenceIndex}: ${preview}...`);
      });
      if (specialCharsIssues.length > 5) {
        console.log(`  ... e mais ${specialCharsIssues.length - 5} chunks\n`);
      }
    }

    // Reconstruct document
    const reconstructed = chunks.map(c => c.text).join('\n\n');

    // Save files
    const outputDir = path.join(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const baseFilename = sourceFile.replace(/\.[^/.]+$/, '');
    const reconstructedPath = path.join(outputDir, `${baseFilename}_RECONSTRUCTED.txt`);
    const analysisPath = path.join(outputDir, `${baseFilename}_ANALYSIS.json`);
    const chunksPath = path.join(outputDir, `${baseFilename}_CHUNKS.json`);

    fs.writeFileSync(reconstructedPath, reconstructed, 'utf8');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2), 'utf8');
    fs.writeFileSync(chunksPath, JSON.stringify(chunks, null, 2), 'utf8');

    console.log('💾 Arquivos salvos:');
    console.log(`  📝 ${reconstructedPath}`);
    console.log(`  📊 ${analysisPath}`);
    console.log(`  🔢 ${chunksPath}\n`);

    console.log('✅ Reconstrução concluída!');
    console.log('📋 Próximos passos:');
    console.log('  1. Compare o arquivo _RECONSTRUCTED.txt com o original');
    console.log('  2. Verifique os problemas de encoding');
    console.log('  3. Analise se os chunks fazem sentido semanticamente');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

reconstructDocument();
