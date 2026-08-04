"use client";

import { createContext, useContext } from "react";

export type Theme = "light";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
} | null>(null);

/**
 * Light-only stub for Phase 1. Dark theme / toggle removed to match the
 * METHODEA architectural mock. Kept so any leftover callers of useTheme
 * still resolve safely without a switcher in the UI.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{ theme: "light", toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
