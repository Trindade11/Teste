"""
Specialized Document Extraction Agents
Pydantic AI agents for extracting structured data from different document types
"""

from pydantic import BaseModel, Field
from pydantic_ai import Agent
from typing import List, Optional, Literal
from datetime import datetime
import os

# ============================================================================
# SCHEMAS FOR RICH EXTRACTION
# ============================================================================

class ContractParty(BaseModel):
    """Party involved in contract"""
    name: str
    role: Literal['contractor', 'client', 'guarantor', 'witness', 'other']
    identifier: Optional[str] = None  # CNPJ, CPF, registration number
    contact: Optional[str] = None

class ContractValue(BaseModel):
    """Financial terms"""
    amount: float
    currency: str = 'BRL'
    payment_schedule: Optional[str] = None
    conditions: Optional[str] = None

class ContractClause(BaseModel):
    """Contract clause"""
    clause_id: str  # e.g., "3.1", "5.2"
    clause_type: Literal['payment', 'termination', 'warranty', 'liability', 'renewal', 'confidentiality', 'other']
    summary: str
    full_text: Optional[str] = None

class ContractDeadline(BaseModel):
    """Important date/deadline"""
    deadline_type: Literal['delivery', 'payment', 'renewal', 'expiration', 'termination_notice', 'other']
    date: Optional[str] = None  # ISO date string
    description: str

class ContractObligation(BaseModel):
    """Party obligation"""
    party: str
    obligation: str
    deadline: Optional[str] = None

class ContractPenalty(BaseModel):
    """Penalty or fine clause"""
    trigger: str
    penalty: str
    amount: Optional[float] = None

class ContractExtraction(BaseModel):
    """Complete contract extraction"""
    parties: List[ContractParty]
    value: Optional[ContractValue] = None
    clauses: List[ContractClause]
    deadlines: List[ContractDeadline]
    obligations: List[ContractObligation]
    penalties: List[ContractPenalty]
    summary: str
    key_risks: List[str]
    confidence: float = Field(ge=0.0, le=1.0)


class ProposalDeliverable(BaseModel):
    """Deliverable/milestone"""
    title: str
    description: str
    deadline: Optional[str] = None
    value: Optional[float] = None

class ProposalAssumption(BaseModel):
    """Project assumption or dependency"""
    category: Literal['technical', 'business', 'timeline', 'resource', 'other']
    description: str

class ProposalExtraction(BaseModel):
    """Complete proposal extraction"""
    client_name: str
    project_name: str
    total_value: Optional[float] = None
    currency: str = 'BRL'
    timeline: Optional[str] = None
    deliverables: List[ProposalDeliverable]
    scope_summary: str
    assumptions: List[ProposalAssumption]
    exclusions: List[str] = []
    team_size: Optional[int] = None
    technologies: List[str] = []
    risks: List[str] = []
    confidence: float = Field(ge=0.0, le=1.0)


class MeetingParticipant(BaseModel):
    """Meeting participant"""
    name: str
    role: Optional[str] = None
    organization: Optional[str] = None

class MeetingTopic(BaseModel):
    """Discussion topic"""
    title: str
    summary: str
    decisions: List[str] = []

class MeetingExtraction(BaseModel):
    """Complete meeting extraction"""
    meeting_title: str
    meeting_date: Optional[str] = None
    participants: List[MeetingParticipant]
    topics: List[MeetingTopic]
    decisions: List[str]
    tasks: List[str]
    next_steps: List[str]
    next_meeting: Optional[str] = None
    confidence: float = Field(ge=0.0, le=1.0)


class ReportMetric(BaseModel):
    """Performance metric or KPI"""
    name: str
    value: str
    unit: Optional[str] = None
    trend: Optional[Literal['up', 'down', 'stable']] = None
    target: Optional[str] = None

class ReportInsight(BaseModel):
    """Key insight or finding"""
    category: Literal['performance', 'risk', 'opportunity', 'trend', 'issue', 'other']
    summary: str
    impact: Literal['high', 'medium', 'low']
    supporting_data: Optional[str] = None

class ReportRecommendation(BaseModel):
    """Action recommendation"""
    priority: Literal['high', 'medium', 'low']
    action: str
    rationale: str
    owner: Optional[str] = None

class ReportExtraction(BaseModel):
    """Complete report extraction"""
    report_title: str
    report_period: Optional[str] = None
    executive_summary: str
    metrics: List[ReportMetric]
    insights: List[ReportInsight]
    recommendations: List[ReportRecommendation]
    risks: List[str] = []
    next_actions: List[str] = []
    confidence: float = Field(ge=0.0, le=1.0)


# ============================================================================
# GENERIC SCHEMA (for analysis/other)
# ============================================================================

class GenericInsight(BaseModel):
    """Generic insight"""
    summary: str
    confidence: Literal['high', 'medium', 'low']
    category: Optional[str] = None

class GenericDecision(BaseModel):
    """Generic decision"""
    summary: str
    context: str
    impact: Optional[str] = None

class GenericExtraction(BaseModel):
    """Generic light extraction"""
    summary: str
    key_topics: List[str]
    insights: List[GenericInsight]
    decisions: List[GenericDecision]
    confidence: float = Field(ge=0.0, le=1.0)


# ============================================================================
# AGENTS
# ============================================================================

# Azure OpenAI configuration
AZURE_OPENAI_ENDPOINT = os.getenv('AZURE_OPENAI_ENDPOINT')
AZURE_OPENAI_KEY = os.getenv('AZURE_OPENAI_KEY')
AZURE_OPENAI_DEPLOYMENT = os.getenv('AZURE_OPENAI_DEPLOYMENT_NAME', 'gpt-4o')

