"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useColorTheme } from "@/app/(providers)/color-theme-provider";
import { colorPalettes } from "@/lib/color-palettes";

const Sketch = dynamic(() => import("react-p5"), {
  ssr: false,
});

const SketchComponent: React.FC = () => {
  const [x, setX] = useState(3);
  const [y, setY] = useState(3);
  const [dragging, setDragging] = useState(false);

  const { theme } = useColorTheme();
  const selectedColors = colorPalettes[theme]?.colors || ["#000000"];
  const strokeColor = selectedColors[0];

  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if (dragging) {
        e.preventDefault();
      }
    };

    window.addEventListener("touchmove", preventDefault, { passive: false });

    return () => {
      window.removeEventListener("touchmove", preventDefault);
    };
  }, [dragging]);

  const setup = (p5: any, canvasParentRef: Element) => {
    const canvas = p5.createCanvas(window.innerWidth, window.innerHeight);
    canvas.parent(canvasParentRef);

    const canvasElement = canvas.elt as HTMLCanvasElement;
    canvasElement.style.position = "fixed";
    canvasElement.style.top = "0";
    canvasElement.style.left = "0";
    canvasElement.style.zIndex = "-2";
    canvasElement.style.backgroundColor = "rgba(245, 245, 245, 0.1)";
    
    p5.clear();
    p5.angleMode(p5.DEGREES);
    p5.rectMode(p5.CENTER);
  };

  const draw = (p5: any) => {
    p5.clear();
    p5.noFill();

    p5.translate(p5.width / 2, p5.height / 2);

    const r = parseInt(strokeColor.slice(1, 3), 16);
    const g = parseInt(strokeColor.slice(3, 5), 16);
    const b = parseInt(strokeColor.slice(5, 7), 16);

    for (let i = 0; i < 85; i++) {
      p5.push();
      p5.rotate(p5.sin(p5.frameCount + i) * 1200);
      p5.stroke(r, g, b);
      p5.circle(x, y, 250 - i * 3, 250 - i / 3, 250 - i);
      p5.pop();
    }
  };

  const mousePressed = (p5: any) => {
    const distance = p5.dist(p5.width / 2, p5.height / 2, p5.mouseX, p5.mouseY);
    if (distance < 250) {
      setDragging(true);
    }
  };

  const mouseReleased = () => {
    setDragging(false);
  };

  const mouseDragged = (p5: any) => {
    if (dragging) {
      setX(p5.mouseX - p5.width / 2);
      setY(p5.mouseY - p5.height / 2);
    }
  };

  return (
    <div
      style={{
        zIndex: 10000,
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(245, 245, 245, 0.6)",
      }}
    >
      <Sketch
        setup={setup}
        draw={draw}
        mousePressed={mousePressed}
        mouseReleased={mouseReleased}
        mouseDragged={mouseDragged}
      />
    </div>
  );
};

export default SketchComponent;