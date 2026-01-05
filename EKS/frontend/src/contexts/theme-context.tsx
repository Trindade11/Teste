"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
}

interface ThemeContextType {
  colors: ThemeColors;
  setColors: (colors: Partial<ThemeColors>) => void;
}

const defaultColors: ThemeColors = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  accent: '#f59e0b',
};

const ThemeContext = createContext<ThemeContextType>({
  colors: defaultColors,
  setColors: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colors, setColorsState] = useState<ThemeColors>(defaultColors);

  useEffect(() => {
    // Carregar cores do localStorage
    const stored = localStorage.getItem('theme-colors');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setColorsState({ ...defaultColors, ...parsed });
      } catch (error) {
        console.error('Erro ao carregar cores do tema:', error);
      }
    }
  }, []);

  const setColors = (newColors: Partial<ThemeColors>) => {
    const updated = { ...colors, ...newColors };
    setColorsState(updated);
    localStorage.setItem('theme-colors', JSON.stringify(updated));

    // Aplicar cores CSS customizadas
    if (newColors.primary) {
      document.documentElement.style.setProperty('--color-primary-custom', newColors.primary);
    }
    if (newColors.secondary) {
      document.documentElement.style.setProperty('--color-secondary-custom', newColors.secondary);
    }
    if (newColors.accent) {
      document.documentElement.style.setProperty('--color-accent-custom', newColors.accent);
    }
  };

  useEffect(() => {
    // Aplicar cores ao carregar
    document.documentElement.style.setProperty('--color-primary-custom', colors.primary);
    document.documentElement.style.setProperty('--color-secondary-custom', colors.secondary);
    document.documentElement.style.setProperty('--color-accent-custom', colors.accent);
  }, [colors]);

  return (
    <ThemeContext.Provider value={{ colors, setColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

