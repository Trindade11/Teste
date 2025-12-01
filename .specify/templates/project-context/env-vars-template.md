# Environment Variables

> Documentation of all environment variables used in this project

**Last Updated**: [DATE]

## Quick Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `EXAMPLE_API_KEY` | Yes | API key for Example service |
| `DATABASE_URL` | Yes | Connection string for primary database |
| `DEBUG_MODE` | No | Enable debug logging (default: false) |

---

## Database Configuration

### `DATABASE_URL`

- **Required**: Yes
- **Format**: `protocol://user:password@host:port/database`
- **Example**: `mongodb+srv://user:pass@cluster.mongodb.net/mydb`
- **Used by**: Backend services, migrations
- **Notes**: Use connection pooling in production

### `DATABASE_NAME`

- **Required**: No (derived from URL if not set)
- **Format**: String
- **Example**: `myapp_production`
- **Used by**: Database connection layer

---

## API Keys & External Services

### `EXAMPLE_API_KEY`

- **Required**: Yes
- **Format**: Alphanumeric string (32 characters)
- **Example**: `sk_live_xxxxxxxxxxxxxxxxxxxxx`
- **Used by**: [Which module/service uses this]
- **Obtain from**: [Where to get this key]
- **Notes**: [Rate limits, permissions needed, etc.]

### `ANOTHER_SERVICE_TOKEN`

- **Required**: No
- **Format**: JWT token
- **Example**: `eyJhbGciOiJIUzI1NiIs...`
- **Used by**: [Which module/service]
- **Notes**: Expires after 24 hours, refresh mechanism in place

---

## Application Settings

### `NODE_ENV` / `ENVIRONMENT`

- **Required**: No
- **Format**: `development` | `staging` | `production`
- **Default**: `development`
- **Used by**: Application bootstrap
- **Notes**: Affects logging level, error display, etc.

### `PORT`

- **Required**: No
- **Format**: Integer (1024-65535)
- **Default**: `3000`
- **Used by**: HTTP server

### `DEBUG_MODE`

- **Required**: No
- **Format**: `true` | `false`
- **Default**: `false`
- **Used by**: Logger configuration
- **Notes**: Never enable in production

---

## Feature Flags

### `FEATURE_NEW_CHECKOUT`

- **Required**: No
- **Format**: `true` | `false`
- **Default**: `false`
- **Used by**: Feature toggle system
- **Notes**: Enable new checkout flow

---

## Secrets Management

### Where secrets are stored

- **Development**: `.env` file (git-ignored)
- **Staging**: [Platform secret manager]
- **Production**: [Platform secret manager]

### Rotation schedule

| Secret | Rotation Frequency | Last Rotated |
|--------|-------------------|--------------|
| `DATABASE_URL` | Quarterly | [DATE] |
| `EXAMPLE_API_KEY` | Annually | [DATE] |

---

## Sample `.env` File

```env
# Database
DATABASE_URL=mongodb://localhost:27017/myapp_dev
DATABASE_NAME=myapp_dev

# External Services
EXAMPLE_API_KEY=sk_test_xxxxxxxxxxxxx

# Application
NODE_ENV=development
PORT=3000
DEBUG_MODE=true

# Feature Flags
FEATURE_NEW_CHECKOUT=false
```

---

## Validation

Before starting the application, ensure:

- [ ] All required variables are set
- [ ] Database URL is accessible
- [ ] API keys have correct permissions
- [ ] No production secrets in development config

