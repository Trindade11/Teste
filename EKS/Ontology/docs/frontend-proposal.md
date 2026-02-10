# Proposta: Nova Aba "Saúde Ontológica" no Frontend

## Análise do Estado Atual

### Aba existente: "Ontologia do Projeto" (`OntologyViewer.tsx`)

| Sub-aba | O que mostra | Foco |
|---------|-------------|------|
| **Visão Geral** | Total nós, total rels, labels com contagem, relationship types com contagem | Inventário estático |
| **Taxonomia** | Árvore hierárquica (Org → Dept → User, Objective → OKR) | Navegação estrutural |
| **Tesauro** | Termos canônicos + aliases, busca e filtro | Vocabulário controlado |
| **Fontes de Injeção** | Pipelines de ingestão, tipos de nó por fonte | Rastreabilidade |
| **Schema do Grafo** | Padrões de relacionamento (From → Rel → To) + distribuição % | Estrutura técnica |

**Veredicto**: Essa aba responde **"O que existe no grafo?"**. É completa para seu propósito.

---

## Nova Aba Proposta: "Saúde Ontológica"

Essa aba responde **"Como está o grafo?"** — métricas dinâmicas, temporais e de qualidade.

### Justificativa para ser uma aba separada

1. **Público diferente**: Ontologia do Projeto é para quem quer navegar. Saúde é para quem quer **agir**
2. **Frequência**: Ontologia é consultada pontualmente. Saúde é monitoramento **contínuo**
3. **Dados**: Ontologia usa dados estáticos (schema). Saúde usa dados **temporais e calculados**
4. **Tamanho**: Juntar tudo tornaria a aba gigante e confusa

### Sub-abas propostas

```
Saúde Ontológica
├── Dashboard (Vitais)
├── Supernós
├── Propriedades
├── Temporal
└── Curadoria
```

---

## Detalhamento de Cada Sub-aba

### 1. Dashboard (Vitais)

**Pergunta**: "O grafo está saudável agora?"

**Cards de métricas (topo)**:
| Card | Valor | Cor/Status |
|------|-------|------------|
| R/N (rels/nó) | 1.65 | Verde se 1-3, Amarelo fora |
| p50 (mediana) | 2 | Informativo |
| p90 | 5.4 | Verde se < 10 |
| p90/p50 ratio | 2.7 | Verde se < 5 |
| Max Degree | 37 | Amarelo se > 3x avg |
| Órfãos | 0% | Verde se < 10% |

**Health Score** (0-10):
- Gauge visual com score composto
- Fórmula: f(R/N, p90/p50, orphans%, freshness)

**Histograma de grau**:
- Barchart com distribuição (grau x quantidade)
- Linha vertical marcando p50 e p90

**API Backend necessária**: `GET /ontology/health`

### 2. Supernós

**Pergunta**: "Quem são os hubs e eles são problema?"

**Tabela de supernós**:
| Posição | Tipo | Nome | Grau | Tendência | Status |
|---------|------|------|------|-----------|--------|
| 1 | User | Rodrigo Trindade | 37 | Subindo | Revisar |
| 2 | Meeting | (sem nome) | 24 | Estável | Corrigir |
| 3 | Organization | CoCreateAI | 14 | Estável | Esperado |

**Detalhe ao clicar**: Lista de todas as relações do nó, agrupadas por tipo

**API Backend necessária**: `GET /ontology/health/supernodes`

### 3. Propriedades

**Pergunta**: "Os dados estão completos?"

**Completude por Label**:
| Label | Total | Completude | Confidence Avg | Ação |
|-------|-------|------------|----------------|------|
| Meeting | 5 | 72% | 0.85 | Ver detalhes |
| User | 12 | 88% | - | OK |
| Task | 8 | 45% | 0.62 | Curadoria |

**Barras de progresso** por propriedade dentro de cada label

**Mapa de propriedades** (matrix):
- Linhas = nós do label
- Colunas = propriedades esperadas
- Cells = preenchida, faltando, baixa confiança

**API Backend necessária**: `GET /ontology/health/completeness`

### 4. Temporal

**Pergunta**: "O que está mudando? O que está parado?"

**Timeline de crescimento**:
- Gráfico de linha: nós criados por semana (últimos 3 meses)
- Gráfico de linha: relações criadas por semana

**Freshness Score**:
- Gauge: Freshness médio global (0-1)
- Lista: Top 10 nós/relações mais "velhos" sem atualização

**Relações dormentes**:
- % de relações sem interação > 30 dias
- Lista: Top 10 relações dormentes

