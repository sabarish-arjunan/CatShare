import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeConfig, getThemeById } from "../config/themeConfig";

interface ThemeContextType {
  currentTheme: ThemeConfig;
  selectedThemeId: string;
  setTheme: (themeId: string) => void;
  getTheme: (themeId: string) => ThemeConfig;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize from localStorage
  const [selectedThemeId, setSelectedThemeId] = useState(() => {
    const stored = localStorage.getItem("selectedTheme");
    return stored || "classic";
  });

  const [currentTheme, setCurrentTheme] = useState(() => {
    const stored = localStorage.getItem("selectedTheme");
    return getThemeById(stored);
  });

  // Update theme when selection changes
  useEffect(() => {
    const theme = getThemeById(selectedThemeId);
    setCurrentTheme(theme);
    localStorage.setItem("selectedTheme", selectedThemeId);

    // Dispatch event for any listeners (for backward compatibility)
    window.dispatchEvent(
      new CustomEvent("themeChanged", {
        detail: { theme: selectedThemeId, config: theme },
      })
    );

    console.log(`✅ Theme changed to: ${selectedThemeId}`, theme);
  }, [selectedThemeId]);

  // Listen for external theme changes (e.g., from other tabs)
  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.theme) {
        setSelectedThemeId(customEvent.detail.theme);
      }
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

/**
 * Hook to use theme context in any component
 * Must be used within ThemeProvider
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error(
      "useTheme must be used within ThemeProvider. Make sure ThemeProvider wraps your component tree in App.tsx"
    );
  }
  return context;
}
