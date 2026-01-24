import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabase-server";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const { data, error } = await supabase
      .from("sketch_media")
      .update(body)
      .eq("id", params.id)
      .select(`
        *,
        media (*)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await supabase
    .from("sketch_media")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json(error, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
