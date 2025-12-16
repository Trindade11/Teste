# Spec 031: Design System Corporativo Adaptável

**Feature**: Sistema de design profissional com identidade visual adaptável  
**Priority**: P1 (MVP v1 - Foundation)  
**Sprint**: 1  
**Effort**: 3 dias  
**Status**: 📋 Planned  

---

## Visão Geral

Design System corporativo moderno e **adaptável à identidade visual do cliente** (logomarca, paleta Pantone, tom de marca), mantendo um estilo profissional e contemporâneo. Sistema permite configuração por empresa mantendo consistência e usabilidade.

---

## Problema

- Interface precisa refletir identidade visual de múltiplas empresas (CoCreate, CVCs, Startups)
- Cores hardcoded limitam personalização
- Falta de sistema de design estruturado dificulta manutenção
- Inconsistência visual entre componentes

---

## Solução

### Design System Modular

```
Design System EKS
├── Foundation (Base)
│   ├── Colors (Adaptável)
│   ├── Typography
│   ├── Spacing
│   └── Shadows
├── Components
│   ├── Button
│   ├── Input
│   ├── Card
│   └── Badge
├── Patterns
│   ├── Navigation
│   ├── Forms
│   └── Feedback
└── Themes (Por Empresa)
    ├── CoCreateAI
    ├── CVC Example
    └── Startup Custom
```

---

## Foundation: Design Tokens

### Color System (Adaptável)

**Cada empresa tem sua paleta** derivada da cor primária (logomarca):

```typescript
// types/theme.ts
interface BrandColors {
  primary: string;        // Cor da logomarca
  primaryDark: string;    // Variante escura
  primaryLight: string;   // Variante clara
  accent: string;         // Cor de destaque
  success: string;        // Verde (universal)
  warning: string;        // Amarelo (universal)
  danger: string;         // Vermelho (universal)
  info: string;           // Azul (universal)
}

interface NeutralColors {
  bg: {
    primary: string;      // Fundo principal
    secondary: string;    // Fundo secundário
    tertiary: string;     // Cards, elevações
    overlay: string;      // Modais
  };
  text: {
    primary: string;      // Texto principal
    secondary: string;    // Texto secundário
    disabled: string;     // Texto desabilitado
    inverse: string;      // Texto em fundo escuro
  };
  border: {
    subtle: string;       // Bordas leves
    default: string;      // Bordas padrão
    strong: string;       // Bordas destacadas
  };
}
```

### Geração Automática de Paleta

```typescript
// lib/theme-generator.ts
import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';

extend([a11yPlugin]);

export function generateTheme(primaryColor: string): BrandColors {
  const base = colord(primaryColor);
  
  return {
    primary: base.toHex(),
    primaryDark: base.darken(0.15).toHex(),
    primaryLight: base.lighten(0.15).toHex(),
    accent: base.rotate(30).saturate(0.2).toHex(),
    
    // Cores universais (não mudam)
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
  };
}

// Exemplo de uso
const coCreateTheme = generateTheme('#2563eb'); // Azul CoCreate
const cvcTheme = generateTheme('#7c3aed');      // Roxo CVC
const startupTheme = generateTheme('#ec4899');   // Rosa Startup
```

### Typography

```css
/* Design tokens */
:root {
  /* Font families */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  /* Font sizes */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  --text-4xl: 2.25rem;     /* 36px */
  
  /* Font weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Line heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### Spacing Scale

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
}
```

### Shadows (Elevação)

```css
:root {
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}
```

### Border Radius

```css
:root {
  --radius-none: 0;
  --radius-sm: 0.25rem;   /* 4px */
  --radius-md: 0.375rem;  /* 6px */
  --radius-lg: 0.5rem;    /* 8px */
  --radius-xl: 0.75rem;   /* 12px */
  --radius-2xl: 1rem;     /* 16px */
  --radius-full: 9999px;  /* Círculo */
}
```

---

## Component Library

### Button

```tsx
// components/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-dark',
        secondary: 'bg-secondary text-white hover:bg-secondary-dark',
        outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
        ghost: 'hover:bg-bg-tertiary',
        danger: 'bg-danger text-white hover:bg-red-700',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-11 px-8 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
```

### Input

```tsx
// components/ui/input.tsx
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-border-default bg-bg-primary px-3 py-2 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          'placeholder:text-text-secondary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
```

### Card

```tsx
// components/ui/card.tsx
export const Card = ({ children, className, ...props }: CardProps) => (
  <div
    className={cn(
      'rounded-xl border border-border-subtle bg-bg-tertiary shadow-sm',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ children, className, ...props }: CardProps) => (
  <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className, ...props }: CardProps) => (
  <h3
    className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
    {...props}
  >
    {children}
  </h3>
);

export const CardContent = ({ children, className, ...props }: CardProps) => (
  <div className={cn('p-6 pt-0', className)} {...props}>
    {children}
  </div>
);
```

### Badge

```tsx
// components/ui/badge.tsx
const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white',
        secondary: 'bg-bg-tertiary text-text-secondary',
        success: 'bg-success text-white',
        warning: 'bg-warning text-white',
        danger: 'bg-danger text-white',
        corporate: 'bg-blue-50 text-blue-700 border border-blue-200',
        personal: 'bg-purple-50 text-purple-700 border border-purple-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
```

