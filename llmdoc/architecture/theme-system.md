# Theme System Architecture

## Overview
Client-side color theme system with 8 predefined themes and dark mode support.

## Theme Definitions
**Location**: `src/lib/color-theme.ts`

### Available Themes
| ID | Name | Color |
|----|------|-------|
| `ocean-blue` | 信任蓝 | `hsl(217 91% 60%)` |
| `emerald` | 翡翠绿 | `hsl(160 84% 39%)` |
| `notion-gray` | 棕橙 | `hsl(32 30% 45%)` |
| `todoist-zeus` | 橄榄绿 | `hsl(78 45% 40%)` |
| `ticktick-teal` | 青蓝 | `hsl(174 72% 40%)` |
| `fintech-gold` | 金色 | `hsl(45 93% 47%)` |
| `peach-fuzz` | 蜜桃 | `hsl(24 73% 67%)` |
| `aurora` | 极光 | Gradient (blue→pink) |

**Default**: `ocean-blue`

## Storage
- **Key**: `color-theme` (via `COLOR_THEME_STORAGE_KEY`)
- **Storage**: localStorage

## Components

### ThemeSwitcher
**Location**: `src/app/_components/ThemeSwitcher.tsx`

Visual theme picker with:
- Color circle buttons
- Selection ring animation (Framer Motion)
- Confetti effect on selection
- Magnetic hover effect

### Hooks

#### useColorTheme
**Location**: `src/app/_components/hooks/useColorTheme.ts`

```typescript
const { theme, setTheme, mounted } = useColorTheme();
```

- Reads/writes to localStorage
- Returns `mounted` for SSR hydration safety

#### useThemeConfetti
**Location**: `src/app/_components/hooks/useThemeConfetti.ts`

```typescript
const { confetti, triggerConfetti } = useThemeConfetti();
```

Triggers micro-confetti animation on theme selection.

## Dark Mode
Uses `next-themes` library for system/manual dark mode.

CSS variables switch between light/dark values based on `data-theme` attribute.

## Semantic Color Tokens
Tailwind CSS uses semantic tokens:
- `bg-base` / `bg-elevated` / `bg-surface`
- `text-primary` / `text-secondary` / `text-muted`
- `border-default` / `border-divider`
- `text-brand-primary` / `bg-brand-primary`

Theme color applied to `--brand-primary` CSS variable.

## Key Files
- **Definitions**: `src/lib/color-theme.ts`
- **Switcher**: `src/app/_components/ThemeSwitcher.tsx`
- **Hook**: `src/app/_components/hooks/useColorTheme.ts`
- **Confetti**: `src/app/_components/hooks/useThemeConfetti.ts`
- **MicroConfetti**: `src/app/_components/MicroConfetti.tsx`
