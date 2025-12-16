"""
MongoDB client wrapper for long-term memory
"""
import logging
from typing import Any, Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from src.config import settings

logger = logging.getLogger(__name__)


class MongoDBClient:
    """MongoDB client for long-term memory storage"""
    
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Optional[AsyncIOMotorDatabase] = None
    
    async def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = AsyncIOMotorClient(settings.mongodb_uri)
            self.db = self.client[settings.mongodb_database]
            # Verify connection
            await self.client.admin.command('ping')
            logger.info("✅ Connected to MongoDB")
        except Exception as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            raise
    
    async def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")
    
    async def insert_one(self, collection: str, document: Dict[str, Any]) -> str:
        """Insert a document"""
        if not self.db:
            raise RuntimeError("MongoDB not initialized")
        
        result = await self.db[collection].insert_one(document)
        return str(result.inserted_id)
    
    async def find_one(
        self,
        collection: str,
        filter: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Find one document"""
        if not self.db:
            raise RuntimeError("MongoDB not initialized")
        
        return await self.db[collection].find_one(filter)
    
    async def find_many(
        self,
        collection: str,
        filter: Dict[str, Any],
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Find multiple documents"""
        if not self.db:
            raise RuntimeError("MongoDB not initialized")
        
        cursor = self.db[collection].find(filter).limit(limit)
        return await cursor.to_list(length=limit)
    
    async def update_one(
        self,
        collection: str,
        filter: Dict[str, Any],
        update: Dict[str, Any]
    ) -> int:
        """Update one document"""
        if not self.db:
            raise RuntimeError("MongoDB not initialized")
        
        result = await self.db[collection].update_one(filter, {"$set": update})
        return result.modified_count


# Global instance
mongodb_client = MongoDBClient()
