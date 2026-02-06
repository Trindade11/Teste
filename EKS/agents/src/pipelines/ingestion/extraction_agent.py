"""
Extraction Agent - Extração de entidades estruturadas de transcrições
Extrai tarefas, decisões, riscos, insights usando LLM
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from pydantic_ai import Agent
import os

class ExtractedItem(BaseModel):
    """Item extraído da transcrição"""
    type: str = Field(description="task, decision, risk, insight, actionItem")
    value: str = Field(description="Título/resumo do item")
    description: str = Field(description="Descrição detalhada")
    confidence: float = Field(default=0.7)
    related_person: Optional[str] = None
    related_area: Optional[str] = None
    impact: Optional[str] = None
    priority: Optional[str] = None
    deadline: Optional[str] = None
    assignee: Optional[str] = None

class ExtractionResult(BaseModel):
    """Resultado da extração"""
    items: List[ExtractedItem]
    summary: str
    key_topics: List[Dict[str, Any]]
    processing_time_ms: int

class ExtractionAgent:
    """
    Agente especializado em extrair conhecimento estruturado de transcrições.
    
    Responsabilidades:
    1. Extrair tarefas, decisões, riscos, insights
    2. Gerar resumo executivo
    3. Identificar tópicos principais
    """
    
    def __init__(self, llm_client=None):
        self.llm_client = llm_client
        
    async def extract(
        self, 
        transcript: str,
        meeting_context: Optional[Dict[str, Any]] = None
    ) -> ExtractionResult:
        """
        Extrai entidades estruturadas da transcrição.
        
        Este método é um wrapper para o serviço LLM do backend Node.js.
        Em produção, chamará a API /meetings/extract.
        
        Args:
            transcript: Texto completo da transcrição
            meeting_context: Contexto adicional (título, projeto, participantes)
            
        Returns:
            ExtractionResult com itens extraídos
        """
        # Placeholder - em produção, chama o serviço LLM
        # A lógica principal está em backend/src/services/llm-extraction.service.ts
        
        return ExtractionResult(
            items=[],
            summary="",
            key_topics=[],
            processing_time_ms=0
        )
