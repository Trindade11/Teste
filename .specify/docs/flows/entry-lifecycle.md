# Entry Lifecycle

> State machine for triage entries and artifacts

## Triage Entry States

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
stateDiagram-v2
    [*] --> Pending: Created by /speckit.triage
    
    Pending --> Processing: Consumer command starts
    Processing --> Absorbed: Successfully integrated
    Processing --> Pending: Processing failed
    
    Absorbed --> [*]
    
    Pending --> Superseded: Newer entry replaces
    Superseded --> [*]
    
    Pending --> Discarded: User rejects
    Discarded --> [*]
    
    note right of Pending
        Waiting for consumer
        command to process
    end note
    
    note right of Absorbed
        Content merged into
        target artifact
    end note
    
    note right of Superseded
        Replaced by newer
        conflicting entry
    end note
```

## Detailed State Transitions

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TD
    subgraph States
        Created["🆕 CREATED<br/>Entry just triaged"]
        Pending["⏳ PENDING<br/>Waiting for processing"]
        Processing["⚙️ PROCESSING<br/>Being consumed"]
        Absorbed["✅ ABSORBED<br/>Merged into artifact"]
        Superseded["🔄 SUPERSEDED<br/>Replaced by newer"]
        Discarded["❌ DISCARDED<br/>Rejected by user"]
    end
    
    Created --> Pending
    
    Pending -->|"/speckit.constitution<br/>or /speckit.specify"| Processing
    Pending -->|"Conflicting entry added"| Superseded
    Pending -->|"User cancels"| Discarded
    
    Processing -->|"Successfully merged"| Absorbed
    Processing -->|"Error or conflict"| Pending
    
    style Created fill:#e8f5e9,stroke:#4caf50,color:#000
    style Pending fill:#fff9c4,stroke:#fbc02d,color:#000
    style Processing fill:#e3f2fd,stroke:#1976d2,color:#000
    style Absorbed fill:#c8e6c9,stroke:#388e3c,color:#000
    style Superseded fill:#fff3e0,stroke:#ff9800,color:#000
    style Discarded fill:#ffcdd2,stroke:#c62828,color:#000
```

## Entry Metadata

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TB
    subgraph Entry["Triage Entry Structure"]
        direction TB
        
        ID["**id**: CONST-001 or SPEC-001"]
        Added["**added_at**: ISO timestamp"]
        Status["**status**: pending | absorbed | superseded | discarded"]
        Content["**content**: The actual text/requirement"]
        
        subgraph WhenAbsorbed["When Absorbed"]
            AbsorbedBy["**absorbed_by**: Target artifact path"]
            AbsorbedAt["**absorbed_at**: ISO timestamp"]
            AbsorbedAgent["**absorbed_agent**: Which command processed"]
        end
        
        subgraph WhenSuperseded["When Superseded"]
            SupersededBy["**superseded_by**: New entry ID"]
            SupersededAt["**superseded_at**: ISO timestamp"]
        end
    end
    
    ID --> Added --> Status --> Content
    Status -->|"= absorbed"| WhenAbsorbed
    Status -->|"= superseded"| WhenSuperseded
```

## Artifact Lifecycle

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
stateDiagram-v2
    [*] --> Draft
    
    state Draft {
        [*] --> Initial: Create from template
        Initial --> Incomplete: Missing info
        Incomplete --> Initial: Add content
        Initial --> Complete: All sections filled
    }
    
    Draft --> InReview: Gate check
    
    state InReview {
        [*] --> Checking
        Checking --> Passed: All gates pass
        Checking --> Failed: Gate violations
        Failed --> Checking: Fix issues
    }
    
    InReview --> Approved: Ready for next phase
    InReview --> Draft: Major changes needed
    
    Approved --> Active: Implementation starts
    
    state Active {
        [*] --> Current
        Current --> Updated: Changes made
        Updated --> Current: Version incremented
    }
    
    Active --> Deprecated: Replaced or obsolete
    Active --> Archived: Project complete
    
    Deprecated --> [*]
    Archived --> [*]
```

