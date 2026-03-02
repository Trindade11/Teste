'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Check,
  X,
  FileCode,
  ScrollText,
  Clipboard,
  FileSignature,
  BookOpen,
  BarChart,
  Search,
} from 'lucide-react';
import { usePLA } from '@/hooks/usePLA';

const DOCUMENT_TYPES = [
  { value: 'contract', label: 'Contrato', icon: FileSignature },
  { value: 'proposal', label: 'Proposta', icon: Clipboard },
  { value: 'report', label: 'Relatório', icon: BarChart },
  { value: 'meeting', label: 'Ata de Reunião', icon: ScrollText },
  { value: 'technical_spec', label: 'Especificação Técnica', icon: FileCode },
  { value: 'policy', label: 'Política', icon: BookOpen },
  { value: 'manual', label: 'Manual', icon: BookOpen },
  { value: 'analysis', label: 'Análise', icon: Search },
  { value: 'other', label: 'Outro', icon: FileText },
];

interface DocumentEditorProps {
  onDocumentStateChange?: (isActive: boolean) => void;
}

export function DocumentEditor({ onDocumentStateChange }: DocumentEditorProps) {
  const { currentDocument } = usePLA();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState<string>('');
  const [isDocumentActive, setIsDocumentActive] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (currentDocument) {
      setContent(currentDocument.content);
      setTitle(currentDocument.title);
      setDocumentType(currentDocument.type);
      setIsDocumentActive(true);
    }
  }, [currentDocument]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  const handleNewDocument = () => {
    onDocumentStateChange?.(true);
    setContent('');
    setTitle('');
    setDocumentType('');
    setIsDocumentActive(true);
  };

  const handleAccept = () => {
    console.log('Aceitar documento:', { title, documentType, content });
  };

  const handleReject = () => {
    if (confirm('Descartar documento?')) {
      setIsDocumentActive(false);
      setContent('');
      setTitle('');
      setDocumentType('');
      onDocumentStateChange?.(false);
    }
  };

  if (!isDocumentActive) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum documento ativo</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          Clique em "Novo Documento" ou peça ao assistente no chat para criar um documento automaticamente
        </p>
        <Button onClick={handleNewDocument} size="lg">
          <FileText className="h-4 w-4 mr-2" />
          Novo Documento
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Editor de Documentos</h2>
            {documentType && (
              <Badge variant="outline">
                {DOCUMENT_TYPES.find(t => t.value === documentType)?.label}
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleNewDocument}>
            <FileText className="h-4 w-4 mr-2" />
            Novo Documento
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Título</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título do documento"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Tipo de Documento</label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="O conteúdo do documento gerado pelo chat aparecerá aqui. Você pode editar e aceitar as alterações."
          className="w-full h-full min-h-[400px] resize-none bg-transparent border-0 focus:outline-none focus:ring-0 font-mono text-sm p-4"
        />
      </div>

      <div className="border-t bg-card p-4 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {content.length} caracteres · {content.split('\n').length} linhas
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReject}>
            <X className="h-4 w-4 mr-2" />
            Rejeitar
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={!title || !documentType}
          >
            <Check className="h-4 w-4 mr-2" />
            Aceitar
          </Button>
        </div>
      </div>
    </div>
  );
}
