"""
Entity Matching Agent - Vinculação inteligente de termos extraídos ao grafo Neo4j
Usa similaridade lexical (fuzzy matching) e thesaurus para encontrar correspondências

Este agente é responsável por:
1. Receber termos/entidades extraídos pelo LLM
2. Buscar correspondências no Neo4j usando múltiplas estratégias
3. Retornar sugestões de vinculação com scores de confiança
"""

from typing import Optional, List, Dict, Any, Tuple
from pydantic import BaseModel, Field
from dataclasses import dataclass
import unicodedata
import re


class GraphNode(BaseModel):
    """Node existente no grafo Neo4j"""
    id: str
    label: str
    name: str
    canonical_name: Optional[str] = None
    aliases: List[str] = Field(default_factory=list)
    context: Optional[str] = None


class MatchCandidate(BaseModel):
    """Candidato de match encontrado"""
    node: GraphNode
    score: float = Field(ge=0, le=1, description="Score de similaridade 0-1")
    match_type: str = Field(description="exact, alias, fuzzy, partial")
    matched_term: str = Field(description="Termo que deu match")


class MatchResult(BaseModel):
    """Resultado do matching para uma entidade"""
    input_term: str
    found: bool
    candidates: List[MatchCandidate] = Field(default_factory=list)
    best_match: Optional[MatchCandidate] = None
    suggested_action: str = Field(description="link, create, review")


