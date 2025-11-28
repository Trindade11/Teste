# Agent Context

> How AI agents should interpret and use Spec Kit artifacts

## Overview for AI Agents

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TB
    subgraph Context["What AI Agents Need to Understand"]
        C1["📚 **Artifacts are Truth**<br/>Specs override verbal requests"]
        C2["🏛️ **Constitution is Law**<br/>Rules apply to ALL features"]
        C3["📊 **Diagrams are Requirements**<br/>Visual specs are binding"]
        C4["🔗 **Traceability is Mandatory**<br/>Every output links to input"]
        C5["🔄 **Iteration is Expected**<br/>Always ask 'Need another round?'"]
    end
    
    style Context fill:#e3f2fd,stroke:#1976d2,color:#000
```

## Reading Priority

When processing a request, read artifacts in this order:

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TD
    Request[User Request] --> Read1
    
    subgraph ReadOrder["Reading Order"]
        Read1["1️⃣ constitution.md<br/>Project-wide constraints"]
        Read2["2️⃣ spec.md<br/>Feature requirements"]
        Read3["3️⃣ plan.md<br/>Technical architecture"]
        Read4["4️⃣ tasks.md<br/>Work breakdown"]
    end
    
    Read1 --> Read2 --> Read3 --> Read4
    
    Read4 --> Process[Process with full context]
    
    style ReadOrder fill:#fff3e0,stroke:#ff9800,color:#000
```

## Artifact Interpretation Guide

### Constitution (constitution.md)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart LR
    subgraph Constitution["How to Interpret Constitution"]
        direction TB
        
        What["**What it contains:**<br/>- Project principles<br/>- Mandatory rules<br/>- Quality gates<br/>- Tech preferences"]
        
        How["**How to use:**<br/>- Check BEFORE generating code<br/>- Validate ALL outputs against it<br/>- Flag violations explicitly<br/>- Never override without justification"]
        
        Example["**Example rule:**<br/>'All APIs must be RESTful'<br/>→ Generate REST endpoints<br/>→ Flag if GraphQL requested"]
    end
    
    What --> How --> Example
    
    style Constitution fill:#e3f2fd,stroke:#1976d2,color:#000
```

### Specification (spec.md)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart LR
    subgraph Specification["How to Interpret Specification"]
        direction TB
        
        What["**What it contains:**<br/>- Process flow diagram<br/>- User stories (P1, P2, P3)<br/>- Functional requirements<br/>- Success criteria"]
        
        How["**How to use:**<br/>- Implement P1 first<br/>- Each FR-XXX is mandatory<br/>- Diagrams show expected flow<br/>- Success criteria = acceptance tests"]
        
        Flag["**Flag these:**<br/>- [NEEDS CLARIFICATION]<br/>- Missing edge cases<br/>- Ambiguous requirements"]
    end
    
    What --> How --> Flag
    
    style Specification fill:#f3e5f5,stroke:#7b1fa2,color:#000
```

### Plan (plan.md)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart LR
    subgraph Plan["How to Interpret Plan"]
        direction TB
        
        What["**What it contains:**<br/>- Sequence diagrams<br/>- Component architecture<br/>- Tech stack decisions<br/>- API contracts"]
        
        How["**How to use:**<br/>- Follow architecture exactly<br/>- Use specified tech stack<br/>- Implement contracts as shown<br/>- Check Constitution compliance"]
        
        Strict["**Strict adherence:**<br/>- Don't change stack<br/>- Don't add components<br/>- Don't modify contracts<br/>- without updating plan first"]
    end
    
    What --> How --> Strict
    
    style Plan fill:#fff8e1,stroke:#f57f17,color:#000
```

### Tasks (tasks.md)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart LR
    subgraph Tasks["How to Interpret Tasks"]
        direction TB
        
        What["**What it contains:**<br/>- Atomic work items<br/>- Dependencies<br/>- Acceptance criteria<br/>- Requirement links"]
        
        How["**How to use:**<br/>- Implement in order<br/>- Check criteria before 'done'<br/>- Link code to FR-XXX<br/>- Update status as you go"]
        
        Output["**Output per task:**<br/>- Working code<br/>- Passing tests<br/>- Documentation if needed"]
    end
    
    What --> How --> Output
    
    style Tasks fill:#e8f5e9,stroke:#4caf50,color:#000
```

## Decision Making

### When User Request Conflicts with Artifacts

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TD
    Conflict{User request conflicts with...}
    
    Conflict -->|Constitution| C1["❌ STOP<br/>Explain conflict<br/>Ask to update constitution first"]
    
    Conflict -->|Specification| C2["⚠️ WARN<br/>Explain impact<br/>Ask to update spec first"]
    
    Conflict -->|Plan| C3["⚠️ WARN<br/>Suggest plan update<br/>Or document deviation"]
    
    Conflict -->|Tasks| C4["✅ ADJUST<br/>Update task<br/>Proceed with change"]
    
    style C1 fill:#ffcdd2,stroke:#c62828,color:#000
    style C2 fill:#fff9c4,stroke:#fbc02d,color:#000
    style C3 fill:#fff9c4,stroke:#fbc02d,color:#000
    style C4 fill:#c8e6c9,stroke:#388e3c,color:#000
