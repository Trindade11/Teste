"""
Linking Agent - Vinculação de entidades extraídas ao grafo Neo4j
Cria relacionamentos e sugere criação de novos nodes
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class LinkSuggestion(BaseModel):
    """Sugestão de vinculação ao grafo"""
    entity_id: str
    entity_value: str
    suggested_node_id: Optional[str] = None
    suggested_node_label: Optional[str] = None
    confidence: float
    action: str = Field(description="link, create, skip")
    reason: str

class LinkingResult(BaseModel):
    """Resultado do processo de linking"""
    linked: List[Dict[str, Any]]
    to_create: List[Dict[str, Any]]
    skipped: List[Dict[str, Any]]

class LinkingAgent:
    """
    Agente especializado em vincular entidades extraídas ao grafo Neo4j.
    
    Responsabilidades:
    1. Buscar nodes existentes que correspondam às entidades
    2. Sugerir criação de novos nodes para entidades não encontradas
    3. Criar relacionamentos apropriados (PARTICIPATED_IN, MENTIONED_IN, etc.)
    """
    
    def __init__(self, neo4j_driver=None):
        self.neo4j_driver = neo4j_driver
        
    async def link_entities(
        self,
        entities: List[Dict[str, Any]],
        meeting_id: str
    ) -> LinkingResult:
        """
        Processa entidades e cria vínculos no grafo.
        
        Args:
            entities: Lista de entidades extraídas
            meeting_id: ID do node Meeting no Neo4j
            
        Returns:
            LinkingResult com entidades vinculadas e a criar
        """
        linked = []
        to_create = []
        skipped = []
        
        for entity in entities:
            entity_type = entity.get('type', '')
            
            if entity_type == 'participant':
                # Participantes já são processados no matching de speakers
                if entity.get('linkedNodeId'):
                    linked.append({
                        'entity': entity,
                        'relationship': 'PARTICIPATED_IN',
                        'target_id': meeting_id
                    })
                else:
                    to_create.append({
                        'entity': entity,
                        'suggested_label': 'ExternalParticipant',
                        'relationship': 'PARTICIPATED_IN'
                    })
                    
            elif entity_type == 'mentionedEntity':
                # Entidades mencionadas - vincular se existir no grafo
                to_create.append({
                    'entity': entity,
                    'suggested_label': self._get_neo4j_label(entity),
                    'relationship': 'MENTIONED_IN'
                })
                
            elif entity_type in ['task', 'decision', 'risk', 'insight']:
                # Itens de conhecimento - criar como nodes próprios
                to_create.append({
                    'entity': entity,
                    'suggested_label': entity_type.capitalize(),
                    'relationship': 'DISCUSSED_IN'
                })
            else:
                skipped.append({
                    'entity': entity,
                    'reason': f'Tipo não suportado: {entity_type}'
                })
                
        return LinkingResult(
            linked=linked,
            to_create=to_create,
            skipped=skipped
        )
    
    def _get_neo4j_label(self, entity: Dict[str, Any]) -> str:
        """Determina o label Neo4j apropriado para uma entidade mencionada"""
        entity_type = entity.get('entityType', entity.get('context', ''))
        
        if 'organization' in entity_type.lower():
            return 'Organization'
        elif 'tool' in entity_type.lower():
            return 'Tool'
        elif 'concept' in entity_type.lower():
            return 'Concept'
        elif 'product' in entity_type.lower():
            return 'Product'
        else:
            return 'Concept'
    
    async def create_relationships(
        self,
        linking_result: LinkingResult,
        meeting_id: str
    ) -> Dict[str, int]:
        """
        Cria os relacionamentos no Neo4j.
        
        Args:
            linking_result: Resultado do processo de linking
            meeting_id: ID do node Meeting
            
        Returns:
            Contagem de relacionamentos criados por tipo
        """
        if not self.neo4j_driver:
            return {'error': 'Neo4j driver not configured'}
            
        counts = {
            'linked': 0,
            'created': 0,
            'skipped': len(linking_result.skipped)
        }
        
        async with self.neo4j_driver.session() as session:
            # Criar relacionamentos para entidades já linkadas
            for item in linking_result.linked:
                entity = item['entity']
                if entity.get('linkedNodeId'):
                    query = f"""
                    MATCH (m:Meeting) WHERE elementId(m) = $meetingId
                    MATCH (e) WHERE elementId(e) = $entityId
                    MERGE (e)-[r:{item['relationship']}]->(m)
                    RETURN r
                    """
                    await session.run(query, {
                        'meetingId': meeting_id,
                        'entityId': entity['linkedNodeId']
                    })
                    counts['linked'] += 1
                    
        return counts
