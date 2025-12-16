# 🎭 Guia de Simulação Completa (Mock Data)

**Objetivo**: Desenvolver frontend SEM precisar de APIs reais, Azure ou bancos de dados

---

## Por Que Simular?

- ✅ **Testar UX** sem depender de infra
- ✅ **Iterar rapidamente** no design
- ✅ **Validar specs** antes de implementar backend
- ✅ **Demo para stakeholders** sem setup complexo

---

## 📦 Mock Data Disponível

### Localização
```
mock-data/
├── nodes/
│   ├── users.json           (4 usuários)
│   ├── companies.json       (3 empresas)
│   ├── startups.json        (2 startups)
│   ├── conversations.json   (2 conversas)
│   ├── knowledge.json       (3 knowledge nodes)
│   └── tasks.json           (3 tasks)
├── profiles/
│   ├── ai-profiles.json          (2 perfis)
│   ├── conversation-profiles.json (2 perfis)
│   └── depth-preferences.json    (2 perfis)
└── examples/
    └── first-node-complete.json
```

**Total**: 17 entidades simuladas prontas para uso

---

## 🎨 Mock API Layer

### 1. Criar MockAPI Service

**Arquivo**: `frontend/src/lib/mockApi.ts`

```typescript
// frontend/src/lib/mockApi.ts
import users from '@/../../mock-data/nodes/users.json';
import companies from '@/../../mock-data/nodes/companies.json';
import startups from '@/../../mock-data/nodes/startups.json';
import conversations from '@/../../mock-data/nodes/conversations.json';
import knowledge from '@/../../mock-data/nodes/knowledge.json';
import tasks from '@/../../mock-data/nodes/tasks.json';
import aiProfiles from '@/../../mock-data/profiles/ai-profiles.json';
import conversationProfiles from '@/../../mock-data/profiles/conversation-profiles.json';

// Simular latência de rede
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  // ===== AUTH =====
  async login(email: string, password: string) {
    await delay(800);
    const user = users.find(u => u.email === email);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    return {
      success: true,
      data: {
        user,
        token: 'mock-jwt-token-12345'
      }
    };
  },

  async logout() {
    await delay(200);
    return { success: true };
  },

  // ===== USERS =====
  async getUsers() {
    await delay(300);
    return { success: true, data: users };
  },

  async getUserById(userId: string) {
    await delay(200);
    const user = users.find(u => u.user_id === userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    return { success: true, data: user };
  },

  async createUser(userData: any) {
    await delay(500);
    const newUser = {
      user_id: `usr_${Date.now()}`,
      ...userData,
      created_at: new Date().toISOString(),
      last_login: null
    };
    // Em produção, isso salvaria no banco
    return { success: true, data: newUser };
  },

  async updateUser(userId: string, updates: any) {
    await delay(400);
    const user = users.find(u => u.user_id === userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    const updated = { ...user, ...updates };
    return { success: true, data: updated };
  },

  // ===== COMPANIES =====
  async getCompanies() {
    await delay(250);
    return { success: true, data: companies };
  },

  async getCompanyById(companyId: string) {
    await delay(200);
    const company = companies.find(c => c.company_id === companyId);
    if (!company) {
      return { success: false, error: 'Company not found' };
    }
    return { success: true, data: company };
  },

  // ===== STARTUPS =====
  async getStartups() {
    await delay(300);
    return { success: true, data: startups };
  },

  async getStartupById(startupId: string) {
    await delay(200);
    const startup = startups.find(s => s.startup_id === startupId);
    if (!startup) {
      return { success: false, error: 'Startup not found' };
    }
    return { success: true, data: startup };
  },

  // ===== CONVERSATIONS =====
  async getConversations(userId: string) {
    await delay(400);
    const userConvs = conversations.filter(c => c.user_id === userId);
    return { success: true, data: userConvs };
  },

  async getConversationById(convId: string) {
    await delay(300);
    const conv = conversations.find(c => c.conversation_id === convId);
    if (!conv) {
      return { success: false, error: 'Conversation not found' };
    }
    return { success: true, data: conv };
  },

  async createConversation(userId: string, type: 'corporate' | 'personal', title?: string) {
    await delay(500);
    const newConv = {
      conversation_id: `conv_${Date.now()}`,
      user_id: userId,
      type,
      title: title || 'Nova conversa',
      summary: '',
      context: [],
      messages: [],
      message_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return { success: true, data: newConv };
  },

  // ===== CHAT (Simulado) =====
  async sendMessage(conversationId: string, message: string, depth: number = 2) {
    await delay(1500); // Simula processamento IA

    // Respostas mockadas baseadas em keywords
    let responseText = '';
    let metadata = {
      model: 'mock-gpt-4o',
      latency_ms: 1500,
      cost_usd: 0.02,
      depth_used: depth,
      confidence: 0.85
    };

    if (message.toLowerCase().includes('startup')) {
      responseText = `Com base nos dados disponíveis, temos ${startups.length} startups no portfólio:\n\n${startups.map(s => `- **${s.name}** (${s.stage}): ${s.sector}`).join('\n')}`;
      metadata.confidence = 0.92;
    } else if (message.toLowerCase().includes('análise') || message.toLowerCase().includes('risco')) {
      responseText = 'Para fazer uma análise completa de risco, preciso acessar:\n- Métricas financeiras atualizadas\n- Histórico de burn rate\n- Projeções de runway\n\n[SIMULAÇÃO] Aumentando profundidade de busca para depth=3...';
      metadata.depth_used = 3;
      metadata.confidence = 0.73;
    } else {
      responseText = `[SIMULAÇÃO] Resposta para: "${message}"\n\nEsta é uma resposta simulada. Em produção, o LLM processaria sua query e retornaria insights baseados no grafo de conhecimento.`;
    }

    const response = {
      role: 'assistant',
      content: responseText,
      timestamp: new Date().toISOString(),
      metadata
    };

    return { success: true, data: response };
  },

  // ===== KNOWLEDGE =====
  async getKnowledge(filters?: any) {
    await delay(350);
    let filtered = knowledge;
    
    if (filters?.visibility) {
      filtered = filtered.filter(k => k.visibility === filters.visibility);
    }
    
    if (filters?.scope) {
      filtered = filtered.filter(k => k.scope === filters.scope);
    }

    return { success: true, data: filtered };
  },

  async createKnowledgeNode(nodeData: any) {
    await delay(600);
    const newNode = {
      knowledge_id: `kn_${Date.now()}`,
      ...nodeData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return { success: true, data: newNode };
  },

  // ===== TASKS =====
  async getTasks(filters?: any) {
    await delay(300);
    let filtered = tasks;

    if (filters?.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    if (filters?.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    return { success: true, data: filtered };
  },

  async createTask(taskData: any) {
    await delay(500);
    const newTask = {
      task_id: `tsk_${Date.now()}`,
      ...taskData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return { success: true, data: newTask };
  },

  async updateTask(taskId: string, updates: any) {
    await delay(400);
    const task = tasks.find(t => t.task_id === taskId);
    if (!task) {
      return { success: false, error: 'Task not found' };
    }
    const updated = { ...task, ...updates, updated_at: new Date().toISOString() };
    return { success: true, data: updated };
  },

  // ===== AI PROFILES =====
  async getAIProfile(userId: string) {
    await delay(250);
    const profile = aiProfiles.find(p => p.user_id === userId);
    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }
    return { success: true, data: profile };
  },

  async getConversationProfile(userId: string) {
    await delay(250);
    const profile = conversationProfiles.find(p => p.user_id === userId);
    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }
    return { success: true, data: profile };
  },

  // ===== VOICE INPUT (Spec 027 - Simulado) =====
  async transcribeAudio(audioBlob: Blob) {
    await delay(1200);
    // Simula Azure Speech-to-Text
    return {
      success: true,
      data: {
        text: '[SIMULAÇÃO] Texto transcrito do áudio',
        confidence: 0.91,
        language: 'pt-BR',
        duration_ms: 3500
      }
    };
  },

  // ===== FILE UPLOAD (Spec 028 - Simulado) =====
  async uploadFile(file: File) {
    await delay(2000);
    // Simula Docling + Azure Blob
    return {
      success: true,
      data: {
        file_id: `file_${Date.now()}`,
        filename: file.name,
        size: file.size,
        mime_type: file.type,
        status: 'processing',
        chunks_extracted: 0,
        total_chunks: 0,
        storage_url: '[MOCK] blob://azure/files/...'
      }
    };
  },

  async getFileStatus(fileId: string) {
    await delay(500);
    // Simula processamento concluído
    return {
      success: true,
      data: {
        file_id: fileId,
        status: 'completed',
        chunks_extracted: 15,
        total_chunks: 15,
        indexed: true
      }
    };
  }
};

// ===== HELPER: Toggle entre Mock e Real =====
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true' || true;

export const api = USE_MOCK ? mockApi : {
  // Aqui vão as chamadas reais quando disponíveis
  // import { realApi } from './realApi';
};
```

