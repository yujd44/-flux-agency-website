"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "flux-theme";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
} | null>(null);

/**
 * Reads/writes `data-theme` on <html>. The actual first-paint value is
 * already applied by the inline script in the root layout (see
 * ThemeScript) so there is no flash of the wrong theme -- this provider
 * only needs to sync React state to whatever the DOM already reflects and
 * persist explicit user toggles.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    // Syncing from an external system (the DOM attribute the blocking head
    // script already applied before hydration, based on localStorage) is
    // exactly what effects are for -- this can't be known during render
    // because of SSR, so a one-time mount sync is intentional here.
    const current = document.documentElement.getAttribute("data-theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(current === "light" ? "light" : "dark");
  }, []);

  const applyTheme = useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage may be unavailable (private mode, disabled storage) -- theme
      // simply won't persist across visits, which is an acceptable fallback.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    applyTheme(theme === "dark" ? "light" : "dark");
  }, [theme, applyTheme]);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
