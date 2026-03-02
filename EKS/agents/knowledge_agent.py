"""
Knowledge Agent - Retrieves and answers questions from knowledge graph
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from pydantic_ai import Agent, RunContext
import os

class KnowledgeQuery(BaseModel):
    """Structured knowledge query"""
    query: str
    entities: List[str] = Field(default_factory=list)
    search_type: str = "hybrid"  # semantic, graph, hybrid
    max_results: int = 5

class KnowledgeSource(BaseModel):
    """Source of knowledge with provenance"""
    id: str
    type: str  # Document, Knowledge, Chunk, etc.
    title: str
    content: str
    relevance_score: float = Field(ge=0.0, le=1.0)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class KnowledgeResponse(BaseModel):
    """Knowledge agent response with citations"""
    answer: str
    sources: List[KnowledgeSource]
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str = ""

knowledge_agent = Agent(
    'openai:gpt-4o',
    result_type=KnowledgeResponse,
    system_prompt="""You are a Knowledge Agent for an enterprise knowledge graph.

Your role:
1. Search the knowledge graph for relevant information
2. Provide accurate answers with proper citations
3. Indicate confidence level based on source quality
4. Explain reasoning when uncertain

Guidelines:
- Always cite sources with provenance
- Distinguish between facts and opinions
- Indicate if information is outdated
- Suggest related topics when relevant
- Be concise but complete"""
)

@knowledge_agent.tool
async def search_semantic(ctx: RunContext[dict], query: str, limit: int = 5) -> List[dict]:
    """Search knowledge using semantic similarity (embeddings)"""
    # In production: query Neo4j vector index
    return []

@knowledge_agent.tool
async def search_graph(ctx: RunContext[dict], entities: List[str]) -> List[dict]:
    """Search knowledge graph by entity relationships"""
    # In production: Cypher query traversing relationships
    return []

@knowledge_agent.tool
async def get_knowledge_context(ctx: RunContext[dict], knowledge_id: str) -> dict:
    """Get full context for a knowledge node"""
    # In production: query Neo4j for full node + relationships
    return {
        "id": knowledge_id,
        "content": "",
        "related_docs": [],
        "related_tasks": []
    }

async def query_knowledge(
    query: str,
    user_id: str,
    context_pack: dict = None
) -> KnowledgeResponse:
    """Query knowledge base and return structured answer"""
    
    context_text = ""
    if context_pack:
        if context_pack.get('semantic'):
            context_text += "\nRelevant knowledge:\n"
            for item in context_pack['semantic'][:3]:
                context_text += f"- {item.get('title', 'Unknown')}: {item.get('summary', '')[:100]}\n"
    
    result = await knowledge_agent.run(
        f"""Answer this question using the knowledge graph:

Question: "{query}"
User ID: {user_id}{context_text}

Provide answer with citations and confidence level.""",
        message_history=[]
    )
    return result.data

if __name__ == "__main__":
    import asyncio
    
    async def test():
        response = await query_knowledge(
            "Quais são os principais projetos em andamento?",
            "user-123",
            {"semantic": [{"title": "Projeto EKS", "summary": "Plataforma de gestão de conhecimento"}]}
        )
        print("Answer:", response.answer)
        print("Confidence:", response.confidence)
        print("Sources:", len(response.sources))
    
    asyncio.run(test())
