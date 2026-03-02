"""
Intelligent Chunker Agent - Pydantic AI Implementation
Uses Pydantic AI for structured validation and better error handling
"""

from pydantic_ai import Agent, RunContext
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

# Pydantic models for structured output
class TableData(BaseModel):
    headers: List[str] = Field(description="Column headers of the table")
    rows: List[List[str]] = Field(description="Table rows as list of lists")

class ChunkMetadata(BaseModel):
    chunk_type: str = Field(description="Type: title, section, paragraph, table, list, summary, other")
    section_title: Optional[str] = Field(description="Title of the section this chunk belongs to")
    section_number: Optional[str] = Field(description="Section number like 1.1, 2.3, etc.")
    hierarchy_level: int = Field(description="Hierarchical level: 1=title, 2=main section, 3=subsection, etc.")
    contains_table: bool = Field(description="Whether this chunk contains a table")
    table_data: Optional[TableData] = Field(description="Structured table data if contains_table is true")
    key_topics: List[str] = Field(description="Key topics or themes in this chunk")
    estimated_importance: str = Field(description="Importance: high, medium, low")
    reasoning: str = Field(description="Brief justification for why this chunk was created this way")

class DocumentChunk(BaseModel):
    sequence_index: int = Field(description="Sequential order of this chunk")
    text: str = Field(description="Complete text of this chunk")
    metadata: ChunkMetadata = Field(description="Rich metadata about this chunk")

class ChunkingResponse(BaseModel):
    chunks: List[DocumentChunk] = Field(description="All chunks in order")
    total_chunks: int = Field(description="Total number of chunks created")
    document_summary: str = Field(description="Brief summary of the document structure")
    processing_notes: str = Field(description="Any notes about the chunking process")

# Create the agent with Azure OpenAI
azure_deployment = os.getenv('AZURE_OPENAI_DEPLOYMENT_NAME', 'gpt-4o-mini-aion')
azure_endpoint = os.getenv('AZURE_OPENAI_ENDPOINT', '')
azure_key = os.getenv('AZURE_OPENAI_KEY', '')

# Azure OpenAI model string format
azure_model = f'azure:{azure_deployment}'

@intelligent_chunker_agent.system_prompt
async def system_prompt() -> str:
    return (
        "You are an expert document analyst specializing in semantic chunking. "
        "Your task is to read documents completely and divide them into logical, "
        "semantically coherent chunks as a human would when studying a document.\n\n"
        
        "CRITICAL RULES:\n"
        "1. Read the ENTIRE document before making chunking decisions\n"
        "2. Each chunk must be a COMPLETE semantic unit - never break sentences\n"
        "3. Minimum chunk size: 50 characters (avoid tiny chunks)\n"
        "4. Maximum chunk size: 2000 characters (keep chunks readable)\n"
        "5. Tables must be separate chunks with structured data extraction\n"
        "6. Identify and preserve document hierarchy (title > sections > subsections)\n"
        "7. Extract key topics and estimate importance (high/medium/low)\n"
        "8. Provide reasoning for each chunk division\n\n"
        
        "CHUNK TYPES:\n"
        "- title: Main document title or major section titles\n"
        "- section: Section headers and their brief descriptions\n"
        "- paragraph: Main content paragraphs\n"
        "- table: Structured tables with headers and data\n"
        "- list: Bulleted or numbered lists\n"
        "- summary: Conclusions or summaries\n"
        "- other: Any other content type\n\n"
        
        "TABLE HANDLING:\n"
        "When you detect a table, extract it as structured data:\n"
        "- Identify column headers clearly\n"
        "- Extract each row as a list of values\n"
        "- Ensure the table can be perfectly reconstructed\n"
        "- Mark contains_table=true and include table_data\n\n"
        
        "HIERARCHY LEVELS:\n"
        "1: Document title\n"
        "2: Main sections (1., 2., 3.)\n"
        "3: Subsections (1.1, 1.2, 2.1)\n"
        "4: Sub-subsections (1.1.1, etc.)\n"
        "5: Content within subsections\n\n"
        
        "QUALITY CRITERIA:\n"
        "- Each chunk should be self-contained and understandable\n"
        "- Logical flow between chunks\n"
        "- No orphaned sentences or fragments\n"
        "- Rich metadata for context and retrieval\n"
        "- Proper handling of special formatting (tables, lists)"
    )

# Create the agent with Azure OpenAI
intelligent_chunker_agent = Agent(
    azure_model,
)

@intelligent_chunker_agent.tool
async def get_document_info(context: RunContext[Dict[str, Any]]) -> str:
    """Get information about the document being processed"""
    doc_info = context.get('document_info', {})
    return (
        f"Document Info:\n"
        f"Title: {doc_info.get('title', 'Unknown')}\n"
        f"Type: {doc_info.get('type', 'Unknown')}\n"
        f"Length: {doc_info.get('length', 0)} characters\n"
        f"Created: {doc_info.get('created_at', datetime.now().isoformat())}"
    )

