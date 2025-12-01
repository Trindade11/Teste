# Decision Tree

> When to use which command - a practical guide

## Main Decision Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TD
    Start([You have something to add/create])
    
    Start --> Q1{What is it?}
    
    Q1 -->|"A mix of different things"| Triage[Use /speckit.triage]
    Q1 -->|"Clear single purpose"| Q2{What type?}
    
    Triage --> Sorted[Content sorted into backlogs]
    Sorted --> Q2
    
    Q2 -->|"Project rule/principle"| Constitution[Use /speckit.constitution]
    Q2 -->|"Technical Context<br/>(DB, Env, Tools)"| Context[Use /speckit.context]
    Q2 -->|"Feature/behavior"| Q3{Do you have a spec?}
    
    Q3 -->|"No"| Specify[Use /speckit.specify]
    Q3 -->|"Yes"| Q4{Do you have a plan?}
    
    Q4 -->|"No"| Plan[Use /speckit.plan]
    Q4 -->|"Yes"| Q5{Do you have tasks?}
    
    Q5 -->|"No"| Tasks[Use /speckit.tasks]
    Q5 -->|"Yes"| Implement[Use /speckit.implement]
    
    Constitution --> AskRound["🔄 Need another round?"]
    Context --> AskRound
    Specify --> AskRound
    Plan --> AskRound
    Tasks --> AskRound
    Implement --> AskRound
    AskRound --> Done([Phase complete])
    
    style Start fill:#e8f5e9,stroke:#4caf50,color:#000
    style AskRound fill:#fff3e0,stroke:#ff9800,color:#000
    style Triage fill:#fff9c4,stroke:#fbc02d,color:#000
    style Constitution fill:#e3f2fd,stroke:#1976d2,color:#000
    style Context fill:#d1c4e9,stroke:#512da8,color:#000
    style Specify fill:#f3e5f5,stroke:#7b1fa2,color:#000
    style Plan fill:#fff8e1,stroke:#f57f17,color:#000
    style Tasks fill:#c8e6c9,stroke:#388e3c,color:#000
    style Implement fill:#fce4ec,stroke:#c2185b,color:#000
    style Done fill:#e0e0e0,stroke:#9e9e9e,color:#000
```

## Input Type Decision

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TD
    Input[Your Input] --> Analyze{Analyze content}
    
    Analyze -->|"Contains 'must', 'always', 'never',<br/>'all X should'"| ProjectRule[PROJECT RULE]
    Analyze -->|"Contains 'prefer', 'use X for Y',<br/>'stack: X'"| TechPref[TECH PREFERENCE]
    Analyze -->|"Contains 'DB schema', 'env vars',<br/>'tool registry'"| ProjContext[PROJECT CONTEXT]
    Analyze -->|"Contains 'users can', 'system shows',<br/>'when X then Y'"| Feature[FEATURE]
    Analyze -->|"Contains 'create endpoint', 'add component',<br/>'implement X'"| Technical[TECHNICAL TASK]
    Analyze -->|"Mix of above"| Mixed[MIXED CONTENT]
    
    ProjectRule --> Constitution[→ /speckit.constitution]
    TechPref --> Constitution
    
    ProjContext --> ContextCmd[→ /speckit.context]
    
    Feature --> Specify[→ /speckit.specify]
    
    Technical --> Q1{Have spec?}
    Q1 -->|No| NeedSpec[First → /speckit.specify]
    Q1 -->|Yes| Q2{Have plan?}
    Q2 -->|No| Plan[→ /speckit.plan]
    Q2 -->|Yes| Tasks[→ /speckit.tasks or /speckit.implement]
    
    Mixed --> Triage[→ /speckit.triage]
    
    style Constitution fill:#e3f2fd,stroke:#1976d2,color:#000
    style ContextCmd fill:#d1c4e9,stroke:#512da8,color:#000
    style Specify fill:#f3e5f5,stroke:#7b1fa2,color:#000
    style Plan fill:#fff8e1,stroke:#f57f17,color:#000
    style Tasks fill:#e8f5e9,stroke:#4caf50,color:#000
    style Triage fill:#fff9c4,stroke:#fbc02d,color:#000
```

## Artifact State Decision

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TD
    Q1{What artifacts exist?}
    
    Q1 -->|"None"| State1[🆕 Starting fresh]
    Q1 -->|"Only constitution.md"| State2[🏛️ Have constitution]
    Q1 -->|"constitution + spec.md"| State3[📋 Have spec]
    Q1 -->|"constitution + spec + plan"| State4[🔧 Have plan]
    Q1 -->|"All including tasks"| State5[📝 Ready to implement]
    
    State1 --> Action1["Start with /speckit.constitution<br/>or /speckit.triage"]
    State2 --> Action2["Ready for /speckit.specify"]
    State3 --> Action3["Ready for /speckit.plan"]
    State4 --> Action4["Ready for /speckit.tasks"]
    State5 --> Action5["Ready for /speckit.implement"]
    
    style State1 fill:#e8f5e9,stroke:#4caf50,color:#000
    style State2 fill:#e3f2fd,stroke:#1976d2,color:#000
    style State3 fill:#f3e5f5,stroke:#7b1fa2,color:#000
    style State4 fill:#fff8e1,stroke:#f57f17,color:#000
    style State5 fill:#c8e6c9,stroke:#388e3c,color:#000
