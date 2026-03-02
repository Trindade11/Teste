"""
Personal Lead Agent (PLA) - Pydantic AI Implementation
Orchestrates user interactions and routes to specialized agents
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from pydantic_ai import Agent, RunContext
import os

# Intent classification models
class UserIntent(BaseModel):
    """Classified user intent from message"""
    intent_type: Literal['question', 'task', 'document_gen', 'exploration', 'chat']
    confidence: float = Field(ge=0.0, le=1.0)
    entities: List[str] = Field(default_factory=list)
    requires_team: bool = False
    suggested_agents: List[str] = Field(default_factory=list)
    reasoning: str = ""

class CDCLevel(BaseModel):
    """Context Depth Controller level determination"""
    level: Literal['D0', 'D1', 'D2', 'D3', 'D4']
    signals: List[str]
    max_tokens: int
    sources: List[str]
    reasoning: str = ""

# PLA Agent for intent classification
pla_agent = Agent(
    'openai:gpt-4o',
    result_type=UserIntent,
    system_prompt="""You are a Personal Lead Agent (PLA) intent classifier.

Analyze user messages and classify into:
- **question**: Information or clarification request
- **task**: Create/manage tasks or projects
- **document_gen**: Generate/create documents
- **exploration**: Browse knowledge base or learn
- **chat**: General conversation

Determine:
1. Intent type with confidence (0-1)
2. Entities mentioned (projects, people, processes)
3. If requires team of agents (complex multi-step)
4. Best suited specialized agents

Be precise and concise in reasoning."""
)

# CDC Agent for depth detection
cdc_agent = Agent(
    'openai:gpt-4o',
    result_type=CDCLevel,
    system_prompt="""You are a Context Depth Controller (CDC).

Analyze conversation context and determine depth level:
- **D0**: Direct answer (500 tokens, working set only)
- **D1**: Continuity (1500 tokens, working + episodic)
- **D2**: Deep conceptual (3000 tokens, + semantic)
- **D3**: Contestation/correction (4000 tokens, + claims)
- **D4**: Topic change (2500 tokens, semantic only - reset)

Detect signals:
- D1: Continuity words ("also", "additionally", "and about")
- D2: Deep questions ("why", "how does", "explain", "compare")
- D3: Contestation ("wrong", "actually", "but", "contradicts")
- D4: Topic change ("changing subject", "now about")

Choose appropriate level and explain reasoning."""
)

@pla_agent.tool
async def get_conversation_history(ctx: RunContext[dict], conversation_id: str) -> dict:
    """Get recent conversation history for context"""
    # In production, query Neo4j for conversation history
    return {
        "conversation_id": conversation_id,
        "recent_messages": [],
        "message_count": 0
    }

@pla_agent.tool
async def get_user_profile(ctx: RunContext[dict], user_id: str) -> dict:
    """Get user profile and preferences"""
    # In production, query Neo4j for AIProfile/PKP
    return {
        "user_id": user_id,
        "preferences": {},
        "expertise_areas": [],
        "recent_topics": []
    }

@cdc_agent.tool
async def analyze_conversation_context(ctx: RunContext[dict], conversation_id: str) -> dict:
    """Analyze conversation for depth signals"""
    # In production, analyze conversation patterns in Neo4j
    return {
        "conversation_id": conversation_id,
        "message_count": 0,
        "topic_continuity": 0.0,
        "detected_signals": []
    }

async def classify_intent(message: str, user_id: str, conversation_id: str) -> UserIntent:
    """Classify user intent using PLA agent"""
    result = await pla_agent.run(
        f"""Classify this user message:
        
Message: "{message}"
User ID: {user_id}
Conversation ID: {conversation_id}

Analyze intent and provide classification.""",
        message_history=[]
    )
    return result.data

async def detect_cdc_level(
    message: str,
    conversation_id: str,
    intent_type: str,
    history: List[dict] = None
) -> CDCLevel:
    """Detect appropriate CDC depth level"""
    history_context = ""
    if history and len(history) > 0:
        history_context = f"\nRecent conversation ({len(history)} messages):\n"
        for msg in history[-3:]:
            history_context += f"- {msg.get('role', 'user')}: {msg.get('content', '')[:100]}\n"
    
    result = await cdc_agent.run(
        f"""Determine context depth level for:

Message: "{message}"
Intent Type: {intent_type}
Conversation ID: {conversation_id}{history_context}

Analyze signals and determine appropriate CDC level.""",
        message_history=[]
    )
    return result.data

if __name__ == "__main__":
    import asyncio
    
    async def test():
        # Test intent classification
        intent = await classify_intent(
            "Como funciona o processo de onboarding?",
            "user-123",
            "conv-456"
        )
        print("Intent:", intent)
        
        # Test CDC detection
        cdc = await detect_cdc_level(
            "Mas isso não está correto, na verdade...",
            "conv-456",
            "question",
            [{"role": "user", "content": "Explique o onboarding"}]
        )
        print("CDC Level:", cdc)
    
    asyncio.run(test())
