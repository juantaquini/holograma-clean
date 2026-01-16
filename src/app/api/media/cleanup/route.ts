import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary/cloudinary";
import { supabase } from "@/lib/supabase/supabase-server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const text = await req.text();

  let session_id: string | undefined;

  console.log("CLEANUP session_id:", session_id);


  try {
    session_id = JSON.parse(text).session_id;
  } catch {
    session_id = undefined;
  }

  if (!session_id) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { data: media, error } = await supabase
    .from("media")
    .select("id, public_id")
    .eq("session_id", session_id)
    .eq("status", "temp");

    console.log("MEDIA FOUND:", media);

  if (error) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  for (const m of media ?? []) {
    try {
      await cloudinary.uploader.destroy(m.public_id, {
        resource_type: "auto",
      });

      await supabase.from("media").delete().eq("id", m.id);
    } catch (e) {
      console.error("Cleanup error:", m.id, e);
    }
  }

  return NextResponse.json({ ok: true });
}
