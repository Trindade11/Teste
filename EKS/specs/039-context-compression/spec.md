# Spec 039: Context Compression

**Feature**: Compressão inteligente de histórico para conversas longas  
**Priority**: P1 (Escalabilidade crítica)  
**Sprint**: 2  
**Effort**: 3 dias  
**Status**: 📋 Planned  

---

## Visão Geral

Sistema para comprimir contexto de conversas longas, evitando:
- **Token limit overflow** (GPT-4 tem limite de tokens)
- **Latência alta** (mais tokens = mais lento)
- **Custo elevado** (pagar por tokens desnecessários)

Usa técnica de **Rolling Summary** + **Semantic Pruning**.

---

## Problema

**Cenário atual**:
```
Conversa com 50 mensagens (10k tokens)
→ Usuário envia nova mensagem
→ Sistema manda TODAS as 50 msgs para LLM
→ Token limit overflow OU
→ Latência alta (3-5s) OU
→ Custo alto ($0.30 por request)
```

**Cenário ideal**:
```
Conversa com 50 mensagens (10k tokens)
→ Sistema comprime para 15 msgs relevantes (3k tokens)
→ Manda apenas compressed context
→ Resposta rápida (1-2s)
→ Custo baixo ($0.10)
```

---

## Solução: Rolling Summary + Semantic Pruning

### Conceito

**Rolling Summary**:
- Manter sempre as **N mensagens mais recentes** (ex: últimas 10)
- Criar **summary** do restante do histórico
- Summary é re-gerado quando história cresce muito

**Semantic Pruning**:
- Identificar mensagens **redundantes** (repetindo informação)
- Remover mensagens de **baixo valor** (confirmações, "ok", "entendi")
- Manter mensagens **semanticamente importantes**

---

## Architecture

```
Conversa longa (50 msgs)
    ↓
┌─────────────────────────────────────┐
│ COMPRESSION ENGINE                  │
├─────────────────────────────────────┤
│ 1. Rolling Window                   │
│    - Keep last N msgs (10)          │
│                                     │
│ 2. Summarize Old                    │
│    - Summary of msgs 1-40           │
│                                     │
│ 3. Semantic Prune                   │
│    - Remove redundant               │
│    - Keep important                 │
└─────────────────────────────────────┘
    ↓
Compressed Context (15 msgs equivalent, 3k tokens)
    ↓
LLM (GPT-4o)
```

---

## Rolling Summary Implementation

### Algorithm

```python
# src/services/compression.py
class ContextCompressor:
    WINDOW_SIZE = 10          # Keep last 10 messages
    SUMMARY_THRESHOLD = 20    # Summarize if > 20 messages
    MAX_SUMMARY_TOKENS = 1000 # Summary max size
    
    async def compress_context(self, conversation_id: str) -> dict:
        """
        Compress conversation history
        Returns: { messages: [...], summary: str, compressed_count: int }
        """
        # 1. Get all messages
        conv = await db.conversations.findOne({ conversation_id })
        messages = conv['messages']
        
        if len(messages) <= self.WINDOW_SIZE:
            # Too short, no compression needed
            return {
                'messages': messages,
                'summary': None,
                'compressed_count': 0
            }
        
        # 2. Split: recent vs old
        recent_msgs = messages[-self.WINDOW_SIZE:]
        old_msgs = messages[:-self.WINDOW_SIZE]
        
        # 3. Summarize old messages
        summary = await self.summarize_messages(old_msgs)
        
        # 4. Semantic prune recent (optional)
        pruned_recent = await self.semantic_prune(recent_msgs)
        
        return {
            'messages': pruned_recent,
            'summary': summary,
            'compressed_count': len(old_msgs)
        }
    
    async def summarize_messages(self, messages: list) -> str:
        """
        Create rolling summary of messages
        """
        # Format messages
        formatted = '\n'.join([
            f"{msg['role']}: {msg['content']}"
            for msg in messages
        ])
        
        # LLM prompt
        prompt = f"""
Você é um assistente que resume conversas. Resuma a seguinte conversa mantendo:
- Pontos-chave discutidos
- Decisões tomadas
- Insights importantes
- Perguntas não respondidas

Seja conciso mas completo. Max 500 palavras.

CONVERSA:
{formatted}

RESUMO:
"""
        
        response = await self.llm.generate(prompt, max_tokens=1000)
        return response
    
    async def semantic_prune(self, messages: list) -> list:
        """
        Remove redundant or low-value messages
        """
        # Calculate embeddings for each message
        embeddings = await asyncio.gather(*[
            self.embed(msg['content'])
            for msg in messages
        ])
        
        # Calculate similarity matrix
        similarity = cosine_similarity_matrix(embeddings)
        
        # Remove highly similar messages (keep first occurrence)
        pruned = []
        for i, msg in enumerate(messages):
            # Check if too similar to previous messages
            is_redundant = any(
                similarity[i][j] > 0.95  # 95% similar
                for j in range(i)
                if j in [pruned.index(m) for m in pruned]
            )
            
            # Check if low-value (short confirmations)
            is_low_value = (
                len(msg['content']) < 20 and
                msg['role'] == 'user' and
                msg['content'].lower() in ['ok', 'sim', 'entendi', 'certo']
            )
            
            if not is_redundant and not is_low_value:
                pruned.append(msg)
        
        return pruned
```

