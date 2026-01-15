"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import LoadingSketch from "@/components/p5/loading/LoadingSketch";

type SketchDisplayProps = {
  slug?: string;
};


const registry: Record<string, () => Promise<any>> = {
  "calm": () => import("./sketches/calm/CalmFirst"),
  "calm_second": () => import("./sketches/calm/CalmSecond"),
  "design_image_composer": () => import("./sketches/design/CanvasImageComposer"),
  "design_image_glow": () => import("./sketches/design/CanvasImageGlow"),
  "chaotic_mouse_trail": () => import("./sketches/chaotic/MouseTrailImage"),
  "chaotic_wave_field": () => import("./sketches/chaotic/ChaoticWaveField"),
  "generative_nature": () => import("./sketches/nature/GenerativeNature"),
  "rolling_interactive_spiral": () => import("./sketches/experimental/RollingInteractiveSpiral"),
  "pad": () => import("./sketches/dynamic/Pad"),
};

export default function SketchDisplay({ slug }: SketchDisplayProps) {
  const params = useParams();
  const effectiveSlug = slug ?? (params?.slug as string | undefined);
  const Sketch = useMemo(() => {
    const normalized = typeof effectiveSlug === "string" ? effectiveSlug.toLowerCase() : "not-found";
    const loader = registry[normalized];
    if (!loader) return null;
    return dynamic(loader, {
      ssr: false,
      loading: () => (
       <LoadingSketch />
      ),
    });
  }, [effectiveSlug]);

  if (!Sketch) {
    return (
      <div
        style={{
          width: "100%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Sketch not found: {effectiveSlug ?? "undefined"}
      </div>
    );
  }

  return <Sketch />;
}