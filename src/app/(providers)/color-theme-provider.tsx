"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { colorPalettes, type ThemeName } from "@/lib/color-palettes";

type ColorThemeContextValue = {
  theme: ThemeName;
  changeTheme: (newTheme: ThemeName) => void;
};

const ColorThemeContext = createContext<ColorThemeContextValue | undefined>(undefined);

export default function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>("whitesmokeAzul");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("selectedTheme") : null;
    if (saved && saved in colorPalettes) setTheme(saved as ThemeName);
  }, []);

  const changeTheme = (newTheme: ThemeName) => {
    setTheme(newTheme);
    if (typeof window !== "undefined") window.localStorage.setItem("selectedTheme", newTheme);
  };

  const colors = colorPalettes[theme];

  useEffect(() => {
    if (!colors) return;
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