class EntityMatchingAgent:
    """
    Agente especializado em vincular termos extraídos ao grafo Neo4j.
    
    Estratégias de matching (em ordem de prioridade):
    1. Match exato no nome canônico
    2. Match exato em aliases (thesaurus)
    3. Match fuzzy usando distância de Levenshtein
    4. Match parcial (contém)
    
    Configurações:
    - fuzzy_threshold: Score mínimo para considerar match fuzzy (default: 0.7)
    - partial_threshold: Score mínimo para match parcial (default: 0.6)
    """
    
    def __init__(
        self, 
        neo4j_driver=None,
        fuzzy_threshold: float = 0.7,
        partial_threshold: float = 0.6
    ):
        self.neo4j_driver = neo4j_driver
        self.fuzzy_threshold = fuzzy_threshold
        self.partial_threshold = partial_threshold
        self.graph_nodes: List[GraphNode] = []
        self._loaded = False
        
    def normalize(self, text: str) -> str:
        """Normaliza texto para comparação (lowercase, sem acentos, sem pontuação)"""
        if not text:
            return ""
        # Lowercase
        text = text.lower().strip()
        # Remove acentos
        text = unicodedata.normalize('NFD', text)
        text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
        # Remove pontuação e espaços extras
        text = re.sub(r'[^\w\s]', '', text)
        text = re.sub(r'\s+', ' ', text)
        return text
    
    def levenshtein_distance(self, s1: str, s2: str) -> int:
        """Calcula distância de Levenshtein entre duas strings"""
        if len(s1) < len(s2):
            return self.levenshtein_distance(s2, s1)
        if len(s2) == 0:
            return len(s1)
        
        previous_row = range(len(s2) + 1)
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (c1 != c2)
                current_row.append(min(insertions, deletions, substitutions))
            previous_row = current_row
        
        return previous_row[-1]
    
    def fuzzy_score(self, term1: str, term2: str) -> float:
        """Calcula score de similaridade fuzzy (0-1)"""
        n1, n2 = self.normalize(term1), self.normalize(term2)
        if not n1 or not n2:
            return 0.0
        if n1 == n2:
            return 1.0
        
        distance = self.levenshtein_distance(n1, n2)
        max_len = max(len(n1), len(n2))
        return 1 - (distance / max_len)
    
    def partial_match_score(self, term: str, target: str) -> float:
        """Score para match parcial (um contém o outro)"""
        n_term = self.normalize(term)
        n_target = self.normalize(target)
        
        if not n_term or not n_target:
            return 0.0
        if n_term == n_target:
            return 1.0
        if n_term in n_target:
            return len(n_term) / len(n_target)
        if n_target in n_term:
            return len(n_target) / len(n_term)
        return 0.0
    
    async def load_graph_nodes(self, labels: List[str] = None) -> List[GraphNode]:
        """
        Carrega nodes do Neo4j para cache local.
        
        Args:
            labels: Lista de labels a carregar (default: Organization, Tool, Concept, Product, Person)
        """
        if not self.neo4j_driver:
            return []
        
        if labels is None:
            labels = ['Organization', 'Tool', 'Concept', 'Product', 'Person', 'ExternalParticipant']
        
        label_filter = ' OR '.join([f'n:{label}' for label in labels])
        
        query = f"""
        MATCH (n)
        WHERE {label_filter}
        RETURN 
            elementId(n) as id,
            labels(n)[0] as label,
            COALESCE(n.name, '') as name,
            COALESCE(n.canonicalName, n.name, '') as canonical_name,
            COALESCE(n.aliases, []) as aliases,
            COALESCE(n.context, n.description, '') as context
        LIMIT 1000
        """
        
        async with self.neo4j_driver.session() as session:
            result = await session.run(query)
            records = await result.data()
        
        self.graph_nodes = [
            GraphNode(
                id=r['id'],
                label=r['label'],
                name=r['name'],
                canonical_name=r['canonical_name'],
                aliases=r['aliases'] if isinstance(r['aliases'], list) else [],
                context=r['context']
            )
            for r in records
            if r['name']  # Ignora nodes sem nome
        ]
        
        self._loaded = True
        return self.graph_nodes
    
    def find_matches(self, term: str) -> List[MatchCandidate]:
        """
        Busca matches para um termo no cache de nodes.
        
        Retorna lista ordenada por score (melhor primeiro).
        """
        if not term:
            return []
        
        candidates: List[MatchCandidate] = []
        n_term = self.normalize(term)
        
        for node in self.graph_nodes:
            best_score = 0.0
            best_type = ""
            matched_term = ""
            
            # 1. Match exato no nome canônico
            if self.normalize(node.canonical_name or node.name) == n_term:
                best_score = 1.0
                best_type = "exact"
                matched_term = node.canonical_name or node.name
            
            # 2. Match exato em aliases
            if best_score < 1.0:
                for alias in node.aliases:
                    if self.normalize(alias) == n_term:
                        best_score = 0.95
                        best_type = "alias"
                        matched_term = alias
                        break
            
            # 3. Match fuzzy no nome
            if best_score < 0.9:
                fuzzy = self.fuzzy_score(term, node.canonical_name or node.name)
                if fuzzy >= self.fuzzy_threshold and fuzzy > best_score:
                    best_score = fuzzy
                    best_type = "fuzzy"
                    matched_term = node.canonical_name or node.name
            
            # 4. Match fuzzy em aliases
            if best_score < 0.9:
                for alias in node.aliases:
                    fuzzy = self.fuzzy_score(term, alias)
                    if fuzzy >= self.fuzzy_threshold and fuzzy > best_score:
                        best_score = fuzzy
                        best_type = "fuzzy_alias"
                        matched_term = alias
            
            # 5. Match parcial
            if best_score < self.fuzzy_threshold:
                partial = self.partial_match_score(term, node.canonical_name or node.name)
                if partial >= self.partial_threshold and partial > best_score:
                    best_score = partial
                    best_type = "partial"
                    matched_term = node.canonical_name or node.name
            
            if best_score >= self.partial_threshold:
                candidates.append(MatchCandidate(
                    node=node,
                    score=best_score,
                    match_type=best_type,
                    matched_term=matched_term
                ))
        
        # Ordena por score decrescente
        candidates.sort(key=lambda c: c.score, reverse=True)
        return candidates[:5]  # Top 5
    
    async def match_entity(self, term: str) -> MatchResult:
        """
        Processa um termo e retorna resultado do matching.
        
        Args:
            term: Termo/entidade a buscar no grafo
            
        Returns:
            MatchResult com candidatos e sugestão de ação
        """
        # Carrega nodes se ainda não carregou
        if not self._loaded and self.neo4j_driver:
            await self.load_graph_nodes()
        
        candidates = self.find_matches(term)
        
        if not candidates:
            return MatchResult(
                input_term=term,
                found=False,
                candidates=[],
                best_match=None,
                suggested_action="create"  # Sugerir criação de novo node
            )
        
        best = candidates[0]
        
        # Determinar ação sugerida baseado no score
        if best.score >= 0.9:
            action = "link"  # Alta confiança - pode linkar automaticamente
        elif best.score >= 0.7:
            action = "review"  # Média confiança - curador deve validar
        else:
            action = "create"  # Baixa confiança - provavelmente é novo
        
        return MatchResult(
            input_term=term,
            found=True,
            candidates=candidates,
            best_match=best,
            suggested_action=action
        )
    
    async def match_entities(self, terms: List[str]) -> List[MatchResult]:
        """Processa múltiplos termos em batch"""
        if not self._loaded and self.neo4j_driver:
            await self.load_graph_nodes()
        
        results = []
        for term in terms:
            result = await self.match_entity(term)
            results.append(result)
        
        return results


# Exemplo de uso
if __name__ == "__main__":
    import asyncio
    
    async def test():
        agent = EntityMatchingAgent()
        
        # Simula alguns nodes do grafo
        agent.graph_nodes = [
            GraphNode(
                id="1", 
                label="Organization", 
                name="CoCreateAI",
                canonical_name="CoCreateAI",
                aliases=["CoCreate", "Co-Create AI", "CVC"]
            ),
            GraphNode(
                id="2",
                label="Organization",
                name="Montreal Ventures",
                aliases=["Montreal", "MV"]
            ),
            GraphNode(
                id="3",
                label="Tool",
                name="Notion",
                aliases=[]
            )
        ]
        agent._loaded = True
        
        # Testa matching
        test_terms = ["cocreate", "CoCreate AI", "co create", "montreal", "notion", "slack"]
        
        for term in test_terms:
            result = await agent.match_entity(term)
            print(f"\n'{term}': found={result.found}, action={result.suggested_action}")
            if result.best_match:
                print(f"  -> {result.best_match.node.name} ({result.best_match.match_type}: {result.best_match.score:.2f})")
    
    asyncio.run(test())
