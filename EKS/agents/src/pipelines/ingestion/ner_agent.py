"""
NER Agent - Named Entity Recognition para transcrições de reuniões
Identifica e vincula entidades mencionadas (organizações, ferramentas, conceitos) ao grafo Neo4j
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from pydantic_ai import Agent
import os

# Modelos de dados
class MentionedEntity(BaseModel):
    """Entidade identificada na transcrição"""
    value: str = Field(description="Nome da entidade como mencionado")
    entity_type: str = Field(description="Tipo: organization, tool, concept, location, product, event")
    description: str = Field(description="Contexto em que foi mencionado")
    mentions: int = Field(default=1, description="Quantidade de menções")
    confidence: float = Field(default=0.7, description="Confiança na identificação")
    
class GraphEntity(BaseModel):
    """Entidade existente no grafo Neo4j"""
    id: str
    label: str
    name: str
    aliases: List[str] = []
    
class NERResult(BaseModel):
    """Resultado da análise NER"""
    entities: List[MentionedEntity]
    linked_entities: List[Dict[str, Any]] = Field(default_factory=list)
    unlinked_entities: List[MentionedEntity] = Field(default_factory=list)

class NERAgent:
    """
    Agente especializado em Named Entity Recognition para transcrições.
    
    Responsabilidades:
    1. Identificar entidades mencionadas (organizações, ferramentas, conceitos)
    2. Buscar correspondências no grafo Neo4j
    3. Sugerir vinculações ou criação de novos nodes
    """
    
    def __init__(self, neo4j_driver=None):
        self.neo4j_driver = neo4j_driver
        self.known_entities: List[GraphEntity] = []
        
    async def load_graph_entities(self) -> List[GraphEntity]:
        """Carrega entidades conhecidas do grafo para matching local"""
        if not self.neo4j_driver:
            return []
            
        query = """
        MATCH (n)
        WHERE n:Organization OR n:Tool OR n:Concept OR n:Product OR n:ExternalParticipant
        RETURN 
            elementId(n) as id,
            labels(n)[0] as label,
            COALESCE(n.name, n.canonicalName, '') as name,
            COALESCE(n.aliases, []) as aliases
        LIMIT 500
        """
        
        async with self.neo4j_driver.session() as session:
            result = await session.run(query)
            records = await result.data()
            
        self.known_entities = [
            GraphEntity(
                id=r['id'],
                label=r['label'],
                name=r['name'],
                aliases=r['aliases'] if isinstance(r['aliases'], list) else []
            )
            for r in records
        ]
        
        return self.known_entities
    
    def normalize_text(self, text: str) -> str:
        """Normaliza texto para comparação"""
        import unicodedata
        normalized = unicodedata.normalize('NFD', text.lower().strip())
        return ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')
    
    def find_graph_match(self, entity_name: str) -> Optional[GraphEntity]:
        """Busca correspondência no grafo carregado"""
        normalized_name = self.normalize_text(entity_name)
        
        for graph_entity in self.known_entities:
            # Match exato no nome
            if self.normalize_text(graph_entity.name) == normalized_name:
                return graph_entity
                
            # Match em aliases
            for alias in graph_entity.aliases:
                if self.normalize_text(alias) == normalized_name:
                    return graph_entity
                    
            # Match parcial (contém)
            if normalized_name in self.normalize_text(graph_entity.name):
                return graph_entity
            if self.normalize_text(graph_entity.name) in normalized_name:
                return graph_entity
                
        return None
    
    async def process(self, entities: List[MentionedEntity]) -> NERResult:
        """
        Processa entidades identificadas e tenta vinculá-las ao grafo.
        
        Args:
            entities: Lista de entidades identificadas pelo LLM
            
        Returns:
            NERResult com entidades vinculadas e não vinculadas
        """
        # Carrega entidades do grafo se ainda não carregou
        if not self.known_entities and self.neo4j_driver:
            await self.load_graph_entities()
        
        linked = []
        unlinked = []
        
        for entity in entities:
            graph_match = self.find_graph_match(entity.value)
            
            if graph_match:
                linked.append({
                    'mentioned': entity.model_dump(),
                    'graph_entity': graph_match.model_dump(),
                    'match_type': 'exact' if self.normalize_text(graph_match.name) == self.normalize_text(entity.value) else 'partial'
                })
            else:
                unlinked.append(entity)
                
        return NERResult(
            entities=entities,
            linked_entities=linked,
            unlinked_entities=unlinked
        )
    
    def suggest_node_type(self, entity: MentionedEntity) -> str:
        """Sugere o tipo de node Neo4j para uma entidade não vinculada"""
        entity_type_mapping = {
            'organization': 'Organization',
            'tool': 'Tool', 
            'concept': 'Concept',
            'location': 'Location',
            'product': 'Product',
            'event': 'Event'
        }
        return entity_type_mapping.get(entity.entity_type, 'Concept')
