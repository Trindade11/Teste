import { create } from 'zustand';

interface PLAMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  intent?: {
    intentType: string;
    confidence: number;
    entities: string[];
    requiresTeam: boolean;
    suggestedAgents: string[];
  };
  cdcLevel?: string;
  agentsUsed?: string[];
}

interface PLAState {
  conversationId: string | null;
  messages: PLAMessage[];
  isLoading: boolean;
  currentDocument: {
    title: string;
    content: string;
    type: string;
  } | null;
  
  // Actions
  setConversationId: (id: string) => void;
  addMessage: (message: PLAMessage) => void;
  setLoading: (loading: boolean) => void;
  setCurrentDocument: (doc: PLAState['currentDocument']) => void;
  clearConversation: () => void;
  sendMessage: (content: string, userId: string) => Promise<void>;
}

export const usePLAStore = create<PLAState>((set, get) => ({
  conversationId: null,
  messages: [],
  isLoading: false,
  currentDocument: null,

  setConversationId: (id) => set({ conversationId: id }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setCurrentDocument: (doc) => set({ currentDocument: doc }),
  
  clearConversation: () => set({
    conversationId: null,
    messages: [],
    currentDocument: null,
  }),

  sendMessage: async (content, userId) => {
    const state = get();
    
    // Add user message
    const userMessage: PLAMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
    }));

    try {
      // Call PLA API
      const response = await fetch('http://localhost:3002/api/pla/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          conversationId: state.conversationId || `conv-${Date.now()}`,
          message: content,
          activeContext: [], // TODO: Get from context store
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get PLA response');
      }

      const data = await response.json();
      
      // Update conversation ID if new
      if (!state.conversationId) {
        set({ conversationId: data.data.conversationId });
      }

      // Add assistant message
      const assistantMessage: PLAMessage = {
        id: data.data.messageId,
        role: 'assistant',
        content: data.data.response,
        timestamp: new Date(),
        intent: data.data.intent,
        cdcLevel: data.data.cdcLevel,
        agentsUsed: data.data.agentsUsed,
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      }));

      // If document was generated, set it
      if (data.data.generatedDocument) {
        set({
          currentDocument: {
            title: data.data.generatedDocument.title || 'Documento Gerado',
            content: data.data.generatedDocument.content,
            type: data.data.generatedDocument.document_type || 'other',
          },
        });
      }
    } catch (error) {
      console.error('PLA send message error:', error);
      
      // Add error message
      const errorMessage: PLAMessage = {
        id: `msg-error-${Date.now()}`,
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        timestamp: new Date(),
      };

      set((state) => ({
        messages: [...state.messages, errorMessage],
        isLoading: false,
      }));
    }
  },
}));
