# Migration Guide

> How to adopt Spec Kit in existing projects

## Migration Overview

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TD
    Start([Existing Project]) --> Assess[Assess Current State]
    
    Assess --> Q1{Has documentation?}
    Q1 -->|Yes| Extract[Extract into Spec Kit format]
    Q1 -->|No| Create[Create from scratch]
    
    Extract --> Setup[Setup Spec Kit structure]
    Create --> Setup
    
    Setup --> Constitution[Define Constitution]
    Constitution --> Boundaries[Define Legacy Boundaries]
    Boundaries --> NewSpecs[Create specs for new work]
    
    NewSpecs --> Gradual[Gradual adoption]
    Gradual --> Complete([Full Spec Kit adoption])
    
    style Start fill:#fff3e0,stroke:#ff9800,color:#000
    style Complete fill:#c8e6c9,stroke:#388e3c,color:#000
```

## Step 1: Assess Current State

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TB
    subgraph Assessment["📋 Assessment Checklist"]
        A1["□ List existing documentation"]
        A2["□ Identify undocumented features"]
        A3["□ Map current architecture"]
        A4["□ Note technical debt"]
        A5["□ Identify legacy boundaries"]
    end
    
    style Assessment fill:#e3f2fd,stroke:#1976d2,color:#000
```

### Questions to Answer

| Question | Why It Matters |
|----------|----------------|
| What works well? | Keep it, document it |
| What's undocumented? | Needs specification |
| What's legacy? | Mark boundaries |
| What needs rewrite? | Plan from scratch |
| What are the implicit rules? | → Constitution |

---

## Step 2: Setup Spec Kit Structure

### Initialize in Existing Project

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart LR
    subgraph Before["Before"]
        B1["📁 src/"]
        B2["📁 tests/"]
        B3["📄 README.md"]
    end
    
    subgraph After["After"]
        A1["📁 .specify/<br/>├── memory/<br/>├── templates/<br/>├── triage/<br/>└── docs/"]
        A2["📁 specs/"]
        A3["📁 src/"]
        A4["📁 tests/"]
        A5["📄 README.md"]
    end
    
    Before --> After
    
    style After fill:#c8e6c9,stroke:#388e3c,color:#000
```

### Command to Initialize

```bash
# In project root
specify init --here --ai cursor-agent --script ps
```

---

## Step 3: Define Constitution

### Extract Implicit Rules

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TD
    subgraph Sources["Where to Find Implicit Rules"]
        S1["📄 README.md<br/>Setup instructions"]
        S2["📄 CONTRIBUTING.md<br/>Code standards"]
        S3["💬 Team knowledge<br/>Verbal conventions"]
        S4["🔍 Code patterns<br/>Repeated patterns"]
        S5["⚙️ Config files<br/>Linter, formatter rules"]
    end
    
    Sources --> Constitution["constitution.md"]
    
    style Constitution fill:#e3f2fd,stroke:#1976d2,color:#000
```

### Example Migration

**From scattered docs:**
```
README.md: "We use TypeScript"
CONTRIBUTING.md: "All PRs need tests"
.eslintrc: strict mode enabled
Team: "We prefer functional style"
```

**To Constitution:**
```markdown
## Core Principles

### I. Type Safety
All code must be written in TypeScript with strict mode.

### II. Test Coverage
Every feature must have tests before merge.

### III. Code Style
Prefer functional programming patterns over OOP.
```

---

## Step 4: Define Legacy Boundaries

### The "Legacy Box" Pattern

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TB
    subgraph Project["Project"]
        subgraph Legacy["📦 Legacy Box (Don't Touch)"]
            L1["Old Frontend"]
            L2["Legacy APIs"]
            L3["Database Schema v1"]
        end
        
        subgraph New["🆕 New Development (Spec Kit)"]
            N1["New Features"]
            N2["New APIs"]
            N3["Schema Extensions"]
        end
        
        subgraph Interface["🔗 Interface Layer"]
            I1["Adapters"]
            I2["Facades"]
        end
    end
    
    Legacy <--> Interface
    Interface <--> New
    
    style Legacy fill:#fff3e0,stroke:#ff9800,color:#000
    style New fill:#c8e6c9,stroke:#388e3c,color:#000
    style Interface fill:#e3f2fd,stroke:#1976d2,color:#000
```

### Document in Constitution

```markdown
## Legacy Boundaries

### What is Legacy (DO NOT modify without spec)
- `src/legacy/` - Old frontend components
- `api/v1/` - Original API endpoints
- Database tables: users_old, orders_v1

### Interface Rules
- New code must NOT directly import from legacy
- Use adapters in `src/adapters/` for legacy integration
- New features must have their own specs before touching legacy
```

---

## Step 5: Create Specs for Existing Features

### Retrofitting Strategy

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TD
    Feature[Existing Feature] --> Q1{Is it changing soon?}
    
    Q1 -->|No| Defer["Defer specification<br/>Document only if needed"]
    Q1 -->|Yes| Spec["Create full specification"]
    
    Spec --> Reverse["Reverse-engineer from code:<br/>1. Map user flows<br/>2. Extract requirements<br/>3. Document current behavior"]
    
    Reverse --> Validate["Validate with stakeholders"]
    Validate --> Store["Store in specs/"]
    
    Defer --> Minimal["Create minimal doc:<br/>- What it does (1 paragraph)<br/>- Key files<br/>- Main dependencies"]
    
    style Spec fill:#c8e6c9,stroke:#388e3c,color:#000
    style Defer fill:#e3f2fd,stroke:#1976d2,color:#000
```

### Minimal Legacy Documentation

