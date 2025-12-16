# CVC Hub Backend

Backend API para CVC Hub - Node.js + TypeScript + Neo4j

## Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Express
- **Database**: Neo4j Aura
- **Auth**: JWT + bcrypt
- **Validation**: Zod
- **Logging**: Winston
- **Testing**: Jest

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copie `.env.example` para `.env` e preencha as variáveis:

```bash
cp .env.example .env
```

**Variáveis obrigatórias**:
- `NEO4J_URI`: URL do Neo4j Aura
- `NEO4J_USER`: Usuário Neo4j
- `NEO4J_PASSWORD`: Senha Neo4j
- `JWT_SECRET`: Secret para JWT (mínimo 32 caracteres)

### 3. Run Development Server

```bash
npm run dev
```

Servidor inicia em `http://localhost:3001`

## Scripts

- `npm run dev` - Inicia servidor de desenvolvimento (hot reload)
- `npm run build` - Compila TypeScript para JavaScript
- `npm start` - Inicia servidor de produção
- `npm test` - Roda testes
- `npm run test:watch` - Roda testes em watch mode
- `npm run test:coverage` - Gera relatório de cobertura
- `npm run lint` - Lint do código
- `npm run format` - Formata código com Prettier

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configurações (env, neo4j)
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── models/           # TypeScript interfaces
│   ├── utils/            # Utilities (logger, etc)
│   └── index.ts          # Entry point
├── tests/                # ⚠️ Tests em ../tests/backend (raiz do projeto)
├── package.json
└── tsconfig.json
```

## Constitution Compliance

✅ **ZERO HARDCODE**: Todas as configurações vêm de `.env` (via Zod validation)  
✅ **Tests Separados**: Todos os testes em `../tests/backend/` (raiz do projeto)  
✅ **Código Limpo**: ESLint + Prettier configurados  
✅ **Logging**: Winston para logs estruturados  
✅ **Error Handling**: Middleware de erro centralizado

## API Endpoints

### Health Check
- `GET /health` - Status do servidor

### (Em construção)
- Auth: `/auth/*`
- Admin: `/admin/*`
- Chat: `/chat` (WebSocket)
- Agents: `/agents/*`
- Memory: `/memory/*`

## Development

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

Tests devem estar em `../tests/backend/unit/` ou `../tests/backend/integration/`

### Linting

```bash
# Check
npm run lint

# Fix
npm run lint:fix
```

## Production

1. Build:
   ```bash
   npm run build
   ```

2. Set environment variables in production

3. Start:
   ```bash
   npm start
   ```

## Next Steps

- [ ] Implementar Auth routes (spec 003)
- [ ] Implementar Admin routes (spec 003)
- [ ] Conectar com Agent Server (specs 004, 005)
- [ ] Implementar Chat WebSocket (spec 007)
- [ ] Add Swagger/OpenAPI docs
