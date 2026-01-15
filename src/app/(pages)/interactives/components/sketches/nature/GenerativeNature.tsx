"use client";

import dynamic from "next/dynamic";
import type p5Types from "p5";

const Sketch = dynamic(() => import("react-p5").then(m => m.default), {
  ssr: false,
});

export default function RedLiquidHD() {
  let t = 0;
  let pg: p5Types.Graphics;

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    const canvas = p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);
    canvas.style("position", "fixed");
    canvas.style("top", "0");
    canvas.style("left", "0");
    canvas.style("width", "100vw");
    canvas.style("height", "100vh");
    canvas.style("z-index", "-1");
    canvas.style("display", "block");
    canvas.style("pointer-events", "none");

    p5.pixelDensity(1);
    p5.noStroke();
    p5.colorMode(p5.RGB);

    pg = p5.createGraphics(p5.width / 2, p5.height / 2);
    pg.pixelDensity(1);
  };

  const draw = (p5: p5Types) => {
    t += 0.003;

    const w = pg.width;
    const h = pg.height;

    pg.loadPixels();

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const nx = x * 0.01 + Math.sin(t) * 0.5;
        const ny = y * 0.01 + Math.cos(t * 0.3) * 0.5;
        const n = p5.noise(nx, ny, t);

        const wave = Math.sin(n * 6 + t * 2);
        const red = 150 + wave * 80;
        const green = wave * 30;
        const blue = wave * 20;

        const index = (y * w + x) * 4;
        pg.pixels[index] = red;
        pg.pixels[index + 1] = green;
        pg.pixels[index + 2] = blue;
        pg.pixels[index + 3] = 255;
      }
    }

    pg.updatePixels();

    p5.image(pg, 0, 0, p5.width, p5.height);
  };

  const windowResized = (p5: p5Types) => {
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
    pg = p5.createGraphics(p5.width / 2, p5.height / 2);
    pg.pixelDensity(1);
  };

return <Sketch setup={setup as any} draw={draw as any} windowResized={windowResized as any} />;
}
