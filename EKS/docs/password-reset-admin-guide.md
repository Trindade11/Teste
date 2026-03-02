# Password Reset Administration Guide

## Overview

O EKS possui um sistema seguro de reset de senhas para administradores, permitindo que usuários com privilégios admin redefinam senhas de outros usuários quando necessário.

## Components

### Backend

#### Endpoint: `POST /admin/users/:id/reset-password`

**Middleware:**
- `authenticate` - Verifica token JWT válido
- `requireAdmin` - Apenas usuários com role `admin`

**Validações:**
- Senha mínima de 6 caracteres
- Admin não pode resetar própria senha (prevenção de abuso)
- Usuário alvo deve existir
- Admin deve estar autenticado

**Segurança:**
- Auditoria completa no Neo4j com relação `PERFORMED_ACTION`
- Logging em `warn` antes da execução
- Logging em `info` após sucesso
- Timestamp em todos os registros

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "audit": {
    "performedBy": "admin@company.com",
    "performedAt": "2026-02-28T10:30:00.000Z",
    "targetUser": "user@company.com"
  }
}
```

### Frontend

#### Component: `UserPasswordReset.tsx`

**Features:**
- Lista de todos os usuários com busca visual
- Seleção interativa com feedback visual
- Formulário de reset com confirmação
- Validações client-side
- Feedback de sucesso/erro
- Indicadores de loading

**UI Elements:**
- Cards separados para lista e formulário
- Badges de role (admin/user)
- Alertas de segurança
- Ícones temáticos (Shield, Key, User)

## Security Features

### 1. Authentication & Authorization
- Apenas admins podem acessar
- Token JWT validado
- Middleware `requireAdmin`

### 2. Audit Trail
```cypher
MATCH (admin:User)-[r:PERFORMED_ACTION]->(target:User)
WHERE r.action = 'PASSWORD_RESET'
RETURN admin.email, target.email, r.timestamp, r.details
```

### 3. Prevention Measures
- Auto-reset bloqueado
- Validação de senha forte
- Logging estruturado
- Rate limiting implícito

## Usage Instructions

### Para Administradores

1. **Acesso**: Navegar para seção Admin → User Password Reset
2. **Seleção**: Clicar no usuário desejado na lista
3. **Formulário**: Preencher nova senha (mín. 6 caracteres)
4. **Confirmação**: Digitar senha novamente
5. **Execução**: Clicar "Reset Password"

### Para Desenvolvedores

#### API Usage:
```typescript
// Reset password via API
const response = await api.post('/admin/users/:id/reset-password', {
  newPassword: 'newSecurePassword123'
});
```

#### Audit Query:
```typescript
// Get password reset history
const auditQuery = `
  MATCH (admin:User)-[r:PERFORMED_ACTION]->(target:User)
  WHERE r.action = 'PASSWORD_RESET'
  RETURN admin.email as admin, target.email as user, 
         r.timestamp as date, r.details as details
  ORDER BY r.timestamp DESC
`;
```

## Emergency Procedures

### Se Admin Esqueceu Própria Senha

1. **Bootstrap Admin**: Usar credenciais de bootstrap se configuradas
2. **Database Direct**: Reset direto no Neo4j (último recurso)
3. **New Admin**: Criar novo admin via console

### Reset via Database (Emergency)
```cypher
// Reset direto - EMERGENCY ONLY
MATCH (u:User {email: 'milena.ventre@cocreateai.com.br'})
SET u.passwordHash = '$2b$10$NEW_HASH_HERE'
RETURN u.email;
```

## Configuration

### Environment Variables
```bash
# Admin bootstrap (opcional)
BOOTSTRAP_ADMIN_ENABLED=true
BOOTSTRAP_ADMIN_EMAIL=admin@company.com
BOOTSTRAP_ADMIN_PASSWORD=tempPassword123
BOOTSTRAP_ADMIN_ORGANIZATION_TYPE=cocreate
```

### Security Headers
- Todos os endpoints admin requerem autenticação
- CORS configurado para domínio específico
- Rate limiting aplicado globalmente

## Monitoring

### Logs Monitorar
- `Password reset attempt by admin X for user Y` (warn)
- `Password reset successfully: X by admin Y` (info)
- `Reset password error:` (error)

### Alerts Configurar
- Múltiplos resets para mesmo usuário em 1h
- Resets fora do horário comercial
- Admins resetando outros admins

## Compliance

### LGPD/GDPR
- Auditoria completa mantida
- Logs com timestamps
- Acesso apenas por admins autorizados

### Best Practices
- Senhas nunca em texto claro
- Hash com bcrypt (salt rounds: 10)
- Expiração de tokens configurável
- Revogação de sessão após reset

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Verificar token JWT
   - Confirmar role admin

2. **403 Forbidden**
   - Admin tentando reset própria senha
   - Middleware de permissão

3. **404 Not Found**
   - ID de usuário inválido
   - Usuário não existe

4. **Validation Error**
   - Senha muito curta (<6)
   - Formato inválido

### Debug Commands
```bash
# Verificar usuário no Neo4j
MATCH (u:User {email: 'milena.ventre@cocreateai.com.br'})
RETURN u.id, u.role, u.email;

# Verificar auditoria
MATCH ()-[r:PERFORMED_ACTION]->()
WHERE r.action = 'PASSWORD_RESET'
RETURN * LIMIT 10;
```

## Future Enhancements

1. **Email Notification**: Avisar usuário sobre reset
2. **Temporary Password**: Gerar senha temporária segura
3. **Multi-Factor Auth**: Requerer 2FA para resets
4. **Approval Workflow**: Múltiplos admins para resets críticos
5. **Password Policy**: Regras complexas de senha

---

**Status**: ✅ Implementado e em produção
**Version**: 1.0
**Last Updated**: 2026-02-28