```

## Problem-Based Decision

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TD
    Problem{What problem are you solving?}
    
    Problem -->|"Need to document<br/>technical context"| P1_5
    Problem -->|"Need to establish<br/>project standards"| P1
    Problem -->|"New feature request<br/>from stakeholder"| P2
    Problem -->|"Spec exists but<br/>no architecture"| P3
    Problem -->|"Plan exists but<br/>work not organized"| P4
    Problem -->|"Tasks defined,<br/>need code"| P5
    Problem -->|"Don't know where<br/>to start"| P6
    Problem -->|"Spec unclear,<br/>need questions"| P7
    
    P1_5["Document Context"] --> Sol1_5[/speckit.context]
    P1["Standards & Rules"] --> Sol1[/speckit.constitution]
    P2["New Feature"] --> Sol2[/speckit.triage or /speckit.specify]
    P3["Need Architecture"] --> Sol3[/speckit.plan]
    P4["Need Task Breakdown"] --> Sol4[/speckit.tasks]
    P5["Need Implementation"] --> Sol5[/speckit.implement]
    P6["Confused/Mixed Input"] --> Sol6[/speckit.triage]
    P7["Ambiguity"] --> Sol7[/speckit.clarify]
    
    style Sol1_5 fill:#d1c4e9,stroke:#512da8,color:#000
    style Sol1 fill:#e3f2fd,stroke:#1976d2,color:#000
    style Sol2 fill:#f3e5f5,stroke:#7b1fa2,color:#000
    style Sol3 fill:#fff8e1,stroke:#f57f17,color:#000
    style Sol4 fill:#e8f5e9,stroke:#4caf50,color:#000
    style Sol5 fill:#fce4ec,stroke:#c2185b,color:#000
    style Sol6 fill:#fff9c4,stroke:#fbc02d,color:#000
    style Sol7 fill:#e1f5fe,stroke:#0288d1,color:#000
```

## Quick Reference Table

| If you have... | And you want... | Use this command |
|----------------|-----------------|------------------|
| Mixed input | Sorted backlogs | `/speckit.triage` |
| Technical context | Documented context | `/speckit.context` |
| Project rules | Documented constitution | `/speckit.constitution` |
| Feature idea | Formal specification | `/speckit.specify` |
| Specification | Technical plan | `/speckit.plan` |
| Plan | Actionable tasks | `/speckit.tasks` |
| Tasks | Working code | `/speckit.implement` |
| Unclear requirements | Questions to ask | `/speckit.clarify` |
| All artifacts | Consistency check | `/speckit.analyze` |
| Phase transition | Quality checklist | `/speckit.checklist` |

## Command Chain Examples

### Example 1: Complete New Feature

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart LR
    Input["User describes<br/>payment feature"]
    
    Input --> T[/speckit.triage]
    T --> CTX[/speckit.context<br/>if context exists]
    T --> C[/speckit.constitution<br/>if rules exist]
    T --> S[/speckit.specify]
    CTX --> S
    C --> S
    S --> P[/speckit.plan]
    P --> K[/speckit.tasks]
    K --> I[/speckit.implement]
    I --> Done["✅ Feature complete"]
    
    style Input fill:#e8f5e9,stroke:#4caf50,color:#000
    style Done fill:#c8e6c9,stroke:#388e3c,color:#000
```

### Example 2: Add Rule to Existing Project

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart LR
    Input["'All APIs must be versioned'"]
    
    Input --> C[/speckit.constitution]
    C --> Review["Review existing specs"]
    Review --> Update["Update affected specs"]
    Update --> Done["✅ Rule applied"]
    
    style Input fill:#e8f5e9,stroke:#4caf50,color:#000
    style Done fill:#c8e6c9,stroke:#388e3c,color:#000
```

### Example 3: Existing Spec Needs Implementation

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart LR
    Input["Have spec.md,<br/>need code"]
    
    Input --> CTX[/speckit.context<br/>(first time)]
    CTX --> P[/speckit.plan]
    P --> K[/speckit.tasks]
    K --> I[/speckit.implement]
    I --> Done["✅ Code generated"]
    
    style Input fill:#e8f5e9,stroke:#4caf50,color:#000
    style Done fill:#c8e6c9,stroke:#388e3c,color:#000
```

## Anti-Patterns

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TD
    subgraph Wrong["❌ DON'T DO THIS"]
        W1["Skip constitution → Jump to implement"]
        W2["Mix rules and features in same spec"]
        W3["Create tasks without plan"]
        W4["Implement without tasks"]
        W5["Plan without context"]
    end
    
    subgraph Right["✅ DO THIS INSTEAD"]
        R1["Constitution → Specify → Plan → Tasks → Implement"]
        R2["Triage first to separate concerns"]
        R3["Plan defines architecture, then tasks"]
        R4["Tasks define acceptance criteria, then implement"]
        R5["Context first to inform planning"]
    end
    
    W1 -.->|"Fix"| R1
    W2 -.->|"Fix"| R2
    W3 -.->|"Fix"| R3
    W4 -.->|"Fix"| R4
    W5 -.->|"Fix"| R5
    
    style Wrong fill:#ffcdd2,stroke:#c62828,color:#000
    style Right fill:#c8e6c9,stroke:#388e3c,color:#000
```


