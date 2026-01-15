import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary/cloudinary";
import { supabase } from "@/lib/supabase/supabase-server";
import { getMediaKind } from "@/lib/functions/getMediaKind";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const formData = await req.formData();

  const file = formData.get("file") as File;
  const sessionId = formData.get("session_id") as string;

  if (!file || !sessionId) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const upload = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { resource_type: "auto", folder: "articles/temp" },
      (err, res) => (err ? reject(err) : resolve(res))
    ).end(buffer);
  });

  const kind = getMediaKind(file, upload.resource_type);

  const { data, error } = await supabase
    .from("media")
    .insert({
      url: upload.secure_url,
      public_id: upload.public_id,
      provider: "cloudinary",
      kind,
      status: "temp",
      session_id: sessionId,
      width: upload.width ?? null,
      height: upload.height ?? null,
      duration: upload.duration ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  return NextResponse.json(data);
}

export { getMediaKind };