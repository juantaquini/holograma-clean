"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const Sketch = dynamic(() => import("react-p5"), {
  ssr: false,
});

export default function GreenSpin() {
  const [x, setX] = useState(3);
  const [y, setY] = useState(3);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if (dragging) e.preventDefault();
    };

    const opts: AddEventListenerOptions & EventListenerOptions = {
      passive: false,
    };

    window.addEventListener("touchmove", preventDefault, opts);

    return () => {
      window.removeEventListener("touchmove", preventDefault, opts);
    };
  }, [dragging]);

  const setup = (p5: any, canvasParentRef: any) => {
    const canvas = p5
      .createCanvas(window.innerWidth, window.innerHeight)
      .parent(canvasParentRef);

    canvas.style("position", "fixed");
    canvas.style("top", "0");
    canvas.style("left", "0");
    canvas.style("z-index", "2");
    canvas.style("display", "block");

    p5.angleMode(p5.DEGREES);
    p5.rectMode(p5.CENTER);
  };

  const draw = (p5: any) => {
    p5.background(19, 26, 36, 10);
    p5.translate(p5.width / 2, p5.height / 2);

    for (let i = 0; i < 85; i++) {
      p5.push();
      p5.rotate(p5.sin(p5.frameCount + i) * 2200);

      const britishGreen = {
        r: 147,
        g: 197,
        b: 253,
      };

      p5.stroke(britishGreen.r, britishGreen.g, britishGreen.b);

      p5.circle(x, y, 250 - i * 3);

      p5.pop();
    }
  };

  const mousePressed = (p5: any) => {
    const distance = p5.dist(p5.width / 2, p5.height / 2, p5.mouseX, p5.mouseY);
    if (distance < 250) setDragging(true);
  };

  const mouseReleased = () => setDragging(false);

  const mouseDragged = (p5: any) => {
    if (dragging) {
      setX(p5.mouseX - p5.width / 2);
      setY(p5.mouseY - p5.height / 2);
    }
  };

  return (
    <Sketch
      setup={setup}
      draw={draw}
      mousePressed={mousePressed}
      mouseReleased={mouseReleased}
      mouseDragged={mouseDragged}
    />
  );
}
