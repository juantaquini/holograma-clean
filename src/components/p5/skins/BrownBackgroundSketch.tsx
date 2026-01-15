"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import type p5Types from "p5";

interface GridPoint {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
}

const Sketch = dynamic(() => import("react-p5").then((mod) => mod.default), {
  ssr: false,
}) as any;

export default function BrownBackgroundSketch() {
  const gridPointsRef = useRef<GridPoint[]>([]);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initGridPoints = (p5: p5Types) => {
    const points: GridPoint[] = [];
    const spacing = 40;
    
    for (let x = 0; x <= p5.width; x += spacing) {
      for (let y = 0; y <= p5.height; y += spacing) {
        points.push({
          x,
          y,
          baseX: x,
          baseY: y,
          size: p5.random(1, 3),
        });
      }
    }
    
    gridPointsRef.current = points;
  };

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

    p5.frameRate(30);
    initGridPoints(p5);
  };

  const getBackgroundColor = (): [number, number, number] => {
    return [45, 30, 20];
  };

  const draw = (p5: p5Types) => {
    const bgColor = getBackgroundColor();
    p5.background(bgColor);
    drawGridEffect(p5);
  };

  const drawGridEffect = (p5: p5Types) => {
    const points = gridPointsRef.current;
    const ctx = p5.drawingContext as CanvasRenderingContext2D;

    ctx.setLineDash([]);
    
    points.forEach((point, i) => {
      p5.noStroke();
      p5.fill(245, 245, 245, 100);
      p5.ellipse(point.x, point.y, point.size);

      for (let j = i + 1; j < points.length; j++) {
        const other = points[j];
        const d = p5.dist(point.x, point.y, other.x, other.y);

        if (d < 100) {
          p5.stroke(245, 245, 245, 30 * (1 - d / 100));
          p5.line(point.x, point.y, other.x, other.y);
        }
      }
    });

    p5.push();
    p5.stroke(245, 245, 245, 20);
    ctx.setLineDash([2, 8]);

    const gridSpacing = 20;
    
    for (let x = 0; x < p5.width; x += gridSpacing) {
      p5.line(x, 0, x, p5.height);
    }
    
    for (let y = 0; y < p5.height; y += gridSpacing) {
      p5.line(0, y, p5.width, y);
    }
    
    p5.pop();
  };

  const windowResized = (p5: p5Types) => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    
    resizeTimeoutRef.current = setTimeout(() => {
      p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
      initGridPoints(p5);
    }, 100);
  };

  return (
    <Sketch 
      setup={setup} 
      draw={draw} 
      windowResized={windowResized}
    />
  );
}