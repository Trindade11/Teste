"use client";

import { GitBranch, Menu, MessageSquare, BookOpen, Network, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewType = "menu" | "knowledge" | "navigator" | "processes" | "chat" | "validation";

interface MobileNavProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function MobileNav({ currentView, onViewChange }: MobileNavProps) {
  return (
    <nav className="flex items-center justify-around border-t border-border bg-card py-2 px-4 safe-area-inset-bottom">
      <NavButton
        icon={Menu}
        label="Menu"
        active={currentView === "menu"}
        onClick={() => onViewChange("menu")}
      />
      <NavButton
        icon={BookOpen}
        label="Conhecimento"
        active={currentView === "knowledge"}
        onClick={() => onViewChange("knowledge")}
      />
      <NavButton
        icon={CheckCircle}
        label="Validar"
        active={currentView === "validation"}
        onClick={() => onViewChange("validation")}
        badge={6}
      />
      <NavButton
        icon={Network}
        label="Navegar"
        active={currentView === "navigator"}
        onClick={() => onViewChange("navigator")}
      />
      <NavButton
        icon={MessageSquare}
        label="Chat"
        active={currentView === "chat"}
        onClick={() => onViewChange("chat")}
      />
    </nav>
  );
}

function NavButton({
  icon: Icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 px-4 py-1 rounded-lg transition-colors relative",
        active
          ? "text-primary"
          : "text-muted-foreground active:text-foreground"
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="text-xs">{label}</span>
      {badge && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}
