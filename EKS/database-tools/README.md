# 📊 Ferramentas de Ingestão CSV - EKS Project

Este conjunto de ferramentas resolve problemas de encoding e caracteres especiais na ingestão de dados CSV para o Neo4j.

## 🔧 Problemas Resolvidos

- ✅ **Encoding Detection**: Detecta automaticamente UTF-8, Latin-1, CP1252
- ✅ **Character Correction**: Corrige caracteres especiais corrompidos
- ✅ **CSV Parsing**: Trata aspas e separadores corretamente
- ✅ **Error Handling**: Continua processamento mesmo com erros individuais
- ✅ **Relationship Creation**: Cria relacionamentos hierárquicos automaticamente

## 📁 Arquivos Disponíveis

### 🚀 Scripts Principais (Robustos)
- **`robust_csv_ingestion.js`** - **Script principal** para ingestão robusta com encoding fix
- **`fix_csv_encoding.js`** - Corrige encoding de arquivos existentes
- **`create_user_aurora.js`** - Cria usuário admin Aurora (usuario040@aurora.example)

### 🔐 Scripts Legados
- **`create_user_proper.js`** - Cria usuário admin com hash de senha válido
- **`create_user.js`** - Versão simplificada (sem hash bcrypt)
- **`upload_with_auth.js`** - Upload CSV com autenticação completa
- **`upload_csv.js`** - Upload CSV direto (sem autenticação)

## 🚀 Como Usar

### 1. Ingestão Robusta (Recomendado)
```bash
node robust_csv_ingestion.js [arquivo.csv]
```

### 2. Corrigir Encoding Apenas
```bash
node fix_csv_encoding.js
```

### 3. Criar Usuário Admin Aurora
```bash
node create_user_aurora.js
```
- **Email**: `usuario040@aurora.example`
- **Senha**: `aurora123`

### 4. Scripts Legados (se necessário)
```bash
node create_user_proper.js
```
- Cria/restaura usuário: `rodrigo.trindade@alocc.com.br`
- Senha temporária: `temp123`

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

## 📋 Caracteres Corrigidos

| Probleático | Corrigido |
|-------------|-----------|
| Execuo | Execução |
| Finanas | Finanças |
| Portiflio | Portfólio |
| Jurdico | Jurídico |
| Alocao | Alocação |
| Estratgico | Estratégico |
| Governana | Governança |
| Operao | Operação |
| Frum | Fórum |
| Direo | Direção |

## 🔍 Detecção de Encoding

O script tenta detectar automaticamente o encoding:
1. **UTF-8** - Padrão moderno
2. **Latin-1** - Comum em Windows
3. **CP1252** - Windows ANSI

Fallback para Latin-1 se nenhum funcionar.

## 📊 Estrutura do CSV

O script espera CSV com as seguintes colunas:
- `name` - Nome da pessoa
- `company` - Empresa
- `jobTitle` - Cargo
- `department` - Departamento
- `access` - Nível de acesso
- `relationshipType` - Tipo de relacionamento
- `accessTypes` - Tipos de acesso
- `location` - Localização
- `email` - Email (único)
- `status` - Status (Ativo/Inativo)
- `role` - Função (user/admin)
- `managerEmail` - Email do gerente

## 🔄 Fluxo de Processamento

1. **Detect Encoding** - Analisa o arquivo
2. **Fix Characters** - Aplica correções
3. **Save Fixed Version** - Cria versão corrigida
4. **Parse CSV** - Interpreta campos corretamente
5. **Create Nodes** - Insere nós Person
6. **Create Relationships** - Cria REPORTS_TO
7. **Report Results** - Estatísticas finais

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