---

## Context Budget Management

### Token Counting

```python
class TokenBudget:
    """
    Manage token budget for conversations
    """
    GPT4_MAX_TOKENS = 128_000      # GPT-4 Turbo
    RESERVE_FOR_RESPONSE = 4_000   # Reserve for output
    SYSTEM_PROMPT_TOKENS = 500     # System prompt overhead
    
    def calculate_available(self) -> int:
        """
        Calculate available tokens for context
        """
        return (
            self.GPT4_MAX_TOKENS 
            - self.RESERVE_FOR_RESPONSE 
            - self.SYSTEM_PROMPT_TOKENS
        )  # = 123,500 tokens
    
    def count_tokens(self, messages: list) -> int:
        """
        Count tokens in message list
        """
        total = 0
        for msg in messages:
            # Rough estimate: 1 token ≈ 4 chars
            total += len(msg['content']) // 4
            total += 10  # Overhead per message
        return total
    
    def fits_budget(self, messages: list, summary: str | None) -> bool:
        """
        Check if context fits in budget
        """
        msg_tokens = self.count_tokens(messages)
        summary_tokens = len(summary) // 4 if summary else 0
        total = msg_tokens + summary_tokens
        
        return total < self.calculate_available()
```

---

## Adaptive Compression

### Dynamic Window Size

```python
async def adaptive_compress(
    self,
    conversation_id: str,
    target_tokens: int = 5000
) -> dict:
    """
    Compress adaptively to fit target token budget
    """
    conv = await db.conversations.findOne({ conversation_id })
    messages = conv['messages']
    
    # Start with large window
    window_size = 20
    
    while window_size > 5:
        recent = messages[-window_size:]
        old = messages[:-window_size]
        
        # Generate summary
        summary = await self.summarize_messages(old) if old else None
        
        # Count tokens
        total_tokens = (
            self.count_tokens(recent) +
            (len(summary) // 4 if summary else 0)
        )
        
        if total_tokens <= target_tokens:
            # Fits! Return this compression
            return {
                'messages': recent,
                'summary': summary,
                'window_size': window_size,
                'total_tokens': total_tokens
            }
        
        # Too big, shrink window
        window_size -= 2
    
    # Fallback: force fit (last 5 messages + short summary)
    return {
        'messages': messages[-5:],
        'summary': await self.summarize_messages(messages[:-5]),
        'window_size': 5,
        'total_tokens': self.count_tokens(messages[-5:])
    }
```

---

## Integration com LLM Router (Spec 026)

### Compression per Depth Level

| Depth | Window Size | Max Summary Tokens | Total Context Budget |
|-------|-------------|-------------------|---------------------|
| 1 (Rápida) | 5 msgs | 500 | ~2k tokens |
| 2 (Balanceada) | 10 msgs | 1000 | ~5k tokens |
| 3 (Profunda) | 20 msgs | 2000 | ~10k tokens |

```python
async def compress_for_depth(
    self,
    conversation_id: str,
    depth: int
) -> dict:
    """
    Compress context based on depth level (Spec 026)
    """
    config = {
        1: {'window': 5, 'max_summary': 500},
        2: {'window': 10, 'max_summary': 1000},
        3: {'window': 20, 'max_summary': 2000}
    }
    
    return await self.compress_with_config(
        conversation_id,
        config[depth]
    )
```

---

## Caching Strategy

### Cache Summaries

```python
# Cache summary para evitar regenerar sempre
class SummaryCache:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.TTL = 3600  # 1 hour
    
    async def get_cached_summary(
        self,
        conversation_id: str,
        message_count: int
    ) -> str | None:
        """
        Get cached summary if available
        """
        key = f"summary:{conversation_id}:{message_count}"
        cached = await self.redis.get(key)
        return cached
    
    async def cache_summary(
        self,
        conversation_id: str,
        message_count: int,
        summary: str
    ):
        """
        Cache generated summary
        """
        key = f"summary:{conversation_id}:{message_count}"
        await self.redis.setex(key, self.TTL, summary)
```

---

## Metrics & Observability

### Track Compression Effectiveness

```python
# Gravar métricas de compressão
compression_metrics = {
    'conversation_id': str,
    'original_message_count': 50,
    'original_tokens': 10_000,
    'compressed_message_count': 15,
    'compressed_tokens': 3_000,
    'compression_ratio': 0.3,  # 70% reduction
    'summary_generated': True,
    'latency_ms': 1200,
    'timestamp': datetime.now()
}

await db.compression_metrics.insertOne(compression_metrics)
```

### Dashboard

