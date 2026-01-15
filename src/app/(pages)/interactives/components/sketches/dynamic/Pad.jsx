"use client";
import React, { useEffect, useState } from "react";

const mediaPath = (name) => `/assets/interactives/pad/${name}`;

let sound;
let sound1;
let sound2;
let sound3;
let sound4;

let areSoundsStarted = false;
let isSoundOn = false;
let isSound1On = false;
let isSound2On = false;
let isSound3On = false;
let isSound4On = false;
let isGrowing = true;
let isHKeyPressed = false;

let initialCircleRadius = 50;
let circleRadius = 0;
let stars = [];

let suzi;
let suziSize = 100;
let suziAngle = 0;
let suziOffset = 0;

let harm;
let harmSize = 100;
let harmAngle = 0;
let harmOffset = 0;

let goyl;
let goylSize = 100;
let goylAngle = 0;
let goylOffset = 0;

let cubeRotation = 0;

// Estados de animación
let suziPhase = 0;
let harmPhase = 0;
let goylPhase = 0;
let circlePhase = 0;

const KEYS = [66, 75, 83, 72]; // B K S H
let activeTouches = new Map();

const Pad = (props) => {
  const [Sketch, setSketch] = useState(null);
  const [p5SoundLoaded, setP5SoundLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/android|iphone|ipad/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/addons/p5.sound.min.js";
    script.async = true;
    script.onload = () => {
      setP5SoundLoaded(true);
      import("react-p5").then((mod) => {
        setSketch(() => mod.default);
      });
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const preload = (p5) => {
    sound = p5.loadSound(mediaPath("beat.wav"));
    sound1 = p5.loadSound(mediaPath("bass.wav"));
    sound2 = p5.loadSound(mediaPath("chords.wav"));
    sound3 = p5.loadSound(mediaPath("synth.wav"));
    sound4 = p5.loadSound(mediaPath("particlesynth.wav"));
    suzi = p5.loadImage(mediaPath("suzi.jpg"));
    harm = p5.loadImage(mediaPath("harm.jpg"));
    goyl = p5.loadImage(mediaPath("goyl.jpg"));
  };

  const setup = (p5, canvasParentRef) => {
    const canvas = p5.createCanvas(
      isMobile ? p5.windowWidth : 1200,
      isMobile ? p5.windowHeight * 0.75 : 500,
      p5.WEBGL
    ).parent(canvasParentRef);

    if (isMobile) {
      canvas.elt.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.elt.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.elt.addEventListener('touchend', handleTouchEnd, { passive: false });
      canvas.elt.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    }
  };

  const isInsideCanvas = (touch, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX;
    const y = touch.clientY;
    
    return (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    );
  };

  const getQuadrantFromTouch = (touch, canvas) => {
    if (!isInsideCanvas(touch, canvas)) return -1;

    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left - rect.width / 2;
    const y = touch.clientY - rect.top - rect.height / 2;

    if (x < 0 && y < 0) return 0; // top-left -> B
    if (x >= 0 && y < 0) return 1; // top-right -> K
    if (x < 0 && y >= 0) return 2; // bottom-left -> S
    if (x >= 0 && y >= 0) return 3; // bottom-right -> H
    return -1;
  };

  const toggleSound = (index, on) => {
    if (index === 0) {
      if (on && !isSoundOn) {
        sound.loop();
        sound.amp(0);
        sound.amp(1, 0.05);
        isSoundOn = true;
      } else if (!on && isSoundOn) {
        sound.amp(0, 0.05);
        setTimeout(() => sound.stop(), 60);
        isSoundOn = false;
      }
    } else if (index === 1) {
      if (on && !isSound1On) {
        sound1.loop();
        sound1.amp(0);
        sound1.amp(1, 0.05);
        isSound1On = true;
      } else if (!on && isSound1On) {
        sound1.amp(0, 0.05);
        setTimeout(() => sound1.stop(), 60);
        isSound1On = false;
      }
    } else if (index === 2) {
      if (on && !isSound2On) {
        sound2.loop();
        sound2.amp(0);
        sound2.amp(1, 0.05);
        isSound2On = true;
      } else if (!on && isSound2On) {
        sound2.amp(0, 0.05);
        setTimeout(() => sound2.stop(), 60);
        isSound2On = false;
      }
    } else if (index === 3) {
      if (on && !isSound3On) {
        sound3.loop();
        sound3.amp(0);
        sound3.amp(1, 0.05);
        isSound3On = true;
      } else if (!on && isSound3On) {
        sound3.amp(0, 0.05);
        setTimeout(() => sound3.stop(), 60);
        isSound3On = false;
      }
    }
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const canvas = e.target;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      
      if (!isInsideCanvas(touch, canvas)) continue;
      
      const quadrant = getQuadrantFromTouch(touch, canvas);
      
      if (quadrant !== -1) {
        activeTouches.set(touch.identifier, quadrant);
        toggleSound(quadrant, true);
      }
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const canvas = e.target;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const oldQuadrant = activeTouches.get(touch.identifier);
      
      if (!isInsideCanvas(touch, canvas)) {
        if (oldQuadrant !== undefined) {
          toggleSound(oldQuadrant, false);
          activeTouches.delete(touch.identifier);
        }
        continue;
      }

      const newQuadrant = getQuadrantFromTouch(touch, canvas);

      if (oldQuadrant !== undefined && oldQuadrant !== newQuadrant) {
        toggleSound(oldQuadrant, false);
        activeTouches.delete(touch.identifier);

        if (newQuadrant !== -1) {
          activeTouches.set(touch.identifier, newQuadrant);
          toggleSound(newQuadrant, true);
        }
      }
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const quadrant = activeTouches.get(touch.identifier);

      if (quadrant !== undefined) {
        toggleSound(quadrant, false);
        activeTouches.delete(touch.identifier);
      }
    }
  };

  const draw = (p5) => {
    p5.background(255, 0, 0);

    // Desktop: tecla L para todo
    if (!isMobile && p5.keyIsDown(76)) {
      if (!areSoundsStarted) {
        sound.loop();
        sound.amp(0);
        sound.amp(1, 0.05);
        
        sound1.loop();
        sound1.amp(0);
        sound1.amp(1, 0.05);
        
        sound2.loop();
        sound2.amp(0);
        sound2.amp(1, 0.05);
        
        sound3.loop();
        sound3.amp(0);
        sound3.amp(1, 0.05);
        
        areSoundsStarted = true;
        cubeRotation = 0;
      }

      p5.push();
      p5.translate(0, 0, -200);
      p5.rotateX(cubeRotation);
      p5.rotateY(cubeRotation);
      p5.texture(suzi);
      p5.box(90);
      p5.pop();

      cubeRotation += 0.01;
    } else {
      if (areSoundsStarted) {
        sound.amp(0, 0.05);
        sound1.amp(0, 0.05);
        sound2.amp(0, 0.05);
        sound3.amp(0, 0.05);
        setTimeout(() => {
          sound.stop();
          sound1.stop();
          sound2.stop();
          sound3.stop();
        }, 60);
        areSoundsStarted = false;
      }
    }

    // Desktop: teclas individuales
    if (!isMobile) {
      if (p5.keyIsDown(66)) {
        if (!isSoundOn) {
          sound.loop();
          sound.amp(0);
          sound.amp(1, 0.05);
          isSoundOn = true;
        }
      } else if (isSoundOn) {
        sound.amp(0, 0.05);
        setTimeout(() => sound.stop(), 60);
        isSoundOn = false;
      }

      if (p5.keyIsDown(75)) {
        if (!isSound1On) {
          sound1.loop();
          sound1.amp(0);
          sound1.amp(1, 0.05);
          isSound1On = true;
        }
      } else if (isSound1On) {
        sound1.amp(0, 0.05);
        setTimeout(() => sound1.stop(), 60);
        isSound1On = false;
      }

      if (p5.keyIsDown(83)) {
        if (!isSound2On) {
          sound2.loop();
          sound2.amp(0);
          sound2.amp(1, 0.05);
          isSound2On = true;
        }
      } else if (isSound2On) {
        sound2.amp(0, 0.05);
        setTimeout(() => sound2.stop(), 60);
        isSound2On = false;
      }

      if (p5.keyIsDown(72)) {
        if (!isSound3On) {
          sound3.loop();
          sound3.amp(0);
          sound3.amp(1, 0.05);
          isSound3On = true;
        }
      } else if (isSound3On) {
        sound3.amp(0, 0.05);
        setTimeout(() => sound3.stop(), 60);
        isSound3On = false;
      }
    }

    // Visuales: suzi (B / cuadrante 0)
    if (isSoundOn && sound.isPlaying()) {
      p5.push();
      
      if (isMobile) {
        suziPhase += 0.02;
        const alpha = 80 + p5.sin(suziPhase) * 80;
        p5.tint(255, alpha);
        
        const x = -p5.width / 4;
        const y = -p5.height / 4;
        p5.translate(x, y);
        
        const scale = Math.max(p5.width / suzi.width, p5.height / suzi.height) * 0.6;
        p5.image(suzi, -suzi.width * scale / 2, -suzi.height * scale / 2, suzi.width * scale, suzi.height * scale);
      } else {
        const scaleValue = p5.sin(suziAngle);
        suziSize = p5.map(scaleValue, -1, 1, 50, 900);
        suziAngle += 0.5;
        p5.translate(p5.width / -50, p5.height / 24, -700);
        p5.image(suzi, -suziSize / 2, -suziSize / 2 + suziOffset, suziSize, suziSize);
      }
      
      p5.pop();
    }

    // Visuales: harm (K / cuadrante 1)
    if (isSound1On && sound1.isPlaying()) {
      p5.push();
      
      if (isMobile) {
        harmPhase += 0.02;
        const alpha = 80 + p5.sin(harmPhase) * 80;
        p5.tint(255, alpha);
        
        const x = p5.width / 4;
        const y = -p5.height / 4;
        p5.translate(x, y);
        
        const scale = Math.max(p5.width / harm.width, p5.height / harm.height) * 0.6;
        p5.image(harm, -harm.width * scale / 2, -harm.height * scale / 2, harm.width * scale, harm.height * scale);
      } else {
        const scaleValue = p5.sin(harmAngle);
        harmSize = p5.map(scaleValue, -1, 1, 50, 900);
        harmAngle += 0.5;
        const harmXPos = (p5.width * 1.5) / 1.6;
        p5.translate(harmXPos, p5.height / 8, -700);
        p5.image(harm, -harmSize / 2, -harmSize / 2 + harmOffset, harmSize, harmSize);
      }
      
      p5.pop();
    }

    // Visuales: goyl (S / cuadrante 2)
    if (isSound2On && sound2.isPlaying()) {
      p5.push();
      
      if (isMobile) {
        goylPhase += 0.02;
        const alpha = 80 + p5.sin(goylPhase) * 80;
        p5.tint(255, alpha);
        
        const x = -p5.width / 4;
        const y = p5.height / 4;
        p5.translate(x, y);
        
        const scale = Math.max(p5.width / goyl.width, p5.height / goyl.height) * 0.6;
        p5.image(goyl, -goyl.width * scale / 2, -goyl.height * scale / 2, goyl.width * scale, goyl.height * scale);
      } else {
        const scaleValue = p5.sin(goylAngle);
        goylSize = p5.map(scaleValue, -1, 1, 50, 900);
        goylAngle += 0.5;
        p5.translate(p5.width / -1, p5.height / 8, -700);
        p5.image(goyl, -goylSize / 2, -goylSize / 2 + goylOffset, goylSize, goylSize);
      }
      
      p5.pop();
    }

    // Círculo para H (cuadrante 3)
    if (!isMobile && p5.keyIsDown(72) && !isHKeyPressed) {
      isHKeyPressed = true;
      circleRadius = initialCircleRadius;
    } else if (!isMobile && !p5.keyIsDown(72) && isHKeyPressed) {
      isHKeyPressed = false;
    }

    if ((isMobile && isSound3On) || (!isMobile && isHKeyPressed)) {
      p5.push();
      
      if (isMobile) {
        circlePhase += 0.05;
        const size = 50 + p5.sin(circlePhase) * 100;
        
        const x = p5.width / 4;
        const y = p5.height / 4;
        p5.translate(x, y);
        
        p5.fill(350, 4, 309);
        p5.ellipse(0, 0, size, size);
      } else {
        p5.fill(350, 4, 309);
        const centerX = p5.width / -60;
        const centerY = p5.height / 60;
        p5.ellipse(centerX, centerY, circleRadius, circleRadius);

        if (isGrowing) {
          circleRadius += 10;
          if (circleRadius > 200) {
            circleRadius = 200;
            isGrowing = false;
          }
        } else {
          circleRadius -= 5;
          if (circleRadius < 5) {
            circleRadius = 5;
            isGrowing = true;
          }
        }
      }
      
      p5.pop();
    }

    // Desktop: R key - estrellas
    if (!isMobile) {
      if (p5.keyIsDown(82) && !isSound4On) {
        sound4.loop();
        sound4.amp(0);
        sound4.amp(1, 0.05);
        isSound4On = true;
      } else if (!p5.keyIsDown(82) && isSound4On) {
        sound4.amp(0, 0.05);
        setTimeout(() => sound4.stop(), 60);
        isSound4On = false;
        stars = [];
      }

      for (let i = 0; i < stars.length; i++) {
        drawStar(p5, stars[i].x, stars[i].y, stars[i].radius);
      }

      if (p5.keyIsPressed && p5.keyIsDown(82)) {
        stars.push({
          x: p5.random(-p5.width / 2, p5.width / 2),
          y: p5.random(-p5.height / 2, p5.height / 2),
          radius: 5,
          growing: true,
        });

        for (let i = 0; i < stars.length; i++) {
          if (stars[i].growing) {
            stars[i].radius += 2;
            if (stars[i].radius > 30) {
              stars[i].growing = false;
            }
          } else {
            stars[i].radius -= 1;
            if (stars[i].radius < 5) {
              stars[i].growing = true;
            }
          }
        }
      }
    }

    // Cruz divisoria en mobile
    if (isMobile) {
      p5.push();
      p5.stroke(255, 255, 255);
      p5.strokeWeight(2);
      
      // Línea vertical
      p5.line(0, -p5.height / 2, 0, p5.height / 2);
      
      // Línea horizontal
      p5.line(-p5.width / 2, 0, p5.width / 2, 0);
      
      p5.pop();
    }
  };

  if (!Sketch || !p5SoundLoaded) {
    return <div>Loading audio library...</div>;
  }

  return (
    <div 
      style={{ 
        width: "100%", 
        height: "100vh", 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "center", 
        alignItems: "center",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        WebkitTapHighlightColor: "transparent",
        touchAction: "none",
      }}
    >
      {!isMobile && (
        <span>
          Press and hold L to play all sounds together. Press K, B, S, H, R for
          individual sounds and visuals.
        </span>
      )}
      <style jsx global>{`
        canvas {
          user-select: none !important;
          -webkit-user-select: none !important;
          -webkit-touch-callout: none !important;
          -webkit-tap-highlight-color: transparent !important;
          touch-action: none !important;
          display: block;
          outline: none;
        }
      `}</style>
      <Sketch setup={setup} draw={draw} preload={preload} />
    </div>
  );
};

function drawStar(p5, x, y, radius) {
  p5.fill(280, 20, 50);
  p5.beginShape();
  for (let i = 0; i < 5; i++) {
    let angle = (p5.TWO_PI * i) / 8 - p5.HALF_PI;
    let x1 = x * p5.cos(angle) * radius;
    let y1 = y * p5.sin(angle) * radius;
    p5.vertex(x1, y1);
    angle += p5.TWO_PI / 10;
    let x2 = x / p5.cos(angle) / radius / 2;
    let y2 = y / p5.sin(angle) / radius / 2;
    p5.vertex(x2, y2);
  }
  p5.endShape(p5.CLOSE);
}

export default Pad;