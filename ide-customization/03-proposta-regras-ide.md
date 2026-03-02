# Proposta de Customização da IDE para o Agente (Windsurf Rules)

Com base nos estudos de terminais e uso contínuo de ferramentas (MCPs), propõe-se a criação de um conjunto de regras (Custom Rules) para a IDE (Windsurf / Cascade). O objetivo é treinar o agente a ser mais autônomo, proativo e integrado ao fluxo de desenvolvimento e debugging do usuário.

## Sugestão de Regras a Adicionar ao `Project Rules` ou `.windsurf/rules/agente-comportamento.md`

### 1. "Always-On Tooling" (Sempre Verifique Ferramentas)
"No início de cada interação, se a intenção do usuário for debugar, procurar um arquivo, ou verificar o estado do projeto, você DEVE priorizar o uso das ferramentas da IDE em vez de adivinhar. Rode `run_command` (ex: `git status`, `ls`, ler logs) para obter contexto atualizado antes de formular sua resposta."

### 2. "Active Terminal Monitoring" (Monitoramento Ativo de Terminal)
"Se houver servidores ou scripts em execução (ex: Node, Next.js, Python), e o usuário relatar um erro genérico (ex: 'quebrou' ou 'deu erro'), você tem a OBRIGAÇÃO de tentar localizar e ler o terminal ativo (usando ferramentas como `command_status`, `read_terminal` ou inspecionando o terminal no painel, caso aplicável) para identificar o erro *antes* de pedir mais informações."

### 3. "MCP-First Code Generation" (Código via MCP Oficial Primeiro)
"Sempre que você for solicitado a gerar código para bibliotecas ou frameworks que sabidamente mudam rápido e cujos MCPs estejam disponíveis no seu Tool Registry (ex: `context7` para documentação), você DEVE consultar a documentação oficial via MCP antes de sugerir a solução. Nunca confie apenas no seu treinamento base para sintaxes complexas de ferramentas modernas."

### 4. "Autocura e Execução" (Self-Healing)
"Se o usuário instruir você a 'rodar e debugar' algo, inicie o processo via `run_command` (non-blocking) e adote uma postura de 'ouvinte'. Se o comando falhar ou você identificar erros nos logs, você tem permissão para propor a correção e reiniciar o processo autonomamente, informando ao usuário o que foi feito."

## Como Implementar Isso Hoje?
A IDE permite configurar o comportamento do agente injetando um prompt de sistema (System Prompt Context) no Workspace ou criando arquivos `.md` na pasta `.windsurf/rules/` (se a feature estiver disponível e configurada). Recomendamos mover essas instruções para o arquivo `Project Rules` ou um `.windsurf/rules/ide-customization.md`.
