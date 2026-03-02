export type DocumentType =
  | 'contract'
  | 'report'
  | 'meeting'
  | 'process_doc'
  | 'strategic_plan'
  | 'technical_spec'
  | 'email'
  | 'note'
  | 'policy'
  | 'analysis'
  | 'manual'
  | 'proposal'
  | 'spreadsheet'
  | 'other';

export type ConfidentialityLevel = 'public' | 'internal' | 'confidential' | 'restricted';
export type MemoryClass = 'semantic' | 'episodic' | 'procedural' | 'evaluative';
export type Visibility = 'individual' | 'department' | 'corporate';

export interface DocumentMetadata {
  title: string;
  type: DocumentType;
  confidentiality: ConfidentialityLevel;
  memoryClass?: MemoryClass;
  author?: string;
  validFrom?: string;
  validUntil?: string;
  effectiveAt?: string;
  signedAt?: string;
  linkedProjectIds?: string[];
  linkedOkrIds?: string[];
  linkedObjectiveIds?: string[];
  linkedProcessId?: string;
  departmentId?: string;
  tags?: string[];
  summary?: string;
  canonicalData?: Record<string, unknown>;
  approvedEntities?: any[];
}
