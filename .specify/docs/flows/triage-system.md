# Triage System

> How the backlog system separates and routes content

## System Overview

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TB
    subgraph Input["📥 User Input"]
        Raw["Mixed content:<br/>rules + features + ideas"]
    end
    
    subgraph Triage["🔀 /speckit.triage"]
        Analyze[Semantic Analysis]
        Classify[Classification Engine]
    end
    
    subgraph Backlogs["📋 Persistent Backlogs"]
        ConstQ[(triage_constitution.md)]
        SpecQ[(triage_specification.md)]
        Log[(triage_log.json)]
    end
    
    subgraph Consumers["⚙️ Consumer Commands"]
        ConstCmd[/speckit.constitution]
        SpecCmd[/speckit.specify]
    end
    
    Raw --> Analyze
    Analyze --> Classify
    
    Classify -->|"Principles, Rules,<br/>Constraints"| ConstQ
    Classify -->|"Features, Behaviors,<br/>Requirements"| SpecQ
    Classify --> Log
    
    ConstQ --> ConstCmd
    SpecQ --> SpecCmd
    
    ConstCmd -->|"Mark absorbed"| ConstQ
    SpecCmd -->|"Mark absorbed"| SpecQ
    
    style Input fill:#e8f5e9,stroke:#4caf50,color:#000
    style Triage fill:#fff3e0,stroke:#ff9800,color:#000
    style Backlogs fill:#e3f2fd,stroke:#1976d2,color:#000
    style Consumers fill:#f3e5f5,stroke:#7b1fa2,color:#000
```

## Classification Criteria

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TD
    Item[Content Item] --> Q1{Project-wide?}
    
    Q1 -->|Yes| Q2{What type?}
    Q1 -->|No| Q3{Feature-specific?}
    
    Q2 -->|"Principle, Value"| Const[✅ CONSTITUTION]
    Q2 -->|"Constraint, Rule"| Const
    Q2 -->|"Quality Standard"| Const
    Q2 -->|"Tech Preference"| Const
    
    Q3 -->|Yes| Q4{What type?}
    Q3 -->|No| Ambig[⚠️ NEEDS CLARIFICATION]
    
    Q4 -->|"User Story"| Spec[✅ SPECIFICATION]
    Q4 -->|"Behavior"| Spec
    Q4 -->|"Requirement"| Spec
    Q4 -->|"Use Case"| Spec
    
    Ambig --> Spec
    
    style Const fill:#e3f2fd,stroke:#1976d2,color:#000
    style Spec fill:#f3e5f5,stroke:#7b1fa2,color:#000
    style Ambig fill:#fff9c4,stroke:#fbc02d,color:#000
```

### Examples by Type

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart LR
    subgraph Constitution["🏛️ Constitution Items"]
        C1["'All APIs must be RESTful'"]
        C2["'Use TypeScript for all code'"]
        C3["'Tests required before merge'"]
        C4["'Prefer composition over inheritance'"]
    end
    
    subgraph Specification["📋 Specification Items"]
        S1["'Users can create accounts'"]
        S2["'Dashboard shows sales data'"]
        S3["'Email notifications on order'"]
        S4["'Search with filters'"]
    end
    
    style Constitution fill:#e3f2fd,stroke:#1976d2,color:#000
    style Specification fill:#f3e5f5,stroke:#7b1fa2,color:#000
```

## Backlog File Structure

### triage_constitution.md

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TB
    subgraph File["triage_constitution.md"]
        Header["# Constitution Backlog<br/>---"]
        
        Entry1["### Entry: CONST-001<br/>**Added**: 2024-01-15T10:30:00<br/>**Status**: pending<br/>**Content**: All APIs must validate input...<br/>---"]
        
        Entry2["### Entry: CONST-002<br/>**Added**: 2024-01-15T10:31:00<br/>**Status**: absorbed<br/>**Absorbed by**: constitution.md<br/>**Absorbed at**: 2024-01-15T11:00:00<br/>**Content**: Use dependency injection...<br/>---"]
    end
    
    Header --> Entry1 --> Entry2
```

