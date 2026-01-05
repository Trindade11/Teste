"""
EKS Agents - FastAPI Server
Main entry point for the agent orchestration system
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.utils.neo4j_client import Neo4jClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown"""
    # Startup
    logger.info("Starting EKS Agents server...")
    
    # Initialize connections
    neo4j_client = Neo4jClient()
    await neo4j_client.connect()
    
    logger.info("✅ All connections initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down EKS Agents server...")
    await neo4j_client.close()
    logger.info("✅ Shutdown complete")


app = FastAPI(
    title="EKS Agents API",
    description="Multi-Agent Orchestration System for Enterprise Knowledge",
    version="0.1.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "eks-agents",
        "version": "0.1.0"
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "EKS Agents API",
        "docs": "/docs",
        "health": "/health"
    }


# TODO: Import and register routers
# from src.router.agent_router import router as agent_router
# app.include_router(agent_router, prefix="/agents", tags=["agents"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
