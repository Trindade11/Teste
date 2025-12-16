---
description: Triage user input to separate Constitution principles from Specification features. Writes to persistent backlog files for downstream agents.
auto_execution_mode: 1
---

---
description: Triage user input to separate Constitution principles from Specification features. Writes to persistent backlog files for downstream agents.
handoffs: 
  - label: Process Constitution Backlog
    agent: speckit-constitution
    prompt: Process pending entries from the constitution backlog
  - label: Process Specification Backlog
    agent: speckit-specify
    prompt: Process pending entries from the specification backlog
---

## User Input

```text
$ARGUMENTS
```

You **MUST** analyze the user input and separate it into appropriate categories.

## Purpose

This command helps users who provide broad, mixed content (combining principles and features) by automatically separating what belongs to Constitution vs. Specification.

**Key Features**:
- Results are persisted to backlog files that downstream agents can consume
- Creates/updates `project-workplan.md` to orchestrate agent execution
- Supports **multi-round interactions** to progressively refine scope
- Guides user on which agent to call next

## File Structure

```
.specify/triage/
├── triage_constitution.md   # Backlog for constitution entries
├── triage_specification.md  # Backlog for specification entries
└── triage_log.json          # Metadata and history

project-context/
├── project-workplan.md      # 🎯 Agent orchestration plan
├── project-overview.md      # 🎯 Macro view of project
└── ...                      # Other context files
```

## Triage Process

### Step 1: Analyze the Input

Read the entire input and identify:

1. **Constitution Content** (principles, rules, constraints):
   - Statements that apply to ALL features (not just one)
   - Long-term principles that won't change per feature
   - Quality standards, coding practices, architectural constraints
   - User profile/preferences that affect how AI should behave
   - Technology stack preferences (without specific implementation)
   - Compliance, security, or regulatory requirements
   
   **Indicators**:
   - "Always...", "Never...", "All features must..."
   - "The system should always...", "We prefer..."
   - "Our stack is...", "We use..."
   - "I'm not a developer, so..."

2. **Specification Content** (features, behaviors, capabilities):
   - Specific functionality to be built
   - User stories and journeys
   - Particular screens, APIs, or interactions
   - Feature-specific requirements
   - Measurable outcomes for a specific capability
   
   **Indicators**:
   - "Build a...", "Create a...", "I want to..."
   - "The user should be able to..."
   - "When the user clicks...", "The screen shows..."
   - Specific workflow descriptions

3. **Ambiguous Content** (needs clarification):
   - Statements that could be either principle or feature
   - Incomplete thoughts that need more context

### Step 2: Write to Backlog Files

After analysis, persist the results:

#### For Constitution entries:

Append to `.specify/triage/triage_constitution.md`:

```markdown
### Entry [ENTRY_ID]

- **Created**: [YYYY-MM-DD HH:MM]
- **Source**: speckit-triage
- **Status**: pending

#### Content

[Extracted principle/rule text]

#### Context

[Why this was classified as Constitution]

---
```

#### For Specification entries:

Append to `.specify/triage/triage_specification.md`:

```markdown
### Entry [ENTRY_ID]

- **Created**: [YYYY-MM-DD HH:MM]
- **Source**: speckit-triage
- **Status**: pending

#### Content

[Extracted feature/behavior text]

#### Suggested Feature Name

[Short name for the feature, 2-4 words]

#### Context

[Why this was classified as Specification]

---
```

#### Update triage_log.json:

Add entry to the `entries` array:

```json
{
  "id": "[ENTRY_ID]",
  "timestamp": "[ISO 8601 timestamp]",
  "type": "constitution|specification",
  "status": "pending",
  "summary": "[Brief summary]",
  "absorbed_by": null,
  "absorbed_at": null,
  "output_ref": null
}
```

### Step 3: Generate/Update Project Workplan (ORCHESTRATION)

**This step ensures the user knows which agent to call next.**

1. **Check if `project-context/project-workplan.md` exists**:
   - If NO: Create it from template `.specify/templates/project-context/project-workplan-template.md`
   - If YES: Read it for updating

