export function getMediaKind(
  file: File,
  cloudinaryResourceType: string
): "image" | "video" | "audio" {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const audioExts = ["mp3", "wav", "ogg", "m4a", "aac", "flac", "wma", "aiff"];

  if (audioExts.includes(ext)) {
    return "audio";
  }

  return cloudinaryResourceType === "image" ? "image" : "video";
}
