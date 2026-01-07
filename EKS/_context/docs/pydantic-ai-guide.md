# Pydantic AI - Framework Guide

> Guia de referência para o framework Pydantic AI no projeto EKS

**Criado**: 2026-01-06  
**Última Atualização**: 2026-01-06  
**Status**: 🟢 Ativo

---

## 📋 Visão Geral

**Pydantic AI** é um framework Python para construção de agentes de IA de nível produção, desenvolvido pela equipe do Pydantic. Traz a experiência de desenvolvimento do FastAPI para aplicações de IA Generativa.

### Por que Pydantic AI?

| Característica | Descrição |
|----------------|-----------|
| **Type-safe** | Validação completa com Pydantic, erros detectados em tempo de escrita |
| **Model-agnostic** | Suporte a OpenAI, Anthropic, Gemini, Azure, Ollama, e muitos outros |
| **Dependency Injection** | Injeção de dependências type-safe para tools e contexto |
| **Structured Output** | Respostas validadas automaticamente com Pydantic models |
| **Observability** | Integração nativa com Pydantic Logfire e OpenTelemetry |
| **MCP Support** | Suporte ao Model Context Protocol para ferramentas externas |
| **Streaming** | Streaming de outputs estruturados com validação em tempo real |
| **Graph Support** | Suporte a grafos para fluxos complexos de agentes |

---

## 🚀 Instalação

```bash
# Via pip
pip install pydantic-ai

# Via Poetry (recomendado para o projeto)
poetry add pydantic-ai
```

### Dependências Opcionais

```bash
# Para Logfire (observability)
pip install pydantic-ai[logfire]

# Para todos os modelos
pip install pydantic-ai[openai,anthropic,google]
```

---

## 🎯 Conceitos Fundamentais

### 1. Agent (Agente)

O `Agent` é a unidade central do framework. Encapsula:
- Modelo LLM a ser usado
- Instruções do sistema
- Tools disponíveis
- Tipo de output esperado
- Dependências injetáveis

```python
from pydantic_ai import Agent

# Agente simples
agent = Agent(
    'openai:gpt-4o',
    instructions='Você é um assistente útil e conciso.'
)

# Execução síncrona
result = agent.run_sync('Qual a capital do Brasil?')
print(result.output)
# Output: Brasília
```

### 2. Structured Output (Saída Estruturada)

Use Pydantic models para garantir respostas tipadas:

```python
from pydantic import BaseModel, Field
from pydantic_ai import Agent

class CityInfo(BaseModel):
    name: str = Field(description='Nome da cidade')
    country: str = Field(description='País')
    population: int = Field(description='População estimada')

agent = Agent(
    'openai:gpt-4o',
    output_type=CityInfo
)

result = agent.run_sync('Informações sobre São Paulo')
print(result.output)
# Output: CityInfo(name='São Paulo', country='Brasil', population=12300000)
print(result.output.name)  # Type-safe access
```

### 3. Tools (Ferramentas)

Tools permitem que o agente execute ações e acesse dados externos:

```python
from pydantic_ai import Agent, RunContext

agent = Agent('openai:gpt-4o')

@agent.tool
async def get_weather(ctx: RunContext, city: str) -> str:
    """Retorna o clima atual de uma cidade."""
    # Implementação real aqui
    return f"Clima em {city}: 25°C, ensolarado"

@agent.tool
def calculate(ctx: RunContext, expression: str) -> float:
    """Calcula uma expressão matemática."""
    return eval(expression)  # Simplificado para exemplo

result = agent.run_sync('Qual o clima em Curitiba?')
```

### 4. Dependency Injection (Injeção de Dependências)

Injete recursos (DB, APIs, configs) de forma type-safe:

```python
from dataclasses import dataclass
from pydantic_ai import Agent, RunContext

@dataclass
class AppDependencies:
    db_connection: DatabaseConn
    user_id: int
    api_key: str

agent = Agent(
    'openai:gpt-4o',
    deps_type=AppDependencies
)

@agent.tool
async def get_user_data(ctx: RunContext[AppDependencies]) -> dict:
    """Busca dados do usuário atual."""
    user = await ctx.deps.db_connection.get_user(ctx.deps.user_id)
    return user.to_dict()

# Uso
deps = AppDependencies(
    db_connection=db,
    user_id=123,
    api_key='secret'
)
result = await agent.run('Mostre meus dados', deps=deps)
```

### 5. Dynamic Instructions (Instruções Dinâmicas)

Instruções podem ser geradas dinamicamente baseadas no contexto:

