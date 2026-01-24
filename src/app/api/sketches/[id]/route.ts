import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabase-server";

export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase
    .from("sketch")
    .select(`
      *,
      sketch_media (
        *,
        media (*)
      ),
      sketch_state (*)
    `)
    .eq("id", params.id)
    .single();

  if (error) {
    return NextResponse.json(error, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("sketch")
    .update(body)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(error, { status: 500 });
  }

  return NextResponse.json(data);
}
