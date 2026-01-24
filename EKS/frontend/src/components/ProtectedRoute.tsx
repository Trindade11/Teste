'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { PasswordChangeGuard } from '@/components/auth/PasswordChangeGuard';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading, loadUser } = useAuthStore();

  useEffect(() => {
    // Load user on mount
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Redirect if admin required but user is not admin
    if (!isLoading && isAuthenticated && requireAdmin && user?.role !== 'admin') {
      router.push('/'); // Or show unauthorized page
    }
  }, [isAuthenticated, isLoading, user, requireAdmin, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!isAuthenticated || (requireAdmin && user?.role !== 'admin')) {
    return null;
  }

  // Wrap children with PasswordChangeGuard
  return (
    <PasswordChangeGuard user={user || undefined}>
      {children}
    </PasswordChangeGuard>
  );
}
