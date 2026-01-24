"use client";

import MediaUploader from "./MediaUploader";
import AudioRecorder from "./AudioRecorder";

export default function PadToolbar({ sketchId }: { sketchId: string }) {
  return (
    <div className="flex gap-4 p-4 border-b border-white/10 bg-black/40 backdrop-blur">
      <MediaUploader sketchId={sketchId} kind="image" />
      <MediaUploader sketchId={sketchId} kind="video" />
      <MediaUploader sketchId={sketchId} kind="audio" />
      <AudioRecorder sketchId={sketchId} />
    </div>
  );
}
