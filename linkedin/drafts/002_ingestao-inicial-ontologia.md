# Template de Post LinkedIn - EKS

## Metadados
- **Título de trabalho**: Ingestão Inicial - O Esqueleto do Grafo Corporativo
- **Pilar**: [x] Técnico [ ] Conceitual [ ] Organizacional [ ] Tendência [ ] Case
- **Data planejada**: 22/01/2026 (sequência do Post 001 - O que é EKS)
- **Status**: [x] Rascunho [ ] Revisão [ ] Pronto [ ] Publicado
- **Imagem**: Screenshot do DataIngestion mostrando estado do banco

---

## Hook (primeiras 2-3 linhas)

> Antes de qualquer agente de IA operar na sua empresa, ele precisa de uma coisa: 𝘀𝗮𝗯𝗲𝗿 𝗾𝘂𝗲𝗺 é 𝗾𝘂𝗲𝗺.

**Tipo de hook usado**:
- [x] Afirmação direta
- [ ] Metáfora forte
- [ ] Experiência pessoal
- [ ] Afirmação contraintuitiva
- [ ] Pergunta

---

## Corpo do Post

### Problema/Contexto

Muita gente quer começar com IA pelo glamouroso:
chatbots, automações, RAG, agentes inteligentes.

Mas esquece do básico.

A IA precisa saber:
• Quem são as pessoas?
• Quais são os departamentos?
• Quem responde para quem?
• Quem tem acesso a quê?

Sem isso, qualquer agente opera no escuro.

### Contraste

É como contratar um novo funcionário e não apresentar a empresa.
Ele vai trabalhar, mas vai errar. Muito.

### Conceito-chave

Eu chamo essa primeira etapa de 𝗜𝗻𝗴𝗲𝘀𝘁ã𝗼 𝗜𝗻𝗶𝗰𝗶𝗮𝗹.

É o esqueleto do grafo corporativo.
A ontologia base (estrutura organizacional + permissões) que permite tudo funcionar.

É o começo de um GraphRAG corporativo com controle de acesso.

### Lista/Estrutura

O que entra nessa carga inicial:

• 𝗨𝘀𝘂á𝗿𝗶𝗼𝘀: nome, email, cargo, status
• 𝗗𝗲𝗽𝗮𝗿𝘁𝗮𝗺𝗲𝗻𝘁𝗼𝘀: estrutura organizacional
• 𝗢𝗿𝗴𝗮𝗻𝗶𝘇𝗮çõ𝗲𝘀: empresa, unidades de negócio
• 𝗟𝗼𝗰𝗮𝗹𝗶𝘇𝗮çõ𝗲𝘀: onde as pessoas trabalham
• 𝗥𝗲𝗹𝗮𝗰𝗶𝗼𝗻𝗮𝗺𝗲𝗻𝘁𝗼𝘀 (o “esqueleto” do grafo):
  - `MEMBER_OF` (Usuário → Departamento)
  - `BELONGS_TO` (Usuário → Organização)
  - `WORKS_AT` (Usuário → Localização)
  - `HAS_ACCESS_TO` (Usuário → Departamento/Área que ele pode acessar)
  - `REPORTS_TO` (Usuário → Gestor) quando existe essa informação

É simples? Sim.

Mas é o que permite:
• Contexto organizacional para cada usuário
• Permissões baseadas em estrutura
• Routing inteligente de perguntas
• Onboarding automático

### Benefício/Consequência

Na imagem mostro a tela **Configurações → Ingestão de Dados**.
Um CSV simples, bem estruturado.
E o grafo já nasce com a ontologia básica da empresa.

Detalhe importante: **os dados existentes são atualizados, não deletados**.

Depois disso, cada colaborador completa seu perfil.
E o grafo cresce de forma orgânica.

Mas sem esse esqueleto inicial, não tem como começar.

---

## CTA (Call-to-Action)

**Tipo**:
- [x] Pergunta para comentários
- [ ] Link para recurso
- [ ] Pedido de compartilhamento
- [x] Convite para grupo/comunidade

> Se você fosse começar amanhã, quais 3 campos do seu “CSV organizacional” seriam obrigatórios?
> 
> Se fizer sentido, eu deixo o link do grupo no WhatsApp no 1º comentário.

---

## Comentário 1 (fixado) - copiar e colar

```
 Eu e quase 100 profissionais de ponta conversamos sobre EKS, ontologia corporativa e IA corporativa (grupo):
https://chat.whatsapp.com/Fyp7W6h2PXS99z5l1MX5Kc
 
Se você trabalha com processos, gestão do conhecimento ou arquitetura, entra lá. Eu compartilho bastidores e padrões práticos.
```

---

## Elementos Visuais

- [ ] Imagem de grafo/diagrama
- [x] Screenshot de interface (DataIngestion)
- [ ] Carrossel
- [ ] Sem imagem

