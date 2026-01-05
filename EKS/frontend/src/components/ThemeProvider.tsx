"use client"

import { useEffect } from 'react'
import { useThemeStore } from '@/store/themeStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { config } = useThemeStore()

  const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

  const hexToRgb = (hex: string) => {
    const raw = hex.replace('#', '').trim()
    if (raw.length !== 3 && raw.length !== 6) return null
    const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw
    const int = Number.parseInt(full, 16)
    if (Number.isNaN(int)) return null
    return {
      r: (int >> 16) & 255,
      g: (int >> 8) & 255,
      b: int & 255,
    }
  }

  const rgbToHsl = (r: number, g: number, b: number) => {
    const rr = r / 255
    const gg = g / 255
    const bb = b / 255

    const max = Math.max(rr, gg, bb)
    const min = Math.min(rr, gg, bb)
    const delta = max - min

    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (delta !== 0) {
      s = delta / (1 - Math.abs(2 * l - 1))
      switch (max) {
        case rr:
          h = ((gg - bb) / delta) % 6
          break
        case gg:
          h = (bb - rr) / delta + 2
          break
        default:
          h = (rr - gg) / delta + 4
      }
      h *= 60
      if (h < 0) h += 360
    }

    return {
      h,
      s: s * 100,
      l: l * 100,
    }
  }

  const parseHslStringToComponents = (value: string) => {
    const v = value.trim()
    if (!v) return null

    // Accept either "hsl(221 83% 53%)" or "221 83% 53%"
    const inner = v.startsWith('hsl(') ? v.slice(4).replace(/\)\s*$/, '') : v
    const parts = inner
      .replace(/\//g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean)

    if (parts.length < 3) return null
    const h = Number.parseFloat(parts[0])
    const s = Number.parseFloat(parts[1].replace('%', ''))
    const l = Number.parseFloat(parts[2].replace('%', ''))
    if ([h, s, l].some((n) => Number.isNaN(n))) return null
    return { h, s, l }
  }

  const toHslCssComponents = (value: string) => {
    const v = value.trim()
    if (!v) return null

    if (v.startsWith('#')) {
      const rgb = hexToRgb(v)
      if (!rgb) return null
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
      return `${hsl.h.toFixed(1)} ${hsl.s.toFixed(1)}% ${hsl.l.toFixed(1)}%`
    }

    const hsl = parseHslStringToComponents(v)
    if (!hsl) return null
    return `${hsl.h.toFixed(1)} ${hsl.s.toFixed(1)}% ${hsl.l.toFixed(1)}%`
  }

  const guessForegroundForHsl = (hslComponents: string) => {
    const parsed = parseHslStringToComponents(hslComponents)
    if (!parsed) return '210 40% 98%'
    // Simple luminance proxy: HSL L
    const l = clamp01(parsed.l / 100)
    return l > 0.6 ? '222.2 84% 4.9%' : '210 40% 98%'
  }

  useEffect(() => {
    // Apply theme colors to CSS variables
    const root = document.documentElement

    const primary = config.colors.primary ? toHslCssComponents(config.colors.primary) : null
    if (primary) {
      root.style.setProperty('--primary', primary)
      root.style.setProperty('--primary-foreground', guessForegroundForHsl(primary))
    }

    const secondary = config.colors.secondary ? toHslCssComponents(config.colors.secondary) : null
    if (secondary) {
      root.style.setProperty('--secondary', secondary)
    }

    const accent = config.colors.accent ? toHslCssComponents(config.colors.accent) : null
    if (accent) {
      root.style.setProperty('--accent', accent)
    }

    const icon = config.iconColor ? toHslCssComponents(config.iconColor) : null
    if (icon) {
      root.style.setProperty('--icon-color', icon)
    }
  }, [config])

  return <>{children}</>
}

