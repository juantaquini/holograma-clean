import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabase-server";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("sketch")
    .select(
      `
      id,
      name,
      user_uid,
      channel_id,
      created_at,
      config,
      sketch_media (
        z_index,
        x,
        y,
        scale,
        rotation,
        opacity,
        volume,
        loop,
        blend_mode,
        color,
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
    return NextResponse.json({ error: "Pad not found" }, { status: 404 });
  }

  const sorted = (data.sketch_media || [])
    .sort((a: any, b: any) => a.z_index - b.z_index)
    .map((sm: any) => {
      const media = Array.isArray(sm.media) ? sm.media[0] : sm.media;
      if (!media) return null;
      return {
        id: media.id,
        url: media.url,
        kind: media.kind,
        width: media.width ?? null,
        height: media.height ?? null,
        duration: media.duration ?? null,
        x: sm.x ?? 0,
        y: sm.y ?? 0,
        scale: sm.scale ?? 1,
        rotation: sm.rotation ?? 0,
        opacity: sm.opacity ?? 1,
        volume: sm.volume ?? 1,
        loop: sm.loop ?? true,
        blendMode: sm.blend_mode ?? "normal",
        color: sm.color ?? null,
        zIndex: sm.z_index ?? 0,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    url: string;
    kind: string;
    width?: number | null;
    height?: number | null;
    duration?: number | null;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    opacity: number;
    volume: number;
    loop: boolean;
    blendMode: string;
    color?: string | null;
    zIndex: number;
  }>;

  const pad = {
    id: data.id,
    title: data.name,
    ownerUid: data.user_uid,
    channelId: data.channel_id,
    createdAt: data.created_at,
    config: data.config ?? {},
    images: sorted.filter((m) => m.kind === "image").map((m) => m.url),
    videos: sorted.filter((m) => m.kind === "video").map((m) => m.url),
    audios: sorted.filter((m) => m.kind === "audio").map((m) => m.url),
    media: sorted,
  };

  return NextResponse.json(pad, { status: 200 });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Pad id is required" }, { status: 400 });
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const channel_id = formData.get("channel_id") as string;
    const configRaw = formData.get("config") as string | null;

    let config: Record<string, any> = {};
    if (configRaw) {
      try {
        config = JSON.parse(configRaw);
      } catch {
        return NextResponse.json({ error: "Invalid config" }, { status: 400 });
      }
    }

    if (!title) {
      return NextResponse.json({ error: "Missing title" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("sketch")
      .update({
        name: title,
        channel_id: channel_id || null,
        config,
      })
      .eq("id", id);

    if (updateError) throw updateError;

    const { error: deleteError } = await supabase
      .from("sketch_media")
      .delete()
      .eq("sketch_id", id);

    if (deleteError) throw deleteError;

    const mediaRaw = formData.getAll("media_ids[]") as string[];

    if (mediaRaw.length > 0) {
      const rows = mediaRaw.map((item, index) => {
        const { id: mediaId } = JSON.parse(item);
        return {
          sketch_id: id,
          media_id: mediaId,
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          opacity: 1,
          volume: 1,
          loop: true,
          blend_mode: "normal",
          color: null,
          z_index: index,
        };
      });

      const { error: linkError } = await supabase
        .from("sketch_media")
        .insert(rows);

      if (linkError) throw linkError;

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
    console.error("❌ UPDATE PAD ERROR:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
