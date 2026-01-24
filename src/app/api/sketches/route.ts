import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabase-server";
import { adminAuth } from "@/lib/firebase/firebase-admin";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json({ error: "No auth header" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = await adminAuth.verifyIdToken(token);
    const { uid } = decoded;

    const { name } = await req.json();

    const { data, error } = await supabase
      .from("sketch")
      .insert({
        name,
        user_uid: uid,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
