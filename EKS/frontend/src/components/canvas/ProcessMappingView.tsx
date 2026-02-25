"use client";

import { useState, useEffect } from "react";
import { 
  GitBranch, 
  MessageSquare,
  Eye,
  Send,
  Sparkles,
  CheckCircle2,
  Circle,
  AlertCircle,
  ChevronRight,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MermaidDiagram } from "@/components/ui/mermaid-diagram";
import { cn } from "@/lib/utils";

interface SuggestedProcess {
  id: string;
  name: string;
  description: string;
  confidence: number;
  source: 'llm_inference' | 'user_defined';
  status: 'suggested' | 'confirmed' | 'in_progress' | 'completed';
}

interface MappingSession {
  sessionId: string;
  processId: string;
  processName: string;
  currentStep: number;
  totalSteps: number;
  mermaidDiagram: string;
  conversationHistory: Array<{
    role: 'assistant' | 'user';
    content: string;
    timestamp: Date;
  }>;
}

export function ProcessMappingView() {
  const [view, setView] = useState<'list' | 'mapping'>('list');
  const [processes, setProcesses] = useState<SuggestedProcess[]>([]);
  const [session, setSession] = useState<MappingSession | null>(null);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load suggested processes on mount
  useEffect(() => {
    loadSuggestedProcesses();
  }, []);

  const loadSuggestedProcesses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      
      const response = await fetch(`${apiUrl}/api/process-mapping/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          userId: 'current-user' // TODO: Get from auth context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to load suggested processes');
      }

      const data = await response.json();
      if (data.success) {
        setProcesses(data.data.suggestedProcesses || []);
      }
    } catch (err) {
      console.error('Error loading processes:', err);
      setError('Erro ao carregar processos sugeridos');
      // Fallback to mock data for demo
      setProcesses([
        {
          id: '1',
          name: 'Qualificação de Leads',
          description: 'Processo de análise e qualificação de leads recebidos do marketing',
          confidence: 0.85,
          source: 'llm_inference',
          status: 'suggested'
        },
        {
          id: '2',
          name: 'Criação de Proposta',
          description: 'Elaboração de propostas comerciais para clientes qualificados',
          confidence: 0.78,
          source: 'llm_inference',
          status: 'suggested'
        },
        {
          id: '3',
          name: 'Negociação de Contrato',
          description: 'Processo de negociação e fechamento de contratos',
          confidence: 0.72,
          source: 'llm_inference',
          status: 'suggested'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startMapping = async (processToMap: SuggestedProcess) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      
      const response = await fetch(`${apiUrl}/api/process-mapping/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          userId: 'current-user',
          processId: processToMap.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start mapping session');
      }

      const data = await response.json();
      if (data.success) {
        setSession({
          sessionId: data.data.sessionId,
          processId: processToMap.id,
          processName: processToMap.name,
          currentStep: 1,
          totalSteps: 5,
          mermaidDiagram: '',
          conversationHistory: [
            {
              role: 'assistant',
              content: data.data.firstQuestion || 'Vamos começar! Onde este processo inicia? (Quem ou o que dispara este processo?)',
              timestamp: new Date()
            }
          ]
        });
        setView('mapping');
      }
    } catch (err) {
      console.error('Error starting mapping:', err);
      // Fallback to mock session for demo
      setSession({
        sessionId: 'demo-session',
        processId: processToMap.id,
        processName: processToMap.name,
        currentStep: 1,
        totalSteps: 5,
        mermaidDiagram: '',
        conversationHistory: [
          {
            role: 'assistant',
            content: 'Vamos começar! Onde este processo inicia? (Quem ou o que dispara este processo?)',
            timestamp: new Date()
          }
        ]
      });
      setView('mapping');
    } finally {
      setLoading(false);
    }
  };

  const submitMappingStep = async () => {
    if (!userInput.trim() || !session) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setLoading(true);

    // Add user message to history
    const updatedHistory = [
      ...session.conversationHistory,
      {
        role: 'user' as const,
        content: userMessage,
        timestamp: new Date()
      }
    ];

    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      
      const response = await fetch(`${apiUrl}/api/process-mapping/step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          sessionId: session.sessionId,
          answer: userMessage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit mapping step');
      }

      const data = await response.json();
      if (data.success) {
        setSession({
          ...session,
          currentStep: session.currentStep + 1,
          mermaidDiagram: data.data.mermaidDiagram || session.mermaidDiagram,
          conversationHistory: [
            ...updatedHistory,
            {
              role: 'assistant',
              content: data.data.nextQuestion || 'Obrigado! Continuando...',
              timestamp: new Date()
            }
          ]
        });

        if (data.data.isComplete) {
          // Process mapping complete
          setTimeout(() => {
            setView('list');
            loadSuggestedProcesses();
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Error submitting step:', err);
      // Fallback to mock response for demo
      const mockMermaid = generateMockMermaid(session.currentStep, userMessage);
      const mockQuestion = getMockQuestion(session.currentStep + 1);
      
      setSession({
        ...session,
        currentStep: session.currentStep + 1,
        mermaidDiagram: mockMermaid,
        conversationHistory: [
          ...updatedHistory,
          {
            role: 'assistant',
            content: mockQuestion,
            timestamp: new Date()
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMockMermaid = (step: number, userAnswer: string): string => {
    if (step === 1) {
      return `flowchart TD
  Start[${userAnswer}]
  style Start fill:#e3f2fd,stroke:#1976d2`;
    } else if (step === 2) {
      return `flowchart TD
  Start[Marketing: Lead via CRM]
  Step1[${userAnswer}]
  Start --> Step1
  style Start fill:#e3f2fd,stroke:#1976d2
  style Step1 fill:#fff3e0,stroke:#ff9800`;
    }
    return '';
  };

  const getMockQuestion = (step: number): string => {
    const questions = [
      'Vamos começar! Onde este processo inicia? (Quem ou o que dispara este processo?)',
      'Ótimo! Quais são os passos principais deste processo?',
      'Perfeito! De quem você recebe informações para iniciar este processo?',
      'Entendi! Para quem você entrega o resultado deste processo?',
      'Excelente! Existem regras de negócio ou decisões importantes neste processo?'
    ];
    return questions[step - 1] || 'Processo mapeado com sucesso!';
  };

  return (
    <div className="h-full w-full flex flex-col">
      {view === 'list' ? (
        // Process List View
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-semibold mb-2">Mapeamento de Processos</h2>
              <p className="text-sm text-muted-foreground">
                Processos sugeridos com base no seu papel e objetivos. Escolha um para iniciar o mapeamento.
              </p>
            </div>

            {/* Process Cards */}
            {loading && processes.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : error && processes.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {processes.map((process) => (
                  <div
                    key={process.id}
                    className="group rounded-xl border-2 border-border bg-card hover:border-primary/50 transition-all p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                        <GitBranch className="w-5 h-5 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{process.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(process.confidence * 100)}% confiança
                          </Badge>
                          {process.status === 'completed' && (
                            <Badge className="bg-green-500/10 text-green-600 text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Mapeado
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-4">
                          {process.description}
                        </p>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => startMapping(process)}
                            disabled={loading || process.status === 'completed'}
                            className="group-hover:bg-primary group-hover:text-primary-foreground"
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            {process.status === 'completed' ? 'Remapear' : 'Iniciar Mapeamento'}
                          </Button>
                          
                          {process.status === 'completed' && (
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-2" />
                              Visualizar
                            </Button>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Custom Process */}
            <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 text-center">
              <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                Não encontrou o processo que procura?
              </p>
              <Button variant="outline" size="sm">
                Adicionar Processo Customizado
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Mapping Session View
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Panel */}
          <div className="w-1/2 border-r border-border flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3 mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setView('list');
                    setSession(null);
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                  <h3 className="font-semibold">{session?.processName}</h3>
                  <p className="text-xs text-muted-foreground">
                    Etapa {session?.currentStep} de {session?.totalSteps}
                  </p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${((session?.currentStep || 0) / (session?.totalSteps || 5)) * 100}%` }}
                />
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {session?.conversationHistory.map((message, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0 h-fit">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0 h-fit">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Processando...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && submitMappingStep()}
                  placeholder="Digite sua resposta..."
                  disabled={loading}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  onClick={submitMappingStep}
                  disabled={loading || !userInput.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Visualization Panel */}
          <div className="w-1/2 flex flex-col bg-muted/30">
            {/* Viz Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">Visualização em Tempo Real</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                O diagrama atualiza conforme você descreve o processo
              </p>
            </div>

            {/* Mermaid Diagram */}
            <div className="flex-1 overflow-y-auto p-6">
              {session?.mermaidDiagram ? (
                <div className="rounded-xl border-2 border-primary/20 bg-card p-6">
                  <MermaidDiagram chart={session.mermaidDiagram} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Circle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      O diagrama aparecerá aqui conforme você mapeia o processo
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