---

## 🎯 Como Usar no Frontend

### 1. Substituir Chamadas de API

**Antes** (com API real):
```typescript
// components/Admin.tsx
import { realApi } from '@/lib/api';

const users = await realApi.getUsers(); // Precisa backend
```

**Depois** (com Mock):
```typescript
// components/Admin.tsx
import { mockApi } from '@/lib/mockApi';

const users = await mockApi.getUsers(); // Funciona SEM backend!
```

### 2. Toggle via ENV

**Arquivo**: `frontend/.env.local`
```bash
# Usar mock ou API real?
NEXT_PUBLIC_USE_MOCK=true  # true = mock, false = real API

# Se false, configurar:
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**No código**:
```typescript
import { api } from '@/lib/mockApi'; // Automaticamente escolhe mock ou real

const users = await api.getUsers();
```

---

## 📊 Simular Features por Spec

### Spec 027: Voice Input

**UI**:
```tsx
// components/chat/VoiceInput.tsx
import { mockApi } from '@/lib/mockApi';

export function VoiceInput() {
  const [isRecording, setIsRecording] = useState(false);

  const handleRecord = async () => {
    setIsRecording(true);
    
    // Simular gravação (em produção: MediaRecorder API)
    await new Promise(r => setTimeout(r, 3000));
    
    const mockBlob = new Blob(['mock audio'], { type: 'audio/wav' });
    const result = await mockApi.transcribeAudio(mockBlob);
    
    setIsRecording(false);
    
    if (result.success) {
      onTranscript(result.data.text);
    }
  };

  return (
    <button onClick={handleRecord} disabled={isRecording}>
      {isRecording ? '🔴 Gravando...' : '🎤 Voice'}
    </button>
  );
}
```

### Spec 028: File Upload

```tsx
// components/upload/FileUpload.tsx
import { mockApi } from '@/lib/mockApi';

