"use client";

import React, { useEffect, useRef, useState } from "react";
import { useColorTheme } from "@/app/(providers)/color-theme-provider";
import { colorPalettes } from "@/lib/color-palettes";

interface Props {
  audios: string[];
  images?: string[];
  videos?: string[];
}

const KEYS = [75, 66, 83, 72]; // K B S H

const DynamicPad: React.FC<Props> = ({
  audios,
  images = [],
  videos = [],
}) => {
  const { theme } = useColorTheme();
  const palette = colorPalettes[theme];

  const sounds = useRef<any[]>([]);
  const soundOn = useRef<boolean[]>([]);
  const imgs = useRef<any[]>([]);
  const vids = useRef<any[]>([]);
  const alphaPhase = useRef<number[]>([0, 1, 2, 3]);
  const activeTouches = useRef<Map<number, number>>(new Map()); // touchId -> quadrant
  const canvasRef = useRef<any>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [Sketch, setSketch] = useState<any>(null);
  const [p5SoundLoaded, setP5SoundLoaded] = useState(false);

  // Cargar p5.sound primero
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/addons/p5.sound.min.js";
    script.async = true;
    script.onload = () => {
      setP5SoundLoaded(true);
      import("react-p5").then((mod) => {
        setSketch(() => mod.default);
      });
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    setIsMobile(/android|iphone|ipad/i.test(navigator.userAgent));
  }, []);

  /* preload */
  const preload = (p5: any) => {
    audios.slice(0, 4).forEach((src, i) => {
      sounds.current[i] = p5.loadSound(src);
      soundOn.current[i] = false;
    });

    images.forEach((src, i) => {
      imgs.current[i] = p5.loadImage(src);
    });

    videos.forEach((src, i) => {
      const v = p5.createVideo(src);
      v.hide();
      v.volume(0);
      v.elt.muted = true;
      v.loop();
      vids.current[i] = v;
    });
  };

  /* setup */
  const setup = (p5: any, parent: Element) => {
    const canvas = p5.createCanvas(
      p5.windowWidth,
      p5.windowHeight * 0.75,
      p5.WEBGL
    ).parent(parent);

    canvasRef.current = canvas.elt;

    // Touch event listeners para mobile
    if (isMobile) {
      canvas.elt.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.elt.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.elt.addEventListener('touchend', handleTouchEnd, { passive: false });
      canvas.elt.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    }
  };

  /* helpers */
  const looped = <T,>(arr: T[], i: number) =>
    arr.length ? arr[i % arr.length] : null;

  const toggle = (i: number, on: boolean) => {
    const s = sounds.current[i];
    if (!s) return;

    if (on && !soundOn.current[i]) {
      s.loop();
      const vid = looped(vids.current, i);
      if (vid && vid.elt.paused) {
        vid.loop();
      }
      soundOn.current[i] = true;
    }

    if (!on && soundOn.current[i]) {
      s.stop();
      soundOn.current[i] = false;
    }
  };

  const isInsideCanvas = (touch: Touch, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX;
    const y = touch.clientY;
    
    return (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    );
  };

  const getQuadrantFromTouch = (touch: Touch, canvas: HTMLCanvasElement) => {
    if (!isInsideCanvas(touch, canvas)) return -1;

    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left - rect.width / 2;
    const y = touch.clientY - rect.top - rect.height / 2;

    if (x < 0 && y < 0) return 0; // top-left
    if (x >= 0 && y < 0) return 1; // top-right
    if (x < 0 && y >= 0) return 2; // bottom-left
    if (x >= 0 && y >= 0) return 3; // bottom-right
    return -1;
  };

  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const canvas = e.target as HTMLCanvasElement;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      
      // Solo procesar si el touch está dentro del canvas
      if (!isInsideCanvas(touch, canvas)) continue;
      
      const quadrant = getQuadrantFromTouch(touch, canvas);
      
      if (quadrant !== -1) {
        activeTouches.current.set(touch.identifier, quadrant);
        toggle(quadrant, true);
      }
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const canvas = e.target as HTMLCanvasElement;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const oldQuadrant = activeTouches.current.get(touch.identifier);
      
      // Si el touch sale del canvas, apagar el audio
      if (!isInsideCanvas(touch, canvas)) {
        if (oldQuadrant !== undefined) {
          toggle(oldQuadrant, false);
          activeTouches.current.delete(touch.identifier);
        }
        continue;
      }

      const newQuadrant = getQuadrantFromTouch(touch, canvas);

      if (oldQuadrant !== undefined && oldQuadrant !== newQuadrant) {
        // Salió del cuadrante, apagar el audio
        toggle(oldQuadrant, false);
        activeTouches.current.delete(touch.identifier);

        // Si entró a un nuevo cuadrante válido, encender ese audio
        if (newQuadrant !== -1) {
          activeTouches.current.set(touch.identifier, newQuadrant);
          toggle(newQuadrant, true);
        }
      }
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const quadrant = activeTouches.current.get(touch.identifier);

      if (quadrant !== undefined) {
        toggle(quadrant, false);
        activeTouches.current.delete(touch.identifier);
      }
    }
  };

  /* draw */
  const draw = (p5: any) => {
    const bg = p5.color(palette.lighter_bg);
    bg.setAlpha(120);
    p5.background(bg);

    /* desktop keys - mantener presionado */
    if (!isMobile) {
      KEYS.forEach((k, i) => {
        toggle(i, p5.keyIsDown(k));
      });
    }

    /* draw layers */
    for (let i = 0; i < 4; i++) {
      const hasSound = soundOn.current[i];
      
      // Posición según cuadrante
      const x = (i % 2 === 0 ? -1 : 1) * (p5.width / 4);
      const y = (i < 2 ? -1 : 1) * (p5.height / 4);

      p5.push();
      p5.translate(x, y);

      // Dibujar video de fondo si existe
      const vid = looped(vids.current, i);
      if (vid && hasSound) {
        const scale = Math.max(
          p5.width / vid.width,
          p5.height / vid.height
        ) * 0.6;

        p5.tint(255, 255);
        p5.image(
          vid,
          (-vid.width * scale) / 2,
          (-vid.height * scale) / 2,
          vid.width * scale,
          vid.height * scale
        );
      }

      // Dibujar imagen con transparencia encima
      if (hasSound) {
        const img = looped(imgs.current, i);
        if (img) {
          alphaPhase.current[i] += 0.02;
          const alpha = 80 + p5.sin(alphaPhase.current[i]) * 80;

          p5.tint(255, alpha);

          const scale = Math.max(
            p5.width / img.width,
            p5.height / img.height
          ) * 0.6;

          p5.image(
            img,
            (-img.width * scale) / 2,
            (-img.height * scale) / 2,
            img.width * scale,
            img.height * scale
          );
        }
      }

      p5.pop();
    }

    /* cruz divisoria en mobile */
    if (isMobile) {
      p5.push();
      p5.stroke(palette.text_secondary);
      p5.strokeWeight(2);
      
      // Línea vertical
      p5.line(0, -p5.height / 2, 0, p5.height / 2);
      
      // Línea horizontal
      p5.line(-p5.width / 2, 0, p5.width / 2, 0);
      
      p5.pop();
    }
  };

  if (!Sketch || !p5SoundLoaded) {
    return <div>Loading audio library...</div>;
  }

  return (
    <div
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        WebkitTouchCallout: "none",
        WebkitTapHighlightColor: "transparent",
        touchAction: "none",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <style jsx global>{`
        canvas {
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          -webkit-touch-callout: none !important;
          -webkit-tap-highlight-color: transparent !important;
          touch-action: none !important;
          display: block;
          outline: none;
        }
      `}</style>
      <Sketch preload={preload} setup={setup} draw={draw} />
    </div>
  );
};

export default DynamicPad;