@intelligent_chunker_agent.result_validator
async def chunk_document_intelligently(
    title: str,
    doc_type: str,
    content: str,
    author: Optional[str] = None
) -> ChunkingResponse:
    """
    Process a document with intelligent LLM-based chunking
    
    Args:
        title: Document title
        doc_type: Document type (contract, report, etc.)
        content: Full document text
        author: Document author (optional)
    
    Returns:
        ChunkingResponse with structured chunks and metadata
    """
    
    # Prepare document info for the agent
    document_info = {
        'title': title,
        'type': doc_type,
        'length': len(content),
        'created_at': datetime.now().isoformat(),
        'author': author
    }
    
    # Create the prompt for the agent
    user_prompt = (
        f"DOCUMENT TO ANALYZE AND CHUNK:\n\n"
        f"Title: {title}\n"
        f"Type: {doc_type}\n"
        f"Author: {author or 'Unknown'}\n"
        f"Length: {len(content)} characters\n\n"
        f"CONTENT:\n{content}\n\n"
        f"Please analyze this document and create semantic chunks following all the rules. "
        f"Pay special attention to:\n"
        f"1. Document structure and hierarchy\n"
        f"2. Tables and structured data\n"
        f"3. Logical flow and completeness\n"
        f"4. Rich metadata for each chunk"
    )
    
    try:
        # Run the intelligent chunking agent
        result = await intelligent_chunker_agent.run(
            user_prompt,
            document_info=document_info
        )
        
        response = result.data
        print(f"✅ Intelligent chunking completed:")
        print(f"   - Total chunks: {response.total_chunks}")
        print(f"   - Document summary: {response.document_summary}")
        print(f"   - Processing notes: {response.processing_notes}")
        
        # Analyze chunk distribution
        chunk_types = {}
        importance_levels = {}
        table_count = 0
        
        for chunk in response.chunks:
            # Count chunk types
            chunk_type = chunk.metadata.chunk_type
            chunk_types[chunk_type] = chunk_types.get(chunk_type, 0) + 1
            
            # Count importance levels
            importance = chunk.metadata.estimated_importance
            importance_levels[importance] = importance_levels.get(importance, 0) + 1
            
            # Count tables
            if chunk.metadata.contains_table:
                table_count += 1
        
        print(f"\n📊 Chunk Analysis:")
        print(f"   - Chunk types: {chunk_types}")
        print(f"   - Importance levels: {importance_levels}")
        print(f"   - Tables detected: {table_count}")
        
        # Validate chunk quality
        tiny_chunks = [c for c in response.chunks if len(c.text) < 50]
        huge_chunks = [c for c in response.chunks if len(c.text) > 2000]
        
        if tiny_chunks:
            print(f"⚠️  Warning: {len(tiny_chunks)} tiny chunks (<50 chars)")
        if huge_chunks:
            print(f"⚠️  Warning: {len(huge_chunks)} huge chunks (>2000 chars)")
        
        if not tiny_chunks and not huge_chunks:
            print(f"✅ All chunks have optimal size (50-2000 chars)")
        
        return response
        
    except Exception as e:
        print(f"❌ Error in intelligent chunking: {str(e)}")
        raise

# Example usage
if __name__ == "__main__":
    import asyncio
    
    async def test_chunking():
        sample_content = """
        PROPOSTA COMERCIAL: GESTÃO TÉCNICA E ESTRATÉGICA EM IA
        
        1. SUMÁRIO EXECUTIVO
        Esta proposta reflete o modelo de parceria estratégica acordado, 
        onde a CoCreate AI atuará como Apoio Técnico e Estratégico em IA 
        para o Move Studio Projeto EKS.
        
        1.1. RESPONSABILIDADES
        CoCreate AI: Fornecer suporte consultivo na arquitetura da solução.
        Empreendedores: Responsáveis finais pelo desenvolvimento.
        
        2. ESTRUTURA DE INVESTIMENTO
        Valor do Apoio Estratégico: R$ 7.000/mês
        Duração: 6 meses (2 meses preparação + 4 meses programa)
        """
        
        result = await chunk_document_intelligently(
            title="Proposta Comercial Teste",
            doc_type="proposal",
            content=sample_content
        )
        
        print(f"\nGenerated {len(result.chunks)} chunks:")
        for i, chunk in enumerate(result.chunks):
            print(f"\nChunk {i+1}:")
            print(f"  Type: {chunk.metadata.chunk_type}")
            print(f"  Level: {chunk.metadata.hierarchy_level}")
            print(f"  Importance: {chunk.metadata.estimated_importance}")
            print(f"  Text preview: {chunk.text[:100]}...")
    
    asyncio.run(test_chunking())
