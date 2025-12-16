"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { cn } from "@/lib/utils";

export function AgentSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { agents, selectedAgent, selectAgent } = useChatStore();

  return (
    <div className="px-4 py-2 border-b border-border">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-3 py-2 text-sm bg-muted rounded-lg hover:bg-muted/80 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{selectedAgent?.icon}</span>
            <div className="text-left">
              <p className="font-medium">{selectedAgent?.name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedAgent?.description}
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => {
                    selectAgent(agent);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-muted transition-colors",
                    selectedAgent?.id === agent.id && "bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{agent.icon}</span>
                    <div className="text-left">
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {agent.description}
                      </p>
                    </div>
                  </div>
                  {selectedAgent?.id === agent.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
