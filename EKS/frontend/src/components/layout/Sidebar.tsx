"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  History,
  Settings,
  X,
  ChevronDown,
  Plus,
  Target,
  LogOut,
  User,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTaskStore } from "@/store/task-store";
import { useAuthStore } from "@/store/authStore";
import { ONBOARDING_STEPS, useOnboardingStore } from "@/store/onboarding-store";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { tasks, activeTask, setActiveTask, toggleTaskMemory, addTask } = useTaskStore();
  const { user, logout } = useAuthStore();
  const { status: onboardingStatus, completedStepIds, open: openOnboarding } = useOnboardingStore();
  const [tasksExpanded, setTasksExpanded] = useState(true);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const onboardingTotal = ONBOARDING_STEPS.filter((s) => s.id !== "welcome" && s.id !== "done").length;
  const onboardingCompleted = completedStepIds.filter((id) => id !== "welcome" && id !== "done").length;
  const onboardingProgress = onboardingTotal === 0 ? 0 : Math.round((onboardingCompleted / onboardingTotal) * 100);

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      addTask({
        title: newTaskTitle.trim(),
        status: "active",
        memoryType: "corporate",
      });
      setNewTaskTitle("");
      setIsAddingTask(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">EH</span>
          </div>
          <span className="font-semibold text-lg">{user?.company ? `${user.company} Hub` : "Enterprise Hub"}</span>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {onboardingStatus !== "completed" && (
        <div className="mb-4 p-3 rounded-lg border border-border bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium">🧭 Completar onboarding</span>
            <span className="ml-auto text-[10px] text-muted-foreground">{onboardingProgress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{ width: `${onboardingProgress}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {onboardingStatus === "not_started"
              ? "Primeira configuração do seu perfil e preferências."
              : "Continue de onde parou."}
          </div>
          <div className="mt-3">
            <Button size="sm" className="w-full" onClick={openOnboarding}>
              {onboardingStatus === "not_started" ? "Começar" : "Continuar"}
            </Button>
          </div>
        </div>
      )}

      {/* Active Task Highlight */}
      {activeTask && (
        <div className="mb-6 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">Tarefa Ativa</span>
            <button
              onClick={() => toggleTaskMemory(activeTask.id)}
              className={cn(
                "ml-auto text-xs px-2 py-0.5 rounded-full transition-colors",
                activeTask.memoryType === "corporate"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
              )}
            >
              {activeTask.memoryType === "corporate" ? "🏢 Corp" : "👤 Pessoal"}
            </button>
          </div>
          <p className="text-sm font-medium">{activeTask.title}</p>
          {activeTask.description && (
            <p className="text-xs text-muted-foreground mt-1">{activeTask.description}</p>
          )}
        </div>
      )}

      {/* Tasks Section */}
      <div className="mb-4">
        <button
          onClick={() => setTasksExpanded(!tasksExpanded)}
          className="flex items-center justify-between w-full text-sm font-medium mb-2 hover:text-primary transition-colors"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Minhas Tarefas</span>
            <span className="text-xs text-muted-foreground">({tasks.length})</span>
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform",
              tasksExpanded && "rotate-180"
            )}
          />
        </button>
        {tasksExpanded && (
          <div className="space-y-1 ml-6">
            {tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => setActiveTask(task)}
                className={cn(
                  "w-full text-left text-sm py-1.5 px-2 rounded-md transition-colors flex items-center gap-2",
                  activeTask?.id === task.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {task.status === "completed" ? (
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                ) : (
                  <Circle className="w-3 h-3 flex-shrink-0" />
                )}
                <span className="truncate flex-1">{task.title}</span>
                <span className="text-[10px] opacity-60">
                  {task.memoryType === "corporate" ? "🏢" : "👤"}
                </span>
              </button>
            ))}
            
            {/* Add Task Input */}
            {isAddingTask ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  placeholder="Nome da tarefa..."
                  className="flex-1 text-sm py-1 px-2 rounded border border-input bg-background"
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={handleAddTask}>
                  ✓
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsAddingTask(false)}>
                  ✕
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingTask(true)}
                className="w-full text-left text-sm py-1.5 px-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Nova tarefa
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-1">
        <SidebarItem icon={History} label="Histórico" />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings */}
      <div className="pt-4 border-t border-border">
        {user?.role === 'admin' ? (
          <Link href="/admin">
            <SidebarItem icon={Settings} label="Configurações (Admin)" />
          </Link>
        ) : (
          <SidebarItem icon={Settings} label="Configurações" />
        )}
      </div>

      {/* User Info & Logout */}
      <div className="pt-4 mt-auto border-t border-border space-y-2">
        {user && (
          <div className="px-2 py-2 rounded-md bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium truncate">{user.email}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {user.role === 'admin' ? '👑 Admin' : '👤 User'} • {user.department || user.company}
            </div>
          </div>
        )}
        <button
          onClick={() => logout()}
          className="flex items-center gap-2 w-full text-sm py-2 px-2 rounded-md text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  active,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={cn(
        "flex items-center gap-2 w-full text-sm py-2 px-2 rounded-md transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
