# CVC Hub Frontend

Plataforma de gestão e mentoria para startups focadas em IA.

## 🚀 Features

- **Chat Interativo**: Converse com agentes especializados, anexe arquivos e envie áudios
- **Seleção de Agentes**: Escolha entre Knowledge, Task, Curation ou deixe o Router decidir automaticamente
- **Canvas Visual**: Visualize e organize conhecimento, tarefas, pessoas e insights em um canvas interativo
- **Responsive Design**: Funciona perfeitamente em desktop e mobile
- **Gestão de Contexto**: Selecione cliente, projeto e tipo de memória (corporativa/pessoal)

## 📦 Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + Tailwind CSS
- **Components**: Radix UI primitives
- **State**: Zustand
- **Icons**: Lucide React

## 🛠️ Setup

### Pré-requisitos

- Node.js 20+
- npm ou pnpm

### Instalação

```bash
cd frontend
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

### Build de Produção

```bash
npm run build
npm start
```

## 📁 Estrutura

```
frontend/
├── src/
│   ├── app/                    # App Router (Next.js 14)
│   │   ├── globals.css         # Estilos globais + Tailwind
│   │   ├── layout.tsx          # Layout raiz
│   │   └── page.tsx            # Página principal
│   ├── components/
│   │   ├── ui/                 # Componentes base (Button, etc.)
│   │   ├── layout/             # Sidebar, MobileNav
│   │   ├── chat/               # ChatPanel, AgentSelector
│   │   └── canvas/             # Canvas visual
│   ├── store/                  # Estado global (Zustand)
│   │   ├── chat-store.ts       # Mensagens e agentes
│   │   └── context-store.ts    # Cliente, projeto, memória
│   └── lib/
│       └── utils.ts            # Utilitários (cn, etc.)
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 🔌 Integração com Backend

O frontend está preparado para se conectar ao backend via API. Configure a variável de ambiente:

```bash
BACKEND_URL=http://localhost:3001
```

As chamadas a `/api/*` serão automaticamente redirecionadas para o backend.

## 📱 Mobile Support

A interface é mobile-first com:

- Menu colapsável
- Chat em tela cheia no mobile
- Navegação inferior para alternar entre Menu, Canvas e Chat
- Touch-friendly UI

## 🎨 Customização

### Cores

As cores são definidas via CSS variables em `globals.css`. O tema suporta light e dark mode automaticamente.

### Agentes

Os agentes disponíveis são definidos em `store/chat-store.ts`. Para adicionar novos agentes, edite o array `defaultAgents`.

## 🔄 Próximos Passos

- [ ] Integrar com API real de chat
- [ ] Implementar gravação de áudio (Web Audio API)
- [ ] Conectar Canvas com Neo4j para persistência
- [ ] Adicionar autenticação
- [ ] Implementar histórico de conversas
