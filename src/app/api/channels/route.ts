import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabase-server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { owner_uid, title, slug, description, cover_media_id } = body || {};

    if (!owner_uid || !title || !slug) {
      return NextResponse.json(
        { error: "owner_uid, title, and slug are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("channels")
      .insert({
        owner_uid,
        title,
        slug,
        description: description ?? null,
        cover_media_id: cover_media_id ?? null,
      })
      .select(
        `
        id,
        owner_uid,
        title,
        slug,
        description,
        cover_media:media (url)
      `
      )
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error("❌ CREATE CHANNEL ERROR:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to create channel" },
      { status: 500 }
    );
  }
}
