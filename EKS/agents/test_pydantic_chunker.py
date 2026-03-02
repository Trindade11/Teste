"""
Test script for Pydantic AI Intelligent Chunker
"""

import asyncio
import os
from dotenv import load_dotenv
from intelligent_chunker_agent import chunk_document_intelligently

# Load environment variables
load_dotenv()

async def test_chunking():
    print("🧪 Testing Pydantic AI Intelligent Chunker...")
    
    # Check environment variables
    azure_deployment = os.getenv('AZURE_OPENAI_DEPLOYMENT_NAME')
    azure_endpoint = os.getenv('AZURE_OPENAI_ENDPOINT')
    azure_key = os.getenv('AZURE_OPENAI_KEY')
    
    print(f"📋 Configuration:")
    print(f"   - Deployment: {azure_deployment}")
    print(f"   - Endpoint: {azure_endpoint}")
    print(f"   - Key: {'✅ Set' if azure_key else '❌ Missing'}")
    
    if not all([azure_deployment, azure_endpoint, azure_key]):
        print("❌ Missing required Azure OpenAI configuration")
        return
    
    # Sample document for testing
    sample_content = """
PROPOSTA COMERCIAL: GESTÃO TÉCNICA E ESTRATÉGICA EM IA - PROJETO EKS

PARA: Montreal Ventures
DE: CoCreate AI
DATA: 30/07/2025
VERSÃO: 3.0

1. SUMÁRIO EXECUTIVO
Esta proposta reflete o modelo de parceria estratégica acordado, onde a CoCreate AI atuará como Apoio Técnico e Estratégico em IA para o Move Studio Projeto EKS. Nosso papel é dar suporte aos empreendedores na arquitetura, no design e na solução dos desafios técnicos de seus projetos, atuando como um conselho consultivo para aplicação de metodologias de IA.

1.1. DIVISÃO DE RESPONSABILIDADES
CoCreate AI (Apoio Técnico e Estratégico): Fornecer suporte consultivo na arquitetura da solução, design técnico, especificações e validação das entregas. Atuamos como um parceiro estratégico para apoiar os empreendedores em seus desafios técnicos.

Empreendedores (Execução e Gestão do Projeto): São os responsáveis finais pelo desenvolvimento, gestão e entrega de seus respectivos projetos, contando com nosso apoio.

2. ESTRUTURA DE INVESTIMENTO

2.1. APOIO TÉCNICO ESTRATÉGICO (TAXA MENSAL)
Valor do Apoio Estratégico: R$ 7.000/mês
Inclui: O suporte consultivo às startups e ao desenvolvimento do Projeto EKS, além das capacitações descritas.
Não Inclui: Custos com desenvolvimento, que serão orçados à parte.

Duração Prevista: 6 meses (2 meses preparação + 4 meses programa)

2.2. CRONOGRAMA DE EXECUÇÃO
Fase 1: Preparação (2 meses previstos)
- Mês 1: Setup + Arquitetura
- Mês 2: Estruturação

Fase 2: Programa (4 meses previstos)
- Mês 3: Início do Programa
- Mês 4: Acompanhamento do Desenvolvimento
- Mês 5: Consolidação
- Mês 6: Finalização

3. CONDIÇÕES COMERCIAIS

3.1. FORMA DE PAGAMENTO
Modelo: Taxa mensal de Apoio Estratégico de R$ 7.000
Faturamento: Mensal até o 5º dia útil, com vencimento em 30 dias.

3.2. FLEXIBILIDADE
O acordo de gestão pode ser cancelado por qualquer parte com aviso prévio de 30 dias.
"""

    print(f"\n📄 Sample document: {len(sample_content)} characters")
    
    try:
        print("\n🤖 Running intelligent chunking...")
        result = await chunk_document_intelligently(
            title="Proposta Comercial Teste",
            doc_type="proposal",
            content=sample_content,
            author="CoCreate AI"
        )
        
        print(f"\n✅ SUCCESS! Generated {result.total_chunks} chunks")
        print(f"📊 Document summary: {result.document_summary}")
        print(f"📝 Processing notes: {result.processing_notes}")
        
        print(f"\n📋 Chunk Details:")
        for i, chunk in enumerate(result.chunks[:5]):  # Show first 5 chunks
            print(f"\nChunk {i+1}:")
            print(f"  Type: {chunk.metadata.chunk_type}")
            print(f"  Level: {chunk.metadata.hierarchy_level}")
            print(f"  Importance: {chunk.metadata.estimated_importance}")
            print(f"  Size: {len(chunk.text)} chars")
            print(f"  Topics: {chunk.metadata.key_topics}")
            print(f"  Reasoning: {chunk.metadata.reasoning}")
            print(f"  Preview: {chunk.text[:100]}...")
        
        if len(result.chunks) > 5:
            print(f"\n... and {len(result.chunks) - 5} more chunks")
        
        # Quality check
        tiny_chunks = [c for c in result.chunks if len(c.text) < 50]
        huge_chunks = [c for c in result.chunks if len(c.text) > 2000]
        
        print(f"\n🔍 Quality Analysis:")
        print(f"   - Tiny chunks (<50 chars): {len(tiny_chunks)}")
        print(f"   - Huge chunks (>2000 chars): {len(huge_chunks)}")
        print(f"   - Tables detected: {sum(1 for c in result.chunks if c.metadata.contains_table)}")
        
        if len(tiny_chunks) == 0 and len(huge_chunks) == 0:
            print("   ✅ All chunks have optimal size!")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        print("\n🔧 Troubleshooting:")
        print("1. Check Azure OpenAI credentials in .env")
        print("2. Verify deployment name exists")
        print("3. Check endpoint accessibility")
        print("4. Ensure API key has permissions")

if __name__ == "__main__":
    asyncio.run(test_chunking())
