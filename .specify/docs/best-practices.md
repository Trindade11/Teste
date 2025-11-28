# Best Practices

> Guidelines for effective Spec-Driven Development

## Golden Rules

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TB
    subgraph Rules["🏆 Golden Rules of Spec Kit"]
        R1["1️⃣ Always start with /speckit.triage<br/>when input is mixed or unclear"]
        R2["2️⃣ Constitution before Specification<br/>Rules constrain features"]
        R3["3️⃣ Specify before Plan<br/>WHAT before HOW"]
        R4["4️⃣ Plan before Tasks<br/>Architecture before breakdown"]
        R5["5️⃣ Tasks before Implement<br/>Criteria before code"]
        R6["6️⃣ Always ask 'Need another round?'<br/>at the end of each phase"]
    end
    
    R1 --> R2 --> R3 --> R4 --> R5 --> R6
    
    style Rules fill:#e8f5e9,stroke:#4caf50,color:#000
```

## The "Need Another Round?" Practice

**This is a mandatory practice in this kit.**

At the end of EVERY phase or significant output, always ask:

```
🔄 Need another round?
- What's missing?
- What needs clarification?
- What should be added?
```

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart LR
    Work[Complete Work] --> Check{Self-Review}
    Check --> Q["Ask: 'Need another round?'"]
    Q --> User{User Response}
    User -->|"Yes, add X"| Iterate[Add X]
    User -->|"No, complete"| Done[Move to next phase]
    Iterate --> Check
    
    style Q fill:#fff9c4,stroke:#fbc02d,color:#000
    style Done fill:#c8e6c9,stroke:#388e3c,color:#000
```

### Why This Matters

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TB
    subgraph Without["❌ Without 'Another Round?'"]
        W1[AI delivers output]
        W2[User finds gaps later]
        W3[Rework needed]
        W4[Time wasted]
        W1 --> W2 --> W3 --> W4
    end
    
    subgraph With["✅ With 'Another Round?'"]
        A1[AI delivers output]
        A2[AI asks about gaps]
        A3[User confirms or adds]
        A4[Complete output]
        A1 --> A2 --> A3 --> A4
    end
    
    style Without fill:#ffcdd2,stroke:#c62828,color:#000
    style With fill:#c8e6c9,stroke:#388e3c,color:#000
```

---

## Do's and Don'ts

### ✅ DO: Follow the Pipeline

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart LR
    subgraph Correct["✅ Correct Flow"]
        C1[Triage] --> C2[Constitution]
        C2 --> C3[Specify]
        C3 --> C4[Plan]
        C4 --> C5[Tasks]
        C5 --> C6[Implement]
    end
    
    style Correct fill:#c8e6c9,stroke:#388e3c,color:#000
```

### ❌ DON'T: Skip Steps

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart LR
    subgraph Wrong["❌ Skipping Steps"]
        W1[User idea] --> W2[Jump to code]
        W2 --> W3[Chaos]
        W3 --> W4[Technical debt]
        W4 --> W5[Rework]
    end
    
    style Wrong fill:#ffcdd2,stroke:#c62828,color:#000
```

---

### ✅ DO: Use Visual Diagrams

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TB
    subgraph Visual["✅ With Diagrams"]
        V1["Clear understanding"]
        V2["Gaps visible"]
        V3["Shared mental model"]
        V4["Better communication"]
    end
    
    style Visual fill:#c8e6c9,stroke:#388e3c,color:#000
```

### ❌ DON'T: Text-Only Specs

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TB
    subgraph TextOnly["❌ Text-Only"]
        T1["Ambiguous requirements"]
        T2["Hidden assumptions"]
        T3["Misalignment"]
        T4["Expensive fixes"]
    end
    
    style TextOnly fill:#ffcdd2,stroke:#c62828,color:#000
```

---

### ✅ DO: Mark Uncertainties

```markdown
## Requirements

- FR-001: User MUST be able to login
- FR-002: System MUST validate [NEEDS CLARIFICATION: what validation rules?]
- FR-003: Dashboard MUST show [NEEDS CLARIFICATION: which metrics?]
```

### ❌ DON'T: Assume or Guess

```markdown
## Requirements

