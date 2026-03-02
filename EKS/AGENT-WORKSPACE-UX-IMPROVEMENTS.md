# Agent Workspace - UX Improvements

## ✅ Implementado (2026-03-01)

### 1. Chat Unificado
**Problema**: Chat duplicado (um no IDELayout, outro na página principal)
**Solução**: 
- Removido chat interno do IDELayout
- Mantido apenas chat lateral da página principal (page.tsx)
- IDELayout agora é apenas Editor + Context Panels

### 2. Estado Inicial Vazio
**Problema**: Documento vinha pré-carregado ao abrir workspace
**Solução**:
- Estado inicial: `isDocumentActive = false`
- Tela vazia com CTA "Novo Documento"
- Mensagem: "Clique em Novo Documento ou peça ao assistente no chat"
- Botão primário: "Novo Documento"

### 3. Placeholder do Editor
**Antes**: "Digite ou cole o conteúdo do documento aqui..."
**Depois**: "O conteúdo do documento gerado pelo chat aparecerá aqui. Você pode editar e aceitar as alterações."

**Contexto**: O chat lateral cria o documento automaticamente, não é o usuário digitando.

### 4. Busca de Contexto Determinística
**Antes**: "Digite @Projeto, @Pessoa, @Processo..."
**Depois**: "Digite Projeto, Pessoa, Processo... (sugestões aparecem automaticamente)"

**Pendente**:
- [ ] Implementar autocomplete/sugestões enquanto digita
- [ ] Auto-adicionar ao "Contexto Ativo" ao selecionar sugestão
- [ ] Integrar com cache de ontologia (labels por categoria)

## 🎯 Próximas Melhorias

### 1. Autocomplete de Contexto
```typescript
// useContextStore: adicionar
searchSuggestions: ContextItem[];
updateSuggestions: (query: string) => void;

// Lógica:
1. Usuário digita "Proj"
2. Busca no cache de ontologia (labels com "Proj")
3. Mostra dropdown: "Projeto EKS", "Projeto Alpha", ...
4. Ao clicar: adiciona direto ao Contexto Ativo
5. Muda aba para "Contexto Ativo" automaticamente
```

### 2. Diff View no Editor
**Objetivo**: Mostrar mudanças do chat em verde/vermelho (estilo IDE)

**Tecnologias**:
- Monaco Editor (substituir textarea)
- Monaco Diff Editor para comparar versões
- Store: manter versões anteriores do documento

**Fluxo**:
1. Chat gera documento V1 → aparece no editor
2. Usuário pede mudança no chat
3. Chat gera documento V2
4. Editor mostra diff: 
   - Linhas removidas em vermelho
   - Linhas adicionadas em verde
5. Botões: "Aceitar Mudanças" | "Rejeitar"

### 3. Controles de Documento no Chat
**Objetivo**: Botões de aceitar/rejeitar aparecem no final das mensagens do chat

**Quando mostrar**:
- Após o chat gerar ou editar um documento
- Mensagem do assistente termina com: 
  ```
  ✅ Aceitar documento
  ❌ Rejeitar mudanças
  ```

**Ação**:
- Aceitar → Chama fluxo de ingestão (igual DataIngestion.tsx)
- Rejeitar → Restaura versão anterior

## 📊 Fluxo Completo IDE

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuário acessa Agent Workspace                          │
│    → Tela vazia com CTA "Novo Documento"                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Usuário clica "Novo Documento" OU pede no chat          │
│    → Editor fica ativo (vazio)                             │
│    → Chat: "Preciso criar um contrato para Projeto EKS"    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Busca Contexto                                           │
│    → Digita "Projeto" → Sugestões: Projeto EKS, Alpha...   │
│    → Clica "Projeto EKS" → Vai p/ Contexto Ativo           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Chat gera documento                                      │
│    → PLA detecta intent: document_gen                       │
│    → Chama Document Agent (Python)                          │
│    → Documento aparece no Editor                            │
│    → Chat mostra: ✅ Aceitar | ❌ Rejeitar                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Usuário edita documento manualmente                      │
│    → Altera título, conteúdo                                │
│    → Ou pede no chat: "Adicione cláusula de confidencial"  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Chat atualiza documento                                  │
│    → Editor mostra DIFF (verde/vermelho)                    │
│    → Linhas antigas em vermelho                             │
│    → Linhas novas em verde                                  │
│    → Chat: ✅ Aceitar mudanças | ❌ Rejeitar                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Usuário aceita                                           │
│    → Fluxo de ingestão (igual DataIngestion.tsx)           │
│    → Extração de entidades, validação                       │
│    → Persiste no Neo4j como :Document                       │
└─────────────────────────────────────────────────────────────┘
```

## 🔗 Integrações Necessárias

### Backend
- [x] `/api/pla/chat` - Recebe mensagem, retorna resposta + documento
- [x] `/api/pla/ontology-metadata` - Cache de labels para autocomplete
- [ ] `/api/context/search` - Busca determinística com query parcial
- [ ] `/api/context/suggest` - Sugestões enquanto digita

### Frontend
- [x] `useOntologyCache` - Labels e categorias em cache
- [ ] `useContextStore.searchSuggestions` - Sugestões de autocomplete
- [ ] `usePLA.documentHistory` - Versões do documento para diff
- [ ] Monaco Editor - Substituir textarea
- [ ] Monaco Diff Editor - Mostrar comparações

### Componentes
- [x] `IDELayout` - Sem chat interno
- [x] `DocumentEditor` - Estado inicial vazio
- [ ] `DocumentEditor` - Diff view com Monaco
- [ ] `ContextPanel` - Autocomplete com dropdown
- [ ] `ChatbotPanel` - Botões aceitar/rejeitar em mensagens

## 📝 Notas Técnicas

### Autocomplete de Contexto
```typescript
// Exemplo de implementação
const useContextSuggestions = (query: string) => {
  const { metadata } = useOntologyCache();
  
  if (query.length < 2) return [];
  
  const queryLower = query.toLowerCase();
  
  // Buscar em labels
  const labelMatches = metadata?.labels
    .filter(l => l.name.toLowerCase().includes(queryLower))
    .map(l => ({
      id: l.name,
      type: l.category,
      title: l.name,
      preview: `${l.count} instâncias`,
    }));
  
  return labelMatches || [];
};
```

### Monaco Diff
```typescript
import { DiffEditor } from '@monaco-editor/react';

<DiffEditor
  original={previousVersion}
  modified={currentVersion}
  language="markdown"
  options={{
    readOnly: true,
    renderSideBySide: true,
  }}
/>
```

## ✨ Resultado Esperado

**Antes**: 
- Chat confuso (dois chats)
- Documento pré-carregado
- Placeholder enganoso
- Busca com @ obrigatório

**Depois**:
- Chat único e claro
- Workspace vazio no início
- Placeholder explicativo
- Busca intuitiva com sugestões
- Diff view para mudanças
- Aceitar/rejeitar no chat

**Experiência**: IDE profissional para criação colaborativa de documentos com IA.
