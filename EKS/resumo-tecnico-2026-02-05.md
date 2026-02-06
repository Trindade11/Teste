# Resumo Técnico - Ingestão de Transcrições de Reunião (VTT)

**Data**: 2026-02-05  
**Projeto**: EKS (Enterprise Knowledge System)  
**Componente**: Meeting Transcript Ingestion  

---

## 🎯 Objetivo do Trabalho

Refinar o fluxo de **extração de entidades** de arquivos VTT (transcrições de reunião) para o grafo Neo4j, melhorando:
1. A qualidade e quantidade de entidades extraídas pelo LLM
2. A interface de validação/edição pelo curador ontológico
3. A persistência correta de todos os metadados no Neo4j

---

## ✅ O Que Foi Feito

### 1. Prompt de Extração Refinado
**Arquivo**: `backend/src/services/llm-extraction.service.ts`

- Prompt otimizado para extrair de forma exaustiva:
  - `summary` (resumo da reunião)
  - `keyTopics` (tópicos principais com descrição e relevância)
  - `decisions` (decisões tomadas)
  - `tasks` (tarefas identificadas)
  - `action_items` (itens de ação com responsável, prazo, prioridade)
  - `risks` (riscos identificados)
  - `insights` (insights relevantes)
  - `mentioned_entities` (organizações, ferramentas, produtos, pessoas externas, conceitos)
- `max_tokens` aumentado de 4000 para **8000** para permitir extração completa

### 2. Script de Teste de Prompt
**Arquivo**: `agents/scripts/test_extraction_prompt.py`

- Script Python para testar iterativamente o prompt contra Azure OpenAI
- Permite refinar prompt sem precisar rodar o frontend
- Salva resultado em `extraction_result.json` para análise

### 3. Frontend - Validação de Entidades
**Arquivo**: `frontend/src/components/admin/MeetingTranscriptIngestion.tsx`

#### Implementado:
- **Responsável em Ações (actionItem)**: Trocado de texto livre para **combo/select**
  - Somente colaboradores internos (`orgNodes`) podem ser responsáveis
  - Se não identificado, fica vazio para o curador selecionar
  - Aparece tanto inline na linha quanto no painel expandido

- **Tipo de Entidade (mentionedEntity)**: Adicionado **combo/select** para classificar:
  - Organização, Ferramenta, Produto, Cliente, Pessoa Externa, Conceito
  - Quando seleciona "Pessoa Externa", abre o form de cadastro de participante externo

- **Indicador de Vinculação**: Badge visual para participantes e entidades mencionadas
  - Verde ("Vinculado") = já existe no grafo
  - Laranja ("Novo") = será criado novo node

- **Matching de Entidades**:
  - Score ≥ 0.9: vinculação automática + auto-validação
  - Score ≥ 0.6: sugestão no contexto para revisão do curador
  - Threshold mantido conservador (90%) para evitar falsos positivos

### 4. Backend - Persistência de keyTopics
**Arquivo**: `backend/src/routes/meetings.routes.ts`

- **Problema**: Neo4j não aceita array de objetos como propriedade
- **Solução implementada**:
  - `Meeting.keyTopics`: `string[]` (lista de nomes dos tópicos)
  - `Meeting.keyTopicsJson`: `string` (JSON completo com topic/description/relevance)

### 5. Payload de Ingestão
**Arquivo**: `frontend/src/components/admin/MeetingTranscriptIngestion.tsx` (função `handleSaveToGraph`)

- Mapeamento corrigido para incluir todos os campos:
  - `description`, `assignee`, `deadline`, `priority`, `impact`
  - `relatedPerson`, `relatedArea`, `linkedNodeId`
  - `entityType` (para mentionedEntity)

---

## ❌ O Que Está Faltando / Pendente

### 1. **Reconhecimento de Entidades Existentes (Montreal)**
- **Problema**: Montreal Ventures não está sendo reconhecida como organização existente no grafo
- **Causa provável**: O nome extraído pelo LLM pode não estar batendo exatamente com o nome no grafo
- **Ação necessária**: 
  - Verificar como "Montreal" está cadastrada no Neo4j
  - Ajustar algoritmo de matching para considerar variações (Montreal, Montreal Ventures, etc.)
  - Possivelmente implementar fuzzy matching mais robusto

### 2. **Contagem de Entidades no Botão Salvar**
- **Status**: Verificado que `validatedCount` conta corretamente entidades com `validated === true`
- **Possível confusão**: Usuário pode estar esperando que conte TODAS as entidades, não apenas as validadas
- **Ação necessária**: Confirmar se o comportamento atual está correto ou se precisa ajuste

### 3. **Exibição de keyTopics Detalhados na UI**
- **Status**: Os `keyTopics` com descrição/relevância estão sendo extraídos e serão salvos no Neo4j
- **Pendente**: Não há UI específica para mostrar/editar o detalhamento de cada tópico antes de salvar
- **Sugestão**: Criar card/seção expandível mostrando topic + description + relevance

### 4. **Lint Warning (baixa prioridade)**
- `ingestionItem` declarado mas não usado em `meetings.routes.ts` linha 68
- Não impede funcionamento, apenas warning de código

### 5. **Testes E2E da Ingestão**
- Não foram feitos testes end-to-end após as alterações
- Recomenda-se:
  1. Reiniciar backend
  2. Processar uma transcrição VTT completa
  3. Verificar se ingestão salva corretamente no Neo4j
  4. Confirmar que `keyTopicsJson` está sendo salvo

---

## 📁 Arquivos Principais

| Arquivo | Descrição |
|---------|-----------|
| `frontend/src/components/admin/MeetingTranscriptIngestion.tsx` | Componente principal de ingestão |
| `backend/src/services/llm-extraction.service.ts` | Serviço de extração via Azure OpenAI |
| `backend/src/routes/meetings.routes.ts` | Rota POST /meetings/ingest |
| `agents/scripts/test_extraction_prompt.py` | Script para testar prompt |
| `agents/.env` | Variáveis de ambiente (Azure OpenAI keys) |

---

## 🔧 Configurações Importantes

```env
# Azure OpenAI (em agents/.env e backend/.env)
AZURE_OPENAI_ENDPOINT=https://xxx.openai.azure.com/
AZURE_OPENAI_KEY=xxx
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-08-01-preview
```

---

## 📋 Regras de Negócio Implementadas

1. **Somente colaboradores internos podem ser responsáveis por Ações**
   - Entidades externas são apenas mencionadas, não recebem tarefas

2. **Threshold de vinculação automática = 90%**
   - Abaixo disso, apenas sugere match para revisão do curador

3. **Tipo de entidade editável para mentionedEntity**
   - Se for "Pessoa Externa", abre form de cadastro

4. **keyTopics são gerados dinamicamente pelo LLM**
   - Não são lista fixa/padrão
   - Variam conforme conteúdo da reunião

---

## 🚀 Próximos Passos Sugeridos

1. Testar ingestão completa (VTT → validação → Neo4j)
2. Verificar se Montreal Ventures existe no grafo e ajustar matching
3. Implementar UI para visualizar/editar keyTopics detalhados
4. Considerar fuzzy matching mais robusto para entidades
5. Avaliar se precisa de mais tipos de entidade no combo

---

*Resumo gerado para handoff de contexto técnico.*