**Atividade recente**:
- Últimas 20 relações criadas (com data, tipo, de → para)

**API Backend necessária**: `GET /ontology/health/temporal`

### 5. Curadoria

**Pergunta**: "O que preciso revisar?"

**Fila de curadoria** (itens que precisam de atenção humana):

| Tipo | Item | Motivo | Prioridade |
|------|------|--------|------------|
| Merge | "AWS" + "aws" | Possível duplicata | Alta |
| Validar | Task "Definir..." | Confidence 0.3 | Alta |
| Revisar | Meeting (null) | Nome faltando | Média |
| Limpar | 3 nós suspeitos | Nome < 2 chars | Baixa |

**Contadores no topo**:
- Pendentes: X
- Resolvidos esta semana: Y
- Nunca validados: Z

**Ações inline**: Aprovar / Rejeitar / Editar / Merge

**API Backend necessária**: `GET /ontology/health/curation-queue`

---

## Arquitetura Técnica

### Backend: Novas rotas

```
GET /ontology/health           → Dashboard summary (vitals)
GET /ontology/health/degree    → Distribuição de grau (p50/p90/histograma)
GET /ontology/health/supernodes → Top N supernós com detalhes
GET /ontology/health/completeness → Completude por label
GET /ontology/health/temporal   → Métricas temporais
GET /ontology/health/curation   → Fila de curadoria
POST /ontology/health/curation/:id/resolve → Resolver item de curadoria
```

### Frontend: Novo componente

```
components/settings/
├── OntologyViewer.tsx          (existente, não alterar)
└── OntologyHealth.tsx          (NOVO)
    ├── HealthDashboard.tsx     (sub-aba Dashboard)
    ├── HealthSupernodes.tsx    (sub-aba Supernós)
    ├── HealthProperties.tsx    (sub-aba Propriedades)
    ├── HealthTemporal.tsx      (sub-aba Temporal)
    └── HealthCuration.tsx      (sub-aba Curadoria)
```

### Mudança em `settings/page.tsx`

Adicionar nova entrada no menu lateral:

```typescript
// Nova seção no menu
<button onClick={() => setActiveSection('ontology-health')}>
  <Activity className="h-4 w-4" />
  <span>Saúde Ontológica</span>
  <div className="text-xs">Métricas, temporal e curadoria</div>
</button>

// No render
{activeSection === 'ontology-health' && <OntologyHealth />}
```

O tipo de `activeSection` precisa incluir `'ontology-health'`.

---

## Prioridade de Implementação

### Fase 1 (MVP)
- [x] Queries Cypher prontas (`health-metrics.cypher`, `temporal-metrics.cypher`)
- [ ] Backend: `GET /ontology/health` (dashboard summary)
- [ ] Backend: `GET /ontology/health/degree` (p50/p90)
- [ ] Frontend: `OntologyHealth.tsx` com Dashboard básico
- [ ] Frontend: Cards de vitais + histograma

### Fase 2 (Propriedades)
- [ ] Backend: `GET /ontology/health/completeness`
- [ ] Backend: `GET /ontology/health/supernodes`
- [ ] Frontend: Sub-aba Supernós
- [ ] Frontend: Sub-aba Propriedades com completude

### Fase 3 (Temporal)
- [ ] Backend: `GET /ontology/health/temporal`
- [ ] Frontend: Sub-aba Temporal com gráficos
- [ ] Implementar `last_accessed_at` e `access_count` no backend

### Fase 4 (Curadoria)
- [ ] Backend: `GET/POST /ontology/health/curation`
- [ ] Frontend: Sub-aba Curadoria com fila
- [ ] Implementar `last_validated_at` no backend
- [ ] Ações de merge/resolve inline

---

## Resumo Comparativo

| Aspecto | Ontologia do Projeto | Saúde Ontológica |
|---------|---------------------|-------------------|
| **Ícone** | `Network` | `Activity` ou `HeartPulse` |
| **Cor** | Roxo | Verde/Vermelho (saúde) |
| **Pergunta** | "O que temos?" | "Como está?" |
| **Frequência** | Quando precisa | Diário/semanal |
| **Ação** | Navegar, entender | Monitorar, curar, agir |
| **Sub-abas** | 5 (Overview, Taxonomy, Thesaurus, Ingestion, Schema) | 5 (Dashboard, Supernós, Propriedades, Temporal, Curadoria) |
| **Backend** | `/ontology/stats`, `/ontology/schema`, etc. | `/ontology/health/*` (NOVO) |