## Constitution Entry Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
sequenceDiagram
    participant User
    participant Triage as /speckit.triage
    participant Backlog as triage_constitution.md
    participant Command as /speckit.constitution
    participant Artifact as constitution.md
    
    User->>Triage: "All code must be typed"
    activate Triage
    Triage->>Triage: Classify as Constitution
    Triage->>Backlog: Add entry (status: pending)
    Triage-->>User: Entry CONST-001 created
    deactivate Triage
    
    User->>Command: Process backlog
    activate Command
    Command->>Backlog: Read pending entries
    Command->>Artifact: Load existing
    Command->>Command: Merge content
    Command->>Artifact: Write updated
    Command->>Backlog: Update status: absorbed
    Command-->>User: Constitution updated
    deactivate Command
```

## Specification Entry Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
sequenceDiagram
    participant User
    participant Triage as /speckit.triage
    participant Backlog as triage_specification.md
    participant Command as /speckit.specify
    participant Const as constitution.md
    participant Spec as specs/###/spec.md
    
    User->>Triage: "Users can reset password"
    activate Triage
    Triage->>Triage: Classify as Specification
    Triage->>Backlog: Add entry (status: pending)
    Triage-->>User: Entry SPEC-001 created
    deactivate Triage
    
    User->>Command: Create spec for password reset
    activate Command
    Command->>Backlog: Read pending entries
    Command->>Const: Load constraints
    Command->>Command: Generate spec content
    Command->>Command: Create diagrams
    Command->>Spec: Write spec.md
    Command->>Backlog: Update status: absorbed
    Command-->>User: Spec created
    deactivate Command
```

## Conflict Resolution

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TD
    New[New Entry] --> Check{Conflict with existing?}
    
    Check -->|No conflict| Add[Add as new pending entry]
    
    Check -->|Same topic, different content| Conflict
    
    subgraph Conflict["Conflict Detected"]
        Compare[Compare entries]
        Compare --> Options
        
        Options -->|"New supersedes old"| Supersede
        Options -->|"Keep both"| KeepBoth
        Options -->|"Merge content"| Merge
        Options -->|"Discard new"| DiscardNew
        
        Supersede[Mark old as SUPERSEDED]
        KeepBoth[Add both as PENDING]
        Merge[Combine into single entry]
        DiscardNew[Reject new entry]
    end
    
    Supersede --> Add
    KeepBoth --> Add
    Merge --> Add
    DiscardNew --> Done[No change]
    
    style New fill:#e8f5e9,stroke:#4caf50,color:#000
    style Conflict fill:#fff9c4,stroke:#fbc02d,color:#000
```

## Batch Processing

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TD
    Start([Start batch processing]) --> Load[Load all pending entries]
    
    Load --> Sort[Sort by timestamp]
    
    Sort --> Loop{More entries?}
    
    Loop -->|Yes| Process[Process next entry]
    Process --> Result{Success?}
    
    Result -->|Yes| Mark[Mark as absorbed]
    Result -->|No| Skip[Keep as pending, log error]
    
    Mark --> Loop
    Skip --> Loop
    
    Loop -->|No| Summary[Generate summary]
    
    Summary --> Report["Report:<br/>- X entries absorbed<br/>- Y entries skipped<br/>- Z conflicts found"]
    
    Report --> Done([End])
    
    style Start fill:#e8f5e9,stroke:#4caf50,color:#000
    style Done fill:#c8e6c9,stroke:#388e3c,color:#000
```

## Timeline View

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
gantt
    title Entry Lifecycle Timeline
    dateFormat  HH:mm
    
    section Entry CONST-001
    Created (Triage)     :milestone, m1, 10:00, 0m
    Pending              :a1, 10:00, 30m
    Processing           :a2, after a1, 10m
    Absorbed             :milestone, m2, 10:40, 0m
    
    section Entry SPEC-001
    Created (Triage)     :milestone, m3, 10:05, 0m
    Pending              :b1, 10:05, 55m
    Processing           :b2, after b1, 15m
    Absorbed             :milestone, m4, 11:15, 0m
    
    section Entry SPEC-002
    Created (Triage)     :milestone, m5, 10:10, 0m
    Pending              :c1, 10:10, 20m
    Superseded           :milestone, m6, 10:30, 0m
```


