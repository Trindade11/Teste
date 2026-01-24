# 🏢 Estrutura de Dados da Empresa no Neo4j

## 📋 Visão Geral

A descrição da empresa é armazenada no **node Organization existente** (criado durante a ingestão de dados) e conectada a **nodes separados** para Mission, Vision e Values. Isso permite criar relacionamentos semânticos ricos e facilita análises futuras.

## 🎯 Estrutura de Nodes

### 1. Organization (Node Central - criado na ingestão)
```cypher
(:Organization {
  name: "Aurora Corretora",  // Vem da ingestão de dados
  description: "Descrição completa da empresa...",  // Adicionado via configurações
  industry: "Serviços Financeiros",  // Adicionado via configurações
  size: "51-200",  // Adicionado via configurações
  updatedBy: "carlos.silva@aurora.com",
  updatedAt: timestamp
})
```

### 2. Mission (Missão)
```cypher
(:Organization)-[:HAS_MISSION]->(:Mission {
  id: "uuid",
  name: "Missão",  // Label para visualização no Neo4j
  text: "Nossa missão é...",
  createdAt: timestamp,
  createdBy: "carlos.silva@aurora.com"
})
```

### 3. Vision (Visão)
```cypher
(:Organization)-[:HAS_VISION]->(:Vision {
  id: "uuid",
  name: "Visão",  // Label para visualização no Neo4j
  text: "Nossa visão é...",
  createdAt: timestamp,
  createdBy: "carlos.silva@aurora.com"
})
```

### 4. Value (Valores - Múltiplos)
```cypher
(:Organization)-[:HAS_VALUE]->(:Value {
  id: "uuid",
  name: "Integridade",
  order: 1,
  createdAt: timestamp,
  createdBy: "usuario040@aurora.example"
})
```

## 🔗 Relacionamentos Futuros

### Alinhamento com Metas
```cypher
(:Goal)-[:SUPPORTS]->(:Value)
(:Goal)-[:ALIGNS_WITH]->(:Mission)
```

### Alinhamento com Tarefas
```cypher
(:Task)-[:CONTRIBUTES_TO]->(:Vision)
(:Task)-[:EMBODIES]->(:Value)
```

### Alinhamento com Processos
```cypher
(:Process)-[:SUPPORTS]->(:Mission)
(:Process)-[:DELIVERS]->(:Value)
```

### Análise de Pessoas
```cypher
(:User)-[:EMBODIES]->(:Value)
(:User)-[:CHAMPIONS]->(:Mission)
```

## 📊 Queries Úteis

### Obter Perfil Completo
```cypher
MATCH (c:Company)
OPTIONAL MATCH (c)-[:HAS_MISSION]->(m:Mission)
OPTIONAL MATCH (c)-[:HAS_VISION]->(v:Vision)
OPTIONAL MATCH (c)-[:HAS_VALUE]->(val:Value)
RETURN c, m, v, collect(val) AS values
```

### Metas Alinhadas com Valores
```cypher
MATCH (g:Goal)-[:SUPPORTS]->(v:Value)<-[:HAS_VALUE]-(c:Company)
RETURN v.name AS valor, collect(g.title) AS metas
```

### Análise de Alinhamento
```cypher
MATCH (c:Company)-[:HAS_VALUE]->(v:Value)
OPTIONAL MATCH (g:Goal)-[:SUPPORTS]->(v)
RETURN v.name AS valor, 
       count(g) AS metas_alinhadas,
       CASE WHEN count(g) = 0 THEN 'Baixo' 
            WHEN count(g) < 3 THEN 'Médio'
            ELSE 'Alto' END AS nivel_alinhamento
```

## 💡 Benefícios da Estrutura

1. **Versionamento**: Histórico de mudanças em Mission/Vision
2. **Análise Semântica**: "Quais metas suportam o valor Inovação?"
3. **Gamificação**: Pontos por tarefas alinhadas com valores
4. **Flexibilidade**: Adicionar metadados específicos a cada conceito
5. **Relacionamentos Ricos**: Conexões entre todos os elementos do sistema

## 🔄 Migração

Para migrar de estrutura antiga (se existir):
```cypher
// Deletar estrutura antiga
MATCH (old:CompanyProfile)
DETACH DELETE old

// Nova estrutura é criada via API POST /company/profile
```

## 🧪 Teste

Execute o script de teste:
```bash
node test_company_structure.js
```
