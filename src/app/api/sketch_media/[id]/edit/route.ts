import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabase-server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    // Permitir actualizar campos como x, y, scale, rotation, opacity, volume, loop, blend_mode, media_id
    const allowed = ["x","y","scale","rotation","opacity","volume","loop","blend_mode","media_id"];
    const update: any = {};
    for (const key of allowed) if (key in body) update[key] = body[key];
    const { data, error } = await supabase
      .from("sketch_media")
      .update(update)
      .eq("id", params.id)
      .select("*,media(*)")
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
