# Artifact Relationships

> How all Spec Kit artifacts relate to each other

## Complete Artifact Map

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
erDiagram
    CONSTITUTION ||--o{ SPECIFICATION : constrains
    CONSTITUTION {
        string principles
        string rules
        string quality_gates
        string governance
    }
    
    SPECIFICATION ||--|| PLAN : drives
    SPECIFICATION {
        string process_flow
        string user_stories
        string requirements
        string success_criteria
    }
    
    PLAN ||--|| TASKS : breaks_into
    PLAN {
        string sequence_diagram
        string component_arch
        string tech_context
        string contracts
    }
    
    TASKS ||--o{ CODE : generates
    TASKS {
        string task_list
        string dependencies
        string acceptance_criteria
        string estimates
    }
    
    CODE }o--|| SPECIFICATION : validates
    CODE {
        string source_files
        string tests
        string configs
    }
    
    TRIAGE_CONST ||--|| CONSTITUTION : feeds
    TRIAGE_CONST {
        string entries
        string status
        string timestamps
    }
    
    TRIAGE_SPEC ||--|| SPECIFICATION : feeds
    TRIAGE_SPEC {
        string entries
        string status
        string timestamps
    }
```

## Dependency Chain

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TD
    subgraph Foundation["🏛️ Foundation Layer"]
        Constitution["constitution.md<br/>━━━━━━━━━━━━━━<br/>Project-wide rules"]
    end
    
    subgraph Feature["📋 Feature Layer"]
        Spec["spec.md<br/>━━━━━━━━━━━━━━<br/>What & Why"]
        Plan["plan.md<br/>━━━━━━━━━━━━━━<br/>How"]
        Tasks["tasks.md<br/>━━━━━━━━━━━━━━<br/>Work breakdown"]
    end
    
    subgraph Implementation["💻 Implementation Layer"]
        Code["Source Code<br/>━━━━━━━━━━━━━━<br/>Executable"]
        Tests["Test Suite<br/>━━━━━━━━━━━━━━<br/>Validation"]
    end
    
    Constitution ==>|constrains| Spec
    Spec ==>|informs| Plan
    Plan ==>|decomposes into| Tasks
    Tasks ==>|implements| Code
    Tasks ==>|validates via| Tests
    
    Code -.->|feedback| Spec
    Tests -.->|validates| Spec
    
    style Foundation fill:#e3f2fd,stroke:#1976d2,color:#000
    style Feature fill:#f3e5f5,stroke:#7b1fa2,color:#000
    style Implementation fill:#e8f5e9,stroke:#4caf50,color:#000
```

## File System Structure

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TB
    subgraph Root["📁 Project Root"]
        subgraph Specify["📁 .specify"]
            Memory["📁 memory/<br/>└── constitution.md"]
            Templates["📁 templates/<br/>├── spec-template.md<br/>└── plan-template.md"]
            Triage["📁 triage/<br/>├── triage_constitution.md<br/>├── triage_specification.md<br/>└── triage_log.json"]
            Docs["📁 docs/<br/>└── *.md (this documentation)"]
        end
        
        subgraph Specs["📁 specs"]
            Feature1["📁 001-feature-a/<br/>├── spec.md<br/>├── plan.md<br/>├── tasks.md<br/>└── research.md"]
            Feature2["📁 002-feature-b/<br/>├── spec.md<br/>├── plan.md<br/>└── tasks.md"]
        end
        
        subgraph Source["📁 src (or similar)"]
            Code["Source code<br/>generated from tasks"]
        end
    end
    
    style Specify fill:#e3f2fd,stroke:#1976d2,color:#000
    style Specs fill:#f3e5f5,stroke:#7b1fa2,color:#000
    style Source fill:#e8f5e9,stroke:#4caf50,color:#000
```

## Traceability Matrix

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart LR
    subgraph Trace["Traceability Chain"]
        direction TB
        
        Principle["🏛️ Principle<br/>(constitution.md)"]
        Requirement["📋 Requirement<br/>(spec.md FR-001)"]
        Component["🔧 Component<br/>(plan.md API)"]
        Task["📝 Task<br/>(tasks.md #1)"]
        Code["💻 Code<br/>(src/api.ts)"]
        Test["✅ Test<br/>(tests/api.test.ts)"]
    end
    
    Principle -->|"constrains"| Requirement
    Requirement -->|"implemented by"| Component
    Component -->|"broken into"| Task
    Task -->|"produces"| Code
    Requirement -->|"validated by"| Test
    Code -->|"tested by"| Test
```

## Cross-Reference Example

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TB
    subgraph Constitution
        C1["Principle: Test-First Development"]
    end
    
    subgraph Specification
        S1["FR-001: User can create account"]
        S2["SC-001: Account creation < 2min"]
    end
    
    subgraph Plan
        P1["Component: AuthService"]
        P2["Contract: POST /api/users"]
    end
    
    subgraph Tasks
        T1["Task #1: Create user model"]
        T2["Task #2: Implement endpoint"]
        T3["Task #3: Add validation"]
    end
    
    subgraph Code
        F1["src/models/user.ts"]
        F2["src/routes/users.ts"]
        F3["src/validators/user.ts"]
        Test1["tests/users.test.ts"]
    end
    
    C1 -.->|enforces| Test1
    S1 --> P1
    S1 --> P2
    S2 -.->|measured by| Test1
    
    P1 --> T1
    P2 --> T2
    P2 --> T3
    
    T1 --> F1
    T2 --> F2
    T3 --> F3
    
    style Constitution fill:#e3f2fd,stroke:#1976d2,color:#000
    style Specification fill:#f3e5f5,stroke:#7b1fa2,color:#000
    style Plan fill:#fff8e1,stroke:#f57f17,color:#000
    style Tasks fill:#e8f5e9,stroke:#4caf50,color:#000
    style Code fill:#fce4ec,stroke:#c2185b,color:#000
```

## Version & Change Tracking

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
stateDiagram-v2
    [*] --> Draft: Create
    
    Draft --> Review: Submit for review
    Review --> Draft: Request changes
    Review --> Approved: Approve
    
    Approved --> Implementing: Start work
    Implementing --> Approved: Pause
    
    Implementing --> Complete: All tasks done
    Complete --> Deprecated: Replaced
    
    Draft --> Deprecated: Cancel
    
    note right of Draft
        Initial creation
        May have [NEEDS CLARIFICATION]
    end note
    
    note right of Approved
        Ready for implementation
        All gates passed
    end note
    
    note right of Complete
        Code delivered
        Tests passing
    end note
```

## Impact Analysis

When a change occurs, what needs updating?

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TD
    Change{What changed?}
    
    Change -->|Constitution| ImpactConst
    Change -->|Specification| ImpactSpec
    Change -->|Plan| ImpactPlan
    Change -->|Code| ImpactCode
    
    subgraph ImpactConst["Constitution Change Impact"]
        IC1[Review all specs for compliance]
        IC2[Update affected plans]
        IC3[Adjust implementation if needed]
    end
    
    subgraph ImpactSpec["Specification Change Impact"]
        IS1[Update related plan]
        IS2[Re-prioritize tasks]
        IS3[Modify affected code]
        IS4[Update tests]
    end
    
    subgraph ImpactPlan["Plan Change Impact"]
        IP1[Update task breakdown]
        IP2[Modify implementation]
        IP3[Update contracts/interfaces]
    end
    
    subgraph ImpactCode["Code Change Impact"]
        IC4[Update tests]
        IC5[Verify spec compliance]
        IC6[Document if spec needs update]
    end
    
    style ImpactConst fill:#ffcdd2,stroke:#c62828,color:#000
    style ImpactSpec fill:#fff9c4,stroke:#fbc02d,color:#000
    style ImpactPlan fill:#c8e6c9,stroke:#388e3c,color:#000
    style ImpactCode fill:#e1f5fe,stroke:#0288d1,color:#000
```


