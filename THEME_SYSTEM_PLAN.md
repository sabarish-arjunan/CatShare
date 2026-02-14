# CatShare Theme System - Comprehensive Architecture Plan

## Overview
Implement a scalable, centralized theme management system that allows users to select a theme on the Themes Settings page, which automatically updates the product preview across:
1. Create Product page
2. Product Modal Preview
3. Rendered/Shared Images

---

## Current Architecture Analysis

### Existing Implementation
- **ThemesSettings.jsx** (line 40): Currently saves theme to localStorage: `localStorage.setItem("selectedTheme", themeId)`
- **ThemesSettings.jsx** (line 41): Dispatches custom event: `window.dispatchEvent(new CustomEvent("themeChanged", { detail: { theme: themeId } }))`
- **renderingUtils.ts** (lines 81-83): Hardcoded styling for product rendering
- **CreateProduct.tsx**: No theme integration yet
- **ProductPreviewModal.jsx**: No theme integration yet

---

## Proposed Solution: Theme Context + Theme Configuration System

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    ThemesSettings Page                       │
│              (User selects theme + saves)                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              ThemeContext (Global State)                     │
│          - Current selected theme                            │
│          - Theme configurations                              │
│          - Helper functions                                  │
└────────────────┬────────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┬──────────────┐
    │            │            │              │
    ▼            ▼            ▼              ▼
┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Create  │  │ Product  │  │ Render   │  │ Other    │
│ Product │  │ Preview  │  │ Utils    │  │Components│
│ Preview │  │  Modal   │  │ (Export) │  │          │
└─────────┘  └──────────┘  └──────────┘  └──────────┘
```

---

## Implementation Steps

### Phase 1: Create Theme Configuration System

#### 1.1 Create `src/config/themeConfig.ts`

This file will store all theme definitions and be the single source of truth:

```typescript
export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  
  // Classic/Glass theme styles
  styles: {
    layout: "classic" | "glass"; // Layout type
    
    // Colors
    bgColor: string;           // Main background color
    lightBgColor: string;      // Light variant for details
    fontColor: string;         // Text color
    imageBgColor: string;      // Product image background
    priceBoxBg: string;        // Price badge background
    
    // Optional gradient for glass theme
    gradientStart?: string;
    gradientEnd?: string;
    
    // Border & shadow
    borderColor?: string;
    shadowColor?: string;
  };
  
  // Rendering-specific settings
  rendering: {
    cropAspectRatio: number;
    cardWidth: number;
    cardBorderRadius: number;
  };
}

export const THEMES: { [key: string]: ThemeConfig } = {
  classic: {
    id: "classic",
    name: "Classic",
    description: "Clean and minimalist design",
    isDefault: true,
    styles: {
      layout: "classic",
      bgColor: "#dc2626",
      lightBgColor: "#fca5a5",
      fontColor: "white",
      imageBgColor: "white",
      priceBoxBg: "#dc2626",
      borderColor: "rgb(229, 231, 235)",
      shadowColor: "rgba(0, 0, 0, 0.1)",
    },
    rendering: {
      cropAspectRatio: 1,
      cardWidth: 330,
      cardBorderRadius: 8,
    },
  },
  
  glass: {
    id: "glass",
    name: "Glass",
    description: "Modern frosted glass design",
    isDefault: false,
    styles: {
      layout: "glass",
      bgColor: "#0f8577",
      lightBgColor: "#7fdcc7",
      fontColor: "#0f8577",
      imageBgColor: "white",
      priceBoxBg: "#dc2626", // Red price badge
      gradientStart: "#dc2626",
      gradientEnd: "#991b1b",
      borderColor: "rgba(255, 255, 255, 1)",
      shadowColor: "rgba(220, 38, 38, 0.3)",
    },
    rendering: {
      cropAspectRatio: 1,
      cardWidth: 280,
      cardBorderRadius: 16,
    },
  },
  
  // Future themes can be added here
  // premium: { ... }
  // minimal: { ... }
  // colorful: { ... }
};

