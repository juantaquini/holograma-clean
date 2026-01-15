"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { FaPlay, FaPause } from "react-icons/fa";
import {
  TbPlayerTrackNextFilled,
  TbPlayerTrackPrevFilled,
} from "react-icons/tb";
import styles from "./AudioPlaylistPlayer.module.css";
import { useColorTheme } from "@/app/(providers)/color-theme-provider";
import { colorPalettes } from "@/lib/color-palettes";

interface AudioPlaylistPlayerProps {
  audioUrls: string[];
  albumTitle?: string;
}

const formatTime = (time: number) => {
  if (isNaN(time)) return "00:00";
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const safeLoad = (ws: WaveSurfer, url: string) => {
  const result = ws.load(url);
  if (result instanceof Promise) {
    result.catch((err) => {
      if (err?.name !== "AbortError") {
        console.error(err);
      }
    });
  }
};

export default function AudioPlaylistPlayer({
  audioUrls,
}: AudioPlaylistPlayerProps) {
  const { theme } = useColorTheme();
  const palette = colorPalettes[theme];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const lastSecondRef = useRef(0);

  useEffect(() => {
    if (!waveformRef.current || audioUrls.length === 0) return;

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: palette.text_secondary,
      progressColor: palette.button,
      cursorColor: "transparent",
      height: 96,
      barWidth: 2,
      barRadius: 2,
    });

    wavesurferRef.current = ws;

    ws.on("ready", () => {
      setDuration(ws.getDuration());
      setCurrentTime(0);
    });

    ws.on("audioprocess", () => {
      const t = ws.getCurrentTime();
      const sec = Math.floor(t);
      if (sec !== lastSecondRef.current) {
        lastSecondRef.current = sec;
        setCurrentTime(t);
      }
    });

    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("finish", () => playNext());

    safeLoad(ws, audioUrls[0]);

    return () => {
      ws.destroy();
      wavesurferRef.current = null;
    };
  }, []);

  useEffect(() => {
    const ws = wavesurferRef.current;
    if (!ws || !audioUrls[currentIndex]) return;

    safeLoad(ws, audioUrls[currentIndex]);
    setCurrentTime(0);
  }, [currentIndex, audioUrls]);

  const togglePlay = async () => {
    const ws = wavesurferRef.current;
    if (!ws) return;
    await ws.playPause();
    setIsPlaying(ws.isPlaying());
  };

  const playNext = () => {
    setCurrentIndex((i) => (i < audioUrls.length - 1 ? i + 1 : i));
  };

  const playPrevious = () => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : i));
  };

  return (
    <div className={styles["wrapper"]}>
      <div className={styles["main"]}>
        <div className={styles["topRow"]}>
          <span className={styles["time"]}>{formatTime(currentTime)}</span>

          <div className={styles["controls"]}>
            <button
              onClick={playPrevious}
              disabled={currentIndex === 0}
              className={styles["button"]}
            >
              <TbPlayerTrackPrevFilled />
            </button>

            <button
              onClick={togglePlay}
              disabled={!audioUrls.length}
              className={`${styles["button"]} ${styles["buttonMain"]}`}
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>

            <button
              onClick={playNext}
              disabled={currentIndex === audioUrls.length - 1}
              className={styles["button"]}
            >
              <TbPlayerTrackNextFilled />
            </button>
          </div>

          <span className={styles["time"]}>{formatTime(duration)}</span>
        </div>
      </div>

      <div ref={waveformRef} className={styles["waveform"]} />

      <span className={styles["track"]}>
        {currentIndex + 1}/{audioUrls.length}
      </span>
    </div>
  );
}
