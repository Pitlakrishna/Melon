'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeName = 'light' | 'cream' | 'indigo' | 'emerald' | 'ruby';

export interface ThemeOption {
  id: ThemeName;
  name: string;
  color: string;
  accent: string;
  emoji: string;
  mode: 'light' | 'dark';
}

export const THEMES: ThemeOption[] = [
  { id: 'light', name: 'Crisp Light', color: '#ffffff', accent: '#4f46e5', emoji: '⚪', mode: 'light' },
  { id: 'cream', name: 'Warm Cream', color: '#faf7f2', accent: '#d97706', emoji: '📜', mode: 'light' },
  { id: 'indigo', name: 'Midnight Indigo', color: '#151d30', accent: '#818cf8', emoji: '🟣', mode: 'dark' },
  { id: 'emerald', name: 'Cyber Emerald', color: '#0f372c', accent: '#34d399', emoji: '🟢', mode: 'dark' },
  { id: 'ruby', name: 'Sunset Ruby', color: '#3a1727', accent: '#fb7185', emoji: '🔴', mode: 'dark' },
];

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themes: ThemeOption[];
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  themes: THEMES,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('app-theme') as ThemeName;
        if (saved && THEMES.some((t) => t.id === saved)) {
          return saved;
        }
      } catch (e) {}
    }
    return 'light';
  });

  useEffect(() => {
    // Ensure document attribute matches on mount
    try {
      const saved = localStorage.getItem('app-theme') as ThemeName;
      if (saved && THEMES.some((t) => t.id === saved)) {
        if (theme !== saved) {
          setThemeState(saved);
        }
        document.documentElement.setAttribute('data-theme', saved);
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch (e) {}
  }, []);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    localStorage.setItem('app-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
