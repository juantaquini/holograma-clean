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
  marronCeleste: {
    background: "#2D1E14",
    text: "#9fe8fc",
    text_secondary: "#F7B267",
    border: "#006064",
    colors: ["#8D6E63", "#84FFFF", "#3E2723"],
    lighter_bg: "#6f5149",
    button: "#006064",
    SketchComponent: BrownBackgroundSketch
  },
  azulMagenta: {
    background: "#10154fff",
    lighter_bg: "#303F9F",
    text: "#F8EAF6",
    text_secondary: "#FFB3B3",
    border: "#E91E63",
    button: "#EC8200",
    opacity_neutral: "#f8eaf699"
  },
  whitesmokeAzul: {
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