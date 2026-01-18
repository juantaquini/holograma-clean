"use client";

import React, { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

interface AudioRecorderProps {
  onUploadComplete: (url: string) => void;
  userId: string;
}

export default function AudioRecorder({ onUploadComplete, userId }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        chunksRef.current = [];
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const uploadAudio = async () => {
    if (!audioBlob) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");
    formData.append("session_id", uuidv4()); // Just for tracking, not strictly needed for this flow

    try {
      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        onUploadComplete(data.url);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 items-center p-6 bg-white/5 rounded-xl border border-white/10">
      <div className="text-xl font-bold">Grabar Idea Latente</div>
      
      {!audioBlob ? (
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`px-6 py-3 rounded-full font-bold transition-all ${
            isRecording 
              ? "bg-red-500 hover:bg-red-600 animate-pulse" 
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isRecording ? "Detener Grabación" : "Iniciar Grabación"}
        </button>
      ) : (
        <div className="flex gap-4">
           <button
            onClick={() => setAudioBlob(null)}
            className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700"
          >
            Descartar
          </button>
          <button
            onClick={uploadAudio}
            disabled={isUploading}
            className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50"
          >
            {isUploading ? "Subiendo..." : "Guardar en Space"}
          </button>
        </div>
      )}
      
      {audioBlob && (
        <audio controls src={URL.createObjectURL(audioBlob)} className="mt-4" />
      )}
    </div>
  );
}