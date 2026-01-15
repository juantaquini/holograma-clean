import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/firebase-admin";
import { supabase } from "@/lib/supabase/supabase-server";

export async function POST(req: NextRequest) {
  console.log("🟢 /api/auth/sync HIT");

  const authHeader = req.headers.get("authorization");
  console.log("🟢 Authorization header:", authHeader?.slice(0, 30));

  if (!authHeader) {
    return NextResponse.json({ error: "No auth header" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");

  const decoded = await adminAuth.verifyIdToken(token);

  console.log("🟢 Decoded token:", decoded);

  const { uid, email, name } = decoded;

  const { data, error } = await supabase
    .from("users")
    .upsert({
      uid,
      email,
      display_name: name ?? null,
    })
    .select();

  console.log("🟢 Supabase data:", data);
  console.log("🔴 Supabase error:", error);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}
