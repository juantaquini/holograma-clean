"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { FaPlay } from "react-icons/fa";
import { useColorTheme } from "@/app/(providers)/color-theme-provider";
import { colorPalettes } from "@/lib/color-palettes";
import styles from "./Calm.module.css";

const Sketch = dynamic(() => import("react-p5"), {
  ssr: false,
});

type StarType = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  update: () => void;
  show: (p5: any) => void;
};

const makeStar = (x: number, y: number): StarType => {
  const vx = (Math.random() - 0.5) * 2;
  const vy = (Math.random() - 0.5) * 2;
  const size = Math.random() * 2 + 0.5;
  return {
    x,
    y,
    vx,
    vy,
    size,
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.size = Math.max(0.2, this.size * 0.995);
    },
    show(p5: any) {
      p5.noStroke();
      p5.fill(255, 255, 255, 200);
      p5.circle(this.x, this.y, this.size);
    },
  };
};

const CalmSecond: React.FC = () => {
  const [audioPermission, setAudioPermission] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [stars, setStars] = useState<StarType[]>([]);
  const p5Ref = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const soundRef = useRef<HTMLAudioElement | null>(null);

  const { theme } = useColorTheme();
  const currentPalette = colorPalettes[theme];

  useEffect(() => {
    soundRef.current = new Audio("/assets/interactives/songs/llanto.wav");
    soundRef.current.loop = true;
    soundRef.current.load();
  }, []);

  const playAudio = () => {
    if (!audioPlaying && soundRef.current) {
      soundRef.current.play();
      setAudioPlaying(true);
      setCursorVisible(false);
    }
  };

  const stopAudio = () => {
    if (soundRef.current) {
      soundRef.current.pause();
      setAudioPlaying(false);
      setCursorVisible(true);
    }
  };

  const requestAudioPermission = () => {
    if (soundRef.current && !audioPermission) {
      soundRef.current
        .play()
        .then(() => {
          setAudioPermission(true);
          stopAudio();
        })
        .catch(() => {});
    }
  };

  const setup = (p5: any, canvasParentRef: Element) => {
    const canvas = p5.createCanvas(window.innerWidth, window.innerHeight);
    canvas.parent(canvasParentRef);
    p5.frameRate(60);
    p5Ref.current = p5;

    const canvasElement = canvas.elt as HTMLCanvasElement;
    canvasElement.style.position = "fixed";
    canvasElement.style.top = "0";
    canvasElement.style.left = "0";
    canvasElement.style.zIndex = "2";
    canvasElement.style.display = "block";

    p5.noCursor();
  };

  const draw = (p5: any) => {
    const bgHex = currentPalette?.lighter_bg || "#000000";
    const r = parseInt(bgHex.slice(1, 3), 16);
    const g = parseInt(bgHex.slice(3, 5), 16);
    const b = parseInt(bgHex.slice(5, 7), 16);
    p5.background(r, g, b, 150);

    for (const star of stars) {
      star.update();
      star.show(p5);
    }

    if (!audioPlaying) {
      p5.stroke(255);
      p5.strokeWeight(1);
      p5.line(p5.width / 2, p5.height / 2, p5.mouseX, p5.mouseY);

      if (p5.frameCount % 5 === 0) {
        const newStar = makeStar(p5.mouseX, p5.mouseY);
        setStars((prev) => [...prev, newStar]);
      }
    }

    if (audioPlaying || !cursorVisible) {
      const centerX = p5.width / 2;
      const centerY = p5.height / 2;
      const numLines = 1500;
      const angleIncrement = p5.TWO_PI / numLines;
      const maxLength = p5.dist(0, 0, centerX, centerY);
      const lineLength =
        soundRef.current && soundRef.current.duration
          ? (soundRef.current.currentTime / soundRef.current.duration) * maxLength
          : maxLength * 0.25;

      for (let i = 0; i < numLines; i++) {
        const angle = i * angleIncrement;
        const x = centerX + lineLength * p5.cos(angle);
        const y = centerY + lineLength * p5.sin(angle);
        p5.stroke(125, 4, 130, 5);
        p5.strokeWeight(p5.random(1, 3));
        p5.line(centerX, centerY, x, y);
      }
    }

    const distToCenter = p5.dist(p5.width / 2, p5.height / 2, p5.mouseX, p5.mouseY);
    if (!audioPlaying && distToCenter < 50) {
      playAudio();
    } else if (audioPlaying && distToCenter >= 50) {
      stopAudio();
    }
  };

  const windowResized = (p5: any) => {
    if (document.fullscreenElement) {
      p5.resizeCanvas(window.innerWidth, window.innerHeight);
    } else {
      p5.resizeCanvas(window.innerWidth, window.innerHeight);
    }
  };

  return (
    <div ref={containerRef} className={styles["sketch-container"]}>
      <div className={styles["sketch-content"]}>
        {audioPermission ? (
          <Sketch setup={setup} draw={draw} windowResized={windowResized} />
        ) : (
          <button
            className={styles["permission-button-red"]}
            onClick={requestAudioPermission}
          >
            <FaPlay />
          </button>
        )}
      </div>
    </div>
  );
};

export default CalmSecond;