```python
from pydantic_ai import Agent, RunContext

agent = Agent('openai:gpt-4o', deps_type=AppDependencies)

@agent.instructions
async def dynamic_instructions(ctx: RunContext[AppDependencies]) -> str:
    user = await ctx.deps.db_connection.get_user(ctx.deps.user_id)
    return f"""
    Você é um assistente para {user.name}.
    Nível de acesso: {user.access_level}
    Preferências: {user.preferences}
    """
```

---

## 🔧 Modelos Suportados

### Configuração por Provider

```python
from pydantic_ai import Agent

# OpenAI
agent = Agent('openai:gpt-4o')
agent = Agent('openai:gpt-4o-mini')

# Azure OpenAI
agent = Agent('azure:gpt-4o')  # Requer AZURE_OPENAI_* env vars

# Anthropic
agent = Agent('anthropic:claude-3-5-sonnet-latest')

# Google Gemini
agent = Agent('google-gla:gemini-1.5-flash')
agent = Agent('google-gla:gemini-2.0-flash')

# Ollama (local)
agent = Agent('ollama:llama3')
agent = Agent('ollama:mistral')

# Groq
agent = Agent('groq:llama-3.3-70b-versatile')

# DeepSeek
agent = Agent('deepseek:deepseek-chat')
```

### Fallback entre Modelos

```python
from pydantic_ai import Agent
from pydantic_ai.models.fallback import FallbackModel
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.models.anthropic import AnthropicModel

# Se OpenAI falhar, usa Anthropic
primary = OpenAIChatModel('gpt-4o')
fallback = AnthropicModel('claude-3-5-sonnet-latest')
model = FallbackModel(primary, fallback)

agent = Agent(model)
```

---

## 🏗️ Padrões de Arquitetura para EKS

### Estrutura de Agente Recomendada

```python
# agents/base_agent.py
from dataclasses import dataclass
from pydantic_ai import Agent, RunContext
from pydantic import BaseModel

@dataclass
class EKSDependencies:
    """Dependências compartilhadas por todos os agentes EKS."""
    neo4j_driver: Neo4jDriver
    user_context: UserContext
    config: AppConfig

class BaseEKSAgent:
    """Classe base para agentes EKS."""
    
    def __init__(self, model: str = 'openai:gpt-4o'):
        self.agent = Agent(
            model,
            deps_type=EKSDependencies,
            output_type=self.get_output_type()
        )
        self._register_tools()
        self._register_instructions()
    
    def get_output_type(self) -> type[BaseModel]:
        raise NotImplementedError
    
    def _register_tools(self):
        raise NotImplementedError
    
    def _register_instructions(self):
        raise NotImplementedError
```

### Exemplo: Agente Operacional

```python
# agents/operational_agent.py
from pydantic import BaseModel, Field
from pydantic_ai import RunContext

class OperationalOutput(BaseModel):
    status: str = Field(description='Status atual do processo')
    metrics: dict = Field(description='Métricas operacionais')
    recommendations: list[str] = Field(description='Recomendações')

class OperationalAgent(BaseEKSAgent):
    
    def get_output_type(self):
        return OperationalOutput
    
    def _register_tools(self):
        @self.agent.tool
        async def query_process_status(
            ctx: RunContext[EKSDependencies], 
            process_id: str
        ) -> dict:
            """Consulta status de um processo no grafo."""
            query = """
            MATCH (p:Process {id: $process_id})
            RETURN p.status, p.metrics
            """
            result = await ctx.deps.neo4j_driver.run(query, process_id=process_id)
            return result
        
        @self.agent.tool
        async def get_sla_compliance(
            ctx: RunContext[EKSDependencies],
            area: str
        ) -> dict:
            """Verifica compliance de SLA por área."""
            # Implementação
            pass
    
    def _register_instructions(self):
        @self.agent.instructions
        async def operational_context(ctx: RunContext[EKSDependencies]) -> str:
            return f"""
            Você é o Agente Operacional do sistema EKS.
            
            Foco: Dados, processos, SLAs, integrações, operações diárias
            Horizonte: Horas a dias
            Usuário: {ctx.deps.user_context.name}
            Área: {ctx.deps.user_context.department}
            
            Responda de forma objetiva com status atual e métricas.
            """
```

### Multi-Agent Orchestration

