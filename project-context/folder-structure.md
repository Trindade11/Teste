# Folder Structure - EKS Project

> ✅ **OPERACIONAL** - Este arquivo permanece ativo

**Created**: 2024-12-13  
**Last Updated**: 2025-01-19

---

## 📁 Project Organization

```
eks-project/
├── src/eks/                     # Main source code
│   ├── core/                    # Core domain logic
│   │   ├── ontology/
│   │   ├── graph/
│   │   └── knowledge/
│   ├── agents/                  # Agent system
│   │   ├── orchestration/
│   │   ├── hierarchical/
│   │   ├── specialized/
│   │   └── infrastructure/
│   ├── extraction/              # Data extraction
│   ├── rag/                     # RAG system
│   ├── gamification/            # Gamification
│   ├── intelligence/            # External intelligence
│   └── api/                     # FastAPI application
│
├── tests/                       # Test suite
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── scripts/                     # Utility scripts
│   ├── setup/
│   ├── migration/
│   └── analysis/
│
├── docs/                        # Additional documentation
├── data/                        # Sample/test data
├── logs/                        # Application logs
└── deployments/                 # Deployment configs
    ├── docker/
    └── kubernetes/
```

---

## 🎯 Key Directories

- **src/eks**: Main application code
- **tests**: Comprehensive test suite
- **scripts**: Automation and utilities
- **project-context**: Project configuration and documentation
- **specs**: Feature specifications
