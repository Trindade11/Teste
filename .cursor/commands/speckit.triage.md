---
description: Triage user input to separate Constitution principles from Specification features. Writes to persistent backlog files for downstream agents.
handoffs: 
  - label: Process Constitution Backlog
    agent: speckit.constitution
    prompt: Process pending entries from the constitution backlog
  - label: Process Specification Backlog
    agent: speckit.specify
    prompt: Process pending entries from the specification backlog
---

## User Input

```text
$ARGUMENTS
```

You **MUST** analyze the user input and separate it into appropriate categories.

## Purpose

This command helps users who provide broad, mixed content (combining principles and features) by automatically separating what belongs to Constitution vs. Specification.

**Key Feature**: Results are persisted to backlog files that downstream agents can consume.

## File Structure

```
.specify/triage/
├── triage_constitution.md   # Backlog for constitution entries
├── triage_specification.md  # Backlog for specification entries
└── triage_log.json          # Metadata and history
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
- **Source**: speckit.triage
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
- **Source**: speckit.triage
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

### Step 3: Check for Scope Changes

Before finalizing, compare new entries with existing absorbed entries:

1. Read `.specify/triage/triage_log.json`
2. For each new entry, check if it contradicts any absorbed entry
3. If contradiction found:
   - Mark new entry as `status: pending-review`
   - Add `conflicts_with: [ENTRY_ID]` to the entry
   - Warn the user about the potential scope change

### Step 4: Present Summary to User

```markdown
# Triage Complete

## Summary

| Type | Entries Added | Pending Total |
|------|---------------|---------------|
| Constitution | [N] | [Total pending] |
| Specification | [N] | [Total pending] |

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

## Next Steps

Choose how to proceed:

- **Option A**: Process constitution backlog now (`/speckit.constitution`)
- **Option B**: Process specification backlog now (`/speckit.specify`)
- **Option C**: Review entries in backlog files first
- **Option D**: Process both in sequence (constitution first, then specification)

**Your choice**: _[A/B/C/D]_
```

### Step 5: Execute Based on User Choice

**If user chooses A**:
- Trigger `/speckit.constitution` to process pending entries

**If user chooses B**:
- Trigger `/speckit.specify` to process pending entries

**If user chooses C**:
- End command, user will review files manually

**If user chooses D**:
1. First, run `/speckit.constitution`
2. Wait for completion
3. Then run `/speckit.specify`

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

## Example

**User Input**:
> "I want to create a task management system. Always use the database we already have configured. Users can create projects and tasks. I'm not a developer so I need clear explanations. The system should have a dashboard with metrics. Always use established components."

**Triage Output**:

### Constitution Entries (3):
1. `TRG-CON-20250228-001`: "Always use the database already configured"
2. `TRG-CON-20250228-002`: "I'm not a developer, need clear explanations"
3. `TRG-CON-20250228-003`: "Always use established components"

### Specification Entries (3):
1. `TRG-SPC-20250228-001`: "Task management system" (feature: task-system)
2. `TRG-SPC-20250228-002`: "Users can create projects and tasks" (feature: project-task-management)
3. `TRG-SPC-20250228-003`: "Dashboard with metrics" (feature: metrics-dashboard)
