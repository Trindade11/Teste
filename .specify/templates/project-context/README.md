# Project Context Templates

> Templates for documenting project-specific technical context

## Overview

These templates help you document critical project information that AI agents need to work effectively. This documentation lives in your project's `project-context/` folder (outside `.specify/`).

## Quick Start

1. Run `/speckit.context` to initialize your project context
2. Fill in each template with your project's specific information
3. AI agents will automatically read this context when processing requests

## Templates

| Template | Purpose | When to Fill |
|----------|---------|--------------|
| `env-vars.md` | Environment variables documentation | After setting up `.env` |
| `database-schema.md` | Semantic database schema | When designing data model |
| `tools-registry.md` | Available tools and MCPs | After configuring integrations |
| `agent-framework.md` | Agent architecture documentation | If building agentic system |
| `folder-structure.md` | Project organization guide | At project start |
| `learnings.md` | Project learnings and decisions | Ongoing throughout project |

## File Structure

After running `/speckit.context`, your project will have:

```
project-root/
├── .specify/              # Spec Kit (generic toolkit)
│   └── templates/
│       └── project-context/  # These templates
│
├── project-context/       # YOUR PROJECT'S CONTEXT (specific)
│   ├── env-vars.md
│   ├── database-schema.md
│   ├── tools-registry.md
│   ├── agent-framework.md
│   ├── folder-structure.md
│   └── learnings.md
│
├── tests/                 # All test files
├── agents/                # Agent definitions (if applicable)
├── docs/                  # Project-specific documentation & diagrams
│   └── flows/             # Mermaid diagrams for project flows
└── ...
```

## Why This Matters

### For AI Agents

- **Faster context loading**: Agents read structured docs instead of scanning code
- **Consistent understanding**: Same context interpretation across all interactions
- **Reduced hallucination**: Real env vars, real schemas, real tools
- **Better suggestions**: Agents know what's available and what's not

### For Humans

- **Onboarding**: New team members understand project setup quickly
- **Documentation**: Single source of truth for technical context
- **Decision history**: Learnings file captures why decisions were made

## Best Practices

1. **Keep it current**: Update context when things change
2. **Be specific**: Use actual values, not placeholders
3. **Add semantic meaning**: Explain WHAT things are, not just list them
4. **Link to details**: Reference external docs when needed
5. **Review periodically**: Context can drift from reality

## Related

- Constitution principle IX: Project Context Documentation
- Constitution principle X: Folder Organization
- `/speckit.context` command

