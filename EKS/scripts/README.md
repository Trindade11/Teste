# EKS - Scripts

Utility scripts for setup and maintenance.

## Available Scripts

### `seed-admin.ts`

Creates initial admin user in Neo4j.

```bash
cd scripts
npx tsx seed-admin.ts
```

**Default credentials**:
- Email: `admin@cocreateai.com.br`
- Password: `admin123`

### `check-env.ts`

Validates all required environment variables are set.

```bash
cd scripts
npx tsx check-env.ts
```

Checks both `backend/.env` and `agents/.env`.

## Usage

Install dependencies first:

```bash
npm install -D tsx dotenv neo4j-driver bcrypt
npm install -D @types/node @types/bcrypt
```

Then run any script:

```bash
npx tsx <script-name>.ts
```
