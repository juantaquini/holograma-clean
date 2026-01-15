"use client";

import dynamic from "next/dynamic";
import type p5Types from "p5";

const Sketch = dynamic(() => import("react-p5").then((mod) => mod.default), {
  ssr: false,
}) as any;

export default function ElegantTiePattern() {
  const backgroundColor: [number, number, number] = [13, 25, 48]; 
  const lineColor: [number, number, number] = [120, 40, 30]; 
  const spacing = 70;
  const lineWeight = 1.8; 

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    const canvas = p5
      .createCanvas(p5.windowWidth, p5.windowHeight)
      .parent(canvasParentRef);

    const canvasElement = canvas.elt as HTMLCanvasElement;
    canvasElement.style.display = "block";
    canvasElement.style.position = "fixed";
    canvasElement.style.top = "0";
    canvasElement.style.left = "0";
    canvasElement.style.zIndex = "-100000";
    canvasElement.style.width = "100%";
    canvasElement.style.height = "100%";
    
    p5.noLoop();
  };

  const draw = (p5: p5Types) => {
    p5.background(...backgroundColor);

    p5.strokeWeight(lineWeight);
    p5.stroke(...lineColor, 200);

    for (let x = 0; x <= p5.width; x += spacing) {
      p5.line(x, 0, x, p5.height);
    }
    for (let y = 0; y <= p5.height; y += spacing) {
      p5.line(0, y, p5.width, y);
    }

    p5.stroke(...lineColor, 100);
    p5.strokeWeight(1);
    for (let x = 0; x <= p5.width; x += spacing) {
      p5.line(x + spacing / 3.5, 0, x + spacing / 3.5, p5.height);
    }
    for (let y = 0; y <= p5.height; y += spacing) {
      p5.line(0, y + spacing / 3.5, p5.width, y + spacing / 3.5);
    }
  };

  const windowResized = (p5: p5Types) => {
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
    p5.redraw();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        zIndex: -100000,
        pointerEvents: "none",
      }}
    >
      <Sketch setup={setup} draw={draw} windowResized={windowResized} />
    </div>
  );
}