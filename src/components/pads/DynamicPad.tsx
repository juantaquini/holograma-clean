"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useColorTheme } from "@/app/(providers)/color-theme-provider";
import { colorPalettes } from "@/lib/color-palettes";
import styles from "./DynamicPad.module.css";

type PadMedia = {
  id: string;
  url: string;
  kind: "image" | "video" | "audio";
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  opacity?: number;
  volume?: number;
  loop?: boolean;
  blendMode?: string;
  color?: string | null;
  zIndex?: number;
};

type PadConfig = {
  backgroundColor?: string;
  text?: string;
};

interface Props {
  media: PadMedia[];
  config?: PadConfig;
  headerActionsRef?: React.RefObject<HTMLDivElement | null>;
}

const KEYS = [75, 66, 83, 72, 74, 70, 76, 68];

const DynamicPad: React.FC<Props> = ({ media, config, headerActionsRef }) => {
  const { theme } = useColorTheme();
  const palette = colorPalettes[theme];

  const audioItems = useMemo(
    () => media.filter((m) => m.kind === "audio"),
    [media]
  );
  const imageItems = useMemo(
    () => media.filter((m) => m.kind === "image"),
    [media]
  );
  const videoItems = useMemo(
    () => media.filter((m) => m.kind === "video"),
    [media]
  );

  const sounds = useRef<any[]>([]);
  const soundOn = useRef<boolean[]>([]);
  const imgs = useRef<any[]>([]);
  const vids = useRef<any[]>([]);
  const alphaPhase = useRef<number[]>([]);
  const activeTouches = useRef<Map<number, number>>(new Map());
  const canvasRef = useRef<any>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordStreamRef = useRef<MediaStream | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const audioConnectedRef = useRef(false);
  const audioUnlockedRef = useRef(false);
  const prevKeyDownRef = useRef<boolean[]>([]);
  const holdModeRef = useRef(false);
  const fadeTimeouts = useRef<any[]>([]);
  const p5Instance = useRef<any>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [Sketch, setSketch] = useState<any>(null);
  const [p5SoundLoaded, setP5SoundLoaded] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingFilename, setRecordingFilename] = useState<string>(
    "holograma-dynamic-pad.webm"
  );
  const [holdMode, setHoldMode] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [headerPortalReady, setHeaderPortalReady] = useState(false);

  holdModeRef.current = holdMode;

  useEffect(() => {
    if (!headerActionsRef) return;
    const id = requestAnimationFrame(() => setHeaderPortalReady(true));
    return () => cancelAnimationFrame(id);
  }, [headerActionsRef]);

  useEffect(() => {
    let cancelled = false;
    import("react-p5")
      .then((mod) => {
        if (cancelled) return;
        try {
          require("p5/lib/addons/p5.sound");
        } catch {
          setP5SoundLoaded(false);
          return;
        }
        setP5SoundLoaded(true);
        setSketch(() => mod.default);
      })
      .catch(() => {
        if (!cancelled) setP5SoundLoaded(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      fadeTimeouts.current.forEach((timeout) => {
        if (timeout) clearTimeout(timeout);
      });
      fadeTimeouts.current = [];

      sounds.current.forEach((sound) => {
        if (sound) {
          try {
            if (sound.isPlaying && sound.isPlaying()) {
              sound.stop();
            }
            if (sound.disconnect) sound.disconnect();
          } catch {}
        }
      });
      sounds.current = [];
      soundOn.current = [];

      vids.current.forEach((vid) => {
        if (vid && vid.elt) {
          try {
            vid.elt.pause();
            vid.remove();
          } catch {}
        }
      });
      vids.current = [];
      imgs.current = [];

      if (p5Instance.current) {
        try {
          p5Instance.current.remove();
          p5Instance.current = null;
        } catch {}
      }

      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        try {
          recorderRef.current.stop();
        } catch {}
      }
      if (recordStreamRef.current) {
        recordStreamRef.current.getTracks().forEach((track) => track.stop());
        recordStreamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setIsMobile(/android|iphone|ipad/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    return () => {
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }
    };
  }, [recordingUrl]);

  const startRecording = () => {
    if (!canvasRef.current || isRecording) return;
    if (typeof MediaRecorder === "undefined") {
      setRecordError("Recording is not supported in this browser.");
      return;
    }
    if (typeof canvasRef.current.captureStream !== "function") {
      setRecordError("Canvas recording is not supported in this browser.");
      return;
    }

    try {
      if (p5Instance.current?.userStartAudio) {
        try {
          p5Instance.current.userStartAudio();
        } catch {}
      }

      const canvasStream: MediaStream = canvasRef.current.captureStream(60);

      let combinedStream = canvasStream;
      const audioCtx =
        typeof p5Instance.current?.getAudioContext === "function"
          ? p5Instance.current.getAudioContext()
          : null;
      if (audioCtx && typeof audioCtx.createMediaStreamDestination === "function") {
        try {
          audioCtx.resume?.();
        } catch {}
        if (!audioDestinationRef.current) {
          audioDestinationRef.current = audioCtx.createMediaStreamDestination();
        }
        const soundOut = (p5Instance.current as any)?.soundOut;
        if (
          soundOut?.output?.connect &&
          audioDestinationRef.current &&
          !audioConnectedRef.current
        ) {
          try {
            soundOut.output.connect(audioDestinationRef.current);
            audioConnectedRef.current = true;
          } catch {}
        }
        if (audioDestinationRef.current?.stream?.getAudioTracks()?.length) {
          const composed = new MediaStream(canvasStream.getVideoTracks());
          audioDestinationRef.current.stream
            .getAudioTracks()
            .forEach((track) => composed.addTrack(track));
          combinedStream = composed;
        }
      }

      recordStreamRef.current = combinedStream;
      recordedChunksRef.current = [];

      const typesToTry = [
        "video/mp4;codecs=h264",
        "video/mp4",
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
      ];
      const supportedType =
        typeof MediaRecorder.isTypeSupported === "function"
          ? typesToTry.find((type) => MediaRecorder.isTypeSupported(type))
          : undefined;
      const options = supportedType ? { mimeType: supportedType } : undefined;

      const recorder = new MediaRecorder(combinedStream, {
        ...(options || {}),
        videoBitsPerSecond: 10_000_000,
        audioBitsPerSecond: 256_000,
      });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "video/webm";
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        if (recordingUrl) URL.revokeObjectURL(recordingUrl);
        const url = URL.createObjectURL(blob);
        setRecordingUrl(url);
        const extension = mimeType.includes("mp4") ? "mp4" : "webm";
        const filename = `holograma-dynamic-pad-${new Date()
          .toISOString()
          .replace(/[:.]/g, "-")}.${extension}`;
        setRecordingFilename(filename);
        recordedChunksRef.current = [];
        setIsRecording(false);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      recorder.onerror = () => {
        setRecordError("Recording failed. Please try again.");
        setIsRecording(false);
        if (recordStreamRef.current) {
          recordStreamRef.current.getTracks().forEach((track) => track.stop());
          recordStreamRef.current = null;
        }
      };

      setRecordError(null);
      setIsRecording(true);
      recorder.start();
    } catch (err) {
      setRecordError("Recording failed. Please try again.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    try {
      recorder.stop();
    } catch {}
    if (recordStreamRef.current) {
      recordStreamRef.current.getTracks().forEach((track) => track.stop());
      recordStreamRef.current = null;
    }
  };

  const preload = (p5: any) => {
    audioItems.forEach((item, i) => {
      try {
        sounds.current[i] = p5.loadSound(item.url);
        soundOn.current[i] = false;
        alphaPhase.current[i] = i;
      } catch {}
    });

    imageItems.forEach((item, i) => {
      try {
        imgs.current[i] = p5.loadImage(item.url);
      } catch {}
    });

    videoItems.forEach((item, i) => {
      try {
        const v = p5.createVideo(item.url);
        v.hide();
        v.volume(0);
        v.elt.muted = true;
        v.elt.playsInline = true;
        v.elt.setAttribute("playsinline", "");
        v.elt.setAttribute("webkit-playsinline", "");
        v.elt.setAttribute("disablePictureInPicture", "");
        v.elt.setAttribute("x-webkit-airplay", "deny");
        v.elt.style.pointerEvents = "none";
        v.loop();
        vids.current[i] = v;
      } catch {}
    });
  };

  const setup = (p5: any, parent: Element) => {
    p5Instance.current = p5;
    try {
      const targetDensity = Math.min(2, window.devicePixelRatio || 1);
      p5.pixelDensity(targetDensity);
    } catch {}
    const canvas = p5.createCanvas(
      p5.windowWidth,
      p5.windowHeight * 0.75,
      p5.WEBGL
    ).parent(parent);
    canvasRef.current = canvas.elt;

    if (isMobile) {
      canvas.elt.addEventListener("touchstart", handleTouchStart, {
        passive: false,
      });
      canvas.elt.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      canvas.elt.addEventListener("touchend", handleTouchEnd, { passive: false });
      canvas.elt.addEventListener("touchcancel", handleTouchEnd, {
        passive: false,
      });
    }
    setIsReady(true);
  };

  const windowResized = (p5: any) => {
    try {
      p5.resizeCanvas(p5.windowWidth, p5.windowHeight * 0.75);
    } catch {}
  };

  const looped = <T,>(arr: T[], i: number) =>
    arr.length ? arr[i % arr.length] : null;

  const toggle = (i: number, on: boolean) => {
    const s = sounds.current[i];
    if (!s) return;

    if (fadeTimeouts.current[i]) {
      clearTimeout(fadeTimeouts.current[i]);
      fadeTimeouts.current[i] = null;
    }

    if (on && !soundOn.current[i]) {
      try {
        if (s.isPlaying && s.isPlaying()) {
          s.stop();
        }
        s.loop();
        s.amp(0);
        s.amp(1, 0.05);

        const vid = looped(vids.current, i);
        if (vid && vid.elt.paused) {
          vid.loop();
        }
        soundOn.current[i] = true;
      } catch {}
    }

    if (!on && soundOn.current[i]) {
      try {
        s.amp(0, 0.05);
        fadeTimeouts.current[i] = setTimeout(() => {
          s.stop();
          fadeTimeouts.current[i] = null;
        }, 60);
        soundOn.current[i] = false;
      } catch {}
    }
  };

  const isInsideCanvas = (touch: Touch, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return (
      touch.clientX >= rect.left &&
      touch.clientX <= rect.right &&
      touch.clientY >= rect.top &&
      touch.clientY <= rect.bottom
    );
  };

  const getQuadrantFromTouch = (touch: Touch, canvas: HTMLCanvasElement) => {
    if (!isInsideCanvas(touch, canvas)) return -1;
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const padCount = Math.max(1, sounds.current.length);
    const cols = Math.ceil(Math.sqrt(padCount));
    const rows = Math.ceil(padCount / cols);
    const cellW = rect.width / cols;
    const cellH = rect.height / rows;
    const col = Math.min(cols - 1, Math.floor(x / cellW));
    const row = Math.min(rows - 1, Math.floor(y / cellH));
    const idx = row * cols + col;
    return idx < padCount ? idx : -1;
  };

  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const canvas = e.target as HTMLCanvasElement;

    if (!audioUnlockedRef.current && p5Instance.current?.userStartAudio) {
      try {
        p5Instance.current.userStartAudio();
        audioUnlockedRef.current = true;
      } catch {}
    }

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (!isInsideCanvas(touch, canvas)) continue;
      const quadrant = getQuadrantFromTouch(touch, canvas);
      if (quadrant !== -1) {
        activeTouches.current.set(touch.identifier, quadrant);
        if (holdModeRef.current) {
          toggle(quadrant, !soundOn.current[quadrant]);
        } else {
          toggle(quadrant, true);
        }
      }
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const canvas = e.target as HTMLCanvasElement;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const oldQuadrant = activeTouches.current.get(touch.identifier);

      if (!isInsideCanvas(touch, canvas)) {
        if (oldQuadrant !== undefined) {
          toggle(oldQuadrant, false);
          activeTouches.current.delete(touch.identifier);
        }
        continue;
      }

      const newQuadrant = getQuadrantFromTouch(touch, canvas);

      if (oldQuadrant !== undefined && oldQuadrant !== newQuadrant) {
        toggle(oldQuadrant, false);
        activeTouches.current.delete(touch.identifier);

        if (newQuadrant !== -1) {
          activeTouches.current.set(touch.identifier, newQuadrant);
          toggle(newQuadrant, true);
        }
      }
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const quadrant = activeTouches.current.get(touch.identifier);

      if (quadrant !== undefined) {
        if (!holdModeRef.current) toggle(quadrant, false);
        activeTouches.current.delete(touch.identifier);
      }
    }
  };

  const draw = (p5: any) => {
    const bg = config?.backgroundColor
      ? p5.color(config.backgroundColor)
      : p5.color(palette.text_secondary);
    bg.setAlpha(120);
    p5.background(bg);

    const anySoundOn = soundOn.current.some(Boolean);
    const bgVideo = vids.current[0];
    if (anySoundOn && bgVideo && bgVideo.width && bgVideo.height) {
      const scale = Math.max(p5.width / bgVideo.width, p5.height / bgVideo.height);
      p5.push();
      p5.tint(255, 255);
      p5.image(
        bgVideo,
        (-bgVideo.width * scale) / 2,
        (-bgVideo.height * scale) / 2,
        bgVideo.width * scale,
        bgVideo.height * scale
      );
      p5.pop();
    }

    if (!isMobile) {
      const padCount = Math.max(1, sounds.current.length);
      let anyKeyDown = false;
      for (let i = 0; i < padCount; i++) {
        const keyCode = KEYS[i];
        if (!keyCode) continue;
        const keyDown = p5.keyIsDown(keyCode);
        if (keyDown) anyKeyDown = true;
        if (holdModeRef.current) {
          while (prevKeyDownRef.current.length <= i) prevKeyDownRef.current.push(false);
          const wasDown = prevKeyDownRef.current[i];
          if (keyDown && !wasDown) {
            toggle(i, !soundOn.current[i]);
          }
          prevKeyDownRef.current[i] = keyDown;
        } else {
          toggle(i, keyDown);
        }
      }
      if (anyKeyDown && !audioUnlockedRef.current && p5Instance.current?.userStartAudio) {
        try {
          p5Instance.current.userStartAudio();
          audioUnlockedRef.current = true;
        } catch {}
      }
    }

    const padCount = Math.max(1, sounds.current.length);
    const cols = Math.ceil(Math.sqrt(padCount));
    const rows = Math.ceil(padCount / cols);
    const cellW = p5.width / cols;
    const cellH = p5.height / rows;

    for (let i = 0; i < padCount; i++) {
      const hasSound = soundOn.current[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = -p5.width / 2 + cellW * col + cellW / 2;
      const y = -p5.height / 2 + cellH * row + cellH / 2;

      p5.push();
      p5.translate(x, y);

      if (hasSound) {
        const img = looped(imgs.current, i);
        if (img) {
          alphaPhase.current[i] += 0.02;
          const alpha = 80 + p5.sin(alphaPhase.current[i]) * 80;
          p5.tint(255, alpha);
          const scale = Math.min(cellW / img.width, cellH / img.height) * 0.85;
          p5.image(
            img,
            (-img.width * scale) / 2,
            (-img.height * scale) / 2,
            img.width * scale,
            img.height * scale
          );
        }
      }

      p5.pop();
    }
  };

  const headerButtonsContent = (
    <>
      {recordingUrl && (
        <a
          href={recordingUrl}
          download={recordingFilename}
          className={styles["button"]}
        >
          Download
        </a>
      )}
      <button
        type="button"
        onClick={() => setHoldMode((h) => !h)}
        className={`${styles["button-secondary"]} ${holdMode ? styles["button-hold-active"] : ""}`}
      >
        {holdMode ? "Holding" : "Hold"}
      </button>
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        className={`${styles["button-secondary"]} ${isRecording ? styles["button-recording"] : ""}`}
      >
        {isRecording ? "Stop" : "Rec"}
      </button>
    </>
  );

  const renderHeaderButtonsInRef =
    headerActionsRef && headerPortalReady && headerActionsRef.current
      ? createPortal(headerButtonsContent, headerActionsRef.current)
      : null;

  if (!Sketch || !p5SoundLoaded) {
    return (
      <div className={styles["loading"]}>
        Loading audio engine...
      </div>
    );
  }

  const keyHintText = isMobile
    ? "Tap + hold, slide to switch"
    : `Keys: ${KEYS.slice(0, Math.max(1, media.length))
        .map((c) => String.fromCharCode(c))
        .join(", ")}`;

  return (
    <div className={styles["root"]}>
      {renderHeaderButtonsInRef}
      {!headerActionsRef && (
        <div className={styles["header-buttons"]}>
          {recordingUrl && (
            <a
              href={recordingUrl}
              download={recordingFilename}
              className={styles["button"]}
            >
              Download
            </a>
          )}
          <button
            type="button"
            onClick={() => setHoldMode((h) => !h)}
            className={`${styles["button"]} ${holdMode ? styles["button-hold-active"] : ""}`}
          >
            {holdMode ? "Hold on" : "Hold"}
          </button>
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`${styles["button-secondary"]} ${isRecording ? styles["button-recording"] : ""}`}
          >
            {isRecording ? "Stop" : "Rec"}
          </button>
        </div>
      )}
      {recordError && (
        <div className={styles["record-error"]}>
          {recordError}
        </div>
      )}
      <div className={styles["config-text"]}>
        {config?.text && <span className={styles["config-text-pad"]}>{config.text}</span>}
        <span className={styles["help-keys-text"]}>{keyHintText}</span>
      </div>
      <style jsx global>{`
        canvas {
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          -webkit-touch-callout: none !important;
          -webkit-tap-highlight-color: transparent !important;
          touch-action: none !important;
          display: block;
          outline: none;
        }

        video {
          pointer-events: none !important;
        }
      `}</style>
      <Sketch preload={preload} setup={setup} draw={draw} windowResized={windowResized} />
      {isMobile && (
        <div className={styles["mobile-overlay"]}>
          <span className={styles["mobile-divider-v"]} />
          <span className={styles["mobile-divider-h"]} />
        </div>
      )}
    </div>
  );
};

export default DynamicPad;
