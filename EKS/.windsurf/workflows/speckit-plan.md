---
description: Execute the implementation planning workflow using the plan template to generate design artifacts.
auto_execution_mode: 1
---

---
description: Execute the implementation planning workflow using the plan template to generate design artifacts.
handoffs: 
  - label: Create Tasks
    agent: speckit-tasks
    prompt: Break the plan into tasks
    send: true
  - label: Create Checklist
    agent: speckit-checklist
    prompt: Create a checklist for the following domain...
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Run `.specify/scripts/powershell/setup-plan.ps1 -Json` from repo root and parse JSON for FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Load context**: 
   - Read FEATURE_SPEC and `.specify/memory/constitution.md`
   - Load IMPL_PLAN template (already copied)
   - **Load project context** (if exists):
     - `project-context/project-overview.md` - **🎯 READ FIRST** - Macro view and status
     - `project-context/env-vars.md` - Available environment variables
     - `project-context/database-schema.md` - Database structure and semantics
     - `project-context/tools-registry.md` - Available MCPs and tools
     - `project-context/agent-framework.md` - Agent architecture (if agentic)
     - `project-context/folder-structure.md` - Project organization
   - If `project-context/` doesn't exist, warn user to run `/speckit-triage` first

3. **Execute plan workflow**: Follow the structure in IMPL_PLAN template to:
   - **MANDATORY**: Generate System Interaction Diagram in Mermaid (sequenceDiagram showing component interactions)
   - **MANDATORY**: Generate Component Architecture diagram in Mermaid (flowchart showing system structure)
   - Fill Technical Context (mark unknowns as "NEEDS CLARIFICATION")
   - Fill Constitution Check section from constitution
   - Evaluate gates (ERROR if violations unjustified)
   - Phase 0: Generate research.md (resolve all NEEDS CLARIFICATION)
   - Phase 1: Generate data-model.md, contracts/, quickstart.md
   - Phase 1: Update agent context by running the agent script
   - Re-evaluate Constitution Check post-design
   - If multi-agent system: Document Agent Contracts table with input/output schemas

4. **Stop and report**: Command ends after Phase 2 planning. Report branch, IMPL_PLAN path, and generated artifacts.

5. **Update Project Overview** (MANDATORY):
   
   After creating/updating a plan, update `project-context/project-overview.md`:
   
   - Update Status Table: Increment Plans count, update emoji
   - Update Blocos Funcionais: Mark Plan column as 🟡/🟢
   - Add Technical View: Update Visão Técnica table with components/integrations from plan
   - Increment version if significant change
   - Add entry to version history

6. **Update Project Workplan** (MANDATORY):

   After creating/updating a plan, update `project-context/project-workplan.md`:

   a. **Update Agent Execution Plan**:
      - Mark `/speckit-plan` as 🔄 IN_PROGRESS (or ✅ DONE if all plans complete)
   
   b. **Update Decision Points**:
      - If project structure was defined in plan → Mark DP1 as ✅ DONE
      - Update `folder-structure.md` with structure from plan
   
   c. **Update Current Phase**:
      - Set "Next Recommended Action" based on:
        - Plan ready for tasks → "Run `/speckit-tasks` for [feature]"
        - More features need planning → "Run `/speckit-plan` for [next feature]"

## Phases

### Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```text
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

### Phase 1: Design & Contracts

**Prerequisites:** `research.md` complete

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Agent context update**:
   - Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType cursor-agent`
   - These scripts detect which AI agent is in use
   - Update the appropriate agent-specific context file
   - Add only new technology from current plan
   - Preserve manual additions between markers

**Output**: data-model.md, /contracts/*, quickstart.md, agent-specific file

## Key rules

- Use absolute paths
- ERROR on gate failures or unresolved clarifications
