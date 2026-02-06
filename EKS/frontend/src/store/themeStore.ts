import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
}

export interface ThemeConfig {
  colors: ThemeColors
  logo: string | null // base64 or URL
  iconColor: string
  institutionName?: string
  institutionShortName?: string
}

interface ThemeState {
  config: ThemeConfig
  setColors: (colors: Partial<ThemeColors>) => void
  setLogo: (logo: string | null) => void
  setIconColor: (color: string) => void
  setInstitutionName: (name: string) => void
  setInstitutionShortName: (name: string) => void
  resetTheme: () => void
}

const defaultTheme: ThemeConfig = {
  colors: {
    primary: '#3b82f6', // Blue 500
    secondary: '#6366f1', // Indigo 500
    accent: '#8b5cf6', // Violet 500
    background: '#ffffff',
  },
  logo: null,
  iconColor: '#3b82f6',
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      config: defaultTheme,
      
      setColors: (colors) =>
        set((state) => ({
          config: {
            ...state.config,
            colors: { ...state.config.colors, ...colors },
          },
        })),
      
      setLogo: (logo) =>
        set((state) => ({
          config: { ...state.config, logo },
        })),
      
      setIconColor: (color) =>
        set((state) => ({
          config: { ...state.config, iconColor: color },
        })),
      
      setInstitutionName: (name) =>
        set((state) => ({
          config: { ...state.config, institutionName: name },
        })),
      
      setInstitutionShortName: (name) =>
        set((state) => ({
          config: { ...state.config, institutionShortName: name },
        })),
      
      resetTheme: () => set({ config: defaultTheme }),
    }),
    {
      name: 'theme-config',
    }
  )
)

