"""
Chat Router - API endpoints for chat with Personal Agent
Compatible with existing frontend services/api.ts
"""
import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.agents.personal_agent import personal_agent, load_user_context, UserContext

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])


class ChatMessage(BaseModel):
    """A single chat message"""
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    """Request body for chat endpoint"""
    user_id: str = Field(..., description="User ID from authentication")
    message: str = Field(..., description="User's message")
    conversation_history: Optional[List[ChatMessage]] = Field(
        default=None,
        description="Previous messages in the conversation"
    )


class ChatResponse(BaseModel):
    """Response from chat endpoint"""
    success: bool
    message: str = Field(..., description="Agent's response message")
    user_name: Optional[str] = Field(None, description="User's name for personalization")


class WelcomeRequest(BaseModel):
    """Request body for welcome message endpoint"""
    user_id: str = Field(..., description="User ID from authentication")


class WelcomeResponse(BaseModel):
    """Response from welcome message endpoint"""
    success: bool
    message: str = Field(..., description="Personalized welcome message")
    user_name: str = Field(..., description="User's name")
    agent_name: str = Field(default="Agente Pessoal", description="Agent's name")


@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest) -> ChatResponse:
    """
    Send a message to the Personal Agent and get a response
    """
    try:
        # Load user context from Neo4j
        user_context = await load_user_context(request.user_id)
        
        if not user_context:
            raise HTTPException(
                status_code=404,
                detail=f"User not found: {request.user_id}"
            )
        
        # Convert history to dict format
        history = None
        if request.conversation_history:
            history = [{"role": m.role, "content": m.content} for m in request.conversation_history]
        
        # Get agent response
        response = await personal_agent.chat(
            user_context=user_context,
            message=request.message,
            conversation_history=history
        )
        
        return ChatResponse(
            success=True,
            message=response,
            user_name=user_context.name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing message: {str(e)}"
        )


@router.post("/welcome", response_model=WelcomeResponse)
async def get_welcome_message(request: WelcomeRequest) -> WelcomeResponse:
    """
    Get a personalized welcome message for the user after onboarding
    """
    try:
        # Load user context from Neo4j
        user_context = await load_user_context(request.user_id)
        
        if not user_context:
            raise HTTPException(
                status_code=404,
                detail=f"User not found: {request.user_id}"
            )
        
        # Get personalized welcome message
        welcome_message = await personal_agent.get_welcome_message(user_context)
        
        return WelcomeResponse(
            success=True,
            message=welcome_message,
            user_name=user_context.name,
            agent_name="Agente Pessoal"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in welcome endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating welcome message: {str(e)}"
        )


@router.get("/health")
async def chat_health():
    """Health check for chat service"""
    return {"status": "healthy", "service": "chat"}


# ===== Frontend Compatible Endpoint (services/api.ts) =====

class FrontendChatRequest(BaseModel):
    """Request compatible with frontend services/api.ts"""
    message: str
    session_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class FrontendChatResponse(BaseModel):
    """Response compatible with frontend services/api.ts"""
    response: str
    session_id: Optional[str] = None


class FrontendWelcomeRequest(BaseModel):
    """Welcome request compatible with frontend services/api.ts"""
    user_id: str
    session_id: Optional[str] = None


# Store session contexts (in production, use Redis or similar)
session_contexts: Dict[str, UserContext] = {}


@router.post("/api/chat", response_model=FrontendChatResponse)
async def frontend_chat(request: FrontendChatRequest) -> FrontendChatResponse:
    """
    Chat endpoint compatible with existing frontend services/api.ts
    Used by ChatbotPanel via use-chat.ts hook
    """
    try:
        session_id = request.session_id or f"session-{id(request)}"
        
        # Try to get user_id from context
        user_id = None
        if request.context:
            user_id = request.context.get("user_id")
            mentions = request.context.get("mentions", [])
        
        # Load or create user context
        user_context = None
        if user_id:
            user_context = await load_user_context(user_id)
            if user_context:
                session_contexts[session_id] = user_context
        elif session_id in session_contexts:
            user_context = session_contexts[session_id]
        
        # If no user context, create a default one
        if not user_context:
            user_context = UserContext(
                user_id="anonymous",
                name="Usuário",
                email="",
                company="",
            )
        
        # Get agent response
        response_text = await personal_agent.chat(
            user_context=user_context,
            message=request.message,
            conversation_history=None
        )
        
        return FrontendChatResponse(
            response=response_text,
            session_id=session_id
        )
        
    except Exception as e:
        logger.error(f"Error in frontend chat endpoint: {e}")
        return FrontendChatResponse(
            response=f"Desculpe, ocorreu um erro ao processar sua mensagem: {str(e)}",
            session_id=request.session_id
        )


@router.post("/api/chat/welcome", response_model=FrontendChatResponse)
async def frontend_chat_welcome(request: FrontendWelcomeRequest) -> FrontendChatResponse:
    """Welcome endpoint compatible with frontend services/api.ts"""
    try:
        session_id = request.session_id or f"session-{id(request)}"

        user_context = await load_user_context(request.user_id)
        if not user_context:
            raise HTTPException(status_code=404, detail=f"User not found: {request.user_id}")

        session_contexts[session_id] = user_context

        welcome_text = await personal_agent.get_welcome_message(user_context)
        return FrontendChatResponse(response=welcome_text, session_id=session_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in frontend welcome endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating welcome message: {str(e)}")