# Contract Extraction Agent
contract_agent = Agent(
    'openai:' + AZURE_OPENAI_DEPLOYMENT,
    result_type=ContractExtraction,
    system_prompt="""You are a legal contract analysis expert with deep knowledge of Brazilian contract law.

Your task is to extract structured information from contracts including:
- All parties involved (names, roles, identifiers like CNPJ/CPF)
- Financial terms (values, payment schedules, conditions)
- Key clauses (payment, termination, warranties, liabilities, renewals, confidentiality)
- Important deadlines (delivery, payment, renewal, expiration)
- Party obligations
- Penalties and fines

Guidelines:
- Extract clause numbers exactly as they appear (e.g., "3.1", "5.2")
- Identify all payment terms and schedules
- Flag renewal and termination clauses
- Identify potential risks and liabilities
- Preserve exact legal terminology
- If a date is mentioned, extract in ISO format (YYYY-MM-DD)
- Assign confidence based on clarity of document

Return ONLY valid JSON matching the ContractExtraction schema. Be thorough and precise."""
)

# Proposal Extraction Agent
proposal_agent = Agent(
    'openai:' + AZURE_OPENAI_DEPLOYMENT,
    result_type=ProposalExtraction,
    system_prompt="""You are a business proposal analysis expert.

Your task is to extract structured information from commercial/technical proposals:
- Client and project identification
- Financial terms (total value, payment schedule)
- Timeline and milestones
- Deliverables with descriptions and deadlines
- Scope definition
- Assumptions and dependencies
- Exclusions (out of scope)
- Team composition
- Technologies to be used
- Identified risks

Guidelines:
- Extract all deliverables with clear descriptions
- Identify project timeline and key milestones
- List all assumptions (technical, business, timeline)
- Flag scope exclusions explicitly
- Extract team size and composition if mentioned
- List technologies, frameworks, tools
- Identify project risks
- Assign confidence based on proposal completeness

Return ONLY valid JSON matching the ProposalExtraction schema."""
)

# Meeting Extraction Agent
meeting_agent = Agent(
    'openai:' + AZURE_OPENAI_DEPLOYMENT,
    result_type=MeetingExtraction,
    system_prompt="""You are a meeting analysis expert.

Your task is to extract structured information from meeting minutes/transcripts:
- Meeting title and date
- All participants (names, roles, organizations)
- Discussion topics with summaries
- Decisions made
- Action items/tasks assigned
- Next steps
- Next meeting scheduled

Guidelines:
- Extract participant names exactly as mentioned
- Group discussions by topic
- Clearly identify decisions vs discussions
- Extract actionable tasks
- Identify task owners when mentioned
- Flag next meeting date if scheduled
- Assign confidence based on meeting documentation quality

Return ONLY valid JSON matching the MeetingExtraction schema."""
)

# Report Extraction Agent
report_agent = Agent(
    'openai:' + AZURE_OPENAI_DEPLOYMENT,
    result_type=ReportExtraction,
    system_prompt="""You are a business report analysis expert.

Your task is to extract structured information from reports (progress, status, performance):
- Report title and period covered
- Executive summary
- Key metrics and KPIs (with values, units, trends, targets)
- Insights and findings (categorized by type)
- Recommendations with priorities
- Identified risks
- Next actions

Guidelines:
- Extract all quantitative metrics with units
- Identify metric trends (up, down, stable)
- Categorize insights (performance, risk, opportunity, trend, issue)
- Prioritize recommendations (high, medium, low)
- Flag high-impact insights
- Extract risk statements
- List concrete next actions
- Assign confidence based on report completeness

Return ONLY valid JSON matching the ReportExtraction schema."""
)

# Generic Extraction Agent
generic_agent = Agent(
    'openai:' + AZURE_OPENAI_DEPLOYMENT,
    result_type=GenericExtraction,
    system_prompt="""You are a document analysis assistant.

Your task is to extract basic insights and decisions from generic documents:
- Summary of the document
- Key topics discussed
- Main insights or findings
- Decisions made

This is a LIGHT extraction - focus on:
- High-level summary
- 3-5 key topics
- Important insights with confidence levels
- Clear decisions with context

Do NOT extract tasks, risks, or detailed entities. Keep it simple and high-level.

Return ONLY valid JSON matching the GenericExtraction schema."""
)


# ============================================================================
# AGENT FACTORY
# ============================================================================

def get_extraction_agent(doc_type: str):
    """Get appropriate extraction agent for document type"""
    agents = {
        'contract': contract_agent,
        'proposal': proposal_agent,
        'meeting': meeting_agent,
        'report': report_agent,
        'analysis': generic_agent,
        'other': generic_agent,
    }
    return agents.get(doc_type, generic_agent)


async def extract_from_document(content: str, doc_type: str, context: dict = None):
    """
    Extract structured data from document using appropriate specialist agent
    
    Args:
        content: Document text content
        doc_type: Document type (contract, proposal, meeting, report, etc.)
        context: Additional context (title, author, dates, etc.)
    
    Returns:
        Extracted structured data
    """
    agent = get_extraction_agent(doc_type)
    
    # Build prompt with context
    prompt = f"Extract structured information from this {doc_type} document:\n\n{content}"
    
    if context:
        context_str = "\n".join([f"{k}: {v}" for k, v in context.items() if v])
        prompt = f"Document context:\n{context_str}\n\n{prompt}"
    
    # Run extraction
    result = await agent.run(prompt)
    
    return result.data
