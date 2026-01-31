import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabase-server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const title = formData.get("title") as string;
    const owner_uid = formData.get("owner_uid") as string;
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

    if (!title || !owner_uid) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { data: sketch, error: sketchError } = await supabase
      .from("sketch")
      .insert({
        name: title,
        user_uid: owner_uid,
        channel_id: channel_id || null,
        config,
      })
      .select()
      .single();

    if (sketchError) throw sketchError;

    const mediaRaw = formData.getAll("media_ids[]") as string[];

    if (mediaRaw.length > 0) {
      const rows = mediaRaw.map((item, index) => {
        const { id } = JSON.parse(item);
        return {
          sketch_id: sketch.id,
          media_id: id,
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

    return NextResponse.json({ success: true, pad_id: sketch.id }, { status: 201 });
  } catch (err: any) {
    console.error("❌ CREATE PAD ERROR:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
