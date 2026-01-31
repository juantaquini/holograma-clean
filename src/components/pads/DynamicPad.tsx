"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useColorTheme } from "@/app/(providers)/color-theme-provider";
import { colorPalettes } from "@/lib/color-palettes";

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
}

const KEYS = [75, 66, 83, 72, 74, 70, 76, 68];

const DynamicPad: React.FC<Props> = ({ media, config }) => {
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
  const fadeTimeouts = useRef<any[]>([]);
  const p5Instance = useRef<any>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [Sketch, setSketch] = useState<any>(null);
  const [p5SoundLoaded, setP5SoundLoaded] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingFilename, setRecordingFilename] = useState<string>(
    "holograma-dynamic-pad.webm"
  );
  const [recordError, setRecordError] = useState<string | null>(null);

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
    script.onerror = () => {
      setP5SoundLoaded(false);
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
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
    try {
      const stored = window.localStorage.getItem("dynamicPadHelpDismissed");
      if (stored === "true") setShowHelp(false);
    } catch {}
  }, []);

  const dismissHelp = () => {
    setShowHelp(false);
    try {
      window.localStorage.setItem("dynamicPadHelpDismissed", "true");
    } catch {}
  };

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

    if (p5Instance.current?.userStartAudio) {
      try {
        p5Instance.current.userStartAudio();
      } catch {}
    }

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (!isInsideCanvas(touch, canvas)) continue;
      const quadrant = getQuadrantFromTouch(touch, canvas);
      if (quadrant !== -1) {
        activeTouches.current.set(touch.identifier, quadrant);
        toggle(quadrant, true);
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
        toggle(quadrant, false);
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
      for (let i = 0; i < padCount; i++) {
        const keyCode = KEYS[i];
        if (!keyCode) continue;
        toggle(i, p5.keyIsDown(keyCode));
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

  if (!Sketch || !p5SoundLoaded) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "400px",
          color: palette.text_secondary,
        }}
      >
        Loading audio engine...
      </div>
    );
  }

  return (
    <div
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        WebkitTouchCallout: "none",
        WebkitTapHighlightColor: "transparent",
        touchAction: "none",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {config?.text && (
        <div
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            zIndex: 6,
            maxWidth: "320px",
            color: palette.text,
            background: "rgba(0,0,0,0.55)",
            border: `1px solid ${palette.border}`,
            padding: "10px 12px",
            borderRadius: "12px",
            fontSize: "14px",
            lineHeight: 1.4,
          }}
        >
          {config.text}
        </div>
      )}
      <div
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          zIndex: 6,
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        {recordingUrl && (
          <a
            href={recordingUrl}
            download={recordingFilename}
            style={{
              color: palette.text,
              textDecoration: "none",
              border: `1px solid ${palette.border}`,
              padding: "8px 12px",
              borderRadius: "999px",
              fontSize: "12px",
              letterSpacing: "0.3px",
              background: "rgba(0,0,0,0.45)",
            }}
          >
            Download
          </a>
        )}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          style={{
            border: `1px solid ${palette.border}`,
            background: isRecording ? "rgba(255, 72, 72, 0.85)" : "rgba(0,0,0,0.45)",
            color: palette.text,
            padding: "8px 14px",
            borderRadius: "999px",
            fontSize: "12px",
            letterSpacing: "0.3px",
            cursor: "pointer",
          }}
        >
          {isRecording ? "Stop" : "Rec"}
        </button>
      </div>
      {recordError && (
        <div
          style={{
            position: "absolute",
            top: "64px",
            right: "16px",
            zIndex: 6,
            background: "rgba(0,0,0,0.6)",
            color: palette.text_secondary,
            border: `1px solid ${palette.border}`,
            padding: "8px 12px",
            borderRadius: "10px",
            fontSize: "12px",
            maxWidth: "240px",
          }}
        >
          {recordError}
        </div>
      )}
      {isReady && showHelp && (
        <div
          style={{
            position: "absolute",
            inset: "16px",
            zIndex: 5,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                background: "rgba(0,0,0,0.55)",
                color: palette.text,
                padding: "12px 14px",
                borderRadius: "14px",
                border: `1px solid ${palette.border}`,
                maxWidth: isMobile ? "100%" : "320px",
                fontSize: "14px",
                letterSpacing: "0.3px",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: "6px" }}>
                Dynamic Pad
              </div>
              <div>
                {isMobile
                  ? "Tap and hold any quadrant to trigger a layer. Slide to switch. Lift your finger to fade out."
                  : "Press and hold K, B, S, H to trigger layers. Release to fade out. Try two keys at once."}
              </div>
            </div>
            <button
              onClick={dismissHelp}
              style={{
                pointerEvents: "auto",
                background: "rgba(0,0,0,0.55)",
                color: palette.text,
                border: `1px solid ${palette.border}`,
                borderRadius: "999px",
                padding: "8px 14px",
                fontSize: "12px",
                letterSpacing: "0.4px",
                height: "fit-content",
              }}
            >
              Got it
            </button>
          </div>

          <div style={{ position: "relative", height: "100%" }}>
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ position: "absolute", inset: 0, opacity: 0.8 }}
            >
              <line
                x1="50"
                y1="6"
                x2="50"
                y2="94"
                stroke={palette.text_secondary}
                strokeWidth="0.3"
                strokeDasharray="1,1.2"
              />
              <line
                x1="8"
                y1="50"
                x2="92"
                y2="50"
                stroke={palette.text_secondary}
                strokeWidth="0.3"
                strokeDasharray="1,1.2"
              />
            </svg>
            {!isMobile && (
              <>
                {(() => {
                  const padCount = Math.max(1, sounds.current.length);
                  const cols = Math.ceil(Math.sqrt(padCount));
                  const rows = Math.ceil(padCount / cols);
                  const cells = Array.from({ length: padCount });
                  return cells.map((_, i) => {
                    const col = i % cols;
                    const row = Math.floor(i / cols);
                    const x = ((col + 0.5) / cols) * 100;
                    const y = ((row + 0.5) / rows) * 100;
                    const key = KEYS[i] ? String.fromCharCode(KEYS[i]) : "";
                    return (
                      <div
                        key={`key-${i}`}
                        style={{
                          position: "absolute",
                          left: `${x}%`,
                          top: `${y}%`,
                          transform: "translate(-50%, -50%)",
                          fontSize: "12px",
                          color: palette.text_secondary,
                          letterSpacing: "0.4px",
                        }}
                      >
                        {key}
                      </div>
                    );
                  });
                })()}
              </>
            )}
            {isMobile && (
              <>
                <div
                  style={{
                    position: "absolute",
                    top: "12%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: "12px",
                    color: palette.text_secondary,
                    letterSpacing: "0.4px",
                  }}
                >
                  Tap + Hold
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: "12%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: "12px",
                    color: palette.text_secondary,
                    letterSpacing: "0.4px",
                  }}
                >
                  Slide to Switch
                </div>
              </>
            )}
          </div>
        </div>
      )}
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
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              bottom: 0,
              width: "2px",
              background: palette.text_secondary,
              opacity: 0.8,
              transform: "translateX(-1px)",
            }}
          />
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: "2px",
              background: palette.text_secondary,
              opacity: 0.8,
              transform: "translateY(-1px)",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DynamicPad;
