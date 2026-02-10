# UI Component Library Architecture

## Overview
Reusable UI components built with React 19, Tailwind CSS v4, and Framer Motion.

## Component Organization
```
src/app/_components/
├── ui/                 # Base UI primitives
├── shared/             # Shared business components
├── layout/             # Layout components
├── modals/             # Modal dialogs
├── hooks/              # Custom React hooks
├── todo/               # Todo-specific components
├── subscriptions/      # Subscription-specific components
├── anniversary/        # Anniversary-specific components
├── items/              # Items-specific components
├── settings/           # Settings-specific components
└── dashboard/          # Dashboard-specific components
```

## Base UI Components (`ui/`)

### ModernCalendar (`ui/ModernCalendar.tsx`)
Date picker with modern styling.
- Month navigation
- Date selection
- Today highlight

### Toast (`ui/Toast.tsx`)
Toast notification system.
- Success/error/info variants
- Auto-dismiss
- Stacking support

### Input (`ui/Input.tsx`)
Styled input with consistent theming.

### Button (`ui/Button.tsx`)
Button variants with loading states.

### Select (`ui/Select.tsx`)
Dropdown select component.

### Tooltip (`ui/Tooltip.tsx`)
Hover tooltips with positioning.

### TimePicker (`ui/TimePicker.tsx`)
Time selection component.

### Badge (`ui/Badge.tsx`)
Status/category badges.

## Shared Components (`shared/`)

### SmartCategoryBadge
Category badge with color coding.

### ServiceIconBadge
Display service icons with fallback.

### EmptyState
Empty list state with action button.

### TiltCard
Card with 3D tilt effect on hover.

### BentoCard
Bento-style card layout.

### NumberTicker
Animated number transitions.

## Layout Components (`layout/`)

### AppHeader
Top navigation bar.

### MainNav
Primary navigation menu.

### BottomNav
Mobile bottom navigation.

### PageTransition
Page transition animations.

### PageBackgroundDecoration
Background decorative elements.

## Smart Input Components

### SmartDateInput (`SmartDateInput.tsx`)
Intelligent date input with:
- Natural language parsing
- Calendar picker
- Solar/lunar support

### SmartDatePartInput (`SmartDatePartInput.tsx`)
Month-day only input for anniversaries.

### CustomSelect (`CustomSelect.tsx`)
Enhanced select with search.

## Key Patterns

### Class Composition
```typescript
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

### Animation
Using Framer Motion:
```typescript
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
/>
```

### Theming
Semantic color tokens in Tailwind config:
- `bg-surface` / `bg-surface-alt`
- `text-primary` / `text-secondary`
- `border-default`
- Dark mode via `next-themes`

### Portal Rendering
`Portal.tsx` for modals/tooltips outside DOM hierarchy.

## Icons
**Location**: `src/app/_components/Icons.tsx`

Centralized icon components using `@iconify/react`.
