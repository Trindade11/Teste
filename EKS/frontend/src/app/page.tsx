"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ChatbotPanel } from "@/components/chat/ChatbotPanel";
import { Canvas } from "@/components/canvas/Canvas";
import { MobileNav } from "@/components/layout/MobileNav";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Menu } from "lucide-react";

const CHAT_STATE_KEY = 'chat_expanded_state'

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false); // Colapsado por padrão
  const [mobileView, setMobileView] = useState<"menu" | "canvas" | "chat">("canvas");

  // Carregar estado do localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(CHAT_STATE_KEY)
    if (savedState !== null) {
      setChatOpen(savedState === 'true')
    }
  }, [])

  // Salvar estado no localStorage
  const handleToggleChat = () => {
    const newState = !chatOpen
    setChatOpen(newState)
    localStorage.setItem(CHAT_STATE_KEY, String(newState))
  }

  // Abrir chat quando onboarding finalizar
  useEffect(() => {
    const onChatStart = () => {
      setChatOpen(true)
      localStorage.setItem(CHAT_STATE_KEY, 'true')
    }

    window.addEventListener('chat:start', onChatStart as EventListener)
    return () => window.removeEventListener('chat:start', onChatStart as EventListener)
  }, [])

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
        <Header />
        <div className="flex flex-1 w-full overflow-hidden">
          {/* Desktop Layout */}
          <div className="hidden md:flex h-full w-full relative">
            {/* Sidebar - colapsável esquerda */}
            <div
              className={`h-full border-r border-border bg-card transition-all duration-300 ${
                sidebarOpen ? "w-64" : "w-0"
              } overflow-hidden`}
            >
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Canvas - área central */}
            <div className="flex-1 h-full overflow-hidden relative">
              {/* Toggle buttons */}
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                {!sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                )}
              </div>
              <Canvas />
            </div>

            {/* Chat coluna à direita */}
            <div
              className={`h-full transition-all duration-300 ${
                chatOpen ? "w-[500px]" : "w-12"
              }`}
            >
              <ChatbotPanel isExpanded={chatOpen} onToggle={handleToggleChat} />
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="flex md:hidden flex-col h-full w-full">
            {/* Mobile Content */}
            <div className="flex-1 overflow-hidden">
              {mobileView === "menu" && <Sidebar onClose={() => setMobileView("canvas")} />}
              {mobileView === "canvas" && <Canvas />}
              {mobileView === "chat" && (
                <ChatbotPanel 
                  isExpanded={true} 
                  onToggle={() => setMobileView("canvas")} 
                  isMobile={true} 
                />
              )}
            </div>

            {/* Mobile Navigation */}
            <MobileNav currentView={mobileView} onViewChange={setMobileView} />
          </div>
        </div>

      </div>
    </ProtectedRoute>
  );
}
