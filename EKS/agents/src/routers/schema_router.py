"""
Schema Router - Expõe taxonomia e ontologia do Neo4j para agentes
Permite que agentes conheçam a estrutura do grafo
"""

from typing import List, Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/schema",
    tags=["schema"]
)

# Definição estática do schema baseada em database-schema.md
# Em produção, isso poderia ser lido dinamicamente do Neo4j

NODE_TYPES = {
    "Meeting": {
        "description": "Reuniões ingeridas via transcrição VTT",
        "properties": {
            "id": {"type": "UUID", "required": True},
            "title": {"type": "String", "required": True},
            "date": {"type": "String", "required": True, "format": "YYYY-MM-DD"},
            "time": {"type": "String", "required": False},
            "duration": {"type": "String", "required": False},
            "organizer": {"type": "String", "required": False},
            "topic": {"type": "String", "required": False},
            "meetingType": {"type": "Enum", "values": ["kickoff", "status", "planning", "review", "retrospective", "brainstorm", "alignment", "decision", "other"]},
            "confidentiality": {"type": "Enum", "values": ["normal", "restricted", "confidential"]},
            "summary": {"type": "String", "required": False, "description": "Resumo executivo LLM"},
            "keyTopics": {"type": "Array[String]", "required": False},
        },
        "indexes": ["id", "date", "meetingType"]
    },
    "Person": {
        "description": "Pessoas no ecossistema (colaboradores, mentores, founders)",
        "properties": {
            "id": {"type": "UUID", "required": True},
            "name": {"type": "String", "required": True},
            "email": {"type": "String", "required": False, "unique": True},
            "role": {"type": "String", "required": True},
            "function": {"type": "String", "required": False},
            "seniority": {"type": "Enum", "values": ["junior", "mid", "senior", "lead", "c-level"]},
            "expertise_areas": {"type": "Array[String]", "required": False},
        },
        "indexes": ["id", "email", "role"]
    },
    "ExternalParticipant": {
        "description": "Participantes externos identificados em reuniões",
        "properties": {
            "id": {"type": "UUID", "required": True},
            "name": {"type": "String", "required": True},
            "email": {"type": "String", "required": False},
            "organization": {"type": "String", "required": False},
            "role": {"type": "String", "required": False},
            "partnerType": {"type": "Enum", "values": ["operational", "strategic", "external", "vendor"]},
        },
        "indexes": ["id", "email", "organization"]
    },
    "Project": {
        "description": "Projetos do ecossistema",
        "properties": {
            "id": {"type": "UUID", "required": True},
            "name": {"type": "String", "required": True},
            "status": {"type": "Enum", "values": ["active", "paused", "completed", "cancelled"]},
            "description": {"type": "String", "required": False},
        },
        "indexes": ["id", "name", "status"]
    },
    "Organization": {
        "description": "Organizações (empresas, CVCs, startups)",
        "properties": {
            "id": {"type": "UUID", "required": True},
            "name": {"type": "String", "required": True},
            "type": {"type": "Enum", "values": ["cvc", "cocreate", "startup", "partner", "vendor"]},
            "focus_area": {"type": "String", "required": False},
        },
        "indexes": ["id", "name", "type"]
    },
    "Task": {
        "description": "Tarefas extraídas de reuniões ou criadas manualmente",
        "properties": {
            "id": {"type": "UUID", "required": True},
            "title": {"type": "String", "required": True},
            "description": {"type": "String", "required": False},
            "status": {"type": "Enum", "values": ["pending", "in_progress", "completed", "cancelled"]},
            "priority": {"type": "Enum", "values": ["low", "medium", "high", "critical"]},
            "due_date": {"type": "DateTime", "required": False},
            "assignee": {"type": "String", "required": False},
        },
        "indexes": ["id", "status", "due_date"]
    },
    "Decision": {
        "description": "Decisões registradas em reuniões",
        "properties": {
            "id": {"type": "UUID", "required": True},
            "value": {"type": "String", "required": True},
            "description": {"type": "String", "required": False},
            "rationale": {"type": "String", "required": False},
            "relatedPerson": {"type": "String", "required": False},
            "relatedArea": {"type": "String", "required": False},
        },
        "indexes": ["id"]
    },
    "Risk": {
        "description": "Riscos identificados em reuniões",
        "properties": {
            "id": {"type": "UUID", "required": True},
            "value": {"type": "String", "required": True},
            "description": {"type": "String", "required": False},
            "impact": {"type": "String", "required": False},
            "probability": {"type": "Enum", "values": ["low", "medium", "high"]},
            "priority": {"type": "Enum", "values": ["low", "medium", "high"]},
        },
        "indexes": ["id"]
    },
    "Insight": {
        "description": "Insights e aprendizados de reuniões",
        "properties": {
            "id": {"type": "UUID", "required": True},
            "value": {"type": "String", "required": True},
            "description": {"type": "String", "required": False},
            "impact": {"type": "String", "required": False},
            "relatedPerson": {"type": "String", "required": False},
            "relatedArea": {"type": "String", "required": False},
        },
        "indexes": ["id"]
    },
    "ActionItem": {
        "description": "Itens de ação específicos com deadline",
        "properties": {
            "id": {"type": "UUID", "required": True},
            "value": {"type": "String", "required": True},
            "description": {"type": "String", "required": False},
            "assignee": {"type": "String", "required": False},
            "deadline": {"type": "String", "required": False},
            "priority": {"type": "Enum", "values": ["low", "medium", "high"]},
            "status": {"type": "Enum", "values": ["pending", "in_progress", "completed"]},
        },
        "indexes": ["id", "status"]
    },
    "Tool": {
        "description": "Ferramentas e softwares mencionados",
        "properties": {
            "id": {"type": "UUID", "required": True},
            "name": {"type": "String", "required": True},
            "category": {"type": "String", "required": False},
            "description": {"type": "String", "required": False},
        },
        "indexes": ["id", "name"]
    },
    "Concept": {
        "description": "Conceitos, termos técnicos ou de negócio",
        "properties": {
            "id": {"type": "UUID", "required": True},
            "name": {"type": "String", "required": True},
            "definition": {"type": "String", "required": False},
            "domain": {"type": "String", "required": False},
        },
        "indexes": ["id", "name"]
    },
}

