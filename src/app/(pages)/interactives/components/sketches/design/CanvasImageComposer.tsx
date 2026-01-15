"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import styles from "./CanvasImageComposer.module.css";
import { SVGs } from "@/assets/SVGs";
import horsePng from "@/assets/interactives/design/horse.png";
import wwwwPng from "@/assets/interactives/design/wwwww.png";
import feelPng from "@/assets/interactives/design/feel.png";
import starsPng from "@/assets/interactives/design/stars.png";
import dolphinesPng from "@/assets/interactives/design/dolphines.png";

const Sketch = dynamic(() => import("react-p5"), {
  ssr: false,
});

let p5Instance: any = null;

const setP5Instance = (p5: any) => {
  p5Instance = p5;
};

const getP5Instance = () => p5Instance;

const setupCanvas = (p5: any, canvasParentRef: Element) => {
  setP5Instance(p5);
  const isMobile = window.innerWidth < 780;

  const updateCanvasSize = () => {
    const isInitialSetup = p5.width === 1 && p5.height === 1;

    if (isMobile && !isInitialSetup) return;

    let canvasWidth = Math.min(window.innerWidth * 0.7, 1024);
    let canvasHeight = canvasWidth * (1.7 / 3);

    if (window.innerHeight < 1060) {
      canvasWidth = Math.min(window.innerWidth * 0.7, 1024);
      canvasHeight = window.innerHeight * 0.65;
    }

    if (window.innerHeight < 900) {
      canvasWidth = Math.min(window.innerWidth * 0.7, 1024);
      canvasHeight = window.innerHeight * 0.65;
    }

    if (window.innerHeight < 800) {
      canvasWidth = Math.min(window.innerWidth * 0.7, 1024);
      canvasHeight = window.innerHeight * 0.7;
    }

    if (window.innerWidth < 980) {
      canvasWidth = window.innerWidth * 0.85;
      canvasHeight = window.innerHeight * 0.65;
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
  canvas.style("border", "1.5px dashed");
  canvas.style("border-spacing", "10px");
  canvas.style("padding", "10px");
  canvas.style("border-radius", "6px");

  p5.textFont("Array");

  canvas.elt.addEventListener(
    "touchstart",
    (e: TouchEvent) => {
      e.preventDefault();
    },
    { passive: false }
  );

  p5.frameRate(60);

  if (!isMobile) {
    window.addEventListener("resize", updateCanvasSize);
  }
};

const windowResizedCanvas = (p5: any) => {
  const isMobile = window.innerWidth < 780;
  if (isMobile) return;

  let canvasWidth = Math.min(window.innerWidth * 0.8, 1024);
  let canvasHeight = canvasWidth * (1.9 / 3);

  p5.resizeCanvas(canvasWidth, canvasHeight);
};

const drawCanvas = (
  p5: any,
  showInstructions: boolean,
  imagesHistory: React.MutableRefObject<any[]>,
  eraserMode: boolean,
  particleMode: boolean
) => {
  p5.background(255, 255, 255);
  p5.cursor(eraserMode ? "crosshair" : "default");

  if (showInstructions) {
    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.textSize(22);
    p5.textFont("IBM Plex Sans");

    const fadeInDuration = 120;
    const fadeOutDuration = 120;
    const totalDuration = fadeInDuration + fadeOutDuration;

    let alpha = 255;
    const cyclePosition = p5.frameCount % totalDuration;
    if (cyclePosition < fadeInDuration) {
      alpha = p5.lerp(0, 255, cyclePosition / fadeInDuration);
    } else {
      const fadeOutPosition = cyclePosition - fadeInDuration;
      alpha = p5.lerp(255, 0, fadeOutPosition / fadeOutDuration);
    }

    const instructionText = "Click on the canvas to place the selected image";
    const wrappedText = wrapText(instructionText, p5.width - 40, p5);

    p5.fill(4, 3, 17, alpha);
    const lineHeight = 40;
    wrappedText.forEach((line: string, index: number) => {
      p5.text(line, p5.width / 2, p5.height / 2 + index * lineHeight);
    });
  }

  function wrapText(text: string, maxWidth: number, p5: any): string[] {
    const words = text.split(" ");
    let lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = p5.textWidth(currentLine + " " + word);
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }

  if (eraserMode && p5.mouseIsPressed) {
    imagesHistory.current = imagesHistory.current.filter(
      ({ x, y, width, height }: any) => {
        const d = p5.dist(p5.mouseX, p5.mouseY, x, y);
        return d > Math.max(width, height) * 0.3;
      }
    );
  }

  for (let i = 0; i < imagesHistory.current.length; i++) {
    const { img, x, y, width, height } = imagesHistory.current[i];
    if (particleMode) {
      for (let px = 0; px < width; px += 4) {
        for (let py = 0; py < height; py += 4) {
          let pixelColor = img.get(
            px * (img.width / width),
            py * (img.height / height)
          );
          if (pixelColor[0] + pixelColor[1] + pixelColor[2] > 50) {
            p5.stroke(0);
            p5.strokeWeight(1);
            p5.line(
              x - width / 2 + px,
              y - height / 2 + py,
              x - width / 2 + px,
              y - height / 2 + py + 3
            );
          }
        }
      }
    } else {
      p5.image(img, x - width / 2, y - height / 2, width, height);
    }
  }
};

const saveSketch = () => {
  const p5 = getP5Instance();
  if (p5) {
    p5.saveCanvas("my-drawing", "png");
  }
};

const handleImageClickHelper = (
  p5: any,
  imageSrc: string,
  size: number,
  setUserImage: (value: any) => void,
  imagesHistory: React.MutableRefObject<any[]>,
  setShowInstructions: (value: boolean) => void
) => {
  p5.loadImage(imageSrc, (img: any) => {
    setUserImage(img);
    setShowInstructions(false);
  });
};

const mousePressedHelper = (
  p5: any,
  imagesHistory: React.MutableRefObject<any[]>,
  userImage: any,
  size: number
) => {
  if (
    userImage &&
    p5.mouseX > 0 &&
    p5.mouseX < p5.width &&
    p5.mouseY > 0 &&
    p5.mouseY < p5.height
  ) {
    const origW = userImage.width;
    const origH = userImage.height;
    const scale = size / Math.max(origW, origH);
    const w = origW * scale;
    const h = origH * scale;
    imagesHistory.current.push({
      img: userImage,
      x: p5.mouseX,
      y: p5.mouseY,
      width: w,
      height: h,
    });
  }
};

const mouseDraggedHelper = (
  p5: any,
  imagesHistory: React.MutableRefObject<any[]>,
  userImage: any,
  size: number
) => {
  if (
    userImage &&
    p5.mouseX > 0 &&
    p5.mouseX < p5.width &&
    p5.mouseY > 0 &&
    p5.mouseY < p5.height
  ) {
    const origW = userImage.width;
    const origH = userImage.height;
    const scale = size / Math.max(origW, origH);
    const w = origW * scale;
    const h = origH * scale;
    imagesHistory.current.push({
      img: userImage,
      x: p5.mouseX,
      y: p5.mouseY,
      width: w,
      height: h,
    });
  }
};

const openFullscreenHelper = () => {
  const elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  }
};

const horseImage = horsePng.src;
const image2 = wwwwPng.src;
const image3 = feelPng.src;
const image4 = starsPng.src;
const image5 = dolphinesPng.src;


const CanvasImageComposer: React.FC = () => {
  const [drawImage, setDrawImage] = useState(false);
  const [userImage, setUserImage] = useState<any>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState(400);
  const [ignoreCanvasClicks, setIgnoreCanvasClicks] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [eraserMode, setEraserMode] = useState(false);
  const [particleMode, setParticleMode] = useState(false);

  const [size, setSize] = useState(() => {
    if (typeof window === "undefined") return 400;
    const mobile = window.innerWidth < 780;
    return mobile ? 50 : 400;
  });

  const imgRef = useRef<any>(null);
  const imagesHistory = useRef<any[]>([]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1200);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      const handleResize = () => {
        const p5 = getP5Instance();
        if (p5) {
          windowResizedCanvas(p5);
        }
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [isMobile]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "z") {
        event.preventDefault();
        setIgnoreCanvasClicks(true);
        handleUndo();
        setTimeout(() => setIgnoreCanvasClicks(false), 0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSizeChangeButton = (newSize: number) => {
    setIgnoreCanvasClicks(true);
    setSize(newSize);
    setSelectedSize(newSize);
    setTimeout(() => setIgnoreCanvasClicks(false), 0);
  };

  const handleClearCanvas = () => {
    const p5 = getP5Instance();
    imagesHistory.current = [];
    setSelectedImage(null);
    setIgnoreCanvasClicks(true);

    if (p5) {
      p5.background(255);
    }

    setTimeout(() => setIgnoreCanvasClicks(false), 300);
  };

  const handleUndo = () => {
    for (let i = imagesHistory.current.length - 1; i >= 0; i--) {
      if (imagesHistory.current[i].hasOwnProperty("img")) {
        imagesHistory.current.splice(i, 1);
        break;
      }
    }
    setDrawImage((prev) => !prev);
  };

  const removeImage = (imageToRemove: string) => {
    setUploadedImages((prevImages) =>
      prevImages.filter((image) => image !== imageToRemove)
    );
  };

  const handleImageSelect = (image: string) => {
    setIgnoreCanvasClicks(true);
    setSelectedImage(image);

    const p5Instance = getP5Instance();
    if (p5Instance) {
      handleImageClickHelper(
        p5Instance,
        image,
        size,
        setUserImage,
        imagesHistory,
        setShowInstructions
      );
    }

    setShowInstructions(false);
    setTimeout(() => setIgnoreCanvasClicks(false), 0);
  };

  const handleImageUploadDynamic = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setUploadedImages((prevImages) => [...prevImages, imageUrl]);
    }
  };

  const handleButtonClickWithIgnore = (callback: () => void) => {
    setIgnoreCanvasClicks(true);
    callback();
    setTimeout(() => setIgnoreCanvasClicks(false), 0);
  };

  const handleDownload = () => {
    saveSketch();
  };

  const renderSizeButtons = () => {
    return (
      <div className={styles["size-controls"]}>
        <button
          className={`${styles["control-button"]} ${styles.tooltip}`}
          onClick={() => handleSizeChangeButton(selectedSize - 50)}
          disabled={selectedSize <= 50}
        >
          {SVGs["minor_icon"](styles["icon-class"])}
          <span className={styles["tooltip-text"]}>{selectedSize}px</span>
        </button>

        <button
          className={`${styles["control-button"]} ${styles.tooltip}`}
          onClick={() => handleSizeChangeButton(selectedSize + 50)}
          disabled={selectedSize >= 1050}
        >
          {SVGs["plus_icon"](styles["icon-class"])}
          <span className={styles["tooltip-text"]}>{selectedSize}px</span>
        </button>
      </div>
    );
  };

  return (
    <div className={styles["canvas-images-container"]}>
      <div className={styles["image-sizes"]}>
        {renderSizeButtons()}
        {isMobile && (
          <button
            className={`${styles["control-button"]} ${styles.tooltip}`}
            onClick={() =>
              document.getElementById("dynamicImageInput")?.click()
            }
          >
            {SVGs["wallpaper"](styles["icon-class"])}
            <span className={styles["tooltip-text"]}>Add Images</span>
          </button>
        )}
        {!isMobile && (
          <button
            className={`${styles["control-button"]} ${styles.tooltip}`}
            onClick={() => handleButtonClickWithIgnore(openFullscreenHelper)}
          >
            {SVGs["full_screan"](styles["icon-class"])}
            <span className={styles["tooltip-text"]}>Full Screen</span>
          </button>
        )}
        <button
          className={`${styles["control-button"]} ${styles.tooltip}`}
          onClick={() => setEraserMode(!eraserMode)}
        >
          {eraserMode
            ? SVGs.eraser_of(styles["icon-class"]) 
            : SVGs.eraser(styles["icon-class"])}
          <span className={styles["tooltip-text"]}>
            {eraserMode ? "Eraser Off" : "Eraser On"}
          </span>
        </button>

        <button
          className={`${styles["control-button"]} ${styles.tooltip}`}
          onClick={handleClearCanvas}
        >
          {SVGs["refresh"](styles["icon-class"])}
          <span className={styles["tooltip-text"]}>Reset</span>
        </button>
        <button
          className={`${styles["control-button"]} ${styles.tooltip}`}
          onClick={handleDownload}
        >
          {SVGs["download_icon"](styles["icon-class"])}
          <span className={styles["tooltip-text"]}>Download</span>
        </button>
      </div>
      <div className={styles["canvas-controls-desktop-row"]}>
        {!isMobile && (
          <div className={styles["image-items"]}>
            {[horseImage, image2, image3, image4, image5].map((image) => (
              <img
                key={image}
                src={image}
                alt="our-image"
                className={`${styles["our-image"]} ${
                  selectedImage === image ? styles.selected : ""
                }`}
                onClick={() => handleImageSelect(image)}
              />
            ))}
          </div>
        )}
        <div className={styles["canvas-content"]}>
          <Sketch
            setup={setupCanvas}
            windowResized={windowResizedCanvas}
            draw={(p5: any) => {
              if (!ignoreCanvasClicks) {
                drawCanvas(
                  p5,
                  showInstructions,
                  imagesHistory,
                  eraserMode,
                  particleMode
                );
              }
            }}
            mousePressed={(p5: any) => {
              if (!ignoreCanvasClicks) {
                mousePressedHelper(p5, imagesHistory, userImage, size);
              }
            }}
            mouseDragged={(p5: any) => {
              if (!ignoreCanvasClicks) {
                mouseDraggedHelper(p5, imagesHistory, userImage, size);
              }
            }}
          />
        </div>
        <div className={styles["canvas-controls-mobile-column"]}>
          {isMobile && (
            <div className={styles["image-items"]}>
              {[horseImage, image2, image3, image4, image5].map((image) => (
                <img
                  key={image}
                  src={image}
                  alt="our-image"
                  className={`${styles["our-image"]} ${
                    selectedImage === image ? styles.selected : ""
                  }`}
                  onClick={() => handleImageSelect(image)}
                />
              ))}
            </div>
          )}
          <div className={styles["image-column"]}>
            {uploadedImages.map((image, index) => (
              <div key={index} className={styles["image-column-item"]}>
                <img
                  src={image}
                  alt="uploaded-image"
                  className={`${styles["our-image"]} ${
                    selectedImage === image ? styles.selected : ""
                  }`}
                  onClick={() => handleImageSelect(image)}
                />
                <button
                  className={styles["close-button"]}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(image);
                  }}
                >
                  {SVGs["minor_icon"](styles["icon-class"])}
                </button>
              </div>
            ))}
            <input
              type="file"
              id="dynamicImageInput"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageUploadDynamic}
            />
          </div>
          {!isMobile && (
            <button
              className={`${styles["control-button-add-photo"]} ${styles.tooltip}`}
              onClick={() =>
                document.getElementById("dynamicImageInput")?.click()
              }
            >
              {SVGs["wallpaper"](styles["icon-class"])}
              <span className={styles["tooltip-text"]}>Add Images</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CanvasImageComposer;
