"use client";

export default function MediaUploader({
  sketchId,
  kind,
}: {
  sketchId: string;
  kind: "image" | "video" | "audio";
}) {
  const handleUpload = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
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
      alert("Error subiendo archivo");
      return;
    }

    console.log("🔗 Media response:", media);
    console.log("🔗 sketchId:", sketchId);
    console.log("🔗 media.id:", media?.id);

    const payload = {
      sketch_id: sketchId,
      media_id: media?.id,
    };
    console.log("🔗 Full payload being sent:", payload);

    const linkRes = await fetch("/api/sketch_media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!linkRes.ok) {
      const err = await linkRes.text();
      console.error("Fallo link sketch_media", linkRes.status, err);
      alert("Error vinculando media al Space");
      return;
    }

    window.location.reload();
  };

  const getAccept = () => {
    if (kind === "image") return "image/*";
    if (kind === "video") return "video/*";
    return "audio/*,audio/mpeg,audio/mp3,audio/wav,audio/ogg";
  };

  return (
    <label className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer text-sm">
      + {kind}
      <input
        type="file"
        accept={getAccept()}
        {...(kind === "audio" && { capture: "user" as any })} // ✅ Fix TypeScript error
        hidden
        onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
      />
    </label>
  );
}
