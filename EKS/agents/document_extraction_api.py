"""
Document Extraction API
FastAPI endpoints for specialized document extraction agents
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from document_extraction_agents import (
    extract_from_document,
    ContractExtraction,
    ProposalExtraction,
    MeetingExtraction,
    ReportExtraction,
    GenericExtraction,
)
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Document Extraction API",
    description="Specialized agents for extracting structured data from documents",
    version="1.0.0"
)

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class ExtractionRequest(BaseModel):
    """Request for document extraction"""
    content: str
    context: Optional[Dict[str, Any]] = None

class ExtractionResponse(BaseModel):
    """Response from document extraction"""
    success: bool
    doc_type: str
    agent: str
    data: Optional[Any] = None
    error: Optional[str] = None

# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "document-extraction-api"}

@app.post("/extract/contract", response_model=ExtractionResponse)
async def extract_contract(request: ExtractionRequest):
    """
    Extract structured data from contract document
    
    Returns: ContractExtraction with parties, clauses, deadlines, obligations, penalties
    """
    try:
        logger.info("Processing contract extraction")
        result = await extract_from_document(
            content=request.content,
            doc_type='contract',
            context=request.context
        )
        
        return ExtractionResponse(
            success=True,
            doc_type='contract',
            agent='contract_extraction_agent',
            data=result.model_dump() if hasattr(result, 'model_dump') else result
        )
    except Exception as e:
        logger.error(f"Contract extraction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract/proposal", response_model=ExtractionResponse)
async def extract_proposal(request: ExtractionRequest):
    """
    Extract structured data from proposal document
    
    Returns: ProposalExtraction with client, project, deliverables, assumptions, risks
    """
    try:
        logger.info("Processing proposal extraction")
        result = await extract_from_document(
            content=request.content,
            doc_type='proposal',
            context=request.context
        )
        
        return ExtractionResponse(
            success=True,
            doc_type='proposal',
            agent='proposal_extraction_agent',
            data=result.model_dump() if hasattr(result, 'model_dump') else result
        )
    except Exception as e:
        logger.error(f"Proposal extraction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract/meeting", response_model=ExtractionResponse)
async def extract_meeting(request: ExtractionRequest):
    """
    Extract structured data from meeting document
    
    Returns: MeetingExtraction with participants, topics, decisions, tasks
    """
    try:
        logger.info("Processing meeting extraction")
        result = await extract_from_document(
            content=request.content,
            doc_type='meeting',
            context=request.context
        )
        
        return ExtractionResponse(
            success=True,
            doc_type='meeting',
            agent='meeting_extraction_agent',
            data=result.model_dump() if hasattr(result, 'model_dump') else result
        )
    except Exception as e:
        logger.error(f"Meeting extraction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract/report", response_model=ExtractionResponse)
async def extract_report(request: ExtractionRequest):
    """
    Extract structured data from report document
    
    Returns: ReportExtraction with metrics, insights, recommendations
    """
    try:
        logger.info("Processing report extraction")
        result = await extract_from_document(
            content=request.content,
            doc_type='report',
            context=request.context
        )
        
        return ExtractionResponse(
            success=True,
            doc_type='report',
            agent='report_extraction_agent',
            data=result.model_dump() if hasattr(result, 'model_dump') else result
        )
    except Exception as e:
        logger.error(f"Report extraction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract/generic", response_model=ExtractionResponse)
async def extract_generic(request: ExtractionRequest):
    """
    Extract basic insights and decisions from generic document
    
    Returns: GenericExtraction with summary, topics, insights, decisions
    """
    try:
        logger.info("Processing generic extraction")
        result = await extract_from_document(
            content=request.content,
            doc_type='other',
            context=request.context
        )
        
        return ExtractionResponse(
            success=True,
            doc_type='generic',
            agent='generic_extraction_agent',
            data=result.model_dump() if hasattr(result, 'model_dump') else result
        )
    except Exception as e:
        logger.error(f"Generic extraction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
