"""
Personal Agent - First agent the user interacts with after onboarding
Uses Pydantic AI framework with Azure OpenAI
"""
import os
import logging
from dataclasses import dataclass
from typing import Optional, List
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.azure import AzureProvider
from openai import AsyncAzureOpenAI

from src.config import settings
from src.utils.neo4j_client import neo4j_client

logger = logging.getLogger(__name__)

# Set environment variables for pydantic-ai Azure provider
os.environ["AZURE_OPENAI_ENDPOINT"] = settings.azure_openai_endpoint
os.environ["AZURE_OPENAI_API_KEY"] = settings.azure_openai_api_key
os.environ["OPENAI_API_VERSION"] = settings.azure_openai_api_version


@dataclass
class UserContext:
    """Context data about the user for personalizing agent responses"""
    user_id: str
    name: str
    email: str
    company: str
    department: Optional[str] = None
    job_title: Optional[str] = None
    role_description: Optional[str] = None
    profile_description: Optional[str] = None
    competencies: Optional[List[str]] = None
    primary_objective: Optional[str] = None
    top_challenges: Optional[str] = None


async def load_user_context(user_id: str) -> Optional[UserContext]:
    """Load user context from Neo4j graph database"""
    query = """
    MATCH (u:User {id: $userId})
    OPTIONAL MATCH (u)-[:HAS_ONBOARDING_RESPONSE]->(o:OnboardingResponse)
    OPTIONAL MATCH (u)-[:MEMBER_OF]->(d:Department)
    RETURN
        u.id AS userId,
        u.name AS name,
        u.email AS email,
        u.company AS company,
        u.jobTitle AS jobTitle,
        d.name AS department,
        o.roleDescription AS roleDescription,
        o.profileDescription AS profileDescription,
        o.competencies AS competencies,
        o.primaryObjective AS primaryObjective,
        o.topChallenges AS topChallenges
    """
    
    try:
        records = await neo4j_client.execute_query(query, {"userId": user_id})
        
        if not records:
            logger.warning(f"User not found: {user_id}")
            return None
        
        record = records[0]
        
        return UserContext(
            user_id=record.get("userId", user_id),
            name=record.get("name", "Usuário"),
            email=record.get("email", ""),
            company=record.get("company", ""),
            department=record.get("department"),
            job_title=record.get("jobTitle"),
            role_description=record.get("roleDescription"),
            profile_description=record.get("profileDescription"),
            competencies=record.get("competencies"),
            primary_objective=record.get("primaryObjective"),
            top_challenges=record.get("topChallenges"),
        )
    except Exception as e:
        logger.error(f"Error loading user context: {e}")
        return None


class PersonalAgent:
    """
    Personal AI Agent - First point of contact for users
    Personalized based on user profile from Neo4j
    """
    
    def __init__(self):
        # Initialize Azure OpenAI client
        self.azure_client = AsyncAzureOpenAI(
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
            azure_endpoint=settings.azure_openai_endpoint,
        )
        
        # Create pydantic-ai agent with Azure OpenAI
        self.agent = Agent(
            f"azure:{settings.azure_openai_deployment_name}",
            deps_type=UserContext,
        )
        
        # Register system prompt generator
        @self.agent.system_prompt
        def get_system_prompt(ctx: RunContext[UserContext]) -> str:
            user = ctx.deps
            
            # Build personalized system prompt
            prompt_parts = [
                "Você é um assistente pessoal de IA chamado 'Agente Pessoal' do sistema EKS (Enterprise Knowledge System).",
                "",
                "## Seu Papel",
                "- Você é o primeiro ponto de contato do usuário com o sistema",
                "- Sua função é ajudar o usuário a explorar e utilizar o sistema de forma personalizada",
                "- Você conhece o perfil, competências e objetivos do usuário",
                "",
                "## Sobre o Usuário",
                f"- Nome: {user.name}",
                f"- Empresa: {user.company}",
            ]
            
            if user.department:
                prompt_parts.append(f"- Área: {user.department}")
            
            if user.job_title:
                prompt_parts.append(f"- Função: {user.job_title}")
            
            if user.profile_description:
                prompt_parts.append(f"- Perfil: {user.profile_description}")
            
            if user.competencies:
                competencies_str = ", ".join(user.competencies)
                prompt_parts.append(f"- Competências: {competencies_str}")
            
            if user.primary_objective:
                prompt_parts.append(f"- Objetivo Principal: {user.primary_objective}")
            
            if user.top_challenges:
                prompt_parts.append(f"- Principais Desafios: {user.top_challenges}")
            
            prompt_parts.extend([
                "",
                "## Diretrizes",
                "- Seja cordial e use o nome do usuário quando apropriado",
                "- Responda em português do Brasil",
                "- Seja conciso mas completo nas respostas",
                "- Ofereça sugestões proativas baseadas no perfil do usuário",
                "- Se o usuário perguntar algo fora do seu conhecimento, indique que pode ajudar a buscar informações",
                "",
                "## Primeira Interação",
                "Se esta for a primeira mensagem do usuário, dê as boas-vindas de forma personalizada,",
                "mencione que você conhece o perfil dele e está pronto para ajudar com seus objetivos.",
            ])
            
            return "\n".join(prompt_parts)
    
    async def chat(
        self,
        user_context: UserContext,
        message: str,
        conversation_history: Optional[List[dict]] = None
    ) -> str:
        """
        Process a chat message and return the agent's response
        
        Args:
            user_context: User context data from Neo4j
            message: The user's message
            conversation_history: Previous messages in the conversation
            
        Returns:
            The agent's response text
        """
        try:
            # Build message with history context if available
            full_message = message
            if conversation_history:
                history_text = "\n".join([
                    f"{'Usuário' if m['role'] == 'user' else 'Assistente'}: {m['content']}"
                    for m in conversation_history[-5:]  # Last 5 messages for context
                ])
                full_message = f"Histórico recente:\n{history_text}\n\nMensagem atual: {message}"
            
            # Run the agent
            result = await self.agent.run(
                full_message,
                deps=user_context,
            )
            
            return result.output
            
        except Exception as e:
            logger.error(f"Error in chat: {e}")
            return f"Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente."
    
    async def get_welcome_message(self, user_context: UserContext) -> str:
        """
        Generate a personalized welcome message for the user
        
        Args:
            user_context: User context data from Neo4j
            
        Returns:
            Personalized welcome message
        """
        welcome_prompt = (
            "O usuário acabou de completar o onboarding e está acessando o sistema pela primeira vez. "
            "Dê uma mensagem de boas-vindas personalizada, mencionando que você conhece o perfil dele "
            "e está pronto para ajudar. Seja breve (2-3 parágrafos) e termine com uma pergunta "
            "sobre como pode ajudá-lo hoje."
        )
        
        return await self.chat(user_context, welcome_prompt)


# Global instance
personal_agent = PersonalAgent()
