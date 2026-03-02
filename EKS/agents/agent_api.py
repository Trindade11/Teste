"""
FastAPI server for Pydantic AI agents
Exposes agent endpoints for backend to call
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn

from pla_agent import classify_intent, detect_cdc_level
from knowledge_agent import query_knowledge
from document_agent import generate_document

app = FastAPI(title="EKS Agents API", version="1.0.0")

# CORS for backend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class IntentRequest(BaseModel):
    message: str
    user_id: str
    conversation_id: str
    history: Optional[List[Dict[str, str]]] = None

class CDCRequest(BaseModel):
    message: str
    conversation_id: str
    intent_type: str
    history: Optional[List[Dict[str, str]]] = None

class KnowledgeRequest(BaseModel):
    query: str
    user_id: str
    context_pack: Optional[dict] = None

class DocumentRequest(BaseModel):
    document_type: str
    title: str
    requirements: str
    context: Optional[dict] = None

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "EKS Agents API"}

# PLA endpoints
@app.post("/agents/pla/classify")
async def classify_user_intent(request: IntentRequest):
    """Classify user intent using PLA agent"""
    try:
        intent = await classify_intent(
            request.message,
            request.user_id,
            request.conversation_id
        )
        return {
            "success": True,
            "data": intent.model_dump()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agents/cdc/detect")
async def detect_depth_level(request: CDCRequest):
    """Detect CDC depth level"""
    try:
        cdc = await detect_cdc_level(
            request.message,
            request.conversation_id,
            request.intent_type,
            request.history or []
        )
        return {
            "success": True,
            "data": cdc.model_dump()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Knowledge agent
@app.post("/agents/knowledge/query")
async def query_knowledge_graph(request: KnowledgeRequest):
    """Query knowledge graph"""
    try:
        response = await query_knowledge(
            request.query,
            request.user_id,
            request.context_pack
        )
        return {
            "success": True,
            "response": response.answer,
            "confidence": response.confidence,
            "sources": [s.model_dump() for s in response.sources],
            "metadata": {"reasoning": response.reasoning}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Document agent
@app.post("/agents/document/generate")
async def generate_doc(request: DocumentRequest):
    """Generate a document"""
    try:
        document = await generate_document(
            request.document_type,
            request.title,
            request.requirements,
            request.context
        )
        return {
            "success": True,
            "data": document.model_dump()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Task agent placeholder
@app.post("/agents/task/generate")
async def generate_task(request: dict):
    """Generate tasks (placeholder)"""
    return {
        "success": True,
        "response": "Task generation not yet implemented",
        "confidence": 0.5
    }

if __name__ == "__main__":
    print("🚀 Starting EKS Agents API on http://localhost:8001")
    print("📚 Docs available at http://localhost:8001/docs")
    uvicorn.run(app, host="0.0.0.0", port=8001)
