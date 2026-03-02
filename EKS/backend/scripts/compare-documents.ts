import fs from 'fs';
import path from 'path';

async function compareDocuments() {
  console.log('🔍 Comparando documento original vs reconstruído...\n');

  const originalPath = path.join(process.cwd(), 'output', 'Proposta comercial CoCreateAI - Move Studio_ORIGINAL.txt');
  const reconstructedPath = path.join(process.cwd(), 'output', 'Proposta comercial CoCreateAI - Move Studio_RECONSTRUCTED.txt');

  if (!fs.existsSync(originalPath) || !fs.existsSync(reconstructedPath)) {
    console.log('❌ Arquivos não encontrados');
    return;
  }

  const original = fs.readFileSync(originalPath, 'utf8');
  const reconstructed = fs.readFileSync(reconstructedPath, 'utf8');

  console.log('📊 Estatísticas de comparação:');
  console.log('─'.repeat(50));
  console.log(`Original:`);
  console.log(`   - Caracteres: ${original.length}`);
  console.log(`   - Palavras: ${original.split(/\s+/).filter(w => w.length > 0).length}`);
  console.log(`   - Linhas: ${original.split('\n').length}`);
  
  console.log(`\nReconstruído:`);
  console.log(`   - Caracteres: ${reconstructed.length}`);
  console.log(`   - Palavras: ${reconstructed.split(/\s+/).filter(w => w.length > 0).length}`);
  console.log(`   - Linhas: ${reconstructed.split('\n').length}`);
  
  console.log(`\nDiferença:`);
  console.log(`   - Caracteres: ${reconstructed.length - original.length}`);
  console.log(`   - Palavras: ${reconstructed.split(/\s+/).filter(w => w.length > 0).length - original.split(/\s+/).filter(w => w.length > 0).length}`);
  console.log(`   - Similaridade: ${Math.round((reconstructed.length / original.length) * 100)}%`);
  console.log('─'.repeat(50));

  // Check for encoding issues
  const originalIssues = /[]/.test(original);
  const reconstructedIssues = /[]/.test(reconstructed);
  
  console.log(`\n🔍 Problemas de encoding:`);
  console.log(`   - Original: ${originalIssues ? 'SIM' : 'NÃO'}`);
  console.log(`   - Reconstruído: ${reconstructedIssues ? 'SIM' : 'NÃO'}`);

  // Check semantic chunking quality
  console.log(`\n📋 Análise do Semantic Chunking:`);
  
  // Count very small chunks (potential problem)
  const chunksPath = path.join(process.cwd(), 'output', 'Proposta comercial CoCreateAI - Move Studio_CHUNKS.json');
  if (fs.existsSync(chunksPath)) {
    const chunks = JSON.parse(fs.readFileSync(chunksPath, 'utf8'));
    const tinyChunks = chunks.filter((c: any) => c.textLength < 10);
    const largeChunks = chunks.filter((c: any) => c.textLength > 1000);
    
    console.log(`   - Total de chunks: ${chunks.length}`);
    console.log(`   - Chunks muito pequenos (<10 chars): ${tinyChunks.length}`);
    console.log(`   - Chunks muito grandes (>1000 chars): ${largeChunks.length}`);
    
    if (tinyChunks.length > 0) {
      console.log(`\n⚠️  Chunks problemáticos (muito pequenos):`);
      tinyChunks.slice(0, 5).forEach((c: any, i: number) => {
        console.log(`     ${i + 1}. Chunk ${c.sequenceIndex}: "${c.text}" (${c.textLength} chars)`);
      });
    }
  }

  // Save comparison report
  const report = {
    timestamp: new Date().toISOString(),
    original: {
      characters: original.length,
      words: original.split(/\s+/).filter(w => w.length > 0).length,
      lines: original.split('\n').length,
      encodingIssues: originalIssues
    },
    reconstructed: {
      characters: reconstructed.length,
      words: reconstructed.split(/\s+/).filter(w => w.length > 0).length,
      lines: reconstructed.split('\n').length,
      encodingIssues: reconstructedIssues
    },
    difference: {
      characters: reconstructed.length - original.length,
      words: reconstructed.split(/\s+/).filter(w => w.length > 0).length - original.split(/\s+/).filter(w => w.length > 0).length,
      similarity: Math.round((reconstructed.length / original.length) * 100)
    }
  };

  const reportPath = path.join(process.cwd(), 'output', 'COMPARISON-REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Relatório salvo em: ${reportPath}`);
}

compareDocuments();