RELATIONSHIP_TYPES = {
    "RELATED_TO_PROJECT": {
        "from": ["Meeting"],
        "to": ["Project"],
        "description": "Reunião pertence a um projeto"
    },
    "PARTICIPATED_IN": {
        "from": ["Person", "User", "ExternalParticipant"],
        "to": ["Meeting"],
        "description": "Pessoa participou da reunião",
        "properties": ["confidence", "sourceRef"]
    },
    "EXTRACTED_FROM": {
        "from": ["Task", "Decision", "Risk", "Insight", "ActionItem"],
        "to": ["Meeting"],
        "description": "Entidade extraída da reunião"
    },
    "ORGANIZED_BY": {
        "from": ["Meeting"],
        "to": ["Person", "User"],
        "description": "Quem organizou a reunião"
    },
    "WORKS_FOR": {
        "from": ["Person"],
        "to": ["Organization"],
        "description": "Pessoa trabalha para organização"
    },
    "ASSIGNED_TO": {
        "from": ["Task", "ActionItem"],
        "to": ["Person", "User"],
        "description": "Tarefa atribuída a pessoa"
    },
    "MENTIONS": {
        "from": ["Meeting"],
        "to": ["Tool", "Concept", "Organization"],
        "description": "Reunião menciona entidade"
    },
}

# Entity types que podem ser extraídos de transcrições
EXTRACTION_ENTITY_TYPES = [
    "task",
    "decision", 
    "risk",
    "insight",
    "actionItem",
    "mentionedEntity",  # Genérico para Tool, Concept, Organization
]


class SchemaResponse(BaseModel):
    node_types: Dict[str, Any]
    relationship_types: Dict[str, Any]
    extraction_entity_types: List[str]


@router.get("/", response_model=SchemaResponse)
async def get_schema():
    """
    Retorna o schema completo do grafo Neo4j.
    
    Útil para agentes que precisam conhecer:
    - Tipos de nodes disponíveis
    - Propriedades de cada node
    - Relacionamentos válidos
    - Tipos de entidades extraíveis
    """
    return SchemaResponse(
        node_types=NODE_TYPES,
        relationship_types=RELATIONSHIP_TYPES,
        extraction_entity_types=EXTRACTION_ENTITY_TYPES
    )


@router.get("/node-types")
async def get_node_types():
    """Lista todos os tipos de nodes disponíveis."""
    return {
        "success": True,
        "data": list(NODE_TYPES.keys()),
        "count": len(NODE_TYPES)
    }


@router.get("/node-types/{node_type}")
async def get_node_type_details(node_type: str):
    """Retorna detalhes de um tipo de node específico."""
    if node_type not in NODE_TYPES:
        return {"success": False, "error": f"Node type '{node_type}' not found"}
    
    return {
        "success": True,
        "data": {
            "name": node_type,
            **NODE_TYPES[node_type]
        }
    }


@router.get("/relationships")
async def get_relationships():
    """Lista todos os tipos de relacionamentos."""
    return {
        "success": True,
        "data": RELATIONSHIP_TYPES,
        "count": len(RELATIONSHIP_TYPES)
    }


@router.get("/extraction-types")
async def get_extraction_types():
    """
    Retorna tipos de entidades que podem ser extraídos de transcrições.
    Útil para o LLM saber o que extrair.
    """
    return {
        "success": True,
        "data": EXTRACTION_ENTITY_TYPES,
        "description": "Entity types that can be extracted from meeting transcripts"
    }
