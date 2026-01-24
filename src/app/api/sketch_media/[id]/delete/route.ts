import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabase-server";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase
      .from("sketch_media")
      .delete()
      .eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
