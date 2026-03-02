import { useCallback } from 'react';
import { usePLAStore } from '@/stores/usePLAStore';
import { useAuthStore } from '@/store/authStore';

export function usePLA() {
  const { user } = useAuthStore();
  const {
    conversationId,
    messages,
    isLoading,
    currentDocument,
    sendMessage: storeSendMessage,
    clearConversation,
    setCurrentDocument,
  } = usePLAStore();

  const sendMessage = useCallback(
    async (content: string) => {
      if (!user?.userId) {
        console.error('User not authenticated');
        return;
      }

      await storeSendMessage(content, user.userId);
    },
    [user, storeSendMessage]
  );

  const generateDocument = useCallback(
    async (documentType: string, title: string, requirements: string) => {
      if (!user?.userId) {
        console.error('User not authenticated');
        return;
      }

      try {
        const response = await fetch('http://localhost:8001/agents/document/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            document_type: documentType,
            title,
            requirements,
            context: {},
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate document');
        }

        const data = await response.json();

        if (data.success && data.data) {
          setCurrentDocument({
            title: data.data.title,
            content: data.data.content,
            type: data.data.document_type,
          });
        }
      } catch (error) {
        console.error('Document generation error:', error);
      }
    },
    [user, setCurrentDocument]
  );

  return {
    conversationId,
    messages,
    isLoading,
    currentDocument,
    sendMessage,
    generateDocument,
    clearConversation,
    setCurrentDocument,
  };
}
