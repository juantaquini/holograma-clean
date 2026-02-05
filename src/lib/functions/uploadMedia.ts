import { MediaKind } from "@/types/media";

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

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid server response");
  }

  if (!res.ok) {
    throw new Error(data?.error ?? "Upload failed");
  }

  return {
    id: data.id,
    url: data.url,
    kind: data.kind,
  };
}
