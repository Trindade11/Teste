import mammoth from 'mammoth';

async function testMammoth() {
  console.log('🧪 Testando mammoth.js com texto em português...\n');

  // Create a simple test buffer (simulating DOCX structure)
  const testText = 'Proposta Comercial: Gestão Técnica e Estratégica em IA\n\nEste é um teste com caracteres acentuados: ç, ã, õ, é, í, ó, ú.';
  
  console.log('📝 Texto de teste:');
  console.log('─'.repeat(50));
  console.log(testText);
  console.log('─'.repeat(50));
  console.log('\n');

  // Check if mammoth is available
  try {
    console.log('✅ mammoth.js importado com sucesso');
    console.log('📦 Versão:', (mammoth as any).version || 'desconhecida');
    
    // Test with a simple buffer (mammoth needs DOCX format, so this will fail gracefully)
    console.log('\n⚠️  Nota: mammoth.js precisa de um arquivo DOCX real para funcionar');
    console.log('💡 Para testar completo, faça upload de um arquivo DOCX e use o endpoint de ingestão');
    
  } catch (error) {
    console.error('❌ Erro ao importar mammoth:', error);
  }
}

testMammoth();
