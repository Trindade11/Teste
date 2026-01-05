"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Bell, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Mock notifications
  const notifications = [
    {
      id: '1',
      title: 'Bem-vindo ao sistema',
      message: 'Complete seu onboarding para ter a melhor experiência',
      time: '2h atrás',
      read: false,
    }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left side - could add breadcrumbs or page title here */}
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-muted-foreground">
            {user.company}
          </div>
        </div>

        {/* Right side - Notifications + Profile */}
        <div className="flex items-center gap-2">
          {/* Notifications Bell */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-border bg-background shadow-lg z-50">
                  <div className="p-3 border-b border-border">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Notificações</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Nenhuma notificação
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={cn(
                            "p-3 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors",
                            !notif.read && "bg-primary/5"
                          )}
                        >
                          <div className="text-sm font-medium">{notif.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {notif.message}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {notif.time}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile Avatar/Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium">
                  {(() => {
                    const base = user?.name?.trim() || user?.email || 'User';
                    return base
                      .split(/\s+/)
                      .map(n => n[0] || '')
                      .join('')
                      .slice(0, 2)
                      .toUpperCase() || 'US';
                  })()}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium">{user?.name || user?.email || 'User'}</div>
                <div className="text-xs text-muted-foreground">
                  {user?.department || user?.company || '—'}
                </div>
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-border bg-background shadow-lg z-50">
                  <div className="p-3 border-b border-border">
                    <div className="text-sm font-medium">{user?.name || user?.email || 'User'}</div>
                    <div className="text-xs text-muted-foreground">{user?.email || '—'}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {user?.jobRole && `${user.jobRole} • `}
                      {user?.department || user?.company || '—'}
                    </div>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        router.push('/settings');
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Configurações
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setShowProfileMenu(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
