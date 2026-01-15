import { MediaKind } from "@/types/article";

export async function uploadMedia(
  file: File,
  sessionId: string
): Promise<{
  id: string;
  url: string;
  kind: MediaKind;
}> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("session_id", sessionId);

  const res = await fetch("/api/media", {
    method: "POST",
    body: fd,
  });

  if (!res.ok) throw new Error("Upload failed");

  return res.json();
}
