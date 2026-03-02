import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

async function testExtraction() {
  console.log('🧪 Testando extração de texto com mammoth.js...\n');

  // Find a recent uploaded DOCX file
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.docx'));
  
  if (files.length === 0) {
    console.log('❌ Nenhum arquivo DOCX encontrado em uploads/');
    return;
  }

  const latestFile = files[files.length - 1];
  const filePath = path.join(uploadsDir, latestFile);
  
  console.log(`📄 Testando arquivo: ${latestFile}`);
  console.log(`📁 Caminho: ${filePath}\n`);

  try {
    // Read file
    const buffer = fs.readFileSync(filePath);
    console.log(`📏 Tamanho do arquivo: ${buffer.length} bytes\n`);

    // Extract with mammoth
    console.log('🔧 Extraindo com mammoth.js...');
    const result = await mammoth.extractRawText({ buffer });
    
    console.log('✅ Extração bem-sucedida!\n');
    console.log('📝 Primeiros 500 caracteres:');
    console.log('─'.repeat(50));
    console.log(result.value.substring(0, 500));
    console.log('─'.repeat(50));
    console.log('\n');

    // Check for encoding issues
    const hasIssues = /[]/.test(result.value);
    console.log(`🔍 Problemas de encoding detectados: ${hasIssues ? 'SIM' : 'NÃO'}`);
    
    if (hasIssues) {
      console.log('⚠️  Caracteres problemáticos encontrados:');
      const matches = result.value.match(/[]/g);
      console.log(`   - Total: ${matches?.length || 0} caracteres`);
      
      // Show examples
      const examples = [];
      let index = 0;
      while ((index = result.value.indexOf('', index)) !== -1 && examples.length < 5) {
        const start = Math.max(0, index - 20);
        const end = Math.min(result.value.length, index + 20);
        examples.push(result.value.substring(start, end).replace(/\n/g, ' '));
        index++;
      }
      
      examples.forEach((ex, i) => {
        console.log(`   ${i + 1}. ...${ex}...`);
      });
    }

    // Word count
    const words = result.value.split(/\s+/).filter(w => w.length > 0).length;
    console.log(`\n📊 Estatísticas:`);
    console.log(`   - Caracteres: ${result.value.length}`);
    console.log(`   - Palavras: ${words}`);
    console.log(`   - Linhas: ${result.value.split('\n').length}`);

  } catch (error) {
    console.error('❌ Erro na extração:', error);
  }
}

testExtraction();