```markdown
# Legacy Feature: User Authentication

**Status**: Legacy (pre-Spec Kit)
**Key Files**: 
- src/auth/login.js
- src/auth/session.js

**What it does**: 
Handles user login via email/password, session management with JWT.

**Dependencies**:
- Database: users table
- External: None

**Note**: Full specification required before any modifications.
```

---

## Step 6: Gradual Adoption

### The Hybrid Approach

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart LR
    subgraph Phases["Adoption Phases"]
        P1["Phase 1<br/>━━━━━━━━━━<br/>Constitution only<br/>+ Legacy docs"]
        P2["Phase 2<br/>━━━━━━━━━━<br/>New features<br/>get full specs"]
        P3["Phase 3<br/>━━━━━━━━━━<br/>Retrofitting<br/>as needed"]
        P4["Phase 4<br/>━━━━━━━━━━<br/>Full coverage"]
    end
    
    P1 --> P2 --> P3 --> P4
    
    style P1 fill:#ffcdd2,stroke:#c62828,color:#000
    style P2 fill:#fff9c4,stroke:#fbc02d,color:#000
    style P3 fill:#c8e6c9,stroke:#388e3c,color:#000
    style P4 fill:#e3f2fd,stroke:#1976d2,color:#000
```

### Decision Matrix: When to Spec

| Scenario | Action |
|----------|--------|
| New feature | Full spec (required) |
| Bug fix in legacy | No spec (just fix) |
| Refactor legacy | Minimal spec (document current + target) |
| Major change to legacy | Full spec (required) |
| Documentation request | Create spec retrospectively |

---

## Common Migration Scenarios

### Scenario A: Frontend Legacy + New Backend

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TB
    subgraph Legacy["Legacy (Keep as-is)"]
        FE["Frontend<br/>(React/Vue/etc)"]
    end
    
    subgraph Specify["New Development (Full Spec)"]
        API["New API Layer"]
        Agents["AI Agents"]
        DB["Database Layer"]
    end
    
    FE <-->|"Existing contracts"| API
    API <--> Agents
    API <--> DB
    
    style Legacy fill:#fff3e0,stroke:#ff9800,color:#000
    style Specify fill:#c8e6c9,stroke:#388e3c,color:#000
```

**Constitution should include:**
```markdown
### Legacy Integration
- Frontend at `frontend/` is legacy - DO NOT modify without spec
- New APIs must be backward compatible with existing frontend contracts
- All new backend work requires full Spec Kit workflow
```

### Scenario B: Monolith to Microservices

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TB
    subgraph Monolith["Legacy Monolith"]
        M1["Auth"]
        M2["Users"]
        M3["Orders"]
        M4["Payments"]
    end
    
    subgraph Extracted["Extracted Services (Spec Kit)"]
        E1["Auth Service<br/>(spec + plan)"]
        E2["User Service<br/>(spec + plan)"]
    end
    
    subgraph Remaining["Remaining in Monolith"]
        R1["Orders"]
        R2["Payments"]
    end
    
    Monolith --> Extracted
    Monolith --> Remaining
    
    style Extracted fill:#c8e6c9,stroke:#388e3c,color:#000
    style Remaining fill:#fff3e0,stroke:#ff9800,color:#000
```

### Scenario C: Adding AI Agents to Existing System

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TB
    subgraph Existing["Existing System (Legacy)"]
        App["Application"]
        DB["Database"]
        API["API"]
    end
    
    subgraph New["New Agent Layer (Full Spec)"]
        Orchestrator["Orchestrator Agent"]
        Specialist1["Specialist Agent 1"]
        Specialist2["Specialist Agent 2"]
    end
    
    subgraph Integration["Integration (Specify)"]
        Adapter["Legacy Adapter"]
    end
    
    Existing <--> Adapter
    Adapter <--> Orchestrator
    Orchestrator <--> Specialist1
    Orchestrator <--> Specialist2
    
    style Existing fill:#fff3e0,stroke:#ff9800,color:#000
    style New fill:#c8e6c9,stroke:#388e3c,color:#000
    style Integration fill:#e3f2fd,stroke:#1976d2,color:#000
```

---

## Migration Checklist

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TD
    subgraph Checklist["✅ Migration Checklist"]
        C1["□ Initialize Spec Kit structure"]
        C2["□ Create constitution.md with implicit rules"]
        C3["□ Document legacy boundaries"]
        C4["□ Create minimal docs for legacy features"]
        C5["□ Setup triage workflow for new requests"]
        C6["□ Train team on Spec Kit commands"]
        C7["□ Create first full spec for a new feature"]
        C8["□ Iterate and refine process"]
    end
    
    C1 --> C2 --> C3 --> C4 --> C5 --> C6 --> C7 --> C8
    
    style Checklist fill:#e8f5e9,stroke:#4caf50,color:#000
```

---

## Troubleshooting Migration

### Common Issues

| Issue | Solution |
|-------|----------|
| "Too much legacy to document" | Use minimal docs, full spec only when changing |
| "Team resistance" | Start with new features only, show value |
| "Unclear boundaries" | Document in constitution, iterate |
| "Mixed old/new in same files" | Create adapters, gradually separate |
| "No time for specs" | Specs save time long-term, start small |

### Success Metrics

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart LR
    subgraph Metrics["Migration Success Indicators"]
        M1["📉 Reduced rework"]
        M2["📈 Better estimates"]
        M3["🎯 Clearer requirements"]
        M4["🤝 Improved collaboration"]
        M5["📚 Living documentation"]
    end
    
    style Metrics fill:#c8e6c9,stroke:#388e3c,color:#000
```

---

## 🔄 Need Another Round?

After reviewing this migration guide, consider:
- Does your specific scenario need more detail?
- Are there edge cases not covered?
- Would additional diagrams help?


