"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Clock,
  ChevronRight,
  Archive,
  X,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Conversation } from "@/types/chat"
import { cn } from "@/lib/utils"

interface ConversationHistoryProps {
  conversations: Conversation[]
  currentConversationId: string | null
  onSelectConversation: (id: string) => void
  onCreateConversation: () => void
  onDeleteConversation: (id: string) => void
  onToggleKnowledgeBase: (id: string) => void
  isOpen: boolean
  onClose?: () => void
}

export function ConversationHistory({
  conversations,
  currentConversationId,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation,
  onToggleKnowledgeBase,
  isOpen,
  onClose,
}: ConversationHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [pendingKBConversationId, setPendingKBConversationId] = useState<string | null>(null)

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Agora"
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  if (!isOpen) return null

  return (
    <div className="w-full h-full border-r border-border bg-muted/30 flex flex-col">
      <div className="p-4 border-b border-border space-y-3 bg-background/50">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center">
            <MessageSquare className="h-4 w-4" />
            <span className="ml-1.5">Conversas</span>
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCreateConversation}
              className="h-8 w-8 p-0"
              title="Nova conversa"
            >
              <Plus className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
                title="Fechar histórico"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {searchQuery ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className="group relative rounded-lg p-3 cursor-pointer transition-all duration-200"
                style={{
                  backgroundColor: currentConversationId === conversation.id
                    ? 'color-mix(in srgb, var(--primary) 10%, transparent)'
                    : undefined
                }}
                onMouseEnter={(e) => {
                  setHoveredId(conversation.id)
                  if (currentConversationId !== conversation.id) {
                    e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--primary) 5%, transparent)'
                  }
                }}
                onMouseLeave={(e) => {
                  setHoveredId(null)
                  if (currentConversationId !== conversation.id) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform",
                      currentConversationId === conversation.id ? "rotate-90" : ""
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {conversation.title}
                    </p>
                    {conversation.messages.length > 0 && (
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {conversation.messages[conversation.messages.length - 1].content.slice(0, 60)}...
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {getRelativeTime(conversation.updatedAt)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        • {conversation.messages.length} msg
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
                    <AlertDialog open={confirmDialogOpen && pendingKBConversationId === conversation.id} onOpenChange={setConfirmDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (conversation.isKnowledgeBase) {
                              onToggleKnowledgeBase(conversation.id)
                            } else {
                              setPendingKBConversationId(conversation.id)
                              setConfirmDialogOpen(true)
                            }
                          }}
                          className={cn(
                            "h-7 w-7 p-0 transition-all duration-200 rounded-md",
                            hoveredId === conversation.id || conversation.isKnowledgeBase 
                              ? "opacity-100 visible" 
                              : "opacity-0 invisible",
                            conversation.isKnowledgeBase && "bg-blue-100 dark:bg-blue-950 hover:bg-blue-200 dark:hover:bg-blue-900"
                          )}
                          title={conversation.isKnowledgeBase ? "Remover da memória corporativa" : "Adicionar à memória corporativa"}
                        >
                          <Archive className={cn(
                            "h-4 w-4",
                            conversation.isKnowledgeBase ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                          )} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Adicionar à Memória Corporativa?</AlertDialogTitle>
                          <AlertDialogDescription asChild>
                            <div className="space-y-2">
                              <div>
                                Esta conversa será processada e adicionada à base de conhecimento corporativa.
                              </div>
                              <div className="font-semibold text-foreground">
                                ⚠️ Este processo é irreversível e gerará conteúdo permanente no sistema.
                              </div>
                              <div className="text-xs">
                                A conversa será indexada e poderá ser usada como referência pelo sistema.
                              </div>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={(e: React.MouseEvent) => {
                            e.stopPropagation()
                            setPendingKBConversationId(null)
                          }}>
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation()
                              if (pendingKBConversationId) {
                                onToggleKnowledgeBase(pendingKBConversationId)
                                setPendingKBConversationId(null)
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Confirmar e Adicionar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteConversation(conversation.id)
                      }}
                      className={cn(
                        "h-6 w-6 p-0 transition-all duration-200",
                        hoveredId === conversation.id 
                          ? "opacity-100 visible" 
                          : "opacity-0 invisible"
                      )}
                      title="Deletar conversa"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-3 border-t border-border bg-background/50">
        <p className="text-xs text-muted-foreground text-center">
          {conversations.length} conversa{conversations.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}