export function FileUpload() {
  const handleUpload = async (file: File) => {
    const uploadResult = await mockApi.uploadFile(file);
    
    if (uploadResult.success) {
      const fileId = uploadResult.data.file_id;
      
      // Poll status (simular processamento)
      const interval = setInterval(async () => {
        const status = await mockApi.getFileStatus(fileId);
        
        if (status.data.status === 'completed') {
          clearInterval(interval);
          console.log('Arquivo processado!', status.data);
        }
      }, 1000);
    }
  };

  return (
    <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
  );
}
```

### Spec 030: Corporate Mode + Potência

```tsx
// components/chat/PowerSelector.tsx
import { mockApi } from '@/lib/mockApi';

export function PowerSelector() {
  const [depth, setDepth] = useState(2); // 1=Rápida, 2=Balanceada, 3=Profunda

  const sendMessage = async (message: string) => {
    const response = await mockApi.sendMessage(convId, message, depth);
    
    // Mostra metadata
    console.log('Potência:', depth);
    console.log('Confidence:', response.data.metadata.confidence);
    console.log('Latency:', response.data.metadata.latency_ms);
  };

  return (
    <div>
      <label>Potência:</label>
      <select value={depth} onChange={e => setDepth(Number(e.target.value))}>
        <option value={1}>●○○ Rápida</option>
        <option value={2}>●●○ Balanceada</option>
        <option value={3}>●●● Profunda</option>
      </select>
    </div>
  );
}
```

### Spec 032: Adaptive Retrieval (Simulado)

```tsx
// components/chat/AdaptiveChat.tsx
import { mockApi } from '@/lib/mockApi';

