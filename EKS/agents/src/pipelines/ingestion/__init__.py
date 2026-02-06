# Ingestion Pipeline
# Pipeline de ingestão de dados para o EKS

from .ner_agent import NERAgent
from .extraction_agent import ExtractionAgent
from .linking_agent import LinkingAgent
from .entity_matching_agent import EntityMatchingAgent

__all__ = ['NERAgent', 'ExtractionAgent', 'LinkingAgent', 'EntityMatchingAgent']
