# EKS - Tests

## Structure

```
tests/
├── e2e/                    # End-to-end tests (Playwright)
│   ├── auth.spec.ts
│   ├── chat.spec.ts
│   └── playwright.config.ts
└── README.md
```

**Note**: Backend and agents tests are in their respective directories:
- `backend/tests/` - Backend unit/integration tests
- `agents/tests/` - Python agents tests

## E2E Tests

### Setup

```bash
cd tests/e2e
npm install -D @playwright/test
npx playwright install
```

### Run Tests

```bash
# Run all e2e tests
npx playwright test

# Run specific test
npx playwright test auth.spec.ts

# Run with UI
npx playwright test --ui

# Debug mode
npx playwright test --debug
```

### Requirements

- Frontend running on `http://localhost:3000`
- Backend running on `http://localhost:3001`
- Agents running on `http://localhost:8000`

## Coverage Goals

- **Backend**: ≥70%
- **Agents**: ≥60%
- **E2E**: Smoke tests (critical paths)
