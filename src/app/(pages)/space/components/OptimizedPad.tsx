"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import styles from "./OptimizedPad.module.css";

interface Pad {
  id: string;
  title: string;
  audio_url?: string;        // legacy single audio
  audio_urls?: string[];     // nuevo array de audios
  images?: string[];
  videos?: string[];
  config?: any;
}

interface Props {
  pad: Pad;
}

const KEYS = [75, 66, 83, 72]; // K B S H

const OptimizedPad: React.FC<Props> = ({ pad }) => {
  const [Sketch, setSketch] = useState<any>(null);
  const [p5SoundLoaded, setP5SoundLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const sounds = useRef<any[]>([]);
  const soundOn = useRef<boolean[]>([]);
  const imgs = useRef<any[]>([]);
  const vids = useRef<any[]>([]);
  const alphaPhase = useRef<number[]>([0, 1, 2, 3]);
  const activeTouches = useRef<Map<number, number>>(new Map());
  const canvasRef = useRef<any>(null);
  const fadeTimeouts = useRef<any[]>([]);

  // Mapear legacy audio_url a array
  const audioList = pad.audio_urls || (pad.audio_url ? [pad.audio_url] : []);

  // Cargar p5.sound y react-p5
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/addons/p5.sound.min.js";
    script.async = true;
    script.onload = () => {
      setP5SoundLoaded(true);
      import("react-p5").then((mod) => setSketch(() => mod.default));
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
      fadeTimeouts.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    setIsMobile(/android|iphone|ipad/i.test(navigator.userAgent));
  }, []);

  const looped = <T,>(arr: T[], i: number) => (arr.length ? arr[i % arr.length] : null);

  const toggle = (i: number, on: boolean) => {
    const s = sounds.current[i];
    if (!s) return;

    if (fadeTimeouts.current[i]) {
      clearTimeout(fadeTimeouts.current[i]);
      fadeTimeouts.current[i] = null;
    }

    if (on && !soundOn.current[i]) {
      s.loop();
      s.amp(0);
      s.amp(1, 0.05);
      const vid = looped(vids.current, i);
      if (vid && vid.elt.paused) vid.loop();
      soundOn.current[i] = true;
    }

    if (!on && soundOn.current[i]) {
      s.amp(0, 0.05);
      fadeTimeouts.current[i] = setTimeout(() => {
        s.stop();
        fadeTimeouts.current[i] = null;
      }, 60);
      soundOn.current[i] = false;
    }
  };

  const isInsideCanvas = (touch: Touch, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return touch.clientX >= rect.left && touch.clientX <= rect.right &&
           touch.clientY >= rect.top && touch.clientY <= rect.bottom;
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
    const canvas = e.target as HTMLCanvasElement;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (!isInsideCanvas(touch, canvas)) continue;
      const q = getQuadrantFromTouch(touch, canvas);
      if (q !== -1) {
        activeTouches.current.set(touch.identifier, q);
        toggle(q, true);
      }
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    const canvas = e.target as HTMLCanvasElement;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const oldQ = activeTouches.current.get(touch.identifier);
      const newQ = getQuadrantFromTouch(touch, canvas);
      if (oldQ !== undefined && oldQ !== newQ) {
        toggle(oldQ, false);
        activeTouches.current.delete(touch.identifier);
        if (newQ !== -1) {
          activeTouches.current.set(touch.identifier, newQ);
          toggle(newQ, true);
        }
      }
      if (newQ === -1 && oldQ !== undefined) {
        toggle(oldQ, false);
        activeTouches.current.delete(touch.identifier);
      }
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const q = activeTouches.current.get(touch.identifier);
      if (q !== undefined) {
        toggle(q, false);
        activeTouches.current.delete(touch.identifier);
      }
    }
  };

  const preload = (p5: any) => {
    audioList.slice(0, 4).forEach((src, i) => {
      sounds.current[i] = p5.loadSound(src);
      soundOn.current[i] = false;
    });

    (pad.images || []).forEach((src, i) => {
      imgs.current[i] = p5.loadImage(src);
    });

    (pad.videos || []).forEach((src, i) => {
      const v = p5.createVideo(src);
      v.hide();
      v.volume(0);
      v.elt.muted = true;
      v.loop();
      vids.current[i] = v;
    });
  };

  const setup = (p5: any, parent: Element) => {
    const canvas = p5.createCanvas(p5.windowWidth, p5.windowHeight * 0.75).parent(parent);
    canvasRef.current = canvas.elt;

    if (isMobile) {
      canvas.elt.addEventListener("touchstart", handleTouchStart, { passive: false });
      canvas.elt.addEventListener("touchmove", handleTouchMove, { passive: false });
      canvas.elt.addEventListener("touchend", handleTouchEnd, { passive: false });
      canvas.elt.addEventListener("touchcancel", handleTouchEnd, { passive: false });
    }
  };

  const draw = (p5: any) => {
    p5.background(20);
    if (!isMobile) KEYS.forEach((k, i) => toggle(i, p5.keyIsDown(k)));

    for (let i = 0; i < 4; i++) {
      const hasSound = soundOn.current[i];
      const x = (i % 2 === 0 ? -1 : 1) * (p5.width / 4);
      const y = (i < 2 ? -1 : 1) * (p5.height / 4);
      p5.push();
      p5.translate(x, y);
      const img = looped(imgs.current, i);
      if (hasSound && img) {
        const scale = Math.max(p5.width / img.width, p5.height / img.height) * 0.3;
        alphaPhase.current[i] += 0.02;
        const alpha = 80 + Math.sin(alphaPhase.current[i]) * 80;
        p5.tint(255, alpha);
        p5.image(img, -img.width * scale / 2, -img.height * scale / 2, img.width * scale, img.height * scale);
      }
      p5.pop();
    }

    if (isMobile) {
      p5.push();
      p5.stroke(255, 255, 255, 100);
      p5.strokeWeight(2);
      p5.line(0, -p5.height / 2, 0, p5.height / 2);
      p5.line(-p5.width / 2, 0, p5.width / 2, 0);
      p5.pop();
    }
  };

  if (!Sketch || !p5SoundLoaded) return <div className={styles.loading}>Cargando audio...</div>;

  return (
    <div className={styles.wrapper}>
      <Sketch preload={preload} setup={setup} draw={draw} />
    </div>
  );
};

export default OptimizedPad;