---

## Theme Configuration

### Per-Company Themes

```typescript
// config/themes.ts
export const themes = {
  cocreate: {
    name: 'CoCreateAI',
    logo: '/logos/cocreate.svg',
    colors: {
      primary: '#2563eb',      // Azul profissional
      primaryDark: '#1e40af',
      primaryLight: '#60a5fa',
      accent: '#06b6d4',       // Cyan
    },
    fonts: {
      sans: 'Inter',
    },
  },
  
  cvc: {
    name: 'CVC Example',
    logo: '/logos/cvc.svg',
    colors: {
      primary: '#7c3aed',      // Roxo corporativo
      primaryDark: '#6d28d9',
      primaryLight: '#a78bfa',
      accent: '#ec4899',       // Pink
    },
    fonts: {
      sans: 'Inter',
    },
  },
  
  startup: {
    name: 'Startup Custom',
    logo: '/logos/startup.svg',
    colors: {
      primary: '#10b981',      // Verde moderno
      primaryDark: '#059669',
      primaryLight: '#34d399',
      accent: '#f59e0b',       // Amber
    },
    fonts: {
      sans: 'Inter',
    },
  },
};

export type ThemeKey = keyof typeof themes;
```

### Theme Provider

```tsx
// providers/theme-provider.tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = typeof themes[ThemeKey];

interface ThemeContextType {
  theme: Theme;
  setTheme: (key: ThemeKey) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>('cocreate');
  
  useEffect(() => {
    // Aplicar CSS variables
    const theme = themes[currentTheme];
    const root = document.documentElement;
    
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-primary-dark', theme.colors.primaryDark);
    root.style.setProperty('--color-primary-light', theme.colors.primaryLight);
    root.style.setProperty('--color-accent', theme.colors.accent);
  }, [currentTheme]);
  
  return (
    <ThemeContext.Provider value={{ theme: themes[currentTheme], setTheme: setCurrentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
```

---

## Exemplos de Uso

### Aplicando Tema por Empresa

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

// components/header.tsx
export function Header() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuthStore();
  
  // Auto-detectar tema baseado na empresa do usuário
  useEffect(() => {
    if (user?.company === 'CoCreateAI') setTheme('cocreate');
    if (user?.company === 'CVC Example') setTheme('cvc');
    // Startups usam tema padrão startup
    if (user?.organizationType === 'startup') setTheme('startup');
  }, [user]);
  
  return (
    <header className="bg-bg-primary border-b border-border-subtle">
      <img src={theme.logo} alt={theme.name} />
      <h1 style={{ color: theme.colors.primary }}>
        {theme.name}
      </h1>
    </header>
  );
}
```

### Customização Manual

```tsx
// pages/admin/theme-settings.tsx
export function ThemeSettings() {
  const [customColor, setCustomColor] = useState('#2563eb');
  
  const handleApplyCustomTheme = () => {
    const generatedTheme = generateTheme(customColor);
    // Aplicar tema customizado
    applyCustomTheme(generatedTheme);
  };
  
  return (
    <div className="space-y-4">
      <h2>Personalizar Tema</h2>
      
      <div>
        <label>Cor Primária (Logomarca)</label>
        <input
          type="color"
          value={customColor}
          onChange={(e) => setCustomColor(e.target.value)}
        />
      </div>
      
      <div className="preview">
        <h3>Preview</h3>
        <Button style={{ backgroundColor: customColor }}>
          Botão Primário
        </Button>
        <Badge style={{ backgroundColor: customColor }}>
          Badge
        </Badge>
      </div>
      
      <Button onClick={handleApplyCustomTheme}>
        Aplicar Tema
      </Button>
    </div>
  );
}
```

---

## Implementação

### Phase 1: Foundation (1d)
- [ ] Criar design tokens (CSS variables)
- [ ] Setup theme provider
- [ ] Gerador automático de paleta
- [ ] Configurar temas padrão (CoCreate, CVC, Startup)

### Phase 2: Components (1d)
- [ ] Button, Input, Card, Badge
- [ ] Layout components (Header, Sidebar, Footer)
- [ ] Form components
- [ ] Feedback components (Toast, Alert, Modal)

### Phase 3: Integration (1d)
- [ ] Aplicar design system no frontend existente
- [ ] Migrar componentes antigos
- [ ] Documentação Storybook (opcional)
- [ ] Theme switcher no admin

---

## Métricas de Sucesso

- ✅ Troca de tema em <100ms
- ✅ Accessibilidade WCAG 2.1 AA (contraste)
- ✅ 100% componentes usando design tokens
- ✅ 3+ temas pré-configurados
- ✅ Customização manual funcional

---

## Dependencies

| Spec | Dependency | Reason |
|------|------------|--------|
| 029 | **SHOULD** | UX Professional (usa design tokens) |
| 003 | **MUST** | Admin Login (aplica tema por empresa) |

---

## Notas de Implementação

- Usar `class-variance-authority` para variants
- Usar `tailwindcss` com CSS variables
- Gerar tons automaticamente com `colord`
- Garantir contraste acessível (WCAG AA)
- Salvar tema preferido em `localStorage` ou `:UserPreferences`

---

**Status**: 📋 Planned (Sprint 1)  
**Next**: Implementar foundation + components base
