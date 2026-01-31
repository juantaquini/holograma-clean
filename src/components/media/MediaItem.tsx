"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { FaPlay, FaPause } from "react-icons/fa";
import styles from "./MediaItem.module.css";
import { MediaKind } from "@/types/media";

interface Props {
  url: string;
  kind: MediaKind;
}

export function MediaItem({ url, kind }: Props) {
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (kind !== "audio" || !waveformRef.current) return;

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      height: 40,
      barWidth: 2,
      normalize: true,
      waveColor: "#aaa",
      progressColor: "#555",
      cursorColor: "transparent",
    });

    wsRef.current = ws;

    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("finish", () => setIsPlaying(false));

    ws.load(url);

    return () => {
      ws.destroy();
      wsRef.current = null;
    };
  }, [kind, url]);

  if (kind === "image") {
    return (
      <img
        src={url}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        className={styles["media-item"]}
      />
    );
  }

  if (kind === "video") {
    return (
      <video
        src={url}
        controls
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        className={styles["media-item"]}
      />
    );
  }

  if (kind === "audio") {
    return (
      <div
        className={styles["media-item-audio"]}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        onClick={() => wsRef.current?.playPause()}
      >
        <span className={styles["audio-icon"]}>
          {isPlaying ? <FaPause /> : <FaPlay />}
        </span>

        <div ref={waveformRef} className={styles["audio-waveform"]} />
      </div>
    );
  }

  return null;
}
