"use client";

import { useRef, useState } from "react";

export default function AudioRecorder({ sketchId }: { sketchId: string }) {
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder.current = new MediaRecorder(stream);

    recorder.current.ondataavailable = (e) => chunks.current.push(e.data);

    recorder.current.onstop = async () => {
      const blob = new Blob(chunks.current, { type: "audio/webm" });
      chunks.current = [];

      const fd = new FormData();
      fd.append("file", blob);
      fd.append("session_id", sketchId);

      const mediaRes = await fetch("/api/media", {
        method: "POST",
        body: fd,
      });

      let media: any = null;
      try {
        media = await mediaRes.json();
      } catch (e) {
        console.error("Error parseando respuesta de /api/media", e);
      }

      if (!mediaRes.ok || !media?.id) {
        console.error("Fallo subida /api/media", mediaRes.status, media);
        alert("Error subiendo audio");
        return;
      }

      const linkRes = await fetch("/api/sketch_media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sketch_id: sketchId,
          media_id: media.id,
        }),
      });

      if (!linkRes.ok) {
        const err = await linkRes.text();
        console.error("Fallo link sketch_media", linkRes.status, err);
        alert("Error vinculando audio al Space");
        return;
      }

      window.location.reload();
    };

    recorder.current.start();
    setRecording(true);
  };

  const stop = () => {
    recorder.current?.stop();
    setRecording(false);
  };

  return (
    <button
      onClick={recording ? stop : start}
      className={`px-4 py-2 rounded-lg text-sm ${
        recording
          ? "bg-red-500 hover:bg-red-600"
          : "bg-green-500 hover:bg-green-600"
      }`}
    >
      {recording ? "Stop" : "Record"}
    </button>
  );
}
