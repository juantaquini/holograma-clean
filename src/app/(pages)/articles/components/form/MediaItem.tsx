"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { FaPlay, FaPause } from "react-icons/fa";
import styles from "./MediaItem.module.css";
import { MediaKind } from "@/types/article";

interface Props {
  url: string;
  kind: MediaKind;
}

export function MediaItem({ url, kind }: Props) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (kind !== "audio" || !waveformRef.current) return;

    let mounted = true;
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

    ws.on("play", () => mounted && setIsPlaying(true));
    ws.on("pause", () => mounted && setIsPlaying(false));
    ws.on("finish", () => mounted && setIsPlaying(false));

    // ✅ Cargar con manejo de errores
    ws.load(url).catch((err) => {
      if (mounted) {
        console.debug("Error loading audio:", err);
      }
    });

    return () => {
      mounted = false;
      // ✅ Detener primero, luego destruir
      if (wsRef.current) {
        try {
          wsRef.current.stop();
          wsRef.current.unAll(); // Remover todos los listeners
          wsRef.current.destroy();
        } catch (err) {
          // Silenciar errores de cleanup
        }
        wsRef.current = null;
      }
    };
  }, [kind, url]);

  /* IMAGE */
  if (kind === "image") {
    return (
      <img
        src={url}
        alt="preview"
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        className={styles["media-item"]}
      />
    );
  }

  /* VIDEO */
  if (kind === "video") {
    return (
      <video
        src={url}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        className={styles["media-item"]}
      />
    );
  }

  /* AUDIO */
  if (kind === "audio") {
    return (
      <div className={styles["audio-container"]}>
        <div ref={waveformRef} className={styles["waveform"]} />
        <button
          type="button"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onClick={() => wsRef.current?.playPause()}
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
      </div>
    );
  }

  return null;
}