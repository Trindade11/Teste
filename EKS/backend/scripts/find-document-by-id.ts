import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const NEO4J_URI = process.env.NEO4J_URI || 'neo4j+ssc://af132785.databases.neo4j.io';
const NEO4J_USER = process.env.NEO4J_USERNAME || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || '';

const documentId = 'aca62a63-9d9f-4c9f-8734-848d9564a7d4';

console.log('🔌 Conectando ao Neo4j:', NEO4J_URI);
console.log('🔍 Procurando documento com ID:', documentId);

async function findDocument() {
  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  const session = driver.session();

  try {
    // Find document by internal ID
    const result = await session.run(
      `MATCH (d:Document {id: $documentId})
       RETURN d.id AS docId, elementId(d) AS elementId, d.title AS title, 
              d.sourceFile AS sourceFile, d.chunkCount AS chunkCount,
              d.createdAt AS createdAt`,
      { documentId }
    );

    if (result.records.length === 0) {
      console.log('❌ Documento não encontrado pelo ID interno');
      
      // List all recent documents
      console.log('\n📋 Documentos recentes:');
      const recentDocs = await session.run(
        `MATCH (d:Document)
         RETURN d.id AS docId, elementId(d) AS elementId, d.title AS title,
                d.sourceFile AS sourceFile, d.chunkCount AS chunkCount,
                d.createdAt AS createdAt
         ORDER BY d.createdAt DESC
         LIMIT 10`
      );
      
      if (recentDocs.records.length > 0) {
        recentDocs.records.forEach((r, i) => {
          console.log(`${i + 1}. ID: ${r.get('docId')}`);
          console.log(`   ElementId: ${r.get('elementId')}`);
          console.log(`   Título: ${r.get('title')}`);
          console.log(`   Arquivo: ${r.get('sourceFile')}`);
          console.log(`   Chunks: ${r.get('chunkCount')}`);
          console.log(`   Criado: ${r.get('createdAt')}`);
          console.log('');
        });
      } else {
        console.log('Nenhum documento encontrado.');
      }
      
      return;
    }

    const record = result.records[0];
    const elementId = record.get('elementId');
    
    console.log('✅ Documento encontrado!');
    console.log('📄 Informações:');
    console.log(`   ID Interno: ${record.get('docId')}`);
    console.log(`   ElementId: ${elementId}`);
    console.log(`   Título: ${record.get('title')}`);
    console.log(`   Arquivo: ${record.get('sourceFile')}`);
    console.log(`   Chunks: ${record.get('chunkCount')}`);
    console.log(`   Criado: ${record.get('createdAt')}`);
    
    console.log('\n🔄 Para reconstruir este documento, use:');
    console.log(`   const elementId = '${elementId}';`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

findDocument();
