// Tipos base
export interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  sources?: string[];
  mentions?: EntityMention[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  summary?: string;
  isKnowledgeBase?: boolean;
}

// Tipos de entidades para menções
export type EntityType = 'projeto' | 'processo' | 'pessoa' | 'agente';

export interface EntityMention {
  id: string;
  type: EntityType;
  name: string;
  metadata?: Record<string, any>;
}

// Entidades específicas do Neo4j
export interface Projeto {
  id: string;
  nome: string;
  descricao?: string;
  status?: string;
}

export interface Processo {
  id: string;
  nome: string;
  tipo?: string;
  responsavel?: string;
}

export interface Pessoa {
  id: string;
  nome: string;
  cargo?: string;
  email?: string;
}

export interface Agente {
  id: string;
  nome: string;
  tipo: string;
  descricao?: string;
  modelo?: string;
}