export function AdaptiveChat() {
  const sendWithAdaptive = async (message: string) => {
    // Simular decisão da IA sobre profundidade
    let depth = 1;
    let confidence = 0;
    let iterations = 0;

    while (confidence < 0.85 && depth <= 3 && iterations < 3) {
      const response = await mockApi.sendMessage(convId, message, depth);
      confidence = response.data.metadata.confidence;
      
      console.log(`[Adaptive] Round ${iterations + 1}: depth=${depth}, confidence=${confidence}`);
      
      if (confidence < 0.85) {
        depth++;
      }
      
      iterations++;
    }

    console.log('Adaptive retrieval finalizado:', { depth, confidence, iterations });
  };

  return (
    <button onClick={() => sendWithAdaptive(userMessage)}>
      Enviar (Auto-Potência)
    </button>
  );
}
```

---

## 🎨 Visualizar Canvas (Spec 029)

### Renderizar Grafo Simulado

```tsx
// components/canvas/GraphView.tsx
import { mockApi } from '@/lib/mockApi';

export function GraphView() {
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    // Carregar nodes do mock
    const loadGraph = async () => {
      const [startups, knowledge, tasks] = await Promise.all([
        mockApi.getStartups(),
        mockApi.getKnowledge(),
        mockApi.getTasks()
      ]);

      // Criar nodes visuais
      const graphNodes = [
        ...startups.data.map(s => ({ id: s.startup_id, label: s.name, type: 'startup' })),
        ...knowledge.data.map(k => ({ id: k.knowledge_id, label: k.title, type: 'knowledge' })),
        ...tasks.data.map(t => ({ id: t.task_id, label: t.title, type: 'task' }))
      ];

      setNodes(graphNodes);
    };

    loadGraph();
  }, []);

  return (
    <div className="canvas">
      {nodes.map(node => (
        <div key={node.id} className={`node node-${node.type}`}>
          {node.label}
        </div>
      ))}
    </div>
  );
}
```

---

## 📋 Checklist de Simulação

### Phase 1: Foundation (2h)
- [ ] Criar `frontend/src/lib/mockApi.ts`
- [ ] Importar todos os JSONs de `mock-data/`
- [ ] Testar cada método (users, startups, conversations)

### Phase 2: Chat Simulado (3h)
- [ ] Integrar `mockApi.sendMessage` no ChatPanel
- [ ] Adicionar respostas condicionais (keywords)
- [ ] Mostrar metadata (latency, cost, depth)

### Phase 3: Features Simuladas (5h)
- [ ] Voice Input (Spec 027)
- [ ] File Upload (Spec 028)
- [ ] Power Selector (Spec 030)
- [ ] Adaptive Retrieval (Spec 032)

### Phase 4: Canvas Visual (4h)
- [ ] Renderizar grafo com mock nodes
- [ ] Navegação entre nodes
- [ ] Destacar tipos (startup, knowledge, task)

---

## 🎯 Benefícios da Simulação

**Desenvolvimento**:
- ✅ Iterar UX sem esperar backend
- ✅ Testar fluxos completos
- ✅ Descobrir gaps nas specs

**Validação**:
- ✅ Stakeholders veem demo funcional
- ✅ Validar usabilidade antes de implementar
- ✅ Ajustar specs baseado em feedback

**Migração**:
- ✅ Trocar `mockApi` → `realApi` quando pronto
- ✅ Mesma interface, zero refactor
- ✅ Feature flags (toggle mock/real)

---

**Próximo passo**: Criar `mockApi.ts` e integrar no frontend?
