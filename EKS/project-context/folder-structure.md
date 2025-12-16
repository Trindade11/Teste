# Folder Structure

> Documentation of project organization and directory purposes

**Last Updated**: 2025-12-06

## Project Root

```
CVCStartups/
│
├── Spec-Orchestrator/     # Spec Kit (DO NOT modify for project-specific content)
│   ├── .specify/          # Methodology toolkit
│   │   ├── docs/          # Methodology documentation
│   │   ├── memory/        # Constitution and project rules
│   │   ├── templates/     # Artifact templates
│   │   └── triage/        # Triage backlog system
│   └── commands/          # Spec Kit commands
│
├── .windsurf/             # Windsurf IDE configuration
│   ├── rules/             # specrules.md
│   └── workflows/         # Spec Kit workflows
│
├── project-context/       # ✅ Project-specific documentation
│   ├── project-workplan.md    # 🎯 Orchestration plan
│   ├── project-overview.md    # 🎯 Macro view
│   ├── env-vars.md            # Environment variables
│   ├── database-schema.md     # Database documentation
│   ├── tools-registry.md      # Available tools and MCPs
│   └── folder-structure.md    # This file
│
├── specs/                 # Feature specifications (to be created)
│   └── [###-feature-name]/
│       ├── spec.md        # Feature specification
│       ├── plan.md        # Technical plan
│       ├── tasks.md       # Implementation tasks
│       └── checklists/    # Quality checklists
│
├── frontend/              # ✅ Next.js Frontend (CREATED)
│   ├── src/
│   │   ├── app/           # App Router (layout, page, globals.css)
│   │   ├── components/
│   │   │   ├── ui/        # Base components (Button, etc.)
│   │   │   ├── layout/    # Sidebar, MobileNav
│   │   │   ├── chat/      # ChatPanel, AgentSelector
│   │   │   └── canvas/    # Canvas visual
│   │   ├── store/         # Zustand stores
│   │   └── lib/           # Utilities
│   ├── public/            # Static assets
│   ├── package.json
│   └── README.md
│
├── backend/               # Node.js Backend (to be created)
│   ├── src/
│   │   ├── api/           # REST endpoints
│   │   ├── services/      # Business logic
│   │   └── config/        # Configuration
│   └── tests/
│
├── agents/                # Python/Agno Agents (to be created)
│   └── knowledge_pipeline/
│       ├── orchestrator.py
│       └── agents/
│
├── tests/                 # ALL test files (to be created)
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── e2e/               # End-to-end tests
│
├── scripts/               # Utility scripts (to be created)
│   └── setup.sh           # Project setup scripts
│
└── docs/                  # Additional documentation (to be created)
    ├── api/               # API documentation
    └── guides/            # User guides
```

---

## Directory Purposes

### `Spec-Orchestrator/.specify/` - Spec Kit (Generic)

**Purpose**: Methodology toolkit, NOT project-specific content

| Folder | Contents | Modify? |
|--------|----------|---------|
| `docs/` | Methodology guides, flows | No |
| `memory/` | Constitution, rules | Yes (carefully) |
| `templates/` | Artifact templates | Rarely |
| `triage/` | Input backlog system | Auto-managed |

**Rule**: Never put project-specific content here. Use `project-context/` instead.

---

### `project-context/` - Project Documentation ✅

**Purpose**: Project-specific technical documentation

| File | Contents | Update Frequency |
|------|----------|-----------------|
| `project-workplan.md` | Agent orchestration plan | Every command |
| `project-overview.md` | Macro view & status | Every significant change |
| `env-vars.md` | Environment variables | When env changes |
| `database-schema.md` | DB structure | When schema changes |
| `tools-registry.md` | Available tools | When tools added |
| `folder-structure.md` | This file | When structure changes |

---

### `specs/` - Feature Specifications

**Purpose**: Spec Kit artifacts for each feature

```
specs/
├── 001-feature-name/
│   ├── spec.md           # What & Why
│   ├── plan.md           # How (technical)
│   ├── tasks.md          # Work breakdown
│   └── checklists/
│       └── requirements.md
```

**Naming Convention**: `[###]-[short-name]/`

---

### `src/` - Source Code

**Purpose**: Main application code

(Estrutura a ser definida durante a fase de planejamento)

---

### `tests/` - Test Files

**Purpose**: ALL test files in one place

**Rule**: Tests MUST NOT be scattered alongside source files. All tests go here.

**Naming Convention**: `[name].test.ts` or `[name].spec.ts`

---

## Current Status

- ✅ `project-context/` - Estrutura básica criada
- ✅ `specs/001-knowledge-pipeline/` - Spec + Plan criados
- ✅ `frontend/` - Next.js app criado (chat, canvas, mobile)
- ⬜ `backend/` - A ser criado durante implementação
- ⬜ `agents/` - A ser criado durante implementação
- ⬜ `tests/` - A ser criado durante implementação
- ⬜ `scripts/` - A ser criado conforme necessário
- ⬜ `docs/` - A ser criado conforme necessário

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Services | PascalCase + "Service" | `AuthService.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Tests | camelCase + `.test` | `validation.test.ts` |
