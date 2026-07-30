# AgencyGrid — Design System

## Glassmorphism
- `.glass`: backdrop-filter blur, semi-transparent bg, border, shadow
- `.sidebar-glass`: darker bg for sidebar, blur, right border
- CSS variables for all colors — no hardcoded dark/light values

## Theme
- `data-theme` attribute on `<html>`
- `agencygrid-theme` localStorage key
- FOUC prevention script in `<head>`

## Typography
- Geist Sans (body), Geist Mono (code)
- Font variables: `--font-geist-sans`, `--font-geist-mono`

## Component Patterns
- All interactive components are "use client"
- Supabase client via `createClient()` from `@/utils/supabase/client`
- GlassCard wraps content in glass style
- Modal uses portal with ESC to close

## Color Tokens
```
--accent-cyan  (#0ea5e9 / #38bdf8)
--accent-purple (#8b5cf6 / #a78bfa)
--accent-green  (#10b981 / #34d399)
--accent-amber  (#f59e0b / #fbbf24)
--accent-rose   (#f43f5e / #fb7185)
--text-primary  (#1a1a2e / #f1f5f9)
--text-secondary (#6b7280 / #94a3b8)
```

## Layout
- Sidebar: 240px (collapsed: 64px)
- Main content: flex-1 with overflow-y-auto
- Auth guard in AppShell, public routes bypass