```

### When Information is Missing

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TD
    Missing{What's missing?}
    
    Missing -->|"Constitution doesn't exist"| M1["Create with /speckit.constitution<br/>or proceed with defaults"]
    
    Missing -->|"Spec incomplete"| M2["Mark [NEEDS CLARIFICATION]<br/>Ask specific questions<br/>Don't assume"]
    
    Missing -->|"Plan doesn't cover case"| M3["Suggest plan update<br/>Or ask for guidance"]
    
    Missing -->|"Task acceptance unclear"| M4["Ask: 'How will we know<br/>this is done?'"]
    
    style M1 fill:#e3f2fd,stroke:#1976d2,color:#000
    style M2 fill:#f3e5f5,stroke:#7b1fa2,color:#000
    style M3 fill:#fff8e1,stroke:#f57f17,color:#000
    style M4 fill:#e8f5e9,stroke:#4caf50,color:#000
```

## Output Guidelines

### Every AI Response Should

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TB
    subgraph Response["AI Response Checklist"]
        R1["✅ Reference relevant artifacts"]
        R2["✅ Show traceability (FR-XXX → code)"]
        R3["✅ Flag any deviations from spec"]
        R4["✅ Include visual diagrams when helpful"]
        R5["✅ End with 'Need another round?'"]
    end
    
    style Response fill:#e8f5e9,stroke:#4caf50,color:#000
```

### Code Generation Rules

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TD
    Generate[Generate Code]
    
    Generate --> Check1{Matches plan architecture?}
    Check1 -->|No| Stop1["❌ Don't generate<br/>Update plan first"]
    Check1 -->|Yes| Check2{Uses specified stack?}
    
    Check2 -->|No| Stop2["❌ Don't generate<br/>Wrong technology"]
    Check2 -->|Yes| Check3{Follows constitution?}
    
    Check3 -->|No| Stop3["❌ Don't generate<br/>Violates rules"]
    Check3 -->|Yes| Check4{Has linked requirement?}
    
    Check4 -->|No| Stop4["⚠️ Add comment<br/>// TODO: Link to FR-XXX"]
    Check4 -->|Yes| Done["✅ Generate code<br/>Include tests"]
    
    Stop4 --> Done
    
    style Done fill:#c8e6c9,stroke:#388e3c,color:#000
    style Stop1 fill:#ffcdd2,stroke:#c62828,color:#000
    style Stop2 fill:#ffcdd2,stroke:#c62828,color:#000
    style Stop3 fill:#ffcdd2,stroke:#c62828,color:#000
```

## Context Synchronization

### When Artifacts Change

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
sequenceDiagram
    participant User
    participant Agent as AI Agent
    participant Artifacts
    
    User->>Agent: Request change to spec
    Agent->>Artifacts: Read current state
    Agent->>Agent: Identify impact
    
    alt Minor change
        Agent->>Artifacts: Update spec
        Agent->>User: "Updated. Check plan for impacts."
    else Major change
        Agent->>User: "This affects plan and tasks.<br/>Update sequence:<br/>1. Spec ✓<br/>2. Plan (needs update)<br/>3. Tasks (needs update)"
    end
    
    Agent->>User: "🔄 Need another round?"
```

### Maintaining Consistency

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TD
    Change[Artifact Changed] --> Impact{Assess Impact}
    
    Impact --> Downstream["Check downstream artifacts"]
    
    Downstream --> Const["Constitution changed?"]
    Const -->|Yes| UpdateAll["Review ALL specs"]
    
    Downstream --> Spec["Specification changed?"]
    Spec -->|Yes| UpdatePlan["Update plan.md"]
    
    Downstream --> Plan["Plan changed?"]
    Plan -->|Yes| UpdateTasks["Update tasks.md"]
    
    Downstream --> Tasks["Tasks changed?"]
    Tasks -->|Yes| UpdateCode["May affect existing code"]
    
    UpdateAll --> Notify["Notify user of cascade"]
    UpdatePlan --> Notify
    UpdateTasks --> Notify
    UpdateCode --> Notify
    
    style Change fill:#fff9c4,stroke:#fbc02d,color:#000
    style Notify fill:#e3f2fd,stroke:#1976d2,color:#000
```

## Triage Backlog Consumption

### When Processing Backlog

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TD
    Start[Start command] --> CheckBacklog{Backlog exists?}
    
    CheckBacklog -->|Yes| ReadPending[Read pending entries]
    CheckBacklog -->|No| UseArgs[Use command arguments]
    
    ReadPending --> Process[Process each entry]
    Process --> Merge[Merge into artifact]
    
    Merge --> UpdateStatus["Update entry status:<br/>- absorbed_by: artifact path<br/>- absorbed_at: timestamp<br/>- absorbed_agent: command name"]
    
    UpdateStatus --> Next{More pending?}
    Next -->|Yes| Process
    Next -->|No| Summary[Report what was absorbed]
    
    UseArgs --> Merge
    
    style Start fill:#e8f5e9,stroke:#4caf50,color:#000
    style Summary fill:#c8e6c9,stroke:#388e3c,color:#000
```

## Error Handling

### When Something Goes Wrong

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TD
    Error[Error Occurred]
    
    Error --> Type{Error Type}
    
    Type -->|"Missing artifact"| E1["Create required artifact<br/>using appropriate command"]
    
    Type -->|"Conflicting requirements"| E2["Flag conflict<br/>Ask user to resolve<br/>Don't proceed until clear"]
    
    Type -->|"Technical impossibility"| E3["Explain why impossible<br/>Suggest alternatives<br/>Update spec if needed"]
    
    Type -->|"Ambiguous requirement"| E4["Mark [NEEDS CLARIFICATION]<br/>Ask specific questions<br/>Don't assume"]
    
    E1 --> Continue[Continue with context]
    E2 --> Wait[Wait for user]
    E3 --> Propose[Propose solution]
    E4 --> Ask[Ask questions]
    
    style Error fill:#ffcdd2,stroke:#c62828,color:#000
```


