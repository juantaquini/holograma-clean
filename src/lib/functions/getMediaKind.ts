import { MediaKind } from "@/types/article";

export function getMediaKind(file: File): MediaKind {
  const mimeType = file.type.toLowerCase();
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  // Audio extensions
  const audioExts = ["mp3", "wav", "ogg", "m4a", "aac", "flac", "wma", "aiff"];
  
  // Check by MIME type first
  if (mimeType.startsWith("audio/") || audioExts.includes(ext)) {
    return "audio";
  }
  
  if (mimeType.startsWith("image/")) {
    return "image";
  }
  
  if (mimeType.startsWith("video/")) {
    return "video";
  }

  // Fallback to extension
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];
  const videoExts = ["mp4", "mov", "avi", "mkv", "webm", "flv", "wmv"];

  if (imageExts.includes(ext)) {
    return "image";
  }
  
  if (videoExts.includes(ext)) {
    return "video";
  }

  // Default to image if uncertain
  return "image";
}