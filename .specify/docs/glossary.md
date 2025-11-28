# Glossary

> Definitions of terms used in Spec Kit

## Core Concepts

### Spec-Driven Development (SDD)

A methodology where **specifications are the primary artifacts**. Code is generated or assisted by AI agents that consume these specifications. The spec is the source of truth, not the code.

### Constitution

The project-wide document containing principles, rules, constraints, and quality gates that apply to ALL features. Think of it as the "laws" of your project.

**File**: `.specify/memory/constitution.md`

### Specification (Spec)

A document describing WHAT a feature does and WHY, using business language. Contains process flows, user stories, requirements, and success criteria. Does NOT include technical implementation details.

**File**: `specs/[###-feature-name]/spec.md`

### Plan

A technical document describing HOW a feature will be implemented. Contains architecture diagrams, tech stack decisions, contracts, and project structure.

**File**: `specs/[###-feature-name]/plan.md`

### Tasks

A breakdown of the plan into atomic, actionable work items with acceptance criteria and dependencies.

**File**: `specs/[###-feature-name]/tasks.md`

---

## Triage System

### Triage

The process of analyzing mixed user input and separating it into Constitution content vs Specification content.

### Triage Backlog

Persistent files that store content waiting to be processed by downstream commands.

**Files**:
- `.specify/triage/triage_constitution.md`
- `.specify/triage/triage_specification.md`
- `.specify/triage/triage_log.json`

### Entry

A single item in a triage backlog, with metadata (ID, timestamp, status, content).

### Entry Status

| Status | Meaning |
|--------|---------|
| `pending` | Waiting to be processed |
| `absorbed` | Successfully merged into target artifact |
| `superseded` | Replaced by a newer entry |
| `discarded` | Rejected by user |

---

## Commands

### /speckit.triage

Analyzes mixed input and routes content to appropriate backlogs.

### /speckit.constitution

Creates or updates the constitution from backlog or direct input.

### /speckit.specify

Creates feature specifications with diagrams, user stories, and requirements.

### /speckit.plan

Creates technical implementation plans with architecture and contracts.

### /speckit.tasks

Breaks down plans into actionable tasks with acceptance criteria.

### /speckit.implement

Generates code following the tasks and respecting the constitution.

### /speckit.clarify

Generates structured questions for ambiguous requirements.

### /speckit.analyze

Produces a consistency report across all artifacts.

### /speckit.checklist

Generates quality gate checklist for current phase.

---

## Artifacts

### Artifact

Any document produced by Spec Kit commands (constitution, spec, plan, tasks).

### Living Documentation

Documentation that evolves with the codebase, staying current through continuous updates.

### Quality Gate

A checkpoint that must pass before moving to the next phase. Defined in the constitution.

---

## Diagram Terms

### Process Flow

A flowchart showing the user journey in business language. Found in specifications.

### Sequence Diagram

A diagram showing interactions between components over time. Found in plans.

### Component Architecture

A diagram showing system structure and relationships. Found in plans.

### State Diagram

A diagram showing states and transitions. Used for lifecycles.

### ER Diagram

Entity Relationship diagram showing data models and relationships.

---

## Requirements

### Functional Requirement (FR)

A specific capability the system MUST have. Format: `FR-001`, `FR-002`, etc.

**Example**: "FR-001: System MUST allow users to create accounts"

### Success Criteria (SC)

Measurable outcomes that define success. Format: `SC-001`, `SC-002`, etc.

**Example**: "SC-001: Users can complete registration in under 2 minutes"

### NEEDS CLARIFICATION

A marker indicating that a requirement is ambiguous and needs user input before proceeding.

**Example**: "FR-003: System MUST authenticate via [NEEDS CLARIFICATION: method not specified]"

---

## User Stories

### User Story

A description of a feature from the user's perspective, with priority and acceptance scenarios.

### Priority Levels

| Priority | Meaning |
|----------|---------|
| P1 | Critical - Must have for MVP |
| P2 | Important - Should have |
| P3 | Nice to have - Could have |

### Acceptance Scenario

A testable scenario using Given/When/Then format.

**Example**: "Given a registered user, When they enter correct credentials, Then they are logged in"

---

## Technical Terms

### Tech Stack

The set of technologies (languages, frameworks, databases) chosen for implementation.

### Contract

An agreement between components about data format and behavior (API schemas, message formats).

### Traceability

The ability to link every piece of code back to a requirement.

---

## Practices

### "Need Another Round?"

The mandatory practice of asking at the end of each phase whether anything is missing or needs clarification.

### Constitution Check

The validation step ensuring a plan complies with constitution rules before implementation.

### Backlog Absorption

The process where a command reads pending entries from a backlog and marks them as processed.

---

## Abbreviations

| Abbreviation | Full Form |
|--------------|-----------|
| SDD | Spec-Driven Development |
| FR | Functional Requirement |
| SC | Success Criteria |
| MVP | Minimum Viable Product |
| API | Application Programming Interface |
| ER | Entity Relationship |

