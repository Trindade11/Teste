/**
 * Cliente API para comunicação com o backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
const AGENTS_URL = process.env.NEXT_PUBLIC_AGENTS_URL || 'http://localhost:8000';

export interface ChatRequest {
  message: string;
  session_id?: string;
  context?: Record<string, any>;
}

export interface ChatResponse {
  response: string;
  session_id?: string;
}

export interface ChatWelcomeRequest {
  user_id: string;
  session_id?: string;
}

export interface ApiError {
  detail: string;
}

/**
 * Envia uma mensagem para o backend e retorna a resposta
 */
export async function sendChatMessage(
  message: string,
  sessionId?: string,
  context?: Record<string, any>
): Promise<ChatResponse> {
  try {
    const response = await fetch(`${AGENTS_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        session_id: sessionId,
        context,
      } as ChatRequest),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Erro ao processar mensagem');
    }

    const data: ChatResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Erro na API:', error);
    throw error;
  }
}

export async function getChatWelcome(
  userId: string,
  sessionId?: string
): Promise<ChatResponse> {
  try {
    const response = await fetch(`${AGENTS_URL}/api/chat/welcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        session_id: sessionId,
      } as ChatWelcomeRequest),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Erro ao gerar boas-vindas');
    }

    const data: ChatResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Erro na API:', error);
    throw error;
  }
}

/**
 * Verifica se o backend está disponível
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${AGENTS_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Backend não disponível:', error);
    return false;
  }
}

/**
 * Ingere um documento no Neo4j
 */
export async function ingestDocument(
  document: Record<string, any>,
  documentType: string = 'Document'
): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/ingest/document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document,
        document_type: documentType,
      }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Erro ao ingerir documento');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao ingerir documento:', error);
    throw error;
  }
}

/**
 * Cria uma entidade no Neo4j
 */
export async function createEntity(
  entityType: string,
  properties: Record<string, any>
): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/entity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entity_type: entityType,
        properties,
      }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Erro ao criar entidade');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao criar entidade:', error);
    throw error;
  }
}

