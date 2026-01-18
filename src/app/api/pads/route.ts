import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabase-server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();
  const { title, audio_url, config, user_id } = body;

  if (!user_id || !audio_url) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("pads")
    .insert({
      title: title || "Untitled Pad",
      audio_url,
      config: config || {},
      user_id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("pads")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}