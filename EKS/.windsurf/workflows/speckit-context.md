---
description: Initialize or update project context documentation (env vars, database schema, tools, agents).
auto_execution_mode: 1
---

---
description: Initialize or update project context documentation (env vars, database schema, tools, agents).
handoffs:
  - label: Create Specification
    agent: speckit-specify
    prompt: Create a specification for...
  - label: Create Plan
    agent: speckit-plan
    prompt: Create a plan for the spec
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Initialize or update the `project-context/` folder with documentation for:
- **Project Workplan** (mandatory - agent orchestration plan, created first)
- **Project Overview** (mandatory macro view - created with workplan)
- Environment variables
- Database schema
- Tools and MCPs
- Agent framework (if applicable)
- Folder structure

This context is **project-specific** and lives OUTSIDE `.specify/` (which is the generic toolkit).

**Note**: 
- `project-workplan.md` is the orchestration artifact that tracks which agents to call, in what order, and their status. It guides the entire project lifecycle.
- `project-overview.md` is the central artifact that shows the project's macro view, completion status, and identified gaps.

Both are automatically updated by `/speckit-triage`, but can also be created/updated here.

## Execution Steps

### 1. Check Current State

1. Check if `project-context/` folder exists in project root
2. If it exists, list which files are present and their last modified dates
3. Report current state to user

### 2. Initialize (if new)

If `project-context/` doesn't exist:

1. Create the folder structure:
   ```
   project-context/
   ├── project-workplan.md    # 🎯 ORCHESTRATION (create first)
   ├── project-overview.md    # 🎯 MACRO VIEW (create with workplan)
   ├── env-vars.md
   ├── database-schema.md
   ├── tools-registry.md
   ├── agent-framework.md
   └── folder-structure.md
   ```

2. Copy templates from `.specify/templates/project-context/` to `project-context/`
   - Replace `-template` suffix with just the base name
   - Example: `env-vars-template.md` → `env-vars.md`

3. Update `[DATE]` placeholders with current date

4. Report created files

### 3. Update (if exists)

If `project-context/` exists, analyze what needs updating:

#### 3a. Auto-detect from project

Scan the project to auto-populate context:

**Environment Variables**:
- Look for `.env`, `.env.example`, `.env.local` files
- Extract variable names and any comments
- Update `project-context/env-vars.md` with findings
- Mark variables as "detected, needs description"

**Database Schema** (if MCP available):
- If MongoDB MCP is configured, use `collection-schema` to fetch schemas
- If other database, look for migration files or schema definitions
- Update `project-context/database-schema.md` with findings
- Mark as "auto-detected, verify accuracy"

**Tools Registry**:
- Scan `.cursor/mcp.json` or equivalent for configured MCPs
- Check `package.json` for relevant CLI tools
- Update `project-context/tools-registry.md` with findings

**Folder Structure**:
- Analyze current project structure
- Compare with recommended structure in template
- Suggest reorganization if needed
- Update `project-context/folder-structure.md`

#### 3b. Interactive update

For each context area, ask the user:

```markdown
## Context Update: [Area Name]

**Current state**: [Summary of what's documented]

**Detected changes**:
- [Change 1]
- [Change 2]

**Options**:
| Option | Action |
|--------|--------|
| A | Update with detected changes |
| B | Skip this area |
| C | Manual review needed |

**Your choice**: _[Wait for response]_
```

### 4. Validate Completeness

Check each context file for completeness:

```markdown
## Context Completeness Report

| File | Status | Missing |
|------|--------|---------|
| project-workplan.md | 🎯 Orchestration | Agent execution plan |
| project-overview.md | 🎯 Central | Project macro view |
| env-vars.md | ⚠️ Partial | 3 vars without descriptions |
| database-schema.md | ✅ Complete | - |
| tools-registry.md | ❌ Empty | Not initialized |
| agent-framework.md | ⚠️ N/A | No agents detected |
| folder-structure.md | ✅ Complete | - |
```

### 5. Create Standard Folders (Optional)

If user agrees, create recommended folders if missing:

```
project-root/
├── tests/           # All tests (if missing)
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── agents/          # Agent code (if agentic, and missing)
└── scripts/         # Utility scripts (if missing)
```

Ask user:
```markdown
## Missing Standard Folders

The following recommended folders don't exist:
- [ ] `tests/` - Centralized test folder
- [ ] `scripts/` - Utility scripts

Create these folders? (yes/no/select)
```

### 6. Report Summary

```markdown
## Context Initialization Complete

**Created/Updated**:
- 🎯 project-context/project-workplan.md (ORCHESTRATION)
- 🎯 project-context/project-overview.md (MACRO VIEW)
- ✅ project-context/env-vars.md
- ✅ project-context/database-schema.md
- ✅ project-context/tools-registry.md
- ⏭️ project-context/agent-framework.md (skipped - no agents)
- ✅ project-context/folder-structure.md

**Next Steps**:
1. 🎯 Run `/speckit-triage` to start scope clarification (updates workplan + overview)
2. Review and update `project-overview.md` with functional blocks and capture learnings
3. Review and complete `env-vars.md` descriptions
4. Verify `database-schema.md` accuracy

**Tip**: AI agents will automatically read `project-workplan.md` to know which phase you're in, then `project-overview.md` for macro context, then relevant files when processing commands.
```

## User Arguments Handling

If user provides arguments, interpret intent:

| Input | Action |
|-------|--------|
| Empty | Full initialization/update flow |
| `workplan` or `plan` | Focus on project-workplan.md only |
| `overview` or `macro` | Focus on project-overview.md only |
| `env` or `environment` | Focus on env-vars.md only |
| `db` or `database` or `schema` | Focus on database-schema.md only |
| `tools` or `mcp` | Focus on tools-registry.md only |
| `agents` or `framework` | Focus on agent-framework.md only |
| `structure` or `folders` | Focus on folder-structure.md only |
| `status` or `check` | Only report completeness, no changes |

**Note**: Project learnings and knowledge are now captured in `project-overview.md` version history rather than a separate learnings file.

## Behavior Rules

- **Project-specific content**: All files go in `project-context/`, NEVER in `.specify/`
- **Non-destructive**: Never overwrite existing content without confirmation
- **Auto-detection**: Use MCPs and file scanning to pre-populate when possible
- **Incremental**: Allow updating individual areas without full re-init
- **Validation**: Always check completeness after changes
- **Guidance**: Provide clear next steps for incomplete areas

## Integration with Other Commands

After running `/speckit-context`, other commands will:

- `/speckit-plan`: Read `env-vars.md`, `database-schema.md`, `tools-registry.md` before generating technical plans
- `/speckit-specify`: Check if context exists, warn if missing
- `/speckit-implement`: Use `folder-structure.md` for file placement guidance

## Context Reading for AI Agents

When processing any request, AI agents should:

1. Check if `project-context/` exists
2. If yes, read relevant files before responding:
   - For technical questions: `tools-registry.md`, `database-schema.md`
   - For env issues: `env-vars.md`
   - For file placement: `folder-structure.md`
   - For architecture: `agent-framework.md`
3. Reference context in responses when relevant

