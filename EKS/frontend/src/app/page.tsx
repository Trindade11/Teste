"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { Canvas } from "@/components/canvas/Canvas";
import { MobileNav } from "@/components/layout/MobileNav";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Menu, MessageSquare } from "lucide-react";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [mobileView, setMobileView] = useState<"menu" | "canvas" | "chat">("canvas");

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
        <Header />
        <div className="flex h-full w-full overflow-hidden">
      {/* Desktop Layout */}
      <div className="hidden md:flex h-full w-full">
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
          <div className="absolute top-4 right-4 z-10">
            {!chatOpen && (
              <button
                onClick={() => setChatOpen(true)}
                className="p-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            )}
          </div>
          <Canvas />
        </div>

        {/* Chat Panel - colapsável direita */}
        <div
          className={`h-full border-l border-border bg-card transition-all duration-300 ${
            chatOpen ? "w-96" : "w-0"
          } overflow-hidden`}
        >
          <ChatPanel onClose={() => setChatOpen(false)} />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex md:hidden flex-col h-full w-full">
        {/* Mobile Content */}
        <div className="flex-1 overflow-hidden">
          {mobileView === "menu" && <Sidebar onClose={() => setMobileView("canvas")} />}
          {mobileView === "canvas" && <Canvas />}
          {mobileView === "chat" && <ChatPanel onClose={() => setMobileView("canvas")} />}
        </div>

        {/* Mobile Navigation */}
        <MobileNav currentView={mobileView} onViewChange={setMobileView} />
      </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}
