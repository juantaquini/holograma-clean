import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabase-server";
import { v4 as uuid } from "uuid";

export async function POST(req: Request) {
  try {
    const {
      sketch_id,
      media_id,
      x = 0.5,
      y = 0.5,
      scale = 1,
      rotation = 0,
      opacity = 1,
      volume = 1,
      loop = true,
      blend_mode = "normal",
    } = await req.json();

    console.log("🟢 sketch_media payload", {
      sketch_id,
      media_id,
      x,
      y,
      scale,
      rotation,
      opacity,
      volume,
      loop,
      blend_mode,
    });

    if (!sketch_id || typeof sketch_id !== "string" || !sketch_id.trim()) {
      return NextResponse.json({ error: "Missing sketch_id" }, { status: 400 });
    }

    if (!media_id || typeof media_id !== "string" || !media_id.trim()) {
      return NextResponse.json({ error: "Missing media_id" }, { status: 400 });
    }

    const { data: sketchExists } = await supabase
      .from("sketch")
      .select("id")
      .eq("id", sketch_id)
      .single();

    if (!sketchExists) {
      return NextResponse.json({ error: "Sketch not found" }, { status: 404 });
    }

    const { data: mediaExists } = await supabase
      .from("media")
      .select("id,status,session_id")
      .eq("id", media_id)
      .single();

    if (!mediaExists) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("sketch_media")
      .insert({
        id: uuid(),
        sketch_id,
        media_id,
        x,
        y,
        scale,
        rotation,
        opacity,
        volume,
        loop,
        blend_mode,
        z_index: Math.floor(Date.now() / 1000), // ✅ Timestamp en segundos (mucho más chico)
      })
      .select(
        `
        *,
        media (*)
      `,
      )
      .single();

    if (error) throw error;

    const { error: mediaUpdateError } = await supabase
      .from("media")
      .update({ status: "ready", session_id: null })
      .eq("id", media_id);

    if (mediaUpdateError) throw mediaUpdateError;

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("❌ SKETCH_MEDIA POST ERROR:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal error" },
      { status: 500 },
    );
  }
}
