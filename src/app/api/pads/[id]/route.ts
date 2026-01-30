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
