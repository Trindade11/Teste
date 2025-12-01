# Folder Structure

> Documentation of project organization and directory purposes

**Last Updated**: [DATE]

## Project Root

```
project-root/
│
├── .specify/              # Spec Kit (DO NOT modify for project-specific content)
│   ├── docs/              # Methodology documentation
│   ├── memory/            # Constitution and project rules
│   ├── templates/         # Artifact templates
│   └── triage/            # Triage backlog system
│
├── project-context/       # Project-specific documentation
│   ├── env-vars.md        # Environment variables
│   ├── database-schema.md # Database documentation
│   ├── tools-registry.md  # Available tools and MCPs
│   ├── agent-framework.md # Agent architecture
│   ├── folder-structure.md# This file
│   └── learnings.md       # Project learnings
│
├── specs/                 # Feature specifications
│   └── [###-feature-name]/
│       ├── spec.md        # Feature specification
│       ├── plan.md        # Technical plan
│       ├── tasks.md       # Implementation tasks
│       └── checklists/    # Quality checklists
│
├── src/                   # Source code
│   ├── components/        # UI components
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   └── types/             # Type definitions
│
├── agents/                # Agent definitions (if agentic system)
│   ├── orchestrator/      # Main orchestrator
│   ├── specialists/       # Specialist agents
│   └── tools/             # Agent-specific tools
│
├── tests/                 # ALL test files
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   ├── e2e/               # End-to-end tests
│   └── fixtures/          # Test data and mocks
│
├── scripts/               # Utility scripts
│   ├── setup.sh           # Project setup
│   ├── seed.js            # Database seeding
│   └── deploy.sh          # Deployment script
│
├── docs/                  # Additional documentation
│   ├── api/               # API documentation
│   ├── guides/            # User guides
│   └── flows/             # Project-specific Mermaid diagrams
│
├── config/                # Configuration files
│   ├── development.json   # Dev config
│   ├── production.json    # Prod config
│   └── test.json          # Test config
│
└── public/                # Static assets
    ├── images/
    └── fonts/
```

---

## Directory Purposes

### `.specify/` - Spec Kit (Generic)

**Purpose**: Methodology toolkit, NOT project-specific content

| Folder | Contents | Modify? |
|--------|----------|---------|
| `docs/` | Methodology guides, flows | No |
| `memory/` | Constitution, rules | Yes (carefully) |
| `templates/` | Artifact templates | Rarely |
| `triage/` | Input backlog system | Auto-managed |

**Rule**: Never put project-specific content here. Use `project-context/` instead.

---

### `project-context/` - Project Documentation

**Purpose**: Project-specific technical documentation

| File | Contents | Update Frequency |
|------|----------|-----------------|
| `env-vars.md` | Environment variables | When env changes |
| `database-schema.md` | DB structure | When schema changes |
| `tools-registry.md` | Available tools | When tools added |
| `agent-framework.md` | Agent architecture | When agents change |
| `folder-structure.md` | This file | When structure changes |
| `learnings.md` | Project learnings | Ongoing |

---

### `specs/` - Feature Specifications

**Purpose**: Spec Kit artifacts for each feature

```
specs/
├── 001-user-auth/
│   ├── spec.md           # What & Why
│   ├── plan.md           # How (technical)
│   ├── tasks.md          # Work breakdown
│   └── checklists/
│       └── requirements.md
├── 002-payment-flow/
│   └── ...
└── 003-dashboard/
    └── ...
```

**Naming Convention**: `[###]-[short-name]/`

---

---

### `docs/` - Additional Documentation

**Purpose**: Project documentation and visual flows

| Folder | Contents | Example |
|--------|----------|---------|
| `api/` | API documentation | `openapi.yaml`, `endpoints.md` |
| `guides/` | User guides | `setup.md`, `deployment.md` |
| `flows/` | Project flow diagrams | Mermaid flowcharts of your system |

**Rule**: Use Mermaid diagrams to document your project's processes, similar to how Spec Kit documents its methodology.

---

### `src/` - Source Code

**Purpose**: Main application code

| Folder | Contents | Example |
|--------|----------|---------|
| `components/` | UI components | `Button.tsx`, `Modal.tsx` |
| `services/` | Business logic | `AuthService.ts`, `PaymentService.ts` |
| `utils/` | Utilities | `formatDate.ts`, `validation.ts` |
| `types/` | Type definitions | `User.ts`, `Order.ts` |

**Rule**: Follow consistent naming conventions within each folder.

---

### `agents/` - Agent System

**Purpose**: Agent definitions and configurations (if agentic system)

```
agents/
├── orchestrator/
│   ├── index.ts          # Entry point
│   ├── router.ts         # Request routing
│   └── config.ts         # Configuration
├── specialists/
│   ├── research/
│   │   ├── index.ts
│   │   └── tools.ts
│   ├── analysis/
│   └── writer/
└── tools/
    ├── database.ts
    └── search.ts
```

**Rule**: Keep agent code separate from business logic in `src/`.

---

### `tests/` - Test Files

**Purpose**: ALL test files in one place

```
tests/
├── unit/
│   ├── services/
│   │   └── AuthService.test.ts
│   └── utils/
│       └── validation.test.ts
├── integration/
│   └── api/
│       └── auth.test.ts
├── e2e/
│   └── checkout.test.ts
└── fixtures/
    ├── users.json
    └── mocks/
        └── paymentGateway.ts
```

**Rule**: Tests MUST NOT be scattered alongside source files. All tests go here.

**Naming Convention**: `[name].test.ts` or `[name].spec.ts`

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Services | PascalCase + "Service" | `AuthService.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Tests | camelCase + `.test`