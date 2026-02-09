import type { ComponentType } from "react";
import BrownBackgroundSketch from "@/components/p5/skins/BrownBackgroundSketch";

export type ColorPalette = {
  background: string;
  text: string;
  text_secondary: string;
  border: string;
  colors?: string[];
  lighter_bg: string;
  button: string;
  opacity_neutral?: string;
  SketchComponent?: ComponentType;
};

export const colorPalettes: Record<string, ColorPalette> = {
  dusk: {
    background: "#11323dff",
    lighter_bg: "#245869ff",
    text: "#ffffffff",
    text_secondary: "#ffd6d6ff",
    border: "#ffffffff",
    button: "#ffffffff",
    opacity_neutral: "#ffd3f899"
  },
  light: {
    background: "#F5F5F5",
    text: "#072A60",
    text_secondary: "#1976D2",
    border: "#303F9F",
    colors: ["#072A60", "#1565C0", "#1976D2", "#2196F3", "#64B5F6"],
    lighter_bg: "#f4f4ddff",
    button: "#0d585aff",
    opacity_neutral: "#20437888"
  }
};

export type ThemeName = keyof typeof colorPalettes;

export const defaultPalette = colorPalettes.whitesmokeAzul;