# Project Constitution

**Version**: 1.0.0 | **Ratified**: [DATE] | **Last Amended**: [DATE]

## Core Principles

### I. Visual Modeling First

All specifications and plans must include visual diagrams (Mermaid) to:
- Facilitate understanding by all stakeholders
- Identify gaps, risks, and opportunities before implementation
- Serve as living documentation of the system

**Rules**:
- Specification: must include process flow/user journey diagram
- Plan: must include technical architecture diagram and interactions
- Flows between agents/components must be explicitly mapped

### II. User-Centric Communication

The primary user may not be a developer. All communication must:
- Use clear and accessible language
- Explain the purpose of each action/command
- Avoid unnecessary technical jargon without explanation
- Provide complete steps and ready-to-execute commands

### III. Established Components Only

Prefer widely adopted components, libraries, and patterns:
- Use official drivers/SDKs whenever available
- Avoid experimental or poorly maintained libraries
- Explicitly justify any choice outside the mainstream
- Prioritize solutions with abundant documentation and active community

### IV. Stack Consistency

The technology stack defined in the Plan must be respected throughout implementation:
- Do not suggest alternative technologies without explicit request
- Maintain consistency with dependencies already configured in the project
- Respect existing environment configurations (.env, MCP, etc.)

### V. Test-First Development

Tests are an integral part of development:
- Tests must be written/planned before implementation
- Each functional requirement must have testable acceptance criteria
- Test coverage must be considered from the specification phase

### VI. Simplicity & YAGNI

Start simple and add complexity only when necessary:
- Avoid over-engineering and premature abstractions
- Implement only what was specified
- Refactor when complexity is justified, not before

### VII. Traceability & Auditability

All artifacts must be traceable:
- Specifications linked to features
- Plans linked to specifications
- Tasks linked to plans
- Changes documented with reason and date

### VIII. Iterative Completeness ("Need Another Round?")

At the end of EVERY phase, deliverable, or significant output, always ask:

```
🔄 Need another round?
- What's missing?
- What needs clarification?
- What should be added?
```

**Rules**:
- This question is MANDATORY before closing any phase
- User must explicitly confirm completion or request additions
- Never assume the output is complete without validation
- Iterate until user confirms satisfaction

## Quality Gates

### Gate 1: Specification Ready

- [ ] Process flow visualized in Mermaid
- [ ] User stories prioritized and independently testable
- [ ] Functional requirements clear and unambiguous
- [ ] Success criteria measurable and technology-agnostic
- [ ] Maximum 3 items marked as [NEEDS CLARIFICATION]

### Gate 2: Plan Ready

- [ ] Technical architecture diagram in Mermaid
- [ ] Technology stack explicitly defined
- [ ] Contracts/interfaces between components documented
- [ ] Directory structure defined
- [ ] Constitution Check passed

### Gate 3: Implementation Ready

- [ ] Tasks broken down and prioritized
- [ ] Each task linked to a requirement
- [ ] Acceptance criteria defined per task
- [ ] Dependencies between tasks mapped

## Governance

- This Constitution takes precedence over ad-hoc practices
- Changes require documentation, justification, and version update
- Violations must be explicitly justified in the relevant artifact
- Periodic reviews of the Constitution are encouraged as the project evolves