### triage_specification.md

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TB
    subgraph File["triage_specification.md"]
        Header["# Specification Backlog<br/>---"]
        
        Entry1["### Entry: SPEC-001<br/>**Added**: 2024-01-15T10:30:00<br/>**Status**: pending<br/>**Content**: User registration flow...<br/>---"]
        
        Entry2["### Entry: SPEC-002<br/>**Added**: 2024-01-15T10:32:00<br/>**Status**: absorbed<br/>**Absorbed by**: specs/001-user-auth/spec.md<br/>**Absorbed at**: 2024-01-15T12:00:00<br/>**Content**: Password reset feature...<br/>---"]
    end
    
    Header --> Entry1 --> Entry2
```

### triage_log.json

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart LR
    subgraph JSON["triage_log.json"]
        direction TB
        
        Log["[<br/>  {<br/>    id: 'TRIAGE-001',<br/>    timestamp: '2024-01-15T10:30:00',<br/>    input_summary: 'User described auth + API rules',<br/>    constitution_entries: ['CONST-001'],<br/>    specification_entries: ['SPEC-001', 'SPEC-002'],<br/>    ambiguous_entries: []<br/>  }<br/>]"]
    end
```

## Consumer Behavior

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
sequenceDiagram
    participant User
    participant Triage as /speckit.triage
    participant ConstQ as triage_constitution.md
    participant Constitution as /speckit.constitution
    participant ConstFile as constitution.md
    
    User->>Triage: Mixed input
    Triage->>ConstQ: Write entry (status: pending)
    Triage->>User: Summary + next steps
    
    User->>Constitution: Process backlog
    Constitution->>ConstQ: Read pending entries
    Constitution->>ConstFile: Merge content
    Constitution->>ConstQ: Update status: absorbed
    Constitution->>User: Confirmation
```

## Scope Change Detection

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TD
    NewEntry[New Triage Entry] --> Compare{Compare with existing}
    
    Compare --> Same[Same scope] --> Add[Add as new entry]
    
    Compare --> Contradiction[Contradicts existing]
    Contradiction --> Flag[Flag conflict]
    Flag --> UserDecision{User decides}
    UserDecision -->|Replace| Replace[Update existing]
    UserDecision -->|Keep both| Add
    UserDecision -->|Discard new| Discard[Ignore entry]
    
    Compare --> Extension[Extends existing]
    Extension --> Link[Link to parent entry]
    Link --> Add
    
    style NewEntry fill:#e8f5e9,stroke:#4caf50,color:#000
    style Flag fill:#ffcdd2,stroke:#c62828,color:#000
```

## Integration with Other Commands

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TB
    subgraph TriageSystem["Triage System"]
        ConstQ[(Constitution<br/>Backlog)]
        SpecQ[(Specification<br/>Backlog)]
    end
    
    subgraph Commands["Commands"]
        Const[/speckit.constitution]
        Spec[/speckit.specify]
        Plan[/speckit.plan]
        Tasks[/speckit.tasks]
        Impl[/speckit.implement]
    end
    
    subgraph Artifacts["Generated Artifacts"]
        ConstFile[constitution.md]
        SpecFile[spec.md]
        PlanFile[plan.md]
        TaskFile[tasks.md]
        Code[Source Code]
    end
    
    ConstQ -->|Consumes| Const
    Const -->|Produces| ConstFile
    
    SpecQ -->|Consumes| Spec
    ConstFile -->|Constrains| Spec
    Spec -->|Produces| SpecFile
    
    SpecFile -->|Input| Plan
    Plan -->|Produces| PlanFile
    
    PlanFile -->|Input| Tasks
    Tasks -->|Produces| TaskFile
    
    TaskFile -->|Input| Impl
    Impl -->|Produces| Code
    
    style TriageSystem fill:#fff3e0,stroke:#ff9800,color:#000
    style Commands fill:#e3f2fd,stroke:#1976d2,color:#000
    style Artifacts fill:#e8f5e9,stroke:#4caf50,color:#000
```


