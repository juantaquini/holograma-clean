import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabase-server";
import { v4 as uuid } from "uuid";

export async function POST(req: Request) {
  const { sketch_id, name, data } = await req.json();

  const { data: state, error } = await supabase
    .from("sketch_state")
    .insert({
      id: uuid(),
      sketch_id,
      name,
      data,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(error, { status: 500 });
  }

  return NextResponse.json(state);
}
