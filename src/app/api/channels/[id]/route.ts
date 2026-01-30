import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabase-server";

export const runtime = "nodejs";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Channel id is required" }, { status: 400 });
    }

    const body = await req.json();
    const { title, slug, description, cover_media_id } = body || {};

    if (!title || !slug) {
      return NextResponse.json(
        { error: "title and slug are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("channels")
      .update({
        title,
        slug,
        description: description ?? null,
        cover_media_id: cover_media_id ?? null,
      })
      .eq("id", id)
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

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error("❌ UPDATE CHANNEL ERROR:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to update channel" },
      { status: 500 }
    );
  }
}
