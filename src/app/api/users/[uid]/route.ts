export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabase-server";

export async function GET(
  _req: Request,
  context: { params: Record<string, string> }
) {
  console.log("CONTEXT:", context);

  const uid = context.params.uid;

  if (!uid) {
    return NextResponse.json(
      { error: "Missing uid" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("users")
    .select("uid, email, display_name, role")
    .eq("uid", uid)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
