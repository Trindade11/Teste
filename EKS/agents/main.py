"""
FastAPI Server for Intelligent Chunking Agent
Provides REST API for Pydantic AI-based document chunking
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import asyncio
from intelligent_chunker_agent import chunk_document_intelligently, ChunkingResponse

app = FastAPI(title="Intelligent Chunking Agent", version="1.0.0")

class ChunkingRequest(BaseModel):
    title: str
    doc_type: str
    content: str
    author: Optional[str] = None

@app.post("/chunk-document")
async def chunk_document(request: ChunkingRequest) -> ChunkingResponse:
    """
    Chunk a document using intelligent LLM-based analysis
    
    Args:
        request: Document information and content
    
    Returns:
        ChunkingResponse with structured chunks and metadata
    """
    try:
        result = await chunk_document_intelligently(
            title=request.title,
            doc_type=request.doc_type,
            content=request.content,
            author=request.author
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "intelligent-chunker"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