```
Context Compression Performance (Última Semana)

┌──────────────────────────────────────────┐
│ Avg Compression Ratio: 68%              │
│ Tokens Saved: 2.4M (= $120 saved)       │
│ Conversations Compressed: 234            │
│ Summary Cache Hit Rate: 78%              │
└──────────────────────────────────────────┘

Top Memory-Heavy Conversations:
1. conv_abc (120 msgs, 24k tokens) → compressed to 5k
2. conv_def (95 msgs, 19k tokens) → compressed to 4k
3. conv_ghi (78 msgs, 16k tokens) → compressed to 3.5k
```

---

## User Scenarios

### Scenario 1: Long conversation (automatic compression)

```
[User] Tem conversa com 40 mensagens
[System] Detecta >20 mensagens
         → Comprime automaticamente
         → Mantém últimas 10 + summary
         
[User] Envia nova mensagem
[System] Usa compressed context
         → Responde em 1.5s (vs 4s sem compressão)
         
[User] Não nota diferença (seamless)
```

### Scenario 2: Budget overflow prevention

```
[User] Conversa atinge 100 mensagens (20k tokens)
[System] Token budget estouraria sem compressão
         → Adaptive compression
         → Window size = 8 msgs
         → Summary de 92 msgs → 1.5k tokens
         → Total: 3.5k tokens (fits!)
         
[Bot] Responde normalmente, contexto preservado
```

### Scenario 3: Summary review (optional UI)

```
[User] Clica "Ver resumo da conversa"
[System] Mostra summary gerado
[UI] 
  📝 Resumo das últimas 40 mensagens:
  - Discutimos métricas de Startup X
  - Identificamos burn rate alto (warning)
  - Sugerimos reunião com fundadores
  - Decisão: Pedir forecast Q1 2025
  
[User] "Ah sim, lembrei!"
```

---

## Requisitos Funcionais

### RF-CMP-001: Automatic Compression
- Sistema DEVE comprimir automaticamente se >20 msgs
- Compression DEVE ser transparente (usuário não nota)

### RF-CMP-002: Rolling Summary
- Summary DEVE manter pontos-chave
- Summary DEVE ser re-gerado a cada N novas mensagens (N=10)
- Summary max 1000 tokens

### RF-CMP-003: Token Budget
- DEVE respeitar limite de tokens do modelo
- DEVE reservar tokens para resposta (4k)
- DEVE alertar se budget estourar mesmo com compression

### RF-CMP-004: Semantic Pruning
- DEVE remover mensagens redundantes (similarity >95%)
- DEVE remover low-value (confirmações curtas)
- DEVE manter msgs semanticamente importantes

### RF-CMP-005: Caching
- DEVE cachear summaries por 1 hora
- Cache key: `conversation_id` + `message_count`
- Invalidar cache se conversa for editada

---

## Testing Strategy

```python
# tests/compression.test.py
def test_compression_ratio():
    """Test that compression reduces tokens significantly"""
    messages = generate_mock_messages(50)  # ~10k tokens
    compressed = compressor.compress_context(conversation_id)
    
    original_tokens = count_tokens(messages)
    compressed_tokens = count_tokens(compressed['messages']) + len(compressed['summary']) // 4
    
    ratio = compressed_tokens / original_tokens
    assert ratio < 0.5, "Compression should reduce by >50%"

def test_summary_preserves_key_info():
    """Test that summary doesn't lose important info"""
    messages = [
        {'role': 'user', 'content': 'Burn rate da Startup X é 200k/mês'},
        {'role': 'assistant', 'content': 'Isso dá runway de 6 meses'},
        # ... 40 more messages
    ]
    
    summary = compressor.summarize_messages(messages)
    
    # Summary should mention key facts
    assert 'burn rate' in summary.lower()
    assert '200k' in summary or '6 meses' in summary

def test_adaptive_compression_fits_budget():
    """Test adaptive compression respects token budget"""
    messages = generate_mock_messages(100)  # Very long
    
    compressed = compressor.adaptive_compress(conv_id, target_tokens=5000)
    
    total_tokens = count_tokens(compressed['messages']) + len(compressed['summary']) // 4
    assert total_tokens <= 5000, "Should fit in budget"
```

---

## Dependencies

| Spec | Dependency | Reason |
|------|------------|--------|
| 026 | **MUST** | LLM Router (depth levels determinam compression) |
| 032 | **SHOULD** | Adaptive Retrieval (ambos otimizam tokens) |

---

## Implementation Notes

### Phase 1: Rolling Summary (1d)
- Implement rolling window
- Summary generation prompt
- Token counting

### Phase 2: Semantic Pruning (1d)
- Embedding-based similarity
- Redundancy detection
- Low-value filtering

### Phase 3: Caching + Metrics (1d)
- Redis caching
- Compression metrics tracking
- Integration with Spec 026

---

**Status**: 📋 Planned (Sprint 2)  
**Next**: Implementar após LLM Router (Spec 026)
