# Agent Workspace - Bug Fixes (2026-03-01)

## 🐛 Bugs Reportados

### 1. ✅ Painel "Buscar Contexto" aparece mesmo sem documento ativo
**Problema**: Context Panel (Buscar Contexto + Contexto Ativo) aparece sempre, mesmo quando não há documento.

**Solução Implementada**:
```typescript
// IDELayout.tsx
const { currentDocument } = usePLA();
const hasActiveDocument = !!currentDocument;

{hasActiveDocument ? (
  <PanelGroup direction="vertical">
    <Panel><DocumentEditor /></Panel>
    <PanelResizeHandle />
    <Panel><ContextPanel /></Panel>  {/* SÓ APARECE COM DOCUMENTO */}
  </PanelGroup>
) : (
  <DocumentEditor />  {/* Empty state sem context panel */}
)}
```

**Resultado**: 
- Sem documento = Empty state limpo (só botão "Novo Documento")
- Com documento = Editor + Context Panel

---

### 2. ⚠️ Chat não mostra mensagens do usuário

**Sintoma**: No chat lateral, as perguntas do usuário não aparecem.

**Causa Identificada**: Hook `use-chat.ts` adiciona mensagens corretamente ao estado:
```typescript
// Linha 100 - use-chat.ts
setMessages(prev => [...prev, userMessage]);
```

**Possíveis Causas**:
1. `onMessageSent` callback não está propagando corretamente
2. Renderização do ChatbotPanel não está lendo o estado atualizado
3. Conflito entre `messages` do hook e `currentConversation.messages`

**Status**: Precisa investigação adicional

**Ação Recomendada**: 
- Verificar se `addMessage` em `useConversations` está funcionando
- Adicionar console.log em `sendMessage` para debug
- Verificar se o chat está lendo de `messages` ou `currentConversation.messages`

---

### 3. ⚠️ Backend não retorna query

**Erro Python**:
```
1 validation error for FrontendChatResponse
response
  Input should be a valid string [type=string_type, input_value={'message': '...
```

**Causa**: Backend Python está retornando objeto em vez de string.

**Onde corrigir**: `agents/src/routers/chat_router.py`
```python
# ERRADO:
return FrontendChatResponse(response={'message': '...'})

# CORRETO:
return FrontendChatResponse(response='Olá, Rodrigo...')
```

**Status**: Backend Python precisa correção

---

## 📊 Status Atual

| Componente | Status | Observação |
|------------|--------|------------|
| Empty State | ✅ OK | Não mostra Context Panel |
| Context Panel | ✅ OK | Só aparece com documento ativo |
| Chat - Mensagens Usuário | ❌ Bug | Não aparecem no chat |
| Chat - Backend Response | ❌ Bug | Erro de validação Pydantic |
| Ontology Cache | ✅ OK | Carrega on-login |

---

## 🔧 Próximos Passos

### Prioridade Alta
1. **Debug Chat Messages**: Adicionar logs no `use-chat.ts` e `ChatbotPanel.tsx`
2. **Corrigir Backend Python**: `FrontendChatResponse(response=string)` em vez de objeto
3. **Testar fluxo completo**: Login → Agent Workspace → Chat → Criar documento

### Prioridade Média
4. **Autocomplete de Contexto**: Sugestões enquanto digita
5. **Monaco Editor**: Substituir textarea por editor de código

### Prioridade Baixa
6. **Diff View**: Mostrar mudanças em verde/vermelho
7. **Botões no Chat**: Aceitar/Rejeitar documento direto nas mensagens

---

## 🎯 Fluxo Esperado (Quando Corrigido)

```
1. Usuário acessa Agent Workspace
   → Empty state limpo (sem context panel)

2. Usuário clica "Novo Documento" OU pede no chat
   → Editor fica ativo
   → Context Panel aparece embaixo

3. Usuário digita no chat: "Crie um contrato para Projeto EKS"
   → Mensagem do usuário APARECE no chat ✅
   → Backend processa e retorna documento
   → Resposta do bot APARECE no chat ✅
   → Documento aparece no editor

4. Usuário edita e clica "Aceitar"
   → Fluxo de ingestão persiste no Neo4j
```

---

## 📝 Notas Técnicas

### Warning Neo4j (Normal)
```
WARNING: The provided label is not in the database
- OnboardingResponse
- topChallenges
```

**Explicação**: Labels criados dinamicamente quando primeiro usuário faz onboarding. Não afeta funcionamento.

### TypeScript Errors (Temporário)
```
Cannot find module './DocumentEditor'
Cannot find module './ContextPanel'
```

**Causa**: Arquivo recém-recriado, TypeScript precisa recompilar.  
**Solução**: Salvar arquivo ou reiniciar dev server.