**Descrição da imagem**: Screenshot do DataIngestion mostrando:
- Estado atual do banco (Usuários, Departamentos, Organizações, Localizações)
- Contadores de relacionamentos
- Upload de arquivo CSV

---

## Menções e Hashtags

### Pessoas/Empresas para mencionar
- (nenhuma específica neste post)

### Hashtags (regra: não usar hashtags, apenas termos no texto)
- (sem hashtags - termos já incorporados no texto naturalmente)

---

## Checklist Pré-Publicação

- [x] Hook forte nos primeiros 150 caracteres
- [x] Pelo menos 1 termo próprio (Ingestão Inicial, esqueleto do grafo)
- [x] Conexão técnico ↔ negócio clara
- [x] Frases curtas intercaladas com longas
- [x] Destaque Unicode para conceitos-chave
- [x] Parágrafos curtos (máx 3 linhas)
- [x] CTA claro
- [x] Hashtags relevantes (regra: não usar hashtags)
- [ ] Imagem preparada (screenshot do DataIngestion)
- [ ] Revisão de erros de digitação
- [ ] Melhor horário: 8h-9h ou 17h-18h

---

## Texto Final (copiar e colar)

```
Antes de qualquer agente de IA operar na sua empresa, ele precisa de uma coisa: 𝘀𝗮𝗯𝗲𝗿 𝗾𝘂𝗲𝗺 é 𝗾𝘂𝗲𝗺.

Muita gente quer começar com IA pelo glamouroso:
chatbots, automações, RAG, agentes inteligentes.

Mas esquece do básico.

A IA precisa saber:
• Quem são as pessoas?
• Quais são os departamentos?
• Quem responde para quem?
• Quem tem acesso a quê?

Sem isso, qualquer agente opera no escuro.

É como contratar um novo funcionário e não apresentar a empresa.
Ele vai trabalhar, mas vai errar. Muito.

Eu chamo essa primeira etapa de 𝗜𝗻𝗴𝗲𝘀𝘁ã𝗼 𝗜𝗻𝗶𝗰𝗶𝗮𝗹.

É o esqueleto do grafo corporativo.
A ontologia base (estrutura organizacional + permissões) que permite tudo funcionar.

É o começo de um GraphRAG corporativo com controle de acesso.

O que entra nessa carga inicial (checklist rápido):

• 𝗨𝘀𝘂á𝗿𝗶𝗼𝘀: nome, email, cargo, status
• 𝗗𝗲𝗽𝗮𝗿𝘁𝗮𝗺𝗲𝗻𝘁𝗼𝘀: estrutura organizacional
• 𝗢𝗿𝗴𝗮𝗻𝗶𝘇𝗮çõ𝗲𝘀: empresa, unidades de negócio
• 𝗟𝗼𝗰𝗮𝗹𝗶𝘇𝗮çõ𝗲𝘀: onde as pessoas trabalham
• 𝗥𝗲𝗹𝗮𝗰𝗶𝗼𝗻𝗮𝗺𝗲𝗻𝘁𝗼𝘀 (o “esqueleto” do grafo):
  - `MEMBER_OF` (Usuário → Departamento)
  - `BELONGS_TO` (Usuário → Organização)
  - `WORKS_AT` (Usuário → Localização)
  - `HAS_ACCESS_TO` (Usuário → Departamento/Área que ele pode acessar)
  - `REPORTS_TO` (Usuário → Gestor) quando existe essa informação

É simples? Sim.

Mas é o que permite:
• Contexto organizacional para cada usuário
• Permissões baseadas em estrutura
• Routing inteligente de perguntas
• Onboarding automático

Na imagem (print) eu mostro a tela **Configurações → Ingestão de Dados**.
Um CSV simples, bem estruturado.
E o grafo já nasce com a ontologia básica da empresa.

Detalhe importante: **os dados existentes são atualizados, não deletados**.

Depois disso, cada colaborador completa seu perfil.
E o grafo cresce de forma orgânica.

Mas sem esse esqueleto inicial, não tem como começar.

Se você fosse começar amanhã, quais 3 campos do seu “CSV organizacional” seriam obrigatórios?

Se fizer sentido, eu deixo o link do grupo no WhatsApp no 1º comentário.
```

---

## Comentário 1 (fixado) - copiar e colar

```
🔗 Eu e quase 100 profissionais de ponta conversamos sobre EKS, ontologia corporativa e IA corporativa (grupo):
https://chat.whatsapp.com/Fyp7W6h2PXS99z5l1MX5Kc
 
Se você trabalha com processos, gestão do conhecimento ou arquitetura, entra lá. Eu compartilho bastidores e padrões práticos.
```

---

## Pós-Publicação

- **URL do post**: 
- **Horário publicado**: 
- **Métricas 24h**: Impressões: | Reações: | Comentários:
- **Métricas 7d**: Impressões: | Reações: | Comentários:
- **Aprendizados**: 

---

*Rascunho v1.0 - 19/01/2026*

