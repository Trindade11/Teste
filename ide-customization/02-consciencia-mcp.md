# Estudo: Conscientização e Uso Contínuo de Ferramentas (MCPs)

## Objetivo
Analisar como garantir que o agente de inteligência (como o Cascade/Windsurf) mantenha uma consciência constante das ferramentas disponíveis (MCPs, comandos de terminal, etc.) e as utilize de forma proativa sem depender de instruções explícitas do usuário a cada interação.

## Contexto do Problema
Frequentemente, o agente possui a capacidade de rodar terminais, listar arquivos, ler URLs ou consultar ferramentas complexas (como o Meta-Grafo do EKS via MCP). No entanto, por segurança ou por limitação de prompt inicial, ele pode hesitar em usar essas ferramentas ou sequer lembrar que as possui, aguardando que o usuário diga "use a ferramenta X para fazer Y".

## Proposta: A "Sombra" Funcional do Agente (Continuous Awareness)
O agente deve operar sob a premissa de que a interação com a IDE é bidirecional. O usuário provê intenção, e o agente usa as ferramentas para materializar a intenção, verificando a validade antes de responder.

### Benefícios Esperados
1. **Autonomia de Resolução**: "Tem erro aqui?" -> O agente não apenas diz "parece um erro de sintaxe", mas roda `npm run lint` ou compila o código em background antes de responder "O linter confirmou o erro na linha X".
2. **Uso de MCPs**: Em vez do usuário lembrar ao agente "use o MCP do Neo4j", o agente, ao detectar uma pergunta sobre o esquema do banco, imediatamente consulta o MCP de banco de dados para garantir que a resposta é atual (grounded).

### Mecanismos de Implementação na IDE (Windsurf / Custom Rules)

1. **Definição Explícita de Capacidades Base**:
   - É necessário documentar, preferencialmente nas regras globais da IDE (ex: `Project Rules` ou `.windsurf/rules/global.md`), uma lista "sempre ativa" de capacidades que o agente DEVE usar.
   - *Exemplo de Regra*: "Antes de responder sobre a estrutura de um projeto, SEMPRE use o comando `ls` ou `find_by_name`. Nunca assuma a estrutura de arquivos baseado apenas no seu conhecimento prévio."

2. **Avaliação Inicial de Cada Interação**:
   - O agente precisa adotar um "pensamento de primeiro passo": *Esta pergunta pode ser respondida com mais precisão se eu rodar uma ferramenta agora mesmo?*
   - O uso de ferramentas deve ser "cheap" (barato). Rodar um `git status` ou ler os logs de um terminal ativo não deve ser uma decisão pesada.

3. **Integração Específica com MCPs**:
   - Quando um MCP é registrado (ex: `context7` para documentação de bibliotecas), o agente deve ser instruído a *sempre* consultar a versão oficial da doc via MCP antes de fornecer um snippet de código para bibliotecas que mudam rápido (ex: React 19, Next.js App Router).

## Próximos Passos
- [ ] Mapear todos os MCPs que o agente atualmente tem acesso na IDE e criar um documento de "Tool Registry" ou adicionar à `project-context/tools-registry.md` se já existir.
- [ ] Criar uma `Custom Rule` (Regra de Workspace) no Windsurf que force o comportamento "Check Tooling First". O agente lerá essa regra no início de cada conversa e saberá que tem permissão (e obrigação) de usar o terminal de forma proativa.
- [ ] Testar cenários em que o agente recebe um pedido vago ("o que quebrou?") e verificar se ele autonomamente busca o terminal ativo (ex: `read_terminal`) para ler o erro.
