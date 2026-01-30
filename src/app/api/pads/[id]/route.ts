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
      sketch_media (
        z_index,
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
    .map((sm: any) => sm.media)
    .filter(Boolean);

  const pad = {
    id: data.id,
    title: data.name,
    ownerUid: data.user_uid,
    channelId: data.channel_id,
    createdAt: data.created_at,
    images: sorted.filter((m: any) => m.kind === "image").map((m: any) => m.url),
    videos: sorted.filter((m: any) => m.kind === "video").map((m: any) => m.url),
    audios: sorted.filter((m: any) => m.kind === "audio").map((m: any) => m.url),
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

    if (!title) {
      return NextResponse.json({ error: "Missing title" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("sketch")
      .update({
        name: title,
        channel_id: channel_id || null,
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
