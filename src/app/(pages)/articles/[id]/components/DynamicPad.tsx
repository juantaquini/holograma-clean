"use client";

import React, { useEffect, useRef, useState } from "react";
import { useColorTheme } from "@/app/(providers)/color-theme-provider";
import { colorPalettes } from "@/lib/color-palettes";

interface Props {
  audios: string[];
  images?: string[];
  videos?: string[];
}

const KEYS = [75, 66, 83, 72]; 

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
  const activeTouches = useRef<Map<number, number>>(new Map());
  const canvasRef = useRef<any>(null);
  const fadeTimeouts = useRef<any[]>([]);
  const p5Instance = useRef<any>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [Sketch, setSketch] = useState<any>(null);
  const [p5SoundLoaded, setP5SoundLoaded] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showHelp, setShowHelp] = useState(true);

  // Cargar p5.sound primero
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/addons/p5.sound.min.js";
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
      console.log("🧹 Cleanup: Removing p5.sound script");
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Cleanup completo al desmontar
  useEffect(() => {
    return () => {
      console.log("🧹 Cleanup: Stopping all sounds and videos");
      
      // Limpiar timeouts
      fadeTimeouts.current.forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
      fadeTimeouts.current = [];
      
      // Detener y liberar todos los sonidos
      sounds.current.forEach((sound, i) => {
        if (sound) {
          try {
            if (sound.isPlaying && sound.isPlaying()) {
              sound.stop();
            }
            // Liberar recursos del sonido
            if (sound.disconnect) sound.disconnect();
          } catch (e) {
            console.warn(`Error stopping sound ${i}:`, e);
          }
        }
      });
      sounds.current = [];
      soundOn.current = [];
      
      // Detener videos
      vids.current.forEach((vid, i) => {
        if (vid && vid.elt) {
          try {
            vid.elt.pause();
            vid.remove();
          } catch (e) {
            console.warn(`Error stopping video ${i}:`, e);
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

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("dynamicPadHelpDismissed");
      if (stored === "true") setShowHelp(false);
    } catch {}
  }, []);

  const dismissHelp = () => {
    setShowHelp(false);
    try {
      window.localStorage.setItem("dynamicPadHelpDismissed", "true");
    } catch {}
  };

  const preload = (p5: any) => {
    console.log("🔄 Preloading assets...");
    
    audios.slice(0, 4).forEach((src, i) => {
      try {
        sounds.current[i] = p5.loadSound(
          src,
          () => console.log(`✅ Audio ${i} loaded`),
          (err: any) => console.error(`❌ Error loading audio ${i}:`, err)
        );
        soundOn.current[i] = false;
      } catch (err) {
        console.error(`❌ Error loading sound ${i}:`, err);
      }
    });

    images.forEach((src, i) => {
      try {
        imgs.current[i] = p5.loadImage(
          src,
          () => console.log(`✅ Image ${i} loaded`),
          (err: any) => console.error(`❌ Error loading image ${i}:`, err)
        );
      } catch (err) {
        console.error(`❌ Error loading image ${i}:`, err);
      }
    });

    videos.forEach((src, i) => {
      try {
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
    
    setIsReady(true);
    console.log("✅ Canvas ready");
  };

  const windowResized = (p5: any) => {
    try {
      p5.resizeCanvas(p5.windowWidth, p5.windowHeight * 0.75);
    } catch {}
  };

  const looped = <T,>(arr: T[], i: number) =>
    arr.length ? arr[i % arr.length] : null;

  const toggle = (i: number, on: boolean) => {
    const s = sounds.current[i];
    if (!s) return;

    if (fadeTimeouts.current[i]) {
      clearTimeout(fadeTimeouts.current[i]);
      fadeTimeouts.current[i] = null;
    }

    if (on && !soundOn.current[i]) {
      try {
        if (s.isPlaying && s.isPlaying()) {
          s.stop();
        }
        s.loop();
        s.amp(0);
        s.amp(1, 0.05);
        
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
        s.amp(0, 0.05);
        fadeTimeouts.current[i] = setTimeout(() => {
          s.stop();
          fadeTimeouts.current[i] = null;
        }, 60);
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
    const canvas = e.target as HTMLCanvasElement;

    if (p5Instance.current?.userStartAudio) {
      try {
        p5Instance.current.userStartAudio();
      } catch {}
    }

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
    const bg = p5.color(palette.text_secondary);
    bg.setAlpha(120);
    p5.background(bg);

    const anySoundOn = soundOn.current.some(Boolean);
    const bgVideo = vids.current[0];
    if (anySoundOn && bgVideo && bgVideo.width && bgVideo.height) {
      const scale = Math.max(
        p5.width / bgVideo.width,
        p5.height / bgVideo.height
      );
      p5.push();
      p5.tint(255, 255);
      p5.image(
        bgVideo,
        (-bgVideo.width * scale) / 2,
        (-bgVideo.height * scale) / 2,
        bgVideo.width * scale,
        bgVideo.height * scale
      );
      p5.pop();
    }

    if (!isMobile) {
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

      if (hasSound) {
        const img = looped(imgs.current, i);
        if (img) {
          alphaPhase.current[i] += 0.02;
          const alpha = 80 + p5.sin(alphaPhase.current[i]) * 80;
          p5.tint(255, alpha);

          const quadW = p5.width / 2;
          const quadH = p5.height / 2;
          const scale = Math.min(quadW / img.width, quadH / img.height) * 0.85;

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
      // mobile crosshair is drawn as DOM overlay for perfect centering
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
      {isReady && showHelp && (
        <div
          style={{
            position: "absolute",
            inset: "16px",
            zIndex: 5,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                background: "rgba(0,0,0,0.55)",
                color: palette.text,
                padding: "12px 14px",
                borderRadius: "14px",
                border: `1px solid ${palette.border}`,
                maxWidth: isMobile ? "100%" : "320px",
                fontSize: "14px",
                letterSpacing: "0.3px",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: "6px" }}>
                Dynamic Pad
              </div>
              <div>
                {isMobile
                  ? "Tap and hold any quadrant to trigger a layer. Slide to switch. Lift your finger to fade out."
                  : "Press and hold K, B, S, H to trigger layers. Release to fade out. Try two keys at once."}
              </div>
            </div>
            <button
              onClick={dismissHelp}
              style={{
                pointerEvents: "auto",
                background: "rgba(0,0,0,0.55)",
                color: palette.text,
                border: `1px solid ${palette.border}`,
                borderRadius: "999px",
                padding: "8px 14px",
                fontSize: "12px",
                letterSpacing: "0.4px",
                height: "fit-content",
              }}
            >
              Got it
            </button>
          </div>

          <div style={{ position: "relative", height: "100%" }}>
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ position: "absolute", inset: 0, opacity: 0.8 }}
            >
              <line
                x1="50"
                y1="6"
                x2="50"
                y2="94"
                stroke={palette.text_secondary}
                strokeWidth="0.3"
                strokeDasharray="1,1.2"
              />
              <line
                x1="8"
                y1="50"
                x2="92"
                y2="50"
                stroke={palette.text_secondary}
                strokeWidth="0.3"
                strokeDasharray="1,1.2"
              />
            </svg>
            {!isMobile && (
              <>
                <div
                  style={{
                    position: "absolute",
                    top: "10%",
                    left: "12%",
                    fontSize: "12px",
                    color: palette.text_secondary,
                    letterSpacing: "0.4px",
                  }}
                >
                  K
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: "10%",
                    right: "12%",
                    fontSize: "12px",
                    color: palette.text_secondary,
                    letterSpacing: "0.4px",
                  }}
                >
                  B
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: "10%",
                    left: "12%",
                    fontSize: "12px",
                    color: palette.text_secondary,
                    letterSpacing: "0.4px",
                  }}
                >
                  S
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: "10%",
                    right: "12%",
                    fontSize: "12px",
                    color: palette.text_secondary,
                    letterSpacing: "0.4px",
                  }}
                >
                  H
                </div>
              </>
            )}
            {isMobile && (
              <>
                <div
                  style={{
                    position: "absolute",
                    top: "12%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: "12px",
                    color: palette.text_secondary,
                    letterSpacing: "0.4px",
                  }}
                >
                  Tap + Hold
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: "12%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: "12px",
                    color: palette.text_secondary,
                    letterSpacing: "0.4px",
                  }}
                >
                  Slide to Switch
                </div>
              </>
            )}
          </div>
        </div>
      )}
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
      <Sketch
        preload={preload}
        setup={setup}
        draw={draw}
        windowResized={windowResized}
      />
      {isMobile && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              bottom: 0,
              width: "2px",
              background: palette.text_secondary,
              opacity: 0.8,
              transform: "translateX(-1px)",
            }}
          />
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: "2px",
              background: palette.text_secondary,
              opacity: 0.8,
              transform: "translateY(-1px)",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DynamicPad;