2. **Update Agent Execution Plan**:
   - Mark `/speckit-context` as ✅ DONE or ⏭️ SKIPPED based on whether `project-context/` exists
   - Mark `/speckit-triage` as 🔄 IN_PROGRESS
   - Keep other phases as ⬜ TODO

3. **Log Triage Round**:
   - Add entry to "Triage Rounds Log" table:
     - Round number (increment from last)
     - Date
     - Focus (main topics discussed)
     - Outputs updated
     - Gaps remaining

4. **Update Backlog Summary**:
   - List pending Constitution items
   - List pending Specification items

5. **Update Current Phase**:
   - Set "Active Phase" to current phase
   - Set "Next Recommended Action" based on:
     - If many gaps remain → "Continue `/speckit-triage` to clarify..."
     - If constitution backlog has items → "Run `/speckit-constitution` to consolidate principles"
     - If spec backlog has items and constitution is stable → "Run `/speckit-specify` for priority features"

6. **Check Decision Points**:
   - If project structure is discussed → Update DP1 status
   - If tech stack is discussed → Update DP2 status

### Step 4: Generate/Update Project Overview (MACRO VISION)

**This step ensures the user always has a visual macro view of the project.**

1. **Check if `project-context/project-overview.md` exists**:
   - If NO: Create it from template `.specify/templates/project-context/project-overview-template.md`
   - If YES: Read it for updating

2. **Extract Macro Blocks from Specification entries**:
   - Analyze all specification entries (new + existing)
   - Group related features into functional blocks (maximum 5–7 blocks)
   - Each block = major capability or domain area

3. **Generate/Update the Macro Diagram**:

   ```mermaid
   %%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000'}}}%%
   flowchart TD
       subgraph Sistema["🎯 [PROJECT NAME]"]
           B1["📦 [Block 1 Name]"]
           B2["📦 [Block 2 Name] ?"]:::gap
           B3["📦 [Block 3 Name] ?"]:::gap
       end
       
       classDef gap fill:#ffcdd2,stroke:#c62828,stroke-dasharray:5,color:#000
   ```

   **Rules for blocks**:
   - Blocks with pending specs → Add `?` suffix and `:::gap` class
   - Blocks with complete specs → Remove gap styling
   - Show connections between blocks based on data/process flow

4. **Update Status Table**:

   | Artifact | Status | Progress |
   |----------|--------|----------|
   | Constitution | [Calculate from pending entries] | X% |
   | Specs | [Count pending vs total] | N/M |
   | Plans | [Count if any] | N/M |

5. **List Gaps**:
   - Convert ambiguous content to gaps
   - Add new gaps from unclear specification entries
   - Mark gaps as critical (block progress) or attention (can proceed)

6. **Write to `project-context/project-overview.md`**:
   - Create folder if it doesn't exist
   - Preserve existing content that wasn't generated
   - Update version number (V1, V2, V3...)
   - Add entry to version history

7. **Cross-reference with Workplan**:
   - Ensure overview status matches workplan phase
   - Link gaps in overview to decision points in workplan

**Example Output**:

```markdown
## 🎯 Project Macro View

> Task management system for remote teams

### Main Blocks Diagram

[Mermaid diagram with blocks]

## 📊 Completion Status

| Artifact | Status | Progress |
|----------|--------|----------|
| Constitution | 🟡 Draft | 3 entries pending |
| Specs | 🔴 Pending | 0/3 |

## ⚠️ Identified Gaps

- [ ] **[GAP-001]**: How will authentication work?
- [ ] **[GAP-002]**: Calendar integration?
```

### Step 5: Check for Scope Changes

Before finalizing, compare new entries with existing absorbed entries:

1. Read `.specify/triage/triage_log.json`
2. For each new entry, check if it contradicts any absorbed entry
3. If contradiction found:
   - Mark new entry as `status: pending-review`
   - Add `conflicts_with: [ENTRY_ID]` to the entry
   - Warn the user about the potential scope change

