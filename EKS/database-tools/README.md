# Database Tools - Neo4j Management

Esta pasta contém ferramentas para gerenciamento da base Neo4j do projeto EKS.

## 📁 Arquivos Disponíveis

### 🔐 Autenticação e Usuários
- **`create_user_proper.js`** - Cria usuário admin com hash de senha válido
- **`create_user.js`** - Versão simplificada (sem hash bcrypt)

### 📤 Upload de Dados
- **`upload_with_auth.js`** - Upload CSV com autenticação completa (recomendado)
- **`upload_csv.js`** - Upload CSV direto (sem autenticação)

## 🚀 Como Usar

### 1. Criar Usuário Admin (se necessário)
```bash
node create_user_proper.js
```
- Cria/restaura usuário: `rodrigo.trindade@alocc.com.br`
- Senha temporária: `temp123`
- Role: `admin`

### 2. Fazer Upload do CSV
```bash
node upload_with_auth.js
```
- Faz login automático
- Upload do arquivo `Nodes_VF.csv`
- Processa todos os usuários e relacionamentos

## 📋 Pré-requisitos

### Backend Online
O backend deve estar rodando em `http://localhost:3002`:
```bash
cd backend
npm run dev
```

### Dependências Necessárias
```bash
npm install neo4j-driver bcrypt node-fetch form-data
```

### Arquivo CSV
O arquivo `Nodes_VF.csv` deve estar na raiz do projeto EKS com as colunas:
- name, company, jobTitle, department, access
- relationshipType, accessTypes, location, email, status, role, managerEmail

## 🔧 Configuração

### Variáveis de Ambiente (.env)
```
NEO4J_URI=neo4j+ssc://af132785.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=42cWtTL6w5hPwC75QUrHP0Q2H87WlXd5m0qWtnH6O0A
JWT_SECRET=d4f2a6f9b1e74c8892e7e4c0a3f6d9b5b0c7a8dfe1c2456f8b3d0e6c1a9f2d4
```

## 📊 Fluxo Completo de Recuperação

1. **Verificar Backend Online**
   ```bash
   curl http://localhost:3002/health
   ```

2. **Criar Usuário Admin**
   ```bash
   node create_user_proper.js
   ```

3. **Fazer Upload dos Dados**
   ```bash
   node upload_with_auth.js
   ```

4. **Verificar Resultado**
   - Acesse o frontend em `http://localhost:3000`
   - Login com: `rodrigo.trindade@alocc.com.br` / `temp123`
   - Verifique os dados no painel admin

## 🚨 Cenários de Uso

### ✅ Base Deletada/Apurada
1. Execute `create_user_proper.js` para recriar acesso
2. Execute `upload_with_auth.js` para repopular dados

### ✅ Usuário Bloqueado/Esquecido
1. Execute `create_user_proper.js` para resetar senha
2. Nova senha: `temp123`

### ✅ Atualização em Massa
1. Modifique o `Nodes_VF.csv`
2. Execute `upload_with_auth.js`
3. Sistema cria/atualiza automaticamente

## 📝 Logs e Saídas

Os scripts mostram:
- ✅ Status de cada operação
- 📊 Resumo estatístico
- ❌ Erros (se houver)
- 🔗 URLs de acesso

## 🔒 Segurança

- **Senha temporária**: Altere após primeiro login
- **Token JWT**: 7 dias de validade
- **Acesso Admin**: Necessário para operações de ingestão

## 🆘 Troubleshooting

### "Invalid credentials"
- Execute `create_user_proper.js` novamente
- Verifique se o backend está online

### "Cannot connect to server"
- Verifique se o backend está rodando na porta 3002
- Confirme as variáveis de ambiente

### "File not found"
- Verifique se `Nodes_VF.csv` existe na raiz do projeto
- Confirme o caminho absoluto no script

---

**Criado por**: Cascade AI Assistant  
**Data**: 08/01/2026  
**Versão**: 1.0
