# 📁 Project Context - EKS

> Documentação de contexto do projeto EKS (Enterprise Knowledge System)

**Atualizado**: 2025-01-19

---

## 📋 Guia de Arquivos

### ✅ Arquivos Ativos (Use estes)

| Arquivo | Propósito | Status |
|---------|-----------|--------|
| `eks-architecture.md` | **FONTE CANÔNICA** - Arquitetura macro | ✅ Atualizado |
| `env-vars.md` | Variáveis de ambiente | ✅ Operacional |
| `tools-registry.md` | Stack tecnológico | ✅ Operacional |
| `folder-structure.md` | Estrutura de pastas | ✅ Operacional |

### ⚠️ Arquivos Deprecados (Não use)

| Arquivo | Motivo | Substituto |
|---------|--------|------------|
| `project-overview.md` | Desatualizado (2024-12) | `eks-architecture.md` |
| `agent-framework.md` | Desatualizado (2024-12) | `EKS/specs/019-*` |
| `database-schema.md` | Desatualizado (2024-12) | `EKS/specs/015-*` + `050-*` |
| `project-workplan.md` | Desatualizado (2024-12) | `EKS/specs/_ROADMAP.md` |

---

## 🎯 Fontes Canônicas por Área

```
ARQUITETURA
└── project-context/eks-architecture.md

MODELO DE DADOS
├── EKS/specs/015-neo4j-graph-model/spec.md
└── EKS/specs/050-meta-graph-schema/spec.md

MEMÓRIA & COGNIÇÃO
├── EKS/specs/017-memory-ecosystem/spec.md
├── EKS/specs/051-context-depth-controller/spec.md
└── EKS/specs/024-retrieval-orchestration/spec.md

AGENTES
├── EKS/specs/005-agent-router/spec.md (PLA)
├── EKS/specs/019-multi-agent-orchestration/spec.md
└── EKS/specs/046-pia-process-intelligence/spec.md

NEGÓCIO
├── EKS/specs/040-business-intent-graph/spec.md
└── EKS/specs/022-onboarding-ai-profile/spec.md (PKP)

ROADMAP
└── EKS/specs/_ROADMAP.md
```

---

## 🔄 Atualização

Para manter alinhamento:
1. **Arquitetura**: Atualize apenas `eks-architecture.md`
2. **Specs**: Atualize nas pastas `EKS/specs/###-nome/`
3. **Roadmap**: Use `EKS/specs/_ROADMAP.md`
4. **Operacional**: `env-vars.md`, `tools-registry.md`, `folder-structure.md`

---

**Nota**: Os arquivos deprecados foram mantidos para referência histórica, mas não devem ser usados para decisões de implementação.

