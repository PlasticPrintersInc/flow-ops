"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { THEME_COOKIE_NAME, type ThemeMode } from "@/lib/theme";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type AppProvidersProps = {
  children: React.ReactNode;
  initialTheme: ThemeMode;
};

function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function persistTheme(theme: ThemeMode) {
  document.cookie = `${THEME_COOKIE_NAME}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function AppProviders({ children, initialTheme }: AppProvidersProps) {
  const [theme, setThemeState] = useState<ThemeMode>(initialTheme);

  useEffect(() => {
    applyTheme(theme);
    persistTheme(theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(() => {
    return {
      theme,
      setTheme: setThemeState,
      toggleTheme: () => {
        setThemeState((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
      },
    };
  }, [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used within AppProviders.");
  }

  return context;
}
