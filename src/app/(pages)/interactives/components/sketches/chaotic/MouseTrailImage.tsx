"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import particleImage from "@/assets/interactives/design/stars.png";

const Sketch = dynamic(() => import("react-p5"), {
  ssr: false,
});

const MouseTrailImage: React.FC = () => {
  const [particles, setParticles] = useState<any[]>([]);
  const [particleImg, setParticleImg] = useState<any>(null);

  let prevMouseX = 0;
  let prevMouseY = 0;

  const setup = (p5: any, canvasParentRef: any) => {
    const canvas = p5
      .createCanvas(window.innerWidth, window.innerHeight)
      .parent(canvasParentRef);

    p5.angleMode(p5.DEGREES);
    p5.rectMode(p5.CENTER);

    const img = p5.loadImage(particleImage.src, () => {
      setParticleImg(img);
    });

    canvas.elt.addEventListener("mousemove", (e: MouseEvent) => {
      const rect = canvas.elt.getBoundingClientRect();
      p5._mouseX = e.clientX - rect.left;
      p5._mouseY = e.clientY - rect.top;
    });

    const initial: any[] = [];
    for (let i = 0; i < 50; i++) {
      initial.push(new Particle(p5, p5.random(p5.width), p5.random(p5.height), img));
    }
    setParticles(initial);
  };

  const draw = (p5: any) => {
    p5.background(159, 187, 252, 0.678);
    p5.noFill();

    setParticles((prev) => {
      const updated = [...prev];

      for (let i = updated.length - 1; i >= 0; i--) {
        updated[i].update(p5);
        updated[i].display(p5);
        if (updated[i].isDead()) updated.splice(i, 1);
      }

      if (prevMouseX !== p5._mouseX || prevMouseY !== p5._mouseY) {
        if (updated.length < 350 && particleImg) {
          updated.push(new Particle(p5, p5._mouseX, p5._mouseY, particleImg));
        }
        prevMouseX = p5._mouseX;
        prevMouseY = p5._mouseY;
      }

      return updated;
    });
  };

  class Particle {
    position: any;
    velocity: any;
    acceleration: any;
    particleImg: any;
    radius: number;
    alpha: number;
    lifespan: number;
    maxSpeed: number;
    maxForce: number;

    constructor(p5: any, x: number, y: number, img: any) {
      this.position = p5.createVector(x, y);
      this.velocity = p5.createVector(p5.random(-1, 1), p5.random(-1, 1));
      this.acceleration = p5.createVector();
      this.maxSpeed = 1;
      this.maxForce = 0.05;
      this.particleImg = img;
      this.radius = p5.random(10);
      this.alpha = 255;
      this.lifespan = 30;
    }

    update(p5: any) {
      this.velocity.add(this.acceleration);
      this.velocity.limit(this.maxSpeed);
      this.position.add(this.velocity);
      this.acceleration.mult(0);
      this.alpha -= 105 / this.lifespan;
    }

    display(p5: any) {
      if (!this.particleImg) return;

      const aspectRatio = this.particleImg.width / this.particleImg.height;
      const width = this.radius * 30;
      const height = width / aspectRatio;

      p5.tint(255, this.alpha);
      p5.imageMode(p5.CENTER);
      p5.image(this.particleImg, this.position.x, this.position.y, width, height);
      p5.noTint();
    }

    isDead() {
      return this.alpha <= 0;
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: -1,
      }}
    >
      <Sketch setup={setup} draw={draw} />
    </div>
  );
};

export default MouseTrailImage;
