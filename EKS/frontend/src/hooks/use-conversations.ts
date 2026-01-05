import { useState, useCallback, useEffect } from 'react';
import { Conversation, Message } from '@/types/chat';

const STORAGE_KEY = 'chat_conversations';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Carregar conversas do localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Converter strings de data para objetos Date
        const conversationsWithDates = parsed.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setConversations(conversationsWithDates);
        
        // Definir a conversa mais recente como atual se não houver nenhuma selecionada
        if (conversationsWithDates.length > 0 && !currentConversationId) {
          setCurrentConversationId(conversationsWithDates[0].id);
        }
      } catch (error) {
        console.error('Erro ao carregar conversas:', error);
      }
    }
  }, []);

  // Salvar conversas no localStorage
  const saveConversations = useCallback((convs: Conversation[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
      setConversations(convs);
    } catch (error) {
      console.error('Erro ao salvar conversas:', error);
    }
  }, []);

  // Criar nova conversa
  const createConversation = useCallback((initialMessage?: Message) => {
    const now = new Date();
    const newConversation: Conversation = {
      id: `conv_${Date.now()}`,
      title: 'Nova Conversa',
      messages: initialMessage ? [initialMessage] : [],
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newConversation, ...conversations];
    saveConversations(updated);
    setCurrentConversationId(newConversation.id);
    
    return newConversation.id;
  }, [conversations, saveConversations]);

  // Atualizar conversa
  const updateConversation = useCallback((conversationId: string, updates: Partial<Conversation>) => {
    const updated = conversations.map(conv => 
      conv.id === conversationId
        ? { ...conv, ...updates, updatedAt: new Date() }
        : conv
    );
    saveConversations(updated);
  }, [conversations, saveConversations]);

  // Adicionar mensagem à conversa
  const addMessage = useCallback((conversationId: string, message: Message) => {
    const updated = conversations.map(conv => {
      if (conv.id === conversationId) {
        const newMessages = [...conv.messages, message];
        
        // Auto-gerar título baseado na primeira mensagem do usuário
        let newTitle = conv.title;
        if (conv.title === 'Nova Conversa' && message.type === 'user') {
          newTitle = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
        }
        
        return {
          ...conv,
          messages: newMessages,
          title: newTitle,
          updatedAt: new Date()
        };
      }
      return conv;
    });
    saveConversations(updated);
  }, [conversations, saveConversations]);

  // Deletar conversa
  const deleteConversation = useCallback((conversationId: string) => {
    const updated = conversations.filter(conv => conv.id !== conversationId);
    saveConversations(updated);
    
    // Se a conversa deletada era a atual, selecionar a primeira disponível
    if (currentConversationId === conversationId) {
      setCurrentConversationId(updated.length > 0 ? updated[0].id : null);
    }
  }, [conversations, currentConversationId, saveConversations]);

  // Obter conversa atual
  const currentConversation = conversations.find(conv => conv.id === currentConversationId);

  // Toggle knowledge base flag
  const toggleKnowledgeBase = useCallback((conversationId: string) => {
    const updated = conversations.map(conv => 
      conv.id === conversationId
        ? { ...conv, isKnowledgeBase: !conv.isKnowledgeBase }
        : conv
    );
    saveConversations(updated);
  }, [conversations, saveConversations]);

  // Limpar todas as conversas
  const clearAllConversations = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setConversations([]);
    setCurrentConversationId(null);
  }, []);

  return {
    conversations,
    currentConversation,
    currentConversationId,
    setCurrentConversationId,
    createConversation,
    updateConversation,
    addMessage,
    deleteConversation,
    toggleKnowledgeBase,
    clearAllConversations,
  };
}

