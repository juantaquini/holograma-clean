"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { FaPlay } from "react-icons/fa";
import styles from "./Calm.module.css";

const Sketch = dynamic(() => import("react-p5"), {
  ssr: false,
});

interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  reachedMouse: boolean;
  angle?: number;
}

const CalmFirst: React.FC = () => {
  const [audioPermission, setAudioPermission] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [mouseInside, setMouseInside] = useState(false);
  const [animationEnded, setAnimationEnded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showButton, setShowButton] = useState(false);
  
  const numParticles = 1700;
  const p5Ref = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const soundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleMouseMove = (event: MouseEvent) => {
      if (event.clientY > window.innerHeight - 100) {
        setShowButton(true);
        clearTimeout(timeout);
        timeout = setTimeout(() => setShowButton(false), 2000);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    soundRef.current = new Audio("/assets/interactives/songs/llanto.wav");
    soundRef.current.loop = false;
    soundRef.current.load();
    soundRef.current.addEventListener("ended", () => setAnimationEnded(true));

    const handleSpaceKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setPaused((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleSpaceKey);

    return () => {
      window.removeEventListener("keydown", handleSpaceKey);
      if (soundRef.current) {
        soundRef.current.pause();
        soundRef.current.currentTime = 0;
      }
    };
  }, []);

  const playAudio = () => {
    if (!audioPlaying && soundRef.current) {
      soundRef.current.play();
      setAudioPlaying(true);
    }
  };

  const stopAudio = () => {
    if (soundRef.current) {
      soundRef.current.pause();
      soundRef.current.currentTime = 0;
      setAudioPlaying(false);
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
        .catch((error) => {
          console.error("Error playing audio:", error);
        });
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

    canvas.mouseOver(() => setMouseInside(true));
    canvas.mouseOut(() => setMouseInside(false));

    const newParticles: Particle[] = [];
    for (let i = 0; i < numParticles; i++) {
      newParticles.push({
        x: p5.random(p5.width),
        y: p5.random(p5.height),
        size: p5.random(0.1, 2),
        opacity: p5.random(150, 255),
        speed: p5.random(2, 4),
        reachedMouse: false,
      });
    }
    setParticles(newParticles);
  };

  const draw = (p5: any) => {
    if (paused) {
      return;
    }

    p5.background(0);

    if (audioPlaying && soundRef.current) {
      const centerX = p5.width / 2;
      const centerY = p5.height / 2;
      const numLines = 500;
      const angleIncrement = p5.TWO_PI / numLines;
      const maxLength = p5.dist(0, 0, centerX, centerY);
      const lineLength =
        (soundRef.current.currentTime / soundRef.current.duration) * maxLength;

      p5.stroke(255, 0, 0);
      p5.strokeWeight(1);
      for (let i = 0; i < numLines; i++) {
        const angle = i * angleIncrement;
        const x = centerX + lineLength * p5.cos(angle);
        const y = centerY + lineLength * p5.sin(angle);
        p5.line(centerX, centerY, x, y);
      }
    }

    for (const particle of particles) {
      if (!particle.reachedMouse && mouseInside) {
        const dx = p5.mouseX - particle.x;
        const dy = p5.mouseY - particle.y;
        const distance = p5.dist(p5.mouseX, p5.mouseY, particle.x, particle.y);

        if (distance < 10) {
          particle.reachedMouse = true;
          particle.speed = p5.random(1, 3);
          particle.angle = p5.random(p5.TWO_PI);
        } else {
          const directionX = dx / distance;
          const directionY = dy / distance;
          particle.x += directionX * particle.speed;
          particle.y += directionY * particle.speed;
        }
      }

      if (particle.reachedMouse && particle.angle !== undefined) {
        particle.x += particle.speed * p5.cos(particle.angle);
        particle.y += particle.speed * p5.sin(particle.angle);
      }

      p5.stroke(255, 0, 0, particle.opacity);
      p5.fill(255, 0, 0, particle.opacity);
      p5.ellipse(particle.x, particle.y, particle.size, particle.size);
    }

    const allParticlesReached = particles.every(
      (particle) => particle.reachedMouse
    );
    if (allParticlesReached && mouseInside) {
      playAudio();
    }

    if (animationEnded) {
      p5.fill(255);
      p5.textSize(22);
      p5.textAlign(p5.CENTER, p5.CENTER);
      p5.textFont("IBM Plex Sans");

      const lines = [
        "CRY",
        "interactive from batidanza - musician based in Buenos Aires.",
        "this experience represents a void and how crying eventually fills the void",
        "turning it into completeness",
      ];

      lines.forEach((line, index) => {
        p5.text(line, p5.width / 2, p5.height / 2 + index * 30);
      });
    }
  };

  const togglePausePlay = () => {
    if (!soundRef.current) return;

    if (paused) {
      soundRef.current.play();
      setAudioPlaying(true);
    } else {
      soundRef.current.pause();
      setAudioPlaying(false);
    }
    setPaused((prev) => !prev);
  };

  const windowResized = (p5: any) => {
    if (document.fullscreenElement) {
      p5.resizeCanvas(window.innerWidth, window.innerHeight);
    } else {
      p5.resizeCanvas(window.innerWidth, window.innerHeight);
    }
  };

  useEffect(() => {
    const handleSpacebar = (event: KeyboardEvent) => {
      if (event.key === " " && soundRef.current) {
        event.preventDefault();
        if (audioPlaying) {
          soundRef.current.pause();
          setAudioPlaying(false);
        } else {
          soundRef.current.play();
          setAudioPlaying(true);
        }
      }
    };

    window.addEventListener("keydown", handleSpacebar);
    return () => {
      window.removeEventListener("keydown", handleSpacebar);
    };
  }, [audioPlaying]);

  return (
    <div ref={containerRef} className={styles["sketch-container"]}>
      <div className={styles["sketch-content"]}>
        {audioPermission ? (
          <Sketch 
            setup={setup} 
            draw={draw} 
            windowResized={windowResized}
          />
        ) : (
          <button
            className={styles["permission-button-red"]}
            onClick={requestAudioPermission}
          >
            <FaPlay />
          </button>
        )}
      </div>
      {showButton && (
        <button
          onClick={togglePausePlay}
          className={styles["permission-button"]}
        >
          {paused ? "Play" : "Pause"}
        </button>
      )}
    </div>
  );
};

export default CalmFirst;
