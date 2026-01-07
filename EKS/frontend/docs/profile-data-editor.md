# Profile Data Editor

## Overview

O Profile Data Editor é uma nova funcionalidade que permite aos usuários editar os dados coletados durante o First-Run Onboarding através do menu de configurações.

## Features

### Campos Editáveis

#### Perfil Pessoal
- **Nome completo**: Somente leitura (gerenciado pelo administrador)
- **Email**: Somente leitura (gerenciado pelo administrador)
- **Função**: Somente leitura (gerenciado pelo administrador)
- **Descrição pessoal**: Editável - perfil e estilo de trabalho

#### Organização
- **Empresa**: Somente leitura (gerenciado pelo administrador)
- **Departamento**: Somente leitura (gerenciado pelo administrador)
- **Descrição da função**: Editável - responsabilidades na organização
- **Descrição da área**: Editável - impacto da área na organização

#### Competências Profissionais
- **Lista de competências**: Editável - adicionar/remover/editar competências

#### Objetivos e Desafios
- **Objetivo Principal**: Editável - objetivo profissional atual
- **Principais Desafios**: Editável - desafios atuais

#### Configurações de Privacidade
- **Visibilidade Padrão**: Editável - Corporativo vs Pessoal
- **Nível de Memória**: Editável - Curto (7d), Médio (30d), Longo (90d)

## Como Usar

1. Acesse o menu **Configurações** na plataforma
2. Selecione **Dados do Perfil** no menu interno
3. Edite os campos desejados
4. Clique em **Salvar** para persistir as alterações

## Funcionalidades

### Validações
- Limites de caracteres nos campos textuais
- Campos obrigatórios marcados visualmente
- Feedback visual de erros e sucessos

### Estados
- **Loading**: Carregando dados do perfil
- **Editing**: Editando campos
- **Saving**: Salvando alterações
- **Success**: Alterações salvas com sucesso
- **Error**: Erro ao salvar

### Detecção de Alterações
- O sistema detecta quando há alterações não salvas
- Botão **Descartar** aparece quando há alterações
- Botão **Salvar** habilitado apenas quando há alterações

## Integração Técnica

### API Endpoints Utilizados
- `GET /onboarding/draft` - Carregar dados atuais
- `POST /onboarding/draft` - Salvar alterações

### Componentes
- `ProfileDataEditor.tsx` - Componente principal
- Integrado em `settings/page.tsx`
- Reutiliza estrutura do `OnboardingWizard.tsx`

### Store Integration
- Usa `useAuthStore` para dados do usuário
- Sincroniza com backend via API existente

## UX Considerations

### Campos Somente Leitura
- Visualmente distintos (cinza/muted)
- Tooltip explicando que são gerenciados pelo admin
- Mantidos para contexto do usuário

### Organização Visual
- Seções agrupadas por cards
- Ícones consistentes com o resto do sistema
- Hierarquia visual clara

### Feedback
- Indicadores de loading
- Mensagens de sucesso/erro
- Contadores de caracteres

## Security & Permissions

- Apenas usuários autenticados podem acessar
- Campos sensíveis permanecem somente leitura
- Validações no frontend e backend

## Future Enhancements

### Possíveis Melhorias
1. **Validação Avançada**: Validação de formato em campos específicos
2. **Histórico**: Log de alterações do perfil
3. **Preview**: Visualização de como os dados aparecem para outros usuários
4. **Bulk Edit**: Edição em lote para administradores
5. **Import/Export**: Exportar/importar dados do perfil

### Integrações Futuras
1. **LDAP/AD**: Sincronização com diretórios corporativos
2. **HR Systems**: Integração com sistemas de RH
3. **Profile Pictures**: Upload e gestão de fotos de perfil

## Troubleshooting

### Issues Comuns
1. **Dados não carregam**: Verificar conexão com API e autenticação
2. **Salvar não funciona**: Verificar permissões e estado dos campos
3. **Campos incorretos**: Verificar dados preenchidos pelo administrador

### Debug
- Console logs para erros de API
- Network tab para verificar requisições
- Store state para debugging local

## Accessibility

- Labels semânticas para todos os campos
- Navegação por teclado
- Contraste adequado
- Screen reader support
