# Spec Kit Visual Flows

> Mermaid diagrams documenting the Spec Kit methodology

## 📖 How to View

1. Install **"Markdown Preview Mermaid Support"** extension (Matt Bierner)
2. Open any `.md` file → `Ctrl+Shift+V` for Preview

---

## 📊 Flow Diagrams Index

| File | Description | Diagrams |
|------|-------------|----------|
| [overview.md](./overview.md) | High-level Spec-Driven Development methodology | 5 |
| [command-flow.md](./command-flow.md) | Detailed flow for each `/speckit.*` command | 12 |
| [triage-system.md](./triage-system.md) | How the triage backlog system works | 7 |
| [artifact-relationships.md](./artifact-relationships.md) | Relationships between all artifacts | 8 |
| [entry-lifecycle.md](./entry-lifecycle.md) | Lifecycle of entries in the triage system | 9 |
| [decision-tree.md](./decision-tree.md) | When to use which command | 6 |
| [gap-notation.md](./gap-notation.md) | How to visualize gaps and uncertainties in diagrams | 8 |

**Total: ~55 diagrams**

---

## 🚀 Quick Overview

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000'}}}%%
flowchart LR
    subgraph Input
        User[User Input]
    end
    
    subgraph Triage
        T["/speckit.triage"]
    end
    
    subgraph Core
        C["/speckit.constitution"]
        S["/speckit.specify"]
        P["/speckit.plan"]
        K["/speckit.tasks"]
        I["/speckit.implement"]
    end
    
    User --> T
    T --> C
    T --> S
    C --> S
    S --> P
    P --> K
    K --> I
```

---

## 🎨 Diagram Style Guide

All diagrams in this folder use dark text on light backgrounds for readability:

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart LR
    A["Light background<br/>with dark text"] --> B["Easy to read"]
    
    style A fill:#e8f5e9,stroke:#4caf50,color:#000
    style B fill:#e3f2fd,stroke:#1976d2,color:#000
```

---

## 🔄 Need Another Round?

Missing a flow diagram? Let us know what should be added.

