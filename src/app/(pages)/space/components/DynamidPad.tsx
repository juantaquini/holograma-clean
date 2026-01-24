"use client";

import React, { useEffect, useRef, useState } from "react";
import { useColorTheme } from "@/app/(providers)/color-theme-provider";
import { colorPalettes } from "@/lib/color-palettes";

const KEYS = [75, 66, 83, 72]; 

export default function DynamicPad({ sketch }: { sketch: any }) {
  const { theme } = useColorTheme();
  const palette = colorPalettes[theme];

  const sounds = useRef<any[]>([]);
  const audioElements = useRef<HTMLAudioElement[]>([]); // Fallback
  const soundOn = useRef<boolean[]>([]);
  const imgs = useRef<any[]>([]);
  const vids = useRef<any[]>([]);
  const alphaPhase = useRef<number[]>([0, 1, 2, 3]);
  const activeTouches = useRef<Map<number, number>>(new Map());
  const canvasRef = useRef<any>(null);
  const fadeTimeouts = useRef<any[]>([]);
  const p5Instance = useRef<any>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [Sketch, setSketch] = useState<any>(null);
  const [p5SoundLoaded, setP5SoundLoaded] = useState(false);

  // Extraer arrays de URLs desde sketch_media
  const layers = Array.isArray(sketch?.sketch_media)
    ? sketch.sketch_media
        .filter((l: any) => l.media)
        .sort((a: any, b: any) => a.z_index - b.z_index)
        .slice(0, 4)
    : [];

  const audios = layers.filter((l: any) => l.media?.kind === "audio").map((l: any) => l.media.url);
  const images = layers.filter((l: any) => l.media?.kind === "image").map((l: any) => l.media.url);
  const videos = layers.filter((l: any) => l.media?.kind === "video").map((l: any) => l.media.url);

  console.log("🎛 Space DynamicPad assets", { audiosCount: audios.length, imagesCount: images.length, videosCount: videos.length });

  // Cargar p5.sound - react-p5 ya incluye p5.js
  useEffect(() => {
    // Inicializar fallbacks de HTMLAudioElement
    audios.slice(0, 4).forEach((src: string, i: number) => {
      try {
        const audio = new Audio(src);
        audio.loop = true;
        audio.crossOrigin = "anonymous";
        audio.preload = "auto";
        audioElements.current[i] = audio;
        console.log(`🔊 Native Audio ${i} initialized as fallback`);
      } catch (e) {
        console.error(`❌ Error initializing native audio ${i}:`, e);
      }
    });

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/addons/p5.sound.min.js";
    script.async = true;
    
    script.onload = () => {
      console.log("✅ p5.sound loaded");
      setP5SoundLoaded(true);
      import("react-p5").then((mod) => {
        console.log("✅ react-p5 loaded");
        setSketch(() => mod.default);
      });
    };
    
    script.onerror = () => {
      console.error("❌ Failed to load p5.sound");
    };
    
    document.body.appendChild(script);

    return () => {
      console.log("🧹 Cleanup");
      
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      
      fadeTimeouts.current.forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
      fadeTimeouts.current = [];
      
      sounds.current.forEach((sound) => {
        if (sound) {
          try {
            if (sound.isPlaying && sound.isPlaying()) {
              sound.stop();
            }
            if (sound.disconnect) sound.disconnect();
          } catch (e) {
            console.warn("Error stopping sound:", e);
          }
        }
      });
      sounds.current = [];
      
      // Cleanup native audio
      audioElements.current.forEach((audio) => {
        if (audio) {
          try {
            audio.pause();
            audio.src = "";
          } catch (e) {
            console.warn("Error stopping native audio:", e);
          }
        }
      });
      audioElements.current = [];

      soundOn.current = [];
      
      vids.current.forEach((vid) => {
        if (vid && vid.elt) {
          try {
            vid.elt.pause();
            vid.remove();
          } catch (e) {
            console.warn("Error stopping video:", e);
          }
        }
      });
      vids.current = [];
      imgs.current = [];
      
      if (p5Instance.current) {
        try {
          p5Instance.current.remove();
          p5Instance.current = null;
        } catch (e) {
          console.warn("Error removing p5 instance:", e);
        }
      }
    };
  }, []);

  useEffect(() => {
    setIsMobile(/android|iphone|ipad/i.test(navigator.userAgent));
  }, []);

  const ensureAudioContext = () => {
    try {
      const p5 = p5Instance.current;
      const ctx = p5?.getAudioContext?.();
      if (ctx && ctx.state !== "running") {
        (window as any).userStartAudio?.();
        ctx.resume?.();
        console.log("🔊 Audio context resumed");
      }
    } catch (e) {
      console.warn("Audio context resume failed:", e);
    }
  };

  const preload = (p5: any) => {
    console.log("🔄 Preloading assets...");
    
    // Intenta configurar soundFormats pero no bloquea si falla
    try {
       // Algunos navegadores necesitan esto, otros no. Lo dejamos opcional.
       // (window as any).p5?.soundFormats?.('mp3','wav','ogg','webm');
    } catch {}

    audios.slice(0, 4).forEach((src: string, i: number) => {
      try {
        console.log(`Loading audio ${i}: ${src}`);
        let sound: any = null;
        if (typeof (p5 as any).loadSound === 'function') {
          sound = (p5 as any).loadSound(
            src,
            () => console.log(`✅ Audio ${i} loaded (p5)`),
            (err: any) => console.error(`❌ Error loading audio ${i} (p5):`, err)
          );
        } else if ((window as any).p5?.SoundFile) {
          const SF = (window as any).p5.SoundFile;
          sound = new SF(
            src,
            () => console.log(`✅ Audio ${i} loaded (SoundFile)`),
            (err: any) => console.error(`❌ Error loading audio ${i} (SoundFile):`, err)
          );
        } else {
          console.warn('p5.sound no disponible, usando fallback nativo');
        }
        sounds.current[i] = sound;
        soundOn.current[i] = false;
      } catch (err) {
        console.error(`❌ Error loading sound ${i}:`, err);
      }
    });

    images.forEach((src: string, i: number) => {
      try {
        console.log(`Loading image ${i}: ${src}`);
        imgs.current[i] = p5.loadImage(
          src,
          () => console.log(`✅ Image ${i} loaded`),
          (err: any) => console.error(`❌ Error loading image ${i}:`, err)
        );
      } catch (err) {
        console.error(`❌ Error loading image ${i}:`, err);
      }
    });

    videos.forEach((src: string, i: number) => {
      try {
        console.log(`Loading video ${i}: ${src}`);
        const v = p5.createVideo(src, () => {
          console.log(`✅ Video ${i} loaded`);
        });
        v.hide();
        v.volume(0);
        v.elt.muted = true;
        v.elt.playsInline = true;
        v.elt.setAttribute('playsinline', '');
        v.elt.setAttribute('webkit-playsinline', '');
        v.elt.setAttribute('disablePictureInPicture', '');
        v.elt.setAttribute('x-webkit-airplay', 'deny');
        v.elt.style.pointerEvents = 'none';
        v.loop();
        vids.current[i] = v;
      } catch (err) {
        console.error(`❌ Error loading video ${i}:`, err);
      }
    });
  };

  const setup = (p5: any, parent: Element) => {
    console.log("🎨 Setting up canvas...");
    p5Instance.current = p5;
    
    const canvas = p5.createCanvas(
      p5.windowWidth,
      p5.windowHeight * 0.75,
      p5.WEBGL
    ).parent(parent);

    canvasRef.current = canvas.elt;

    if (isMobile) {
      canvas.elt.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.elt.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.elt.addEventListener('touchend', handleTouchEnd, { passive: false });
      canvas.elt.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    }
    
    console.log("✅ Canvas ready");
  };

  const looped = <T,>(arr: T[], i: number) =>
    arr.length ? arr[i % arr.length] : null;

  const toggle = (i: number, on: boolean) => {
    const s = sounds.current[i];
    const nativeAudio = audioElements.current[i];
    
    if (!s && !nativeAudio) return;

    if (fadeTimeouts.current[i]) {
      clearTimeout(fadeTimeouts.current[i]);
      fadeTimeouts.current[i] = null;
    }

    if (on && !soundOn.current[i]) {
      try {
        // Intentar p5 sound
        if (s && s.loop) {
          s.loop();
          s.amp(0);
          s.amp(1, 0.05);
        } else if (nativeAudio) {
          // Fallback nativo
          nativeAudio.volume = 1;
          nativeAudio.play().catch(e => console.warn("Native play failed:", e));
        }
        
        const vid = looped(vids.current, i);
        if (vid && vid.elt.paused) {
          vid.loop();
        }
        soundOn.current[i] = true;
      } catch (err) {
        console.error(`Error toggling sound ${i} on:`, err);
      }
    }

    if (!on && soundOn.current[i]) {
      try {
        if (s && s.stop) {
          s.amp(0, 0.05);
          fadeTimeouts.current[i] = setTimeout(() => {
            s.stop();
            fadeTimeouts.current[i] = null;
          }, 60);
        } else if (nativeAudio) {
          nativeAudio.pause();
          nativeAudio.currentTime = 0;
        }
        
        soundOn.current[i] = false;
      } catch (err) {
        console.error(`Error toggling sound ${i} off:`, err);
      }
    }
  };

  const isInsideCanvas = (touch: Touch, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return (
      touch.clientX >= rect.left &&
      touch.clientX <= rect.right &&
      touch.clientY >= rect.top &&
      touch.clientY <= rect.bottom
    );
  };

  const getQuadrantFromTouch = (touch: Touch, canvas: HTMLCanvasElement) => {
    if (!isInsideCanvas(touch, canvas)) return -1;

    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left - rect.width / 2;
    const y = touch.clientY - rect.top - rect.height / 2;

    if (x < 0 && y < 0) return 0;
    if (x >= 0 && y < 0) return 1;
    if (x < 0 && y >= 0) return 2;
    if (x >= 0 && y >= 0) return 3;
    return -1;
  };

  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    ensureAudioContext();
    const canvas = e.target as HTMLCanvasElement;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
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
      
      if (!isInsideCanvas(touch, canvas)) {
        if (oldQuadrant !== undefined) {
          toggle(oldQuadrant, false);
          activeTouches.current.delete(touch.identifier);
        }
        continue;
      }

      const newQuadrant = getQuadrantFromTouch(touch, canvas);

      if (oldQuadrant !== undefined && oldQuadrant !== newQuadrant) {
        toggle(oldQuadrant, false);
        activeTouches.current.delete(touch.identifier);

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

  const draw = (p5: any) => {
    const bg = p5.color(palette.lighter_bg);
    bg.setAlpha(120);
    p5.background(bg);

    if (!isMobile) {
      ensureAudioContext();
      KEYS.forEach((k, i) => {
        toggle(i, p5.keyIsDown(k));
      });
    }

    for (let i = 0; i < 4; i++) {
      const hasSound = soundOn.current[i];
      const x = (i % 2 === 0 ? -1 : 1) * (p5.width / 4);
      const y = (i < 2 ? -1 : 1) * (p5.height / 4);

      p5.push();
      p5.translate(x, y);

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

      {
        const img = looped(imgs.current, i);
        if (img) {
          alphaPhase.current[i] += 0.02;
          const base = hasSound ? 80 : 20;
          const alpha = base + p5.sin(alphaPhase.current[i]) * (hasSound ? 80 : 20);
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

    if (isMobile) {
      p5.push();
      p5.stroke(palette.text_secondary);
      p5.strokeWeight(2);
      p5.line(0, -p5.height / 2, 0, p5.height / 2);
      p5.line(-p5.width / 2, 0, p5.width / 2, 0);
      p5.pop();
    }
  };

  if (!Sketch || !p5SoundLoaded) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '400px',
        color: palette.text_secondary 
      }}>
        Cargando biblioteca de audio...
      </div>
    );
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
        
        video {
          pointer-events: none !important;
        }
      `}</style>
      <Sketch preload={preload} setup={setup} draw={draw} />
    </div>
  );
}