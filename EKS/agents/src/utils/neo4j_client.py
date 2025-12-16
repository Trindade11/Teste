"""
Neo4j client wrapper
"""
import logging
from typing import Any, Dict, List, Optional
from neo4j import AsyncGraphDatabase, AsyncDriver

from src.config import settings

logger = logging.getLogger(__name__)


class Neo4jClient:
    """Neo4j database client"""
    
    def __init__(self):
        self.driver: Optional[AsyncDriver] = None
    
    async def connect(self):
        """Connect to Neo4j"""
        try:
            self.driver = AsyncGraphDatabase.driver(
                settings.neo4j_uri,
                auth=(settings.neo4j_user, settings.neo4j_password)
            )
            # Verify connection
            await self.driver.verify_connectivity()
            logger.info("✅ Connected to Neo4j")
        except Exception as e:
            logger.error(f"❌ Failed to connect to Neo4j: {e}")
            raise
    
    async def close(self):
        """Close Neo4j connection"""
        if self.driver:
            await self.driver.close()
            logger.info("Neo4j connection closed")
    
    async def execute_query(
        self,
        query: str,
        parameters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Execute a Cypher query"""
        if not self.driver:
            raise RuntimeError("Neo4j driver not initialized")
        
        async with self.driver.session() as session:
            result = await session.run(query, parameters or {})
            records = await result.data()
            return records
    
    async def execute_write(
        self,
        query: str,
        parameters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Execute a write query"""
        if not self.driver:
            raise RuntimeError("Neo4j driver not initialized")
        
        async with self.driver.session() as session:
            result = await session.run(query, parameters or {})
            records = await result.data()
            await session.close()
            return records


# Global instance
neo4j_client = Neo4jClient()
