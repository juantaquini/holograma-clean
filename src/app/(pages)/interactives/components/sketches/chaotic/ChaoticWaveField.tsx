"use client";

import dynamic from "next/dynamic";
import React, { useRef } from "react";



const Sketch = dynamic(() => import("react-p5"), {
  ssr: false,
});

export default function BlueStormMountains() {
  const canvasRef = useRef<HTMLDivElement | null>(null);

  let time = 0;
  let fadeProgress = 0;
  let slowMo = true;
  let hidden = false;
  let baseYPos = 0;

  const setup = (p5: any, canvasParentRef: any) => {
    p5.createCanvas(window.innerWidth, window.innerHeight).parent(
      canvasParentRef
    );

    p5.frameRate(60);
    p5.noiseDetail(8, 0.5);

    baseYPos = p5.height * 0.65;

    p5.mousePressed = () => {
      hidden = !hidden;
    };


  };




  const draw = (p5: any) => {
    p5.noStroke();
    p5.fill(15, 20, 40, 28);
    p5.rect(0, 0, p5.width, p5.height);



    const layers = 2;
    const step = 2;
    baseYPos = p5.lerp(baseYPos, p5.map(p5.mouseY, 0, p5.height, p5.height * 0.45, p5.height * 0.70), 0.08);
    const baseY = baseYPos;

    if (hidden) {
      time += slowMo ? 0.0003 : 0.0015;
      return;
    }

    for (let i = 0; i < layers; i++) {
      const alpha = 180 * (1 - fadeProgress);

      p5.stroke(
        60 + p5.noise(i * 0.3 + time) * 50,
        150 + p5.noise(time * 0.5 + i) * 30,
        255,
        alpha
      );

      p5.strokeWeight(1.6 + p5.noise(i * 0.2 + time) * 1.6);
      p5.noFill();
      p5.strokeJoin(p5.ROUND);
      p5.strokeCap(p5.ROUND);
      p5.beginShape();

      const mousePhase = p5.mouseX / 0.003;
      for (let x = 0; x <= p5.width;) {
        const phaseX = x * 0.004 + mousePhase * 0.6;
        const baseN = p5.noise(phaseX, time * 0.12 + i * 0.2);
        const detailN = p5.noise(x * 0.02 + i, time * 0.9);

        const swell = Math.sin(phaseX + baseN * 3.0);
        const ridge = Math.pow(Math.max(0, swell), 2.6) * p5.height * 0.30;
        const fbm = baseN * 0.6 + detailN * 0.4;

        let y = baseY - ridge * (0.9 + i * 0.03) - fbm * p5.height * 0.06 + i * 8;

        const jitter = (p5.noise(x * 0.19 + i, time * 1.1) - 0.5) * p5.height * 0.012;
        y += jitter;

        p5.curveVertex(x, y);

        const dxVar = step + (p5.noise(x * 0.03 + i, time * 0.4) - 0.5) * 2 + p5.random(-0.5, 0.5);
        x += Math.max(1, dxVar);
      }

      p5.endShape();
    }

    time += slowMo ? 0.0003 : 0.0015;
  };

  return (
    <div
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
      }}
    >
      <Sketch setup={setup} draw={draw} />
    </div>
  );
}