### Step 6: Present Summary to User

```markdown
# Triage Round [N] Complete

## 📋 Workplan Status

| Phase | Agent | Status |
|-------|-------|--------|
| Setup | `/speckit-context` | [✅/⏭️] |
| Triage | `/speckit-triage` | 🔄 IN_PROGRESS |
| Constitution | `/speckit-constitution` | ⬜ TODO |
| Specification | `/speckit-specify` | ⬜ TODO |
| Planning | `/speckit-plan` | ⬜ TODO |

## Summary

| Type | Entries Added | Pending Total |
|------|---------------|---------------|
| Constitution | [N] | [Total pending] |
| Specification | [N] | [Total pending] |

## 🎯 Artifacts Updated

- `project-context/project-workplan.md` → Round [N] logged
- `project-context/project-overview.md` → V[N] (added [X] blocks)

## ⚠️ Open Gaps

- [?] [Gap 1 description]
- [?] [Gap 2 description]

## 🔀 Decision Points

| ID | Decision | Status |
|----|----------|--------|
| DP1 | Project Structure | [⬜/🔄/✅] |
| DP2 | Tech Stack | [⬜/🔄/✅] |

## Constitution Entries Added

| ID | Summary | Status |
|----|---------|--------|
| [ID] | [Brief] | pending |

## Specification Entries Added

| ID | Summary | Status |
|----|---------|--------|
| [ID] | [Brief] | pending |

## Scope Alerts

[List any conflicts or scope changes detected]

---

## 🎯 Recommended Next Steps

1. [Primary recommendation based on current state]
2. [Alternative option]
3. [Another alternative]

**What would you like to focus on next?**
```

### Step 7: Execute Based on User Choice

**If user chooses A**:
- Trigger `/speckit-constitution` to process pending entries

**If user chooses B**:
- Trigger `/speckit-specify` to process pending entries

**If user chooses C**:
- End command, user will review files manually

**If user chooses D**:
1. First, run `/speckit-constitution`
2. Wait for completion
3. Then run `/speckit-specify`

**If user wants more triage**:
- Continue conversation in same session
- Each round updates workplan and overview
- Guide user toward decision points when appropriate

## Entry ID Format

Use format: `TRG-[TYPE]-[YYYYMMDD]-[SEQ]`

Examples:
- `TRG-CON-20250228-001` (Constitution entry)
- `TRG-SPC-20250228-001` (Specification entry)

## Guidelines

### What Goes to Constitution:

- User profile: "I'm not a developer", "I prefer visual explanations"
- Stack preferences: "We use [specific database]", "Prefer official drivers"
- Quality standards: "Always include tests", "Use established libraries"
- Communication style: "Explain commands before running", "Use simple language"
- Architectural principles: "Event-driven", "Microservices", "Multi-tenant"
- Compliance: "Compliance X required", "Audit trail mandatory"

### What Goes to Specification:

- Specific features: "Build a dashboard", "Create login screen"
- User stories: "User can upload files", "Admin can manage users"
- Workflows: "When user submits form, system validates and saves"
- Integrations: "Connect to external service X"
- Specific screens/pages: "Home page shows...", "Settings screen has..."

### Handling Voice Transcriptions:

Voice input often mixes topics. When processing voice transcriptions:
1. Clean up repetitions and filler words
2. Identify topic shifts (often indicated by "also", "another thing", "by the way")
3. Group related thoughts even if scattered in the input
4. Ask for clarification on truly ambiguous parts

### Multi-Round Triage:

Triage is designed for **N interactions**, not one-shot:

1. **Round 1**: Capture initial vision, objective, product type
   - Create workplan V1 and overview V1
   - Identify major gaps

2. **Round 2..N**: Progressively refine
   - Deepen personas, use cases, constraints
   - Update workplan with clearer recommendations
   - Mark gaps as resolved or escalate to decision points

3. **Exit criteria**: Move to next phase when:
   - Macro view is stable (no major new blocks expected)
   - Constitution backlog has clear items to process
   - At leas