export function getThemeById(themeId: string): ThemeConfig {
  return THEMES[themeId] || THEMES.classic;
}

export function getAllThemes(): ThemeConfig[] {
  return Object.values(THEMES);
}
```

---

### Phase 2: Create Theme Context

#### 2.1 Create `src/context/ThemeContext.tsx`

This will provide global theme state to all components:

```typescript
import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeConfig, getThemeById, THEMES } from "../config/themeConfig";

interface ThemeContextType {
  currentTheme: ThemeConfig;
  selectedThemeId: string;
  setTheme: (themeId: string) => void;
  getTheme: (themeId: string) => ThemeConfig;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [selectedThemeId, setSelectedThemeId] = useState(() => {
    return localStorage.getItem("selectedTheme") || "classic";
  });

  const [currentTheme, setCurrentTheme] = useState(() => {
    return getThemeById(selectedThemeId);
  });

  // Update theme when selection changes
  useEffect(() => {
    const theme = getThemeById(selectedThemeId);
    setCurrentTheme(theme);
    localStorage.setItem("selectedTheme", selectedThemeId);
    
    // Dispatch event for any listeners
    window.dispatchEvent(
      new CustomEvent("themeChanged", {
        detail: { theme: selectedThemeId, config: theme },
      })
    );
  }, [selectedThemeId]);

