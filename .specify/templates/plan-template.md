# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## System Interaction Diagram (Technical View) *(mandatory)*

<!--
  IMPORTANT: This diagram shows technical architecture and component interactions.
  Include: services, databases, APIs, agents, queues, etc.
  Use sequenceDiagram to show call flows.
-->

```mermaid
sequenceDiagram
  participant User as User/Client
  participant Frontend as Frontend/UI
  participant Backend as Backend/API
  participant DB as Database
  participant External as External Services
  
  %% Fill with actual system interactions
  %% Example:
  %% User->>Frontend: User action
  %% Frontend->>Backend: POST /api/resource
  %% Backend->>DB: Query/Insert
  %% DB-->>Backend: Result
  %% Backend-->>Frontend: Response JSON
  %% Frontend-->>User: Visual feedback
```

### Component Architecture

```mermaid
flowchart TB
  subgraph Frontend
    UI[User Interface]
    State[State Management]
  end
  
  subgraph Backend
    API[API Layer]
    Services[Business Logic]
    Data[Data Access]
  end
  
  subgraph Storage
    DB[(Database)]
    Cache[(Cache)]
  end
  
  subgraph External
    Ext1[External Service 1]
    Ext2[External Service 2]
  end
  
  %% Fill with actual connections
  %% UI --> API
  %% API --> Services
  %% Services --> Data
  %% Data --> DB
```

### Message Contracts (if multi-component)

| From | To | Method/Event | Payload | Response |
|------|-----|--------------|---------|----------|
| [Component A] | [Component B] | [POST /endpoint or Event] | `{ field1, field2 }` | `{ result }` |

---

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [single/web/mobile - determines source structure]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

[Gates determined based on constitution file]

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

## Agent/Component Interaction (Technical) *(include if multi-agent)*

<!--
  If the system uses multiple agents or components that interact,
  document technical contracts here.
-->

```mermaid
sequenceDiagram
  participant Orchestrator
  participant Agent1 as Specialist Agent 1
  participant Agent2 as Specialist Agent 2
  participant Store as Data Store
  
  %% Example of technical interaction between agents:
  %% Orchestrator->>Agent1: JSON { query, context }
  %% Agent1->>Store: POST /data
  %% Store-->>Agent1: { result }
  %% Agent1-->>Orchestrator: { processed_data }
```

### Agent Contracts

| Agent | Input Schema | Output Schema | Side Effects |
|-------|--------------|---------------|--------------|
| [Agent Name] | `{ field1: type, field2: type }` | `{ result: type }` | [Logs, DB writes, etc.] |