- FR-001: User MUST be able to login
- FR-002: System MUST validate with regex (assuming email format)  ← BAD
- FR-003: Dashboard MUST show sales data (probably what they want)  ← BAD
```

---

## Common Anti-Patterns

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TD
    subgraph AntiPatterns["⚠️ Anti-Patterns to Avoid"]
        AP1["🚫 **Premature Implementation**<br/>Coding before spec is complete"]
        AP2["🚫 **Scope Creep in Spec**<br/>Adding features during planning"]
        AP3["🚫 **Tech in Specification**<br/>Mentioning frameworks in spec.md"]
        AP4["🚫 **Orphan Tasks**<br/>Tasks without requirement links"]
        AP5["🚫 **Monolithic Specs**<br/>One spec for entire system"]
        AP6["🚫 **Silent Assumptions**<br/>Not marking NEEDS CLARIFICATION"]
    end
    
    style AntiPatterns fill:#fff3e0,stroke:#ff9800,color:#000
```

### How to Fix Anti-Patterns

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart LR
    subgraph Fixes
        AP1["Premature Implementation"] --> Fix1["Go back to /speckit.specify"]
        AP2["Scope Creep"] --> Fix2["Create new spec for additions"]
        AP3["Tech in Spec"] --> Fix3["Move to plan.md"]
        AP4["Orphan Tasks"] --> Fix4["Link to FR-XXX"]
        AP5["Monolithic Specs"] --> Fix5["Split by feature"]
        AP6["Silent Assumptions"] --> Fix6["Mark [NEEDS CLARIFICATION]"]
    end
```

---

## Quality Checklist per Phase

### Before Moving to Next Phase

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TD
    Phase[Current Phase Complete?]
    
    Phase --> Q1{All sections filled?}
    Q1 -->|No| Fill[Fill missing sections]
    Q1 -->|Yes| Q2{Diagrams included?}
    
    Q2 -->|No| AddDiagrams[Add required diagrams]
    Q2 -->|Yes| Q3{NEEDS CLARIFICATION < 3?}
    
    Q3 -->|No| Clarify[Use /speckit.clarify]
    Q3 -->|Yes| Q4{Asked 'Another round?'}
    
    Q4 -->|No| Ask["Ask user 'Need another round?'"]
    Q4 -->|Yes, user said done| Next[✅ Proceed to next phase]
    
    Fill --> Q1
    AddDiagrams --> Q2
    Clarify --> Q3
    Ask --> Q4
    
    style Next fill:#c8e6c9,stroke:#388e3c,color:#000
```

---

## Naming Conventions

### Feature Branches and Folders

```
✅ Good:
specs/001-user-authentication/
specs/002-payment-processing/
specs/003-dashboard-analytics/

❌ Bad:
specs/auth/
specs/new-feature/
specs/update/
```

### Requirement IDs

```
✅ Good:
FR-001, FR-002, FR-003  (Functional Requirements)
SC-001, SC-002          (Success Criteria)
CONST-001, SPEC-001     (Triage entries)

❌ Bad:
req1, requirement-a, the-login-thing
```

---

## Iteration Guidelines

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000', 'secondaryTextColor': '#000', 'tertiaryTextColor': '#000', 'lineColor': '#333'}}}%%
flowchart TD
    Start[Start Feature]
    
    Start --> MVP["Define MVP<br/>(P1 stories only)"]
    MVP --> Implement1[Implement P1]
    Implement1 --> Review1{Review with user}
    
    Review1 -->|"Need changes"| Iterate1[Update spec + plan]
    Review1 -->|"Approved"| P2["Add P2 stories"]
    
    Iterate1 --> Implement1
    
    P2 --> Implement2[Implement P2]
    Implement2 --> Review2{Review}
    
    Review2 -->|"Need changes"| Iterate2[Update]
    Review2 -->|"Approved"| P3[Add P3 if needed]
    
    Iterate2 --> Implement2
    
    P3 --> Complete[Feature Complete]
    
    style MVP fill:#e3f2fd,stroke:#1976d2,color:#000
    style Complete fill:#c8e6c9,stroke:#388e3c,color:#000
```

---

## Communication Templates

### Starting a New Feature

```
I'd like to create a new feature: [brief description]

Context:
- Who will use it: [user type]
- Main goal: [what they want to achieve]
- Current situation: [how it's done today, if applicable]

Please use /speckit.triage to process this.
```

### Requesting Clarification

```
Before proceeding, I need clarification on:

1. [Question about requirement]
2. [Question about scope]
3. [Question about priority]

Please answer these so I can update the spec.
```

### Completing a Phase

```
Phase [X] complete. Summary:
- [What was done]
- [Key decisions made]
- [Open items if any]

🔄 Need another round? What should be added or clarified?
```