```python
# orchestrator/master.py
from pydantic_ai import Agent, RunContext
from dataclasses import dataclass

@dataclass
class OrchestratorDeps:
    operational_agent: OperationalAgent
    gerencial_agent: GerencialAgent
    tatico_agent: TaticoAgent
    estrategico_agent: EstrategicoAgent
    user_context: UserContext

class MasterOrchestrator:
    
    def __init__(self):
        self.agent = Agent(
            'openai:gpt-4o',
            deps_type=OrchestratorDeps,
            instructions=self._get_instructions()
        )
        self._register_routing_tools()
    
    def _get_instructions(self) -> str:
        return """
        Você é o Master Orchestrator do sistema EKS.
        
        Sua função é:
        1. Analisar a query do usuário
        2. Identificar qual(is) agente(s) deve(m) responder
        3. Orquestrar a colaboração entre agentes
        4. Sintetizar as respostas em uma resposta coerente
        
        Agentes disponíveis:
        - Operacional: status, processos, SLAs (horas/dias)
        - Gerencial: KPIs, custos, compliance (dias/semanas)
        - Tático: opções, trade-offs, roadmap (semanas/meses)
        - Estratégico: visão, regulação, posicionamento (meses/anos)
        """
    
    def _register_routing_tools(self):
        @self.agent.tool
        async def route_to_operational(
            ctx: RunContext[OrchestratorDeps],
            query: str
        ) -> dict:
            """Roteia query para o agente operacional."""
            result = await ctx.deps.operational_agent.run(query)
            return result.output.model_dump()
        
        @self.agent.tool
        async def route_to_gerencial(
            ctx: RunContext[OrchestratorDeps],
            query: str
        ) -> dict:
            """Roteia query para o agente gerencial."""
            result = await ctx.deps.gerencial_agent.run(query)
            return result.output.model_dump()
```

---

## 📊 Observability com Logfire

```python
import logfire
from pydantic_ai import Agent

# Configurar Logfire
logfire.configure()

# Instrumentar o agente
logfire.instrument_pydantic_ai()

agent = Agent('openai:gpt-4o')

# Todas as chamadas serão automaticamente rastreadas
result = agent.run_sync('Olá!')
```

---

## 🔗 Integração com MCP

```python
from pydantic_ai import Agent
from pydantic_ai.mcp import MCPServerHTTP

# Conectar a um servidor MCP
mcp_server = MCPServerHTTP('http://localhost:3000/mcp')

agent = Agent(
    'openai:gpt-4o',
    mcp_servers=[mcp_server]
)

# O agente agora tem acesso às tools do MCP
result = agent.run_sync('Use a ferramenta do MCP para...')
```

---

## 🧪 Testes

```python
# tests/test_operational_agent.py
import pytest
from unittest.mock import AsyncMock, MagicMock
from agents.operational_agent import OperationalAgent, EKSDependencies

@pytest.fixture
def mock_deps():
    return EKSDependencies(
        neo4j_driver=AsyncMock(),
        user_context=MagicMock(name='Test User', department='IT'),
        config=MagicMock()
    )

@pytest.mark.asyncio
async def test_operational_agent_returns_structured_output(mock_deps):
    agent = OperationalAgent()
    
    # Mock do Neo4j
    mock_deps.neo4j_driver.run.return_value = {
        'status': 'running',
        'metrics': {'uptime': 99.9}
    }
    
    result = await agent.run('Status do processo X', deps=mock_deps)
    
    assert result.output.status is not None
    assert isinstance(result.output.metrics, dict)
```

---

## 📚 Recursos Adicionais

- **Documentação Oficial**: https://ai.pydantic.dev/
- **GitHub**: https://github.com/pydantic/pydantic-ai
- **Exemplos**: https://github.com/pydantic/pydantic-ai/tree/main/examples
- **API Reference**: https://ai.pydantic.dev/api/

---

## 🔄 Migração de Agno para Pydantic AI

### Principais Diferenças

| Aspecto | Agno | Pydantic AI |
|---------|------|-------------|
| Tipagem | Parcial | Completa (type-safe) |
| Validação | Manual | Automática (Pydantic) |
| DI | Básica | RunContext tipado |
| Observability | Externo | Logfire integrado |
| Multi-model | Limitado | Model-agnostic |

### Checklist de Migração

- [ ] Atualizar `pyproject.toml` (agno → pydantic-ai)
- [ ] Refatorar agents para usar `Agent` class
- [ ] Converter tools para decorators `@agent.tool`
- [ ] Implementar `deps_type` para injeção de dependências
- [ ] Criar Pydantic models para `output_type`
- [ ] Atualizar testes para novo padrão
- [ ] Configurar Logfire para observability

---

## 🔄 Version History

| Versão | Data | Mudanças |
|--------|------|----------|
| 1.0 | 2026-01-06 | Documento inicial - migração de Agno para Pydantic AI |
