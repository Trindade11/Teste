"""
Ingestion Router - Endpoints para pipeline de ingestão
Expõe EntityMatchingAgent e outros agentes de ingestão
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
import logging

from src.utils.neo4j_client import neo4j_client
from src.pipelines.ingestion.entity_matching_agent import EntityMatchingAgent, MatchResult

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/ingestion",
    tags=["ingestion"]
)

# Request/Response models
class MatchEntityRequest(BaseModel):
    """Request para match de uma entidade"""
    term: str = Field(description="Termo a buscar no grafo")
    
class MatchEntitiesRequest(BaseModel):
    """Request para match de múltiplas entidades"""
    terms: List[str] = Field(description="Lista de termos a buscar")

class MatchEntityResponse(BaseModel):
    """Response do match de entidade"""
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None

class MatchEntitiesResponse(BaseModel):
    """Response do match de múltiplas entidades"""
    success: bool
    data: Optional[List[dict]] = None
    error: Optional[str] = None


# Singleton do agent (carrega nodes uma vez)
_entity_matching_agent: Optional[EntityMatchingAgent] = None

async def get_entity_matching_agent() -> EntityMatchingAgent:
    """Dependency para obter o EntityMatchingAgent configurado"""
    global _entity_matching_agent
    
    if _entity_matching_agent is None:
        _entity_matching_agent = EntityMatchingAgent(
            neo4j_driver=neo4j_client.driver,
            fuzzy_threshold=0.7,
            partial_threshold=0.6
        )
        # Carrega nodes do grafo
        if neo4j_client.driver:
            try:
                await _entity_matching_agent.load_graph_nodes()
                logger.info(f"✅ EntityMatchingAgent loaded {len(_entity_matching_agent.graph_nodes)} nodes")
            except Exception as e:
                logger.warning(f"⚠️ Failed to load graph nodes: {e}")
    
    return _entity_matching_agent


@router.post("/match-entity", response_model=MatchEntityResponse)
async def match_entity(
    request: MatchEntityRequest,
    agent: EntityMatchingAgent = Depends(get_entity_matching_agent)
):
    """
    Busca correspondência de um termo no grafo Neo4j.
    
    Usa múltiplas estratégias de matching:
    1. Match exato no nome canônico
    2. Match em aliases (thesaurus)
    3. Match fuzzy (Levenshtein)
    4. Match parcial
    
    Returns:
        MatchResult com candidatos e sugestão de ação (link/review/create)
    """
    try:
        result = await agent.match_entity(request.term)
        return MatchEntityResponse(
            success=True,
            data=result.model_dump()
        )
    except Exception as e:
        logger.error(f"Error matching entity '{request.term}': {e}")
        return MatchEntityResponse(
            success=False,
            error=str(e)
        )


@router.post("/match-entities", response_model=MatchEntitiesResponse)
async def match_entities(
    request: MatchEntitiesRequest,
    agent: EntityMatchingAgent = Depends(get_entity_matching_agent)
):
    """
    Busca correspondência de múltiplos termos no grafo Neo4j (batch).
    
    Returns:
        Lista de MatchResult para cada termo
    """
    try:
        results = await agent.match_entities(request.terms)
        return MatchEntitiesResponse(
            success=True,
            data=[r.model_dump() for r in results]
        )
    except Exception as e:
        logger.error(f"Error matching entities: {e}")
        return MatchEntitiesResponse(
            success=False,
            error=str(e)
        )


@router.get("/graph-nodes")
async def get_graph_nodes(
    agent: EntityMatchingAgent = Depends(get_entity_matching_agent)
):
    """
    Lista os nodes carregados do grafo (para debug/verificação).
    
    Returns:
        Lista de nodes com id, label, name, aliases
    """
    return {
        "success": True,
        "count": len(agent.graph_nodes),
        "nodes": [
            {
                "id": node.id,
                "label": node.label,
                "name": node.name,
                "aliases": node.aliases[:5] if node.aliases else []  # Limita aliases
            }
            for node in agent.graph_nodes[:50]  # Limita a 50 nodes
        ]
    }


@router.post("/reload-nodes")
async def reload_graph_nodes(
    agent: EntityMatchingAgent = Depends(get_entity_matching_agent)
):
    """
    Recarrega os nodes do grafo Neo4j.
    
    Útil quando novos nodes são adicionados e o cache precisa ser atualizado.
    """
    try:
        if not neo4j_client.driver:
            raise HTTPException(status_code=503, detail="Neo4j not connected")
        
        agent._loaded = False
        await agent.load_graph_nodes()
        
        return {
            "success": True,
            "message": f"Reloaded {len(agent.graph_nodes)} nodes from Neo4j"
        }
    except Exception as e:
        logger.error(f"Error reloading nodes: {e}")
        raise HTTPException(status_code=500, detail=str(e))
