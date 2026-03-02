"""
Document Agent - Generates structured documents
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from pydantic_ai import Agent, RunContext
import os

class DocumentRequest(BaseModel):
    """Request to generate a document"""
    document_type: Literal['contract', 'proposal', 'report', 'analysis', 'manual', 'other']
    title: str
    requirements: str
    context: dict = Field(default_factory=dict)

class DocumentSection(BaseModel):
    """Section of a generated document"""
    heading: str
    content: str
    level: int = 1

class GeneratedDocument(BaseModel):
    """Generated document in Markdown format"""
    title: str
    document_type: str
    content: str  # Full Markdown content
    sections: List[DocumentSection]
    suggested_type: str  # AI's suggestion for document type
    metadata: dict = Field(default_factory=dict)

# Specialized agents for each document type
contract_agent = Agent(
    'openai:gpt-4o',
    result_type=GeneratedDocument,
    system_prompt="""You are a Contract Generation Expert.

Generate professional contracts in Markdown format with:
1. **Parties**: Clearly identify all parties
2. **Terms**: Specific obligations and rights
3. **Payment**: Clear payment structure
4. **Duration**: Start and end dates
5. **Clauses**: Standard legal clauses
6. **Signatures**: Signature block

Use clear, legal language. Include all necessary sections."""
)

proposal_agent = Agent(
    'openai:gpt-4o',
    result_type=GeneratedDocument,
    system_prompt="""You are a Business Proposal Expert.

Generate compelling proposals in Markdown format with:
1. **Executive Summary**: Key value proposition
2. **Client Needs**: Understanding of requirements
3. **Proposed Solution**: Detailed approach
4. **Deliverables**: What will be delivered
5. **Timeline**: Project schedule
6. **Pricing**: Clear cost breakdown
7. **Team**: Key team members

Be persuasive and professional."""
)

report_agent = Agent(
    'openai:gpt-4o',
    result_type=GeneratedDocument,
    system_prompt="""You are a Report Generation Expert.

Generate structured reports in Markdown format with:
1. **Executive Summary**: Key findings
2. **Methodology**: How data was gathered
3. **Findings**: Detailed results
4. **Analysis**: Interpretation
5. **Recommendations**: Action items
6. **Metrics/KPIs**: Quantitative data

Use data-driven language with clear visualizations."""
)

generic_agent = Agent(
    'openai:gpt-4o',
    result_type=GeneratedDocument,
    system_prompt="""You are a Document Generation Expert.

Generate well-structured documents in Markdown format.
Adapt style based on document type and requirements.
Include appropriate sections and professional formatting."""
)

async def generate_document(
    document_type: str,
    title: str,
    requirements: str,
    context: dict = None
) -> GeneratedDocument:
    """Generate a document using appropriate specialized agent"""
    
    # Select agent based on type
    agent_map = {
        'contract': contract_agent,
        'proposal': proposal_agent,
        'report': report_agent,
    }
    agent = agent_map.get(document_type, generic_agent)
    
    context_text = ""
    if context:
        context_text = f"\nContext:\n"
        for key, value in context.items():
            context_text += f"- {key}: {value}\n"
    
    result = await agent.run(
        f"""Generate a {document_type} document:

Title: "{title}"
Requirements: {requirements}{context_text}

Create a complete, professional document in Markdown format.""",
        message_history=[]
    )
    
    return result.data

@contract_agent.tool
async def get_contract_templates(ctx: RunContext[dict], contract_type: str) -> dict:
    """Get standard contract templates"""
    # In production: fetch from knowledge base
    return {"template": "Standard contract template"}

@proposal_agent.tool
async def get_project_data(ctx: RunContext[dict], project_id: str) -> dict:
    """Get project data for proposal"""
    # In production: query Neo4j for project details
    return {"project": {}}

@report_agent.tool
async def get_metrics_data(ctx: RunContext[dict], metric_type: str) -> dict:
    """Get metrics and KPIs for report"""
    # In production: query Neo4j for metrics
    return {"metrics": []}

if __name__ == "__main__":
    import asyncio
    
    async def test():
        doc = await generate_document(
            document_type='proposal',
            title='Proposta Projeto EKS',
            requirements='Criar proposta comercial para plataforma de gestão de conhecimento',
            context={'client': 'Move Studio', 'value': 'R$ 150.000'}
        )
        print("Title:", doc.title)
        print("Type:", doc.document_type)
        print("\nContent:")
        print(doc.content[:500])
    
    asyncio.run(test())
