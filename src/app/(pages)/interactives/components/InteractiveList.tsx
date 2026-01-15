"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./InteractiveList.module.css";
import calm from "@/assets/interactives/calm.jpeg";
import calm2 from "@/assets/interactives/calm2.jpeg";
import chaotic from "@/assets/interactives/chaotic.jpeg";
import chaotic2 from "@/assets/interactives/chaotic2.png";
import design from "@/assets/interactives/design.jpeg";
import design2 from "@/assets/interactives/design2.jpeg";
import dynamic from "@/assets/interactives/dynamic.jpeg";
import dynamic2 from "@/assets/interactives/dynamic2.jpeg";
import experimental from "@/assets/interactives/experimental.jpeg";
import nature from "@/assets/interactives/nature.png";
import psychedelic from "@/assets/interactives/psychedelic.jpeg";

const InteractiveList = () => {
  const [hoveredDescription, setHoveredDescription] = useState(
    "Geometric shapes, patterns, or structured art."
  );
  const [visibleSketches, setVisibleSketches] = useState<any[]>([]);
  const [linePosition, setLinePosition] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [sketchCount, setSketchCount] = useState(visibleSketches.length);

  const [activeSection, setActiveSection] = useState({
    name: "DESIGN",
    description: "Geometric shapes, patterns, or structured art.",
  });

  useEffect(() => {
    setSketchCount(visibleSketches.length);
  }, [visibleSketches]);

  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth <= 968);
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const sections = [
    { name: "CALM", description: "Soft colors, shapes and smooth motion." },
    { name: "PSYCHEDELIC", description: "Color chaos and visual explosions." },
    { name: "CHAOTIC", description: "Unpredictable, harsh, glitchy visuals." },
    { name: "DESIGN", description: "Geometric patterns and structures." },
    { name: "NATURE", description: "Organic movement and earth textures." },
    { name: "EXPERIMENTAL", description: "Unconventional visual behavior." },
    { name: "DYNAMIC", description: "Fast, loud, energetic movement." },
  ];

  const sketchesBySection: any = {
    CALM: [
      {
        id: 1,
        src: calm,
        title: "calm",
        path: "calm",
      },
      {
        id: 2,
        src: calm2,
        title: "calm 2",
        path: "calm_second",
      },
    ],
    PSYCHEDELIC: [
      {
        id: 3,
        src: psychedelic,
        title: "psy",
        path: "alma",
      },
    ],
    CHAOTIC: [
      { id: 4, src: chaotic, title: "chaotic", path: "chaotic_mouse_trail" },
      {
        id: 5,
        src: chaotic2,
        title: "Nature Abstract Sketch",
        path: "chaotic_wave_field",
      },
    ],
    DESIGN: [
      { id: 6, src: design, title: "DESIGN", path: "design_image_composer" },
      {
        id: 7,
        src: design2,
        title: "IMAGE + SHAPE",
        path: "design_image_glow",
      },
    ],
    NATURE: [
      {
        id: 8,
        src: nature,
        title: "Nature Abstract Sketch",
        path: "generative_nature",
      },
    ],
    EXPERIMENTAL: [
      {
        id: 3,
        src: experimental,
        title: "SHAPE",
        path: "rolling_interactive_spiral",
      },
    ],
    DYNAMIC: [
      { id: 7, src: dynamic, title: "PAD SKETCH", path: "pad" },
    ],
  };

  useEffect(() => {
    const updateLinePosition = () => {
      if (!activeSection) return;

      const container = document.querySelector(
        ".interactive-list-page-container"
      ) as HTMLElement;
      const button = document.querySelector(
        `[data-section="${activeSection.name}"]`
      ) as HTMLElement;
      if (!button || !container) return;

      const containerRect = container.getBoundingClientRect();
      const rect = button.getBoundingClientRect();

      const startX = rect.left + rect.width / 2 - containerRect.left;
      const startY = rect.bottom - containerRect.top + (isMobile ? 50 : 50);
      let endY = startY + (isMobile ? 80 : 150);

      const sketches = sketchesBySection[activeSection.name] || [];
      let sketchesWithPositions: any[] = [];

      if (sketches.length > 0) {
        const screenWidth = window.innerWidth;
        const padding = 50;
        const availableWidth = screenWidth - padding * 2;
        const sketchSpacing = availableWidth / sketches.length;
        const startXOffset = padding + sketchSpacing / 2;

        sketchesWithPositions = sketches.map(
          (sketch: (typeof sketches)[number], index: number) => ({
            ...sketch,
            x: startXOffset + index * sketchSpacing - 90,
            y: endY + (isMobile ? 40 : 90),
          })
        );

        endY += 20;
      }

      setLinePosition({
        startX,
        startY,
        endX: startX,
        endY,
        branches: sketchesWithPositions,
      });

      setVisibleSketches(sketchesWithPositions);
    };

    updateLinePosition();
    window.addEventListener("resize", updateLinePosition);
    window.addEventListener("scroll", updateLinePosition);
    return () => {
      window.removeEventListener("resize", updateLinePosition);
      window.removeEventListener("scroll", updateLinePosition);
    };
  }, [activeSection, isMobile]);

  const handleSectionChange = (section: any) => {
    setHoveredDescription(section.description);
    setActiveSection(section);
    try {
      localStorage.setItem("lastActiveSection", JSON.stringify(section));
    } catch (e) {}
  };

  useEffect(() => {
    const savedSection = localStorage.getItem("lastActiveSection");
    if (savedSection) {
      const parsedSection = JSON.parse(savedSection);
      setActiveSection(parsedSection);
      setHoveredDescription(parsedSection.description);
    }
  }, []);

  return (
    <>
      <div
        className={`${styles["interactive-list-page-container"]} interactive-list-page-container`}
        style={{ padding: "18px" }}
      >
        <div
          className={`${styles["interactive-list-sketch-carousel"]} interactive-list-sketch-carousel`}
        >
          <div
            className={`${styles["interactive-list-section-description-container"]} interactive-list-section-description-container`}
          >
            <div
              className={`${styles["interactive-list-sections-container"]} interactive-list-sections-container`}
            >
              {sections.map((section) => (
                <button
                  key={section.name}
                  className={`${styles["interactive-list-section-button"]} interactive-list-section-button`}
                  data-section={section.name}
                  onMouseEnter={
                    !isMobile ? () => handleSectionChange(section) : undefined
                  }
                  onClick={
                    isMobile ? () => handleSectionChange(section) : undefined
                  }
                >
                  {section.name}
                </button>
              ))}
            </div>
            {hoveredDescription && (
              <div
                className={`${styles["interactive-list-description-container"]} interactive-list-description-container`}
              >
                {hoveredDescription}
              </div>
            )}
          </div>
        </div>

        <div
          className={`${styles["interactive-list-interactives-sketch-container"]} interactive-list-interactives-sketch-container`}
          data-count={sketchCount}
        >
          {visibleSketches.map((sketch, index) => (
            <Link
              href={`/interactives/${sketch.path}`}
              key={`${sketch.id}-${index}`}
              className={`${styles["interactive-list-sketch-image-container"]} interactive-list-sketch-image-container`}
              style={{ top: sketch.y, left: sketch.x }}
            >
              <Image
                className={`${styles["interactive-list-sketch-image"]} interactive-list-sketch-image`}
                src={sketch.src}
                alt={sketch.title}
                draggable={false}
              />
            </Link>
          ))}
        </div>

        {linePosition && (
          <svg
            className={`${styles["interactive-list-dotted-line"]} interactive-list-dotted-line`}
            xmlns="http://www.w3.org/2000/svg"
          >
            <line
              x1={linePosition.startX}
              y1={linePosition.startY}
              x2={linePosition.endX}
              y2={linePosition.endY}
              stroke={"var(--text-color)"}
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            {linePosition.branches?.map((sketch: any, index: number) => (
              <line
                key={index}
                x1={linePosition.endX}
                y1={linePosition.endY}
                x2={sketch.x + 35}
                y2={sketch.y}
                stroke={"var(--text-color)"}
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            ))}
          </svg>
        )}
      </div>
    </>
  );
};

export default InteractiveList;
