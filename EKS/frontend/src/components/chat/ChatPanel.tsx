"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  X,
  Bot,
  User,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/store/chat-store";
import { useTaskStore } from "@/store/task-store";
import { useOnboardingStore } from "@/store/onboarding-store";
import { cn } from "@/lib/utils";
import { AgentSelector } from "./AgentSelector";

interface ChatPanelProps {
  onClose?: () => void;
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, isLoading, selectedAgent, addMessage, setLoading } = useChatStore();
  const { activeTask, toggleTaskMemory } = useTaskStore();
  const { 
    isOpen: isOnboardingOpen, 
    status: onboardingStatus, 
    currentStepId,
    responses,
    startConversation,
    updateConversationPhase,
    updateResponse,
    addConversationSignal,
  } = useOnboardingStore();

  useEffect(() => {
    if (!isOnboardingOpen) return;
    if (onboardingStatus === "completed") return;
    if (currentStepId !== "goals") return;
    if (responses.conversationPhase !== "not_started") return;

    // Inicia conversa automaticamente no step Goals
    startConversation();
    
    const greeting = `Olá ${responses.fullName || ""}, vi que você trabalha ${responses.company ? `na **${responses.company}**` : ""} ${responses.jobRole ? `como **${responses.jobRole}**` : ""}. ${responses.competencies.length > 0 ? `\n\nNotei algumas competências interessantes: ${responses.competencies.slice(0, 3).join(", ")}...` : ""}\n\nVamos conversar um pouco para eu entender melhor seu contexto. **Qual é seu objetivo principal ao usar este sistema?**`;
    
    addMessage({
      role: "assistant",
      content: greeting,
      agentId: "onboarding",
    });
  }, [isOnboardingOpen, onboardingStatus, currentStepId, responses, startConversation, addMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;

    // Add user message
    addMessage({
      role: "user",
      content: input,
      attachments: attachments.map((f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        type: f.type.startsWith("audio") ? "audio" : "file",
        size: f.size,
      })),
      agentId: selectedAgent?.id,
    });

    setInput("");
    setAttachments([]);
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      const isOnboardingAgent = selectedAgent?.id === "onboarding" || isOnboardingOpen;
      
      if (isOnboardingAgent && responses.conversationPhase !== "not_started" && responses.conversationPhase !== "done") {
        let response = "";
        
        // Lógica adaptativa baseada na fase da conversação
        if (responses.conversationPhase === "goals") {
          // Captura objetivo e move para próxima fase
          updateResponse("primaryObjective", input);
          addConversationSignal(`objetivo: ${input}`);
          updateConversationPhase("challenges");
          
          response = `Ótimo! Entendi que seu objetivo é: "${input.substring(0, 100)}..."\n\n**E quais são seus maiores desafios** para alcançar isso? Pode ser falta de tempo, dificuldade em organizar informações, falta de visibilidade, etc.`;
        } else if (responses.conversationPhase === "challenges") {
          // Captura desafios e move para preferências
          updateResponse("topChallenges", input);
          addConversationSignal(`desafios: ${input}`);
          updateConversationPhase("preferences");
          
          response = `Entendo. Vou te ajudar com isso.\n\nÚltima pergunta: **você prefere que o sistema armazene informações por padrão como Corporativas** (visíveis para todos da empresa) **ou Pessoais** (apenas você vê)? Recomendo Corporativo para facilitar colaboração.`;
        } else if (responses.conversationPhase === "preferences") {
          // Captura preferência e valida
          const isCorporate = input.toLowerCase().includes("corporat") || input.toLowerCase().includes("empresa") || input.toLowerCase().includes("todos");
          updateResponse("defaultVisibility", isCorporate ? "corporate" : "personal");
          updateConversationPhase("validation");
          
          response = `Perfeito! Configurado como **${isCorporate ? "Corporativo" : "Pessoal"}**.\n\nResumo do seu perfil:\n- Objetivo: ${responses.primaryObjective.substring(0, 80)}\n- Desafios: ${responses.topChallenges.substring(0, 80)}\n- Memória: ${isCorporate ? "Corporativa" : "Pessoal"}\n\n**Está tudo correto?** (Responda sim para finalizar ou me diga o que quer ajustar)`;
        } else if (responses.conversationPhase === "validation") {
          const isConfirmed = input.toLowerCase().includes("sim") || input.toLowerCase().includes("correto") || input.toLowerCase().includes("ok");
          
          if (isConfirmed) {
            updateConversationPhase("done");
            response = `✅ **Onboarding completo!**\n\nJá tenho tudo que preciso para personalizar sua experiência. Clique em "Próximo" no Canvas para revisar e finalizar.`;
          } else {
            response = `Sem problema! Me diga o que quer ajustar e eu atualizo.`;
          }
        }
        
        addMessage({
          role: "assistant",
          content: response,
          agentId: "onboarding",
        });
      } else {
        addMessage({
          role: "assistant",
          content: `Processando sua mensagem com o ${selectedAgent?.name || "Router"}...\n\nEsta é uma resposta de demonstração. O backend ainda não está conectado.`,
          agentId: selectedAgent?.id,
        });
      }
      
      setLoading(false);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      // TODO: Process audio and add to attachments
    } else {
      // Start recording
      setIsRecording(true);
      // TODO: Start audio recording
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Bot className="w-5 h-5 text-primary flex-shrink-0" />
          {activeTask ? (
            <span className="font-medium truncate">{activeTask.title}</span>
          ) : (
            <span className="font-medium">Chat</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {activeTask && (
            <button
              onClick={() => toggleTaskMemory(activeTask.id)}
              className={cn(
                "text-xs px-2 py-0.5 rounded-full cursor-pointer transition-colors",
                activeTask.memoryType === "corporate"
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                  : "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:hover:bg-purple-800"
              )}
              title="Clique para alternar memória"
            >
              {activeTask.memoryType === "corporate" ? "🏢 Corp" : "👤 Pessoal"}
            </button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Agent Selector */}
      <AgentSelector />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Bot className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">Inicie uma conversa</p>
            <p className="text-xs mt-1">
              Envie uma mensagem ou anexe um arquivo para começar
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.role === "user" ? "flex-row-reverse" : ""
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {message.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-4 py-2",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {message.attachments.map((att) => (
                    <span
                      key={att.id}
                      className="text-xs bg-background/20 px-2 py-0.5 rounded"
                    >
                      📎 {att.name}
                    </span>
                  ))}
                </div>
              )}
              <span className="text-[10px] opacity-60 mt-1 block">
                {message.timestamp.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-muted rounded-lg px-4 py-2">
              <p className="text-sm text-muted-foreground">Pensando...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-border">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs"
              >
                <Paperclip className="w-3 h-3" />
                <span className="max-w-[100px] truncate">{file.name}</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <div className="flex items-end gap-2">
          {/* Attachment Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="*/*"
          />

          {/* Voice Button */}
          <Button
            variant={isRecording ? "destructive" : "ghost"}
            size="icon"
            onClick={toggleRecording}
            className="flex-shrink-0"
          >
            {isRecording ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              rows={1}
              className="w-full resize-none rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-h-[40px] max-h-[120px]"
              style={{
                height: "auto",
                minHeight: "40px",
              }}
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && attachments.length === 0)}
            className="flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
