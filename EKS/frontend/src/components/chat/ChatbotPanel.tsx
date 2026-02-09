"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip } from "@/components/ui/tooltip"
import {
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  Bot,
  User,
  Paperclip,
  History,
  FolderKanban,
  GitBranch,
  UserIcon,
  BotIcon,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Menu,
} from "lucide-react"
import { useChat } from "@/hooks/use-chat"
import { useConversations } from "@/hooks/use-conversations"
import { useAuthStore } from "@/store/authStore"
import { useChatContextStore } from "@/store/chatContextStore"
import { getChatWelcome } from "@/services/api"
import { MarkdownRenderer } from "./MarkdownRenderer"
import { ConversationHistory } from "./ConversationHistory"
import { EntityMention } from "./EntityMention"
import { AudioRecorder } from "./AudioRecorder"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { EntityType } from "@/types/chat"
import { cn } from "@/lib/utils"
import { X, CheckCircle2, AlertTriangle, Lightbulb, CheckSquare, Target, FileText } from "lucide-react"

interface ChatbotPanelProps {
  isExpanded?: boolean
  onToggle?: () => void
  isMobile?: boolean
}

const MIN_WIDTH = 320
const MAX_WIDTH = 800
const DEFAULT_WIDTH = 448

export function ChatbotPanel({ 
  isExpanded: isExpandedProp, 
  onToggle, 
  isMobile = false 
}: ChatbotPanelProps) {
  // No modo mobile, sempre expandido
  const isExpanded = isMobile ? true : (isExpandedProp ?? false)

  const { user } = useAuthStore()
  const { contextItems, removeContextItem, clearContext } = useChatContextStore()
  const sessionIdRef = useRef<string>(`session-${Date.now()}`)
  const welcomeInFlightRef = useRef(false)
  const [isStartingChat, setIsStartingChat] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH)
  const [isResizing, setIsResizing] = useState(false)
  const [showEntityMention, setShowEntityMention] = useState(false)
  const [cursorPosition, setCursorPosition] = useState<{ start: number; end: number } | null>(null)
  const [selectedEntities, setSelectedEntities] = useState<Record<string, string>>({})
  const [messageFeedback, setMessageFeedback] = useState<Record<string, 'positive' | 'negative' | null>>({})
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mentionTriggerRef = useRef<HTMLDivElement>(null)
  const resizeStartXRef = useRef<number>(0)
  const resizeStartWidthRef = useRef<number>(DEFAULT_WIDTH)

  // Gerenciamento de conversas
  const {
    conversations,
    currentConversation,
    currentConversationId,
    setCurrentConversationId,
    createConversation,
    addMessage,
    deleteConversation,
    toggleKnowledgeBase,
  } = useConversations()

  // Chat hook integrado com conversas
  const { messages, isLoading, sendMessage, resetMessages } = useChat({
    initialMessages: currentConversation?.messages || [],
    sessionId: sessionIdRef.current,
    baseContext: user?.userId ? { user_id: user.userId } : undefined,
    onMessageSent: (message) => {
      if (currentConversationId) {
        addMessage(currentConversationId, message)
      }
    }
  })

  // Feedback para mensagens
  const handleMessageFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    setMessageFeedback(prev => ({
      ...prev,
      [messageId]: prev[messageId] === feedback ? null : feedback
    }))
  }

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const startChatWithWelcome = useCallback(async (userId: string) => {
    if (welcomeInFlightRef.current) return
    welcomeInFlightRef.current = true
    setIsStartingChat(true)

    try {
      const sessionId = sessionIdRef.current
      const welcome = await getChatWelcome(userId, sessionId)

      const initialMessage = {
        id: Date.now().toString(),
        type: 'bot' as const,
        content: welcome.response,
        timestamp: new Date(),
        sources: ['Agente Pessoal'],
      }

      createConversation(initialMessage)
      resetMessages(initialMessage.content)
    } catch {
      const fallbackMessage = {
        id: Date.now().toString(),
        type: 'bot' as const,
        content: 'Não consegui iniciar o chat agora. Tente enviar uma mensagem para começar.',
        timestamp: new Date(),
        sources: ['Sistema'],
      }

      createConversation(fallbackMessage)
      resetMessages(fallbackMessage.content)
    } finally {
      setIsStartingChat(false)
      welcomeInFlightRef.current = false
    }
  }, [createConversation, resetMessages])

  useEffect(() => {
    if (!isExpanded) return
    if (!user?.userId) return
    if (!currentConversationId) {
      void startChatWithWelcome(user.userId)
      return
    }

    if ((currentConversation?.messages || []).length === 0) {
      void startChatWithWelcome(user.userId)
    }
  }, [isExpanded, user?.userId, currentConversationId, currentConversation?.messages, startChatWithWelcome])

  useEffect(() => {
    const onChatStart = (e: Event) => {
      const detail = (e as CustomEvent).detail as { userId?: string | null } | undefined
      const userId = detail?.userId || user?.userId
      if (!userId) return
      void startChatWithWelcome(userId)
    }

    window.addEventListener('chat:start', onChatStart as EventListener)
    return () => window.removeEventListener('chat:start', onChatStart as EventListener)
  }, [user?.userId, startChatWithWelcome])

  // Gerenciar redimensionamento
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const deltaX = resizeStartXRef.current - e.clientX
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, resizeStartWidthRef.current + deltaX))
      setPanelWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    if (isResizing) {
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    resizeStartXRef.current = e.clientX
    resizeStartWidthRef.current = panelWidth
  }

  const handleSendMessage = async (content: string) => {
    const { getContextForLLM } = useChatContextStore.getState()
    const contextText = getContextForLLM()
    const fullContent = contextText ? `${contextText}\n\n---\n\n${content}` : content
    await sendMessage(fullContent)
    setInputValue("")
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Verificar se o item arrastado é válido
    const types = e.dataTransfer.types
    if (types.includes("application/json")) {
      e.dataTransfer.dropEffect = "move"
    } else {
      e.dataTransfer.dropEffect = "none"
    }
  }

  const dragCounterRef = useRef(0)

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    dragCounterRef.current--
    
    // Só desativa quando realmente saiu de todos os elementos filhos
    if (dragCounterRef.current === 0) {
      setIsDraggingOver(false)
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    dragCounterRef.current++
    
    // Verificar se o item arrastado é válido
    const types = e.dataTransfer.types
    if (types.includes("application/json")) {
      setIsDraggingOver(true)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current = 0
    setIsDraggingOver(false)

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"))
      if (data.type && data.title) {
        const { addContextItem } = useChatContextStore.getState()
        addContextItem({
          id: data.id || `context-${Date.now()}`,
          type: data.type,
          title: data.title,
          description: data.description || "",
          metadata: data.metadata || {},
        })
      }
    } catch (error) {
      console.error("Failed to parse dropped data:", error)
    }
  }

  // Handler global para detectar quando o drag termina
  useEffect(() => {
    const handleDragEnd = () => {
      dragCounterRef.current = 0
      setIsDraggingOver(false)
    }

    document.addEventListener("dragend", handleDragEnd)
    return () => {
      document.removeEventListener("dragend", handleDragEnd)
    }
  }, [])

  const getContextItemIcon = (type: string) => {
    switch (type) {
      case "decision":
        return <CheckCircle2 className="w-3.5 h-3.5" />
      case "risk":
        return <AlertTriangle className="w-3.5 h-3.5" />
      case "insight":
        return <Lightbulb className="w-3.5 h-3.5" />
      case "task":
        return <CheckSquare className="w-3.5 h-3.5" />
      case "project":
        return <FolderKanban className="w-3.5 h-3.5" />
      case "okr":
        return <Target className="w-3.5 h-3.5" />
      default:
        return <FileText className="w-3.5 h-3.5" />
    }
  }

  const getContextItemLabel = (type: string) => {
    switch (type) {
      case "decision":
        return "Decisão"
      case "risk":
        return "Risco"
      case "insight":
        return "Insight"
      case "task":
        return "Tarefa"
      case "project":
        return "Projeto"
      case "okr":
        return "OKR"
      default:
        return type
    }
  }

  const handleAudioRecorded = async (audioBlob: Blob) => {
    const simulatedTranscription = '[Áudio gravado - transcrição pendente]'
    await sendMessage(simulatedTranscription)
  }

  const handleNewConversation = () => {
    const newId = createConversation()
    resetMessages()
    setInputValue("")
    setShowHistory(true)
  }

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id)
    const conversation = conversations.find(c => c.id === id)
    if (conversation) {
      resetMessages(conversation.messages[0]?.content)
    }
  }

  // Ícone para cada tipo de entidade
  const getEntityIcon = (type: EntityType) => {
    switch (type) {
      case 'projeto':
        return <FolderKanban className="h-3 w-3" />
      case 'processo':
        return <GitBranch className="h-3 w-3" />
      case 'pessoa':
        return <UserIcon className="h-3 w-3" />
      case 'agente':
        return <BotIcon className="h-3 w-3" />
    }
  }

  // Render Mobile
  if (isMobile) {
    return (
      <div className="flex h-full w-full">
        <div className="flex flex-col h-full w-full">
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                <ConversationHistory
                  conversations={conversations}
                  currentConversationId={currentConversationId}
                  onSelectConversation={handleSelectConversation}
                  onCreateConversation={handleNewConversation}
                  onDeleteConversation={deleteConversation}
                  onToggleKnowledgeBase={toggleKnowledgeBase}
                  isOpen={true}
                />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-sm">Assistente Virtual</h3>
            </div>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleNewConversation}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages Area */}
          <div 
            className="flex-1 overflow-y-auto p-4" 
            ref={scrollAreaRef}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.type === "bot" && (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                  )}

                  <div className={`max-w-[80%] ${message.type === "user" ? "order-1" : ""}`}>
                    <div
                      className={`rounded-lg p-3 text-sm ${
                        message.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      {message.type === "bot" ? (
                        <MarkdownRenderer content={message.content} />
                      ) : (
                        message.content
                      )}
                    </div>

                    {message.type === "bot" && (
                      <div className="flex items-center gap-1 mt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-6 w-6 p-0",
                            messageFeedback[message.id] === 'positive' && "text-green-600"
                          )}
                          onClick={() => handleMessageFeedback(message.id, 'positive')}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-6 w-6 p-0",
                            messageFeedback[message.id] === 'negative' && "text-red-600"
                          )}
                          onClick={() => handleMessageFeedback(message.id, 'negative')}
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-1">
                      {message.timestamp.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {message.type === "user" && (
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="h-3 w-3" />
                    </div>
                  )}
                </div>
              ))}

              {(isLoading || isStartingChat) && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area Mobile */}
          <div 
            className="border-t border-border bg-card"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Área de Drop Mobile (quando arrastando) - sempre visível quando arrastando */}
            {isDraggingOver && (
              <div className="px-4 py-4 bg-primary/10 border-b-2 border-primary animate-pulse">
                <div className="flex items-center justify-center gap-2 text-primary font-semibold">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm">Solte aqui para adicionar ao contexto</span>
                </div>
              </div>
            )}

            {/* Área de Contexto Mobile */}
            {(contextItems.length > 0 || isDraggingOver) && (
              <div className={cn(
                "px-4 pt-3 pb-2 border-b border-border/50 transition-colors",
                contextItems.length > 0 ? "bg-muted/30" : "bg-transparent",
                isDraggingOver && "bg-primary/5"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Contexto Ativo
                    </span>
                    {contextItems.length > 0 && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        {contextItems.length}
                      </Badge>
                    )}
                    {isDraggingOver && contextItems.length === 0 && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 border-primary text-primary">
                        Solte para adicionar
                      </Badge>
                    )}
                  </div>
                  {contextItems.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearContext}
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Limpar
                    </Button>
                  )}
                </div>
                {contextItems.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {contextItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background border border-border text-xs group"
                      >
                        <div className="text-muted-foreground">
                          {getContextItemIcon(item.type)}
                        </div>
                        <span className="font-medium text-foreground truncate max-w-[120px]">
                          {item.title}
                        </span>
                        <button
                          onClick={() => removeContextItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : isDraggingOver && (
                  <div className="text-xs text-muted-foreground italic py-1">
                    Arraste elementos aqui para incluí-los no contexto da conversa
                  </div>
                )}
              </div>
            )}

            {/* Input Mobile */}
            <div className="p-4">
            <div className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                placeholder="Sua pergunta..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(inputValue)
                  }
                }}
                className="flex-1 min-h-[40px] max-h-[120px] px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                rows={1}
                disabled={isLoading || isStartingChat}
              />
              <AudioRecorder 
                onAudioRecorded={handleAudioRecorded}
                className="flex-shrink-0"
              />
              <Button
                onClick={() => handleSendMessage(inputValue)}
                size="sm"
                disabled={!inputValue.trim() || isLoading || isStartingChat}
                className="h-9 w-9 p-0 flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render Desktop - embutido na coluna do layout
  return (
    <div className="h-full w-full relative" data-chat-panel>
      {/* Sidebar de Histórico - OVERLAY sobre o canvas */}
      {isExpanded && showHistory && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-30"
            onClick={() => setShowHistory(false)}
          />
          {/* Histórico posicionado à direita do canvas, antes do chat */}
          <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 bg-card border-l border-r border-border shadow-2xl z-40 transform translate-x-[-500px]">
            <ConversationHistory
              conversations={conversations}
              currentConversationId={currentConversationId}
              onSelectConversation={handleSelectConversation}
              onCreateConversation={handleNewConversation}
              onDeleteConversation={deleteConversation}
              onToggleKnowledgeBase={toggleKnowledgeBase}
              isOpen={showHistory}
              onClose={() => setShowHistory(false)}
            />
          </div>
        </>
      )}

      {/* Painel do Chat - tamanho fixo */}
      <div className="h-full w-full flex flex-col bg-card relative border-l-2 border-border shadow-[-4px_0_12px_rgba(0,0,0,0.08)]">
        {/* Botão de colapsar - SEMPRE VISÍVEL */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onToggle} 
          className="absolute top-2 left-2 z-50 h-8 w-8 p-0 bg-card border border-border hover:bg-accent"
          data-chat-expand
        >
          {isExpanded ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>

        {isExpanded ? (
          <div className="flex flex-col h-full w-full">
            <div className="relative p-4 border-b border-border bg-card flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 ml-10 min-w-0 flex-1">
                  <Bot className="h-5 w-5 text-primary flex-shrink-0" />
                  <h3 className="font-semibold text-sm whitespace-nowrap">Assistente Virtual</h3>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Tooltip content="Nova conversa">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleNewConversation}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip content={showHistory ? "Ocultar histórico" : "Mostrar histórico"}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowHistory(!showHistory)}
                      className="h-8 w-8 p-0"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-9 mt-1">
                <p className="text-xs text-muted-foreground truncate">
                  {currentConversation?.title || 'Seu assistente inteligente'}
                </p>
              </div>
            </div>

            <div 
              className="flex-1 overflow-y-auto p-4 pb-0" 
              ref={scrollAreaRef}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${message.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.type === "bot" && (
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="h-3 w-3 text-primary" />
                      </div>
                    )}

                    <div className={`max-w-[80%] ${message.type === "user" ? "order-1" : ""}`}>
                      <div
                        className={`rounded-lg p-3 text-sm ${
                          message.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        {message.type === "bot" ? (
                          <MarkdownRenderer content={message.content} />
                        ) : (
                          message.content
                        )}
                      </div>

                      {message.mentions && message.mentions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {message.mentions.map((mention, index) => (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className="text-xs flex items-center gap-1"
                            >
                              {getEntityIcon(mention.type)}
                              {mention.name}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-muted-foreground">Fontes consultadas:</p>
                          {message.sources.map((source, index) => (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className="text-xs mr-1"
                            >
                              {source}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {message.type === "bot" && (
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-6 px-2",
                              messageFeedback[message.id] === 'positive' && "bg-green-100 dark:bg-green-900"
                            )}
                            onClick={() => handleMessageFeedback(message.id, 'positive')}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-6 px-2",
                              messageFeedback[message.id] === 'negative' && "bg-red-100 dark:bg-red-900"
                            )}
                            onClick={() => handleMessageFeedback(message.id, 'negative')}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground mt-1">
                        {message.timestamp.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {message.type === "user" && (
                      <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                ))}

                {(isLoading || isStartingChat) && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div 
              className="border-t border-border mt-auto bg-card flex-shrink-0"
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Área de Drop (quando arrastando) - sempre visível quando arrastando */}
              {isDraggingOver && (
                <div className="px-4 py-4 bg-primary/10 border-b-2 border-primary animate-pulse">
                  <div className="flex items-center justify-center gap-2 text-primary font-semibold">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm">Solte aqui para adicionar ao contexto</span>
                  </div>
                </div>
              )}

              {/* Área de Contexto */}
              {(contextItems.length > 0 || isDraggingOver) && (
                <div className={cn(
                  "px-4 pt-3 pb-2 border-b border-border/50 transition-colors",
                  contextItems.length > 0 ? "bg-muted/30" : "bg-transparent",
                  isDraggingOver && "bg-primary/5"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Contexto Ativo
                      </span>
                      {contextItems.length > 0 && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {contextItems.length}
                        </Badge>
                      )}
                      {isDraggingOver && contextItems.length === 0 && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0 border-primary text-primary">
                          Solte para adicionar
                        </Badge>
                      )}
                    </div>
                    {contextItems.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearContext}
                        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Limpar
                      </Button>
                    )}
                  </div>
                  {contextItems.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {contextItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background border border-border text-xs group"
                        >
                          <div className="text-muted-foreground">
                            {getContextItemIcon(item.type)}
                          </div>
                          <span className="font-medium text-foreground truncate max-w-[120px]">
                            {item.title}
                          </span>
                          <button
                            onClick={() => removeContextItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : isDraggingOver && (
                    <div className="text-xs text-muted-foreground italic py-1">
                      Arraste elementos aqui para incluí-los no contexto da conversa
                    </div>
                  )}
                </div>
              )}

              {/* Área de Input */}
              <div className="p-4">
              <div className="flex gap-2 items-end w-full">
                <Tooltip content="Anexar arquivo (em breve)">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 flex-shrink-0"
                    disabled={isLoading || isStartingChat}
                  >
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </Tooltip>
                
                <div className="flex-1 min-w-0">
                  <textarea
                    ref={textareaRef}
                    placeholder="Sua pergunta..."
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value)
                      
                      if (e.target.value.charAt(e.target.selectionStart - 1) === '@') {
                        setShowEntityMention(true)
                        setCursorPosition({
                          start: e.target.selectionStart,
                          end: e.target.selectionStart
                        })
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setShowEntityMention(false)
                      }
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage(inputValue)
                      }
                    }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    disabled={isLoading || isStartingChat}
                    rows={1}
                    style={{
                      minHeight: '36px',
                      maxHeight: '120px'
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      const newHeight = Math.min(120, Math.max(36, target.scrollHeight));
                      target.style.height = `${newHeight}px`;

                      if (target.scrollHeight > 150) {
                        target.style.overflowY = 'auto';
                      } else {
                        target.style.overflowY = 'hidden';
                      }
                    }}
                  />
                  
                  <EntityMention
                    isOpen={showEntityMention}
                    onSelect={(entity) => {
                      if (cursorPosition && textareaRef.current) {
                        const beforeMention = inputValue.slice(0, cursorPosition.start - 1)
                        const afterMention = inputValue.slice(cursorPosition.end)
                        const newValue = `${beforeMention}${entity.name}${afterMention}`
                        setInputValue(newValue)
                        
                        setSelectedEntities(prev => ({
                          ...prev,
                          [entity.name]: `@[${entity.name}](${entity.type}:${entity.id})`
                        }))
                        
                        textareaRef.current.focus()
                        const newCursorPos = beforeMention.length + entity.name.length
                        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
                      }
                      setShowEntityMention(false)
                    }}
                    onClose={() => setShowEntityMention(false)}
                    triggerRef={mentionTriggerRef as React.RefObject<HTMLElement>}
                  />
                </div>
                
                <AudioRecorder 
                  onAudioRecorded={handleAudioRecorded}
                  className="flex-shrink-0"
                />
                
                <Button
                  size="sm"
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={isLoading || isStartingChat || !inputValue.trim()}
                  className="h-9 w-9 p-0 flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full pt-12">
            <MessageCircle className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  )
}
