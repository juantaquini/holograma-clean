"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { colorPalettes, type ThemeName } from "@/lib/color-palettes";

type ColorThemeContextValue = {
  theme: ThemeName;
  changeTheme: (newTheme: ThemeName) => void;
};

const ColorThemeContext = createContext<ColorThemeContextValue | undefined>(undefined);

const DEFAULT_THEME: ThemeName = "light";
const THEME_STORAGE_KEY = "holograma-theme";

function applyPaletteToRoot(colors: (typeof colorPalettes)[ThemeName]) {
  if (typeof document === "undefined" || !colors) return;
  const root = document.documentElement;
  root.style.setProperty("--bg", colors.background);
  root.style.setProperty("--text", colors.text);
  root.style.setProperty("--text-secondary", colors.text_secondary);
  root.style.setProperty("--border", colors.border);
  root.style.setProperty("--lighter-bg", colors.lighter_bg);
  root.style.setProperty("--button", colors.button);
  if (colors.opacity_neutral) root.style.setProperty("--opacity-neutral", colors.opacity_neutral);
  root.style.setProperty("--bg-color", colors.background);
  root.style.setProperty("--text-color", colors.text);
  root.style.setProperty("--text-color-secondary", colors.text_secondary);
  root.style.setProperty("--border-color", colors.border);
  root.style.setProperty("--lighter-bg-color", colors.lighter_bg);
  root.style.setProperty("--button-color", colors.button);
  if (colors.opacity_neutral) root.style.setProperty("--opacity-neutral-color", colors.opacity_neutral);
}

function getStoredTheme(): ThemeName | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && Object.prototype.hasOwnProperty.call(colorPalettes, stored)) {
      return stored as ThemeName;
    }
  } catch {}
  return null;
}

export default function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>(() => {
    const stored = getStoredTheme();
    if (stored) return stored;
    if (typeof window !== "undefined") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      return media.matches ? "dark" : "light";
    }
    return DEFAULT_THEME;
  });

  const changeTheme = (newTheme: ThemeName) => {
    setTheme(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {}
  };

  const colors = colorPalettes[theme] ?? colorPalettes[DEFAULT_THEME];

  useLayoutEffect(() => {
    applyPaletteToRoot(colors);
  }, [colors]);

  const value = useMemo(() => ({ theme, changeTheme }), [theme]);

  return (
    <ColorThemeContext.Provider value={value}>
      {colors?.SketchComponent ? <colors.SketchComponent /> : null}
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme() {
  const ctx = useContext(ColorThemeContext);
  if (!ctx) throw new Error("useColorTheme must be used within ColorThemeProvider");
  return ctx;
}