'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, isAuthenticated, clearError } = useAuthStore();
  const { config: theme } = useThemeStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const success = await login(email, password);
    
    if (success) {
      router.push('/');
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ 
        background: `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.secondary} 100%)` 
      }}
    >
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          {theme.logo ? (
            <img 
              src={theme.logo} 
              alt="Logo" 
              className="h-16 mx-auto mb-4"
            />
          ) : (
            <h1 
              className="text-3xl font-bold mb-2"
              style={{ color: theme.colors.primary }}
            >
              Enterprise Hub
            </h1>
          )}
          <p className="text-gray-600 mt-2">Login to continue</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition"
              style={{ borderColor: theme.colors.primary }}
              placeholder="admin@company.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition"
              style={{ borderColor: theme.colors.primary }}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: theme.colors.primary }}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Dev Credentials Hint */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            <strong>Demo credentials:</strong>
            <br />
            rodrigo.trindade@alok.com.br / 1234
            <br />
            admin@company.com / 1234
          </p>
        </div>
      </div>
    </div>
  );
}
