import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabase-server";
import cloudinary from "@/lib/cloudinary/cloudinary";

export const runtime = "nodejs";

function getMediaKind(fileName: string, cloudinaryResourceType: string): "image" | "video" | "audio" {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const audioExts = ["mp3", "wav", "ogg", "m4a", "aac", "flac", "wma", "aiff"];
  
  if (audioExts.includes(ext)) {
    return "audio";
  }
  
  return cloudinaryResourceType === "image" ? "image" : "video";
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = Number(idParam);

  if (!id || isNaN(id)) {
    return NextResponse.json(
      { error: "Valid Article ID is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("article")
    .select(
      `
      id,
      title,
      artist,
      content,
      author_uid,
      created_at,
      article_media (
        position,
        media (
          id,
          url,
          kind,
          width,
          height,
          duration
        )
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const sorted = (data.article_media || [])
    .sort((a: any, b: any) => a.position - b.position)
    .map((am: any) => am.media)
    .filter(Boolean);

  const article = {
    ...data,
    images: sorted
      .filter((m: any) => m.kind === "image")
      .map((m: any) => m.url),
    videos: sorted
      .filter((m: any) => m.kind === "video")
      .map((m: any) => m.url),
    audios: sorted
      .filter((m: any) => m.kind === "audio")
      .map((m: any) => m.url),
    media: sorted,
  };

  return NextResponse.json(article);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const articleId = Number(idParam);

    if (!articleId || isNaN(articleId)) {
      return NextResponse.json(
        { error: "Invalid article id" },
        { status: 400 }
      );
    }

    const formData = await req.formData();

    /* 1️⃣ Update article */
    const { error: articleError } = await supabase
      .from("article")
      .update({
        title: formData.get("title"),
        artist: formData.get("artist"),
        content: formData.get("content"),
      })
      .eq("id", articleId);

    if (articleError) throw articleError;

    /* 2️⃣ Remove deleted media */
    const removed = formData.getAll("removed_media_ids[]") as string[];

    if (removed.length > 0) {
      const { error: removeError } = await supabase
        .from("article_media")
        .delete()
        .eq("article_id", articleId)
        .in("media_id", removed);

      if (removeError) throw removeError;
    }

    /* 3️⃣ Update positions of existing media */
    const positionsRaw = formData.getAll("media_positions[]") as string[];

    for (const item of positionsRaw) {
      const { id: mediaId, position } = JSON.parse(item);

      const { error: posError } = await supabase
        .from("article_media")
        .update({ position })
        .eq("article_id", articleId)
        .eq("media_id", mediaId);

      if (posError) throw posError;
    }

    /* 4️⃣ Add new media (already uploaded to /api/media) */
    const mediaIdsRaw = formData.getAll("media_ids[]") as string[];

    if (mediaIdsRaw.length > 0) {
      const rows = mediaIdsRaw.map((item) => {
        const { id, position } = JSON.parse(item);
        return {
          article_id: articleId,
          media_id: id,
          position,
        };
      });

      const { error: linkError } = await supabase
        .from("article_media")
        .insert(rows);

      if (linkError) throw linkError;

      /* 5️⃣ Finalize media (change status from temp to ready) */
      const mediaIds = rows.map((r) => r.media_id);

      const { error: mediaUpdateError } = await supabase
        .from("media")
        .update({
          status: "ready",
          session_id: null,
        })
        .in("id", mediaIds);

      if (mediaUpdateError) throw mediaUpdateError;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("❌ UPDATE ARTICLE ERROR:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}