  // Listen for external theme changes
  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setSelectedThemeId(customEvent.detail.theme);
    };

    window.addEventListener("themeChanged", handleThemeChange);
    return () => window.removeEventListener("themeChanged", handleThemeChange);
  }, []);

  const setTheme = (themeId: string) => {
    setSelectedThemeId(themeId);
  };

  const getTheme = (themeId: string) => {
    return getThemeById(themeId);
  };

  return (
    <ThemeContext.Provider
      value={{ currentTheme, selectedThemeId, setTheme, getTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
```

---

### Phase 3: Integrate Theme into Components

#### 3.1 Update `src/App.tsx` - Wrap with ThemeProvider

```typescript
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      {/* Rest of your app */}
    </ThemeProvider>
  );
}
```

#### 3.2 Update `src/pages/ThemesSettings.jsx` - Connect to Context

```jsx
import { useTheme } from "../context/ThemeContext";

export default function ThemesSettings() {
  const { setTheme, selectedThemeId } = useTheme();
  
  const handleThemeSelect = (themeId) => {
    setTheme(themeId);
    // Context will handle localStorage and dispatch
  };
  
  // Use selectedThemeId instead of state
}
```

#### 3.3 Update `src/CreateProduct.tsx` - Use Theme in Preview

```typescript
import { useTheme } from "./context/ThemeContext";

function CreateProduct() {
  const { currentTheme } = useTheme();
  
  // In preview section:
  return (
    <div style={{
      backgroundColor: currentTheme.styles.lightBgColor,
      color: currentTheme.styles.fontColor,
      // ... other theme styles
    }}>
      {/* Product preview using currentTheme */}
    </div>
  );
}
```

#### 3.4 Update `src/ProductPreviewModal.jsx` - Use Theme

```jsx
import { useTheme } from "./context/ThemeContext";

function ProductPreviewModal() {
  const { currentTheme } = useTheme();
  
  // Apply currentTheme.styles to preview elements
}
```

---

### Phase 4: Update Rendering Utils for Export/Share

#### 4.1 Modify `src/utils/renderingUtils.ts`

Add theme support to rendering functions:

```typescript
import { getThemeById } from "../config/themeConfig";

export async function renderProductImageOnTheFly(
  product: any,
  catalogueLabel: string,
  catalogueId?: string,
  themeId?: string // Add theme parameter
): Promise<string | null> {
  // Get theme configuration
  const theme = getThemeById(themeId || localStorage.getItem("selectedTheme") || "classic");
  
  // Use theme styles instead of hardcoded values
  const fontColor = product.fontColor || theme.styles.fontColor;
  const bgColor = product.bgColor || theme.styles.bgColor;
  const imageBg = product.imageBgColor || theme.styles.imageBgColor;
  
  // Pass theme to canvas renderer
  const base64 = await renderProductToCanvas(
    productData,
    {
      ...theme.rendering,
      bgColor,
      fontColor,
      imageBg,
      layout: theme.styles.layout,
    }
  );
  
  return base64;
}
```

---

### Phase 5: Update Canvas Renderer

#### 5.1 Modify `src/utils/canvasRenderer.ts`

Support theme layouts in rendering:

```typescript
interface RenderOptions {
  bgColor: string;
  fontColor: string;
  imageBg: string;
  cardWidth: number;
  cardBorderRadius: number;
  layout: "classic" | "glass";
  priceBoxBg: string;
  // ... other options
}

export async function renderProductToCanvas(
  product: any,
  options: RenderOptions
): Promise<string | null> {
  if (options.layout === "glass") {
    return renderGlassTheme(product, options);
  } else {
    return renderClassicTheme(product, options);
  }
}

function renderGlassTheme(product: any, options: RenderOptions) {
  // Implement glass theme rendering
}

function renderClassicTheme(product: any, options: RenderOptions) {
  // Implement classic theme rendering
}
```

---

## Data Flow Diagram

### Theme Selection Flow
```
User clicks "Select Glass" on ThemesSettings
                    ↓
ThemeContext.setTheme("glass")
                    ↓
Update localStorage
Update currentTheme state
Dispatch "themeChanged" event
                    ↓
All components using useTheme() re-render
                    ↓
CreateProduct preview updates
ProductPreviewModal updates
renderingUtils use new theme
```

---

## File Modifications Summary

| File | Changes | Priority |
|------|---------|----------|
| `src/config/themeConfig.ts` | NEW - Theme definitions | High |
| `src/context/ThemeContext.tsx` | NEW - Theme provider & hook | High |
| `src/App.tsx` | Wrap with ThemeProvider | High |
| `src/pages/ThemesSettings.jsx` | Connect to useTheme() | High |
| `src/CreateProduct.tsx` | Apply theme to preview | High |
| `src/ProductPreviewModal.jsx` | Apply theme to preview | High |
| `src/utils/renderingUtils.ts` | Pass theme to renderer | Medium |
| `src/utils/canvasRenderer.ts` | Support theme layouts | Medium |

---

## Future Extensibility

### Adding New Themes

Simply add to `THEMES` object in `themeConfig.ts`:

```typescript
export const THEMES = {
  classic: { ... },
  glass: { ... },
  premium: {  // NEW THEME
    id: "premium",
    name: "Premium",
    styles: {
      layout: "premium",
      bgColor: "#1a1a1a",
      // ...
    },
    rendering: { ... }
  }
};
```

No other changes needed - all components will automatically support it.

---

## Benefits of This Approach

1. **Centralized**: All theme data in one place (`themeConfig.ts`)
2. **Scalable**: Easy to add new themes without touching components
3. **Real-time**: Theme changes propagate immediately to all components
4. **Persistent**: Theme choice saved to localStorage
5. **Type-safe**: TypeScript interfaces for all theme properties
6. **DRY**: No duplicate theme definitions across files
7. **Accessible**: Simple `useTheme()` hook for any component

---

## Implementation Checklist

- [ ] Create `src/config/themeConfig.ts`
- [ ] Create `src/context/ThemeContext.tsx`
- [ ] Wrap App with ThemeProvider in `src/main.tsx` or `src/App.tsx`
- [ ] Update ThemesSettings to use useTheme()
- [ ] Create theme preview components (classic & glass layouts)
- [ ] Update CreateProduct preview with useTheme()
- [ ] Update ProductPreviewModal with useTheme()
- [ ] Update renderingUtils to accept theme parameter
- [ ] Update canvasRenderer to support multiple layouts
- [ ] Test theme switching across all 3 areas
- [ ] Plan for future themes (premium, minimal, etc.)
