"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import styles from "./CanvasImageGlow.module.css";
import { TbArrowDownRightCircle, TbTopologyStarRing } from "react-icons/tb";
import { SVGs } from "@/assets/SVGs";
import { useColorTheme } from "@/app/(providers)/color-theme-provider";
import { colorPalettes } from "@/lib/color-palettes";

const Sketch = dynamic(() => import("react-p5"), {
  ssr: false,
});

interface Aureola {
  x: number;
  y: number;
  radius: number;
  growing: boolean;
}

const CanvasImageGlow: React.FC = () => {
  const { theme } = useColorTheme();
  const [aureolaColor, setAureolaColor] = useState(
    colorPalettes[theme]?.text_secondary || "#91A0DC"
  );
  const [userImage, setUserImage] = useState<string | null>(null);
  const [drawUserImage, setDrawUserImage] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [selectedShape, setSelectedShape] = useState<string>("ellipse");
  const [imageSize, setImageSize] = useState(120);
  const [isControlPressed, setIsControlPressed] = useState(false);

  const imgRef = useRef<any>(null);
  const p5Instance = useRef<any>(null);
  const aureolasRef = useRef<Aureola[]>([]);

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAureolaColor(event.target.value);
  };

  const isMobile =
    typeof window !== "undefined" ? window.innerWidth < 768 : false;

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setShowInstructions(false);
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserImage(e.target?.result as string);
        setDrawUserImage(true);
        imgRef.current = null;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSizeChangeButton = (newSize: number) => {
    setIsControlPressed(true);
    setImageSize(newSize);
    setTimeout(() => setIsControlPressed(false), 0);
  };

  const mousePressed = (p5: any) => {
    if (isControlPressed) return;

    if (drawUserImage && userImage && imgRef.current?.user) {
      const img = imgRef.current.user;
      let imgWidth = img.width;
      let imgHeight = img.height;

      const maxImageSize = imageSize * 2;
      const scaleFactor = Math.min(
        maxImageSize / imgWidth,
        maxImageSize / imgHeight
      );

      const scaledWidth = imgWidth * scaleFactor;
      const scaledHeight = imgHeight * scaleFactor;

      const mouseX = p5.mouseX;
      const mouseY = p5.mouseY;

      p5.image(
        img,
        mouseX - scaledWidth / 2,
        mouseY - scaledHeight / 2,
        scaledWidth,
        scaledHeight
      );

      aureolasRef.current.push({
        x: mouseX,
        y: mouseY,
        radius: 0,
        growing: true,
      });
    }
  };

  const mouseReleased = () => {
    aureolasRef.current.forEach((aureola) => {
      aureola.growing = false;
    });
  };

  useEffect(() => {
    const handleResize = () => {
      if (p5Instance.current) {
        windowResized(p5Instance.current);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    return () => {
      if (p5Instance.current) {
        try {
          p5Instance.current.remove();
        } catch (e) {}
        p5Instance.current = null;
      }
      document.querySelectorAll(".fluid").forEach((container) => {
        container.querySelectorAll("canvas").forEach((c) => c.remove());
      });
    };
  }, []);

  const setup = (p5: any, canvasParentRef: Element) => {
    try {
      if (canvasParentRef) {
        Array.from(canvasParentRef.querySelectorAll("canvas")).forEach((el) =>
          el.remove()
        );
      }
    } catch (e) {}

    p5Instance.current = p5;

    const updateCanvasSize = () => {
      let canvasWidth = Math.min(window.innerWidth * 0.8, 1024);
      let canvasHeight = canvasWidth * (1.9 / 3);

      if (window.innerHeight < 1060) {
        canvasHeight = window.innerHeight * 0.65;
      }

      if (window.innerWidth < 980) {
        canvasWidth = window.innerWidth * 0.85;
        canvasHeight = window.innerHeight * 0.7;
      }

      p5.resizeCanvas(canvasWidth, canvasHeight);
    };

    const canvas = p5.createCanvas(1, 1);
    canvas.parent(canvasParentRef);
    canvas.id("drawingCanvas");

    updateCanvasSize();

    canvas.style("display", "block");
    canvas.style("margin", "auto");
    canvas.style("user-select", "none");
    canvas.style("touch-action", "none");
    p5.textFont("IBM Plex Sans");
    canvas.style("border", "1.5px dashed");
    canvas.style("border-spacing", "10px");
    canvas.style("padding", "10px");
    canvas.style("border-radius", "6px");

    p5.frameRate(60);
  };

  const windowResized = (p5: any) => {
    let canvasWidth = Math.min(window.innerWidth * 0.8, 1024);
    let canvasHeight = canvasWidth * (1.9 / 3);

    if (window.innerWidth < 780) {
      canvasWidth = window.innerWidth;
      canvasHeight = window.innerHeight * 0.9;
    }

    p5.resizeCanvas(canvasWidth, canvasHeight);
  };

  const draw = (p5: any) => {
    if (!userImage) {
      p5.background(245, 245, 245);
    }

    if (userImage && !imgRef.current) {
      imgRef.current = {
        user: p5.loadImage(userImage, () => {
          setShowInstructions(false);
        }),
      };
    }

    for (let i = aureolasRef.current.length - 1; i >= 0; i--) {
      p5.noFill();
      p5.stroke(aureolaColor);

      const aureola = aureolasRef.current[i];

      if (selectedShape === "ellipse") {
        p5.ellipse(aureola.x, aureola.y, aureola.radius, aureola.radius);
      } else if (selectedShape === "rect") {
        p5.rect(aureola.x, aureola.y, aureola.radius, aureola.radius);
      } else if (selectedShape === "tube") {
        p5.ellipse(
          aureola.x - aureola.radius / 2,
          aureola.y - aureola.radius / 2,
          aureola.radius,
          aureola.radius
        );
      } else if (selectedShape === "centerRect") {
        p5.rect(
          aureola.x - aureola.radius / 2,
          aureola.y - aureola.radius / 2,
          aureola.radius,
          aureola.radius
        );
      } else if (selectedShape === "circleLoop") {
        p5.push();
        p5.translate(aureola.x, aureola.y);
        p5.rotate(p5.frameCount * 0.01);
        p5.rect(
          -aureola.radius / 2,
          -aureola.radius / 2,
          aureola.radius,
          aureola.radius
        );
        p5.pop();
      } else if (selectedShape === "blurie") {
        p5.push();
        p5.translate(aureola.x, aureola.y);
        p5.rectMode(p5.CENTER);
        p5.filter(p5.BLUR, 2);
        p5.rect(0, 0, aureola.radius, aureola.radius);
        p5.pop();
      } else if (selectedShape === "chart") {
        let size = aureola.radius + 20 * p5.sin(p5.frameCount * 0.1);
        p5.rect(aureola.x - size / 2, aureola.y - size / 2, size, size);
      }

      if (aureola.growing) {
        aureola.radius += 5;
      }

      if (aureola.radius >= 340) {
        aureolasRef.current.splice(i, 1);
      }
    }
  };

  return (
    <div className={styles["sketch-draw-image-figure-container"]}>
      <div className={styles["sketch-draw-image-figure-container-column"]}>
        <div className={styles["size-controls-image-figure"]}>
          <label
            htmlFor="imageUpload"
            className={`${styles["control-button"]} ${styles.tooltip}`}
            onMouseDown={() => setIsControlPressed(true)}
            onMouseUp={() => setIsControlPressed(false)}
          >
            {SVGs["wallpaper"]("color-responsive-icon")}
            <span className={styles["tooltip-text"]}>Choose image</span>
          </label>
          <input
            id="imageUpload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />

          <button
            className={`${styles["control-button"]} ${styles.tooltip}`}
            onClick={() => handleSizeChangeButton(imageSize - 50)}
            disabled={imageSize <= 100}
            onMouseDown={() => setIsControlPressed(true)}
            onMouseUp={() => setIsControlPressed(false)}
          >
            {SVGs["minor_icon"]("color-responsive-icon")}
            <span className={styles["tooltip-text"]}>{imageSize}px</span>
          </button>

          <button
            className={`${styles["control-button"]} ${styles.tooltip}`}
            onClick={() => handleSizeChangeButton(imageSize + 50)}
            disabled={imageSize >= 300}
            onMouseDown={() => setIsControlPressed(true)}
            onMouseUp={() => setIsControlPressed(false)}
          >
            {SVGs["plus_icon"]("color-responsive-icon")}
            <span className={styles["tooltip-text"]}>{imageSize}px</span>
          </button>
        </div>
      </div>
      <div className={styles["sketch-draw-image-figure-content"]}>
        <div className={styles["sketch-controls"]}>
          <input
            type="color"
            id="aureolaColor"
            value={aureolaColor}
            onChange={handleColorChange}
            className={styles["color-button"]}
            onMouseDown={() => setIsControlPressed(true)}
            onMouseUp={() => setIsControlPressed(false)}
          />
          <button
            className={`${styles["control-button"]} ${
              selectedShape === "ellipse" ? styles.selected : ""
            }`}
            onClick={() => setSelectedShape("ellipse")}
            onMouseDown={() => setIsControlPressed(true)}
            onMouseUp={() => setIsControlPressed(false)}
          >
            {SVGs["circle_loop"]("color-responsive-icon")}
          </button>
          <button
            className={`${styles["control-button"]} ${
              selectedShape === "rect" ? styles.selected : ""
            }`}
            onClick={() => setSelectedShape("rect")}
            onMouseDown={() => setIsControlPressed(true)}
            onMouseUp={() => setIsControlPressed(false)}
          >
            {SVGs["side_square"]("color-responsive-icon")}
          </button>
          <button
            className={`${styles["control-button"]} ${
              selectedShape === "centerRect" ? styles.selected : ""
            }`}
            onClick={() => setSelectedShape("centerRect")}
            onMouseDown={() => setIsControlPressed(true)}
            onMouseUp={() => setIsControlPressed(false)}
          >
            {SVGs["square"]("color-responsive-icon")}
          </button>
          <button
            className={`${styles["control-button"]} ${
              selectedShape === "tube" ? styles.selected : ""
            }`}
            onClick={() => setSelectedShape("tube")}
            onMouseDown={() => setIsControlPressed(true)}
            onMouseUp={() => setIsControlPressed(false)}
          >
            <TbArrowDownRightCircle size={30} />
          </button>
          {!isMobile && (
            <button
              className={`${styles["control-button"]} ${
                selectedShape === "circleLoop" ? styles.selected : ""
              }`}
              onClick={() => setSelectedShape("circleLoop")}
              onMouseDown={() => setIsControlPressed(true)}
              onMouseUp={() => setIsControlPressed(false)}
            >
              <TbTopologyStarRing size={30} />
            </button>
          )}

          {!isMobile && (
            <button
              className={`${styles["control-button"]} ${
                selectedShape === "blurie" ? styles.selected : ""
              }`}
              onClick={() => setSelectedShape("blurie")}
              onMouseDown={() => setIsControlPressed(true)}
              onMouseUp={() => setIsControlPressed(false)}
            >
              {SVGs["blur"]("color-responsive-icon")}
            </button>
          )}
          <button
            className={`${styles["control-button"]} ${
              selectedShape === "chart" ? styles.selected : ""
            }`}
            onClick={() => setSelectedShape("chart")}
            onMouseDown={() => setIsControlPressed(true)}
            onMouseUp={() => setIsControlPressed(false)}
          >
            {SVGs["chart"]("color-responsive-icon")}
          </button>
        </div>

        <Sketch
          windowResized={windowResized}
          className="fluid"
          setup={setup}
          draw={draw}
          mousePressed={mousePressed}
          mouseReleased={mouseReleased}
        />
      </div>
    </div>
  );
};

export default CanvasImageGlow;
