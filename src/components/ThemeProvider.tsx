"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContext {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeCtx = createContext<ThemeContext>({
  theme: "dark",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    try {
      setTheme("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("agencygrid-theme", "dark");
    } catch {
      setTheme("dark");
    }
  }, []);

  const toggleTheme = () => {
    setTheme("dark");
    document.documentElement.setAttribute("data-theme", "dark");
    try {
      localStorage.setItem("agencygrid-theme", "dark");
    } catch {}
  };

  return (
    <ThemeCtx.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
