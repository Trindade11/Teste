# Análise de Chunking - Documento CoCreateAI

## 📊 Estatísticas dos Chunks

- **Total de chunks**: 28
- **Chunks esperados**: 28 ✅
- **Tamanho médio**: 307 chars
- **Tamanho mínimo**: 2 chars ⚠️
- **Tamanho máximo**: 1405 chars
- **Chunks vazios**: 0
- **Chunks com problemas de encoding**: 21/28 (75%) ❌

## ❌ Problemas Identificados

### 1. Encoding UTF-8 Quebrado (CRÍTICO)

**Causa**: Script Python usando `decode('utf-8', errors='ignore')` que **descartava** caracteres acentuados em vez de preservá-los.

**Exemplos**:
```
Gestão → Gest�o
Técnica → T�cnica
Estratégica → Estrat�gica
definição → defini��o
região → regi�o
```

**Correção aplicada**: Removido `errors='ignore'` do decode UTF-8.

**Arquivo**: `backend/src/services/file-text-extractor.service.ts`

### 2. Semantic Chunking Irregular

**Problema**: Chunks com tamanhos extremamente variados (2 até 1405 chars).

**Possíveis causas**:
1. Biblioteca `semantic-chunking` não está recebendo sentenças corretamente
2. Parâmetros de similarity threshold muito restritivos
3. Documento tem estrutura que confunde o chunker

**Análise de chunks problemáticos**:
- Chunk com 2 chars: provavelmente só um número ou pontuação
- Chunks muito grandes (>1000): várias sentenças sendo agrupadas incorretamente

## ✅ Correções Aplicadas

1. **Encoding UTF-8**: Corrigido no `file-text-extractor.service.ts`
2. **Endpoint de reconstrução**: Criado `/documents/:elementId/reconstruct` para debug
3. **Script de análise**: `scripts/reconstruct-document.ts` para validação offline

## 🔄 Próximos Passos

### Imediato
1. **Reiniciar backend** para aplicar correção de encoding
2. **Fazer novo upload** do documento teste
3. **Validar encoding** nos chunks gerados

### Investigação do Semantic Chunking
1. Analisar logs detalhados da lib `semantic-chunking`
2. Ajustar parâmetros:
   - `similarityThreshold`: atualmente 0.5 (testar 0.4-0.6)
   - `maxTokenSize`: atualmente 1000 (testar 500-800)
   - `numSimilaritySentencesLookahead`: atualmente 3 (testar 2-5)
3. Verificar se o problema está no split de sentenças antes do chunking

### Alternativas se semantic-chunking não funcionar
1. Usar `cramit` (fixed-size) da mesma lib
2. Implementar chunker baseado em parágrafos + sentenças (já existe no `GenericChunker`)
3. Testar biblioteca alternativa: `langchain` text splitters

## 📝 Observações

- O documento original tem **boa estrutura** (seções, títulos, parágrafos)
- O encoding quebrado está **afetando a qualidade** do chunking semântico
- Após corrigir encoding, reavaliar se semantic chunking melhora
