import { NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2/r2-client";
import { supabase } from "@/lib/supabase/supabase-server";
import { getMediaKind } from "@/lib/functions/getMediaKind";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;
    const sessionId = formData.get("session_id") as string;

    console.log("📤 Upload iniciado:", { 
      fileName: file?.name, 
      sessionId,
      hasFile: !!file 
    });

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const effectiveSessionId = sessionId || Math.random().toString(36).slice(2);

    // Converter file para buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log("📦 Buffer criado:", buffer.length, "bytes");

    // Gerar key único para R2
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const ext = file.name.split(".").pop() || "bin";
    const key = `articles/temp/${effectiveSessionId}/${timestamp}-${randomStr}.${ext}`;

    console.log("🔑 Key gerada:", key);

    // Upload para R2
    console.log("☁️ Iniciando upload para R2...");
    const url = await uploadToR2(buffer, key, file.type);
    console.log("✅ Upload R2 completo:", url);

    // Determinar kind do media
    const kind = getMediaKind(file);
    console.log("🎯 Kind detectado:", kind);

    // Obter dimensões/duração se for imagem ou vídeo
    let width: number | null = null;
    let height: number | null = null;
    let duration: number | null = null;

    // Salvar no Supabase
    console.log("💾 Salvando no Supabase...");
    const { data, error } = await supabase
      .from("media")
      .insert({
        url,
        public_id: key,
        provider: "r2",
        kind,
        status: "temp",
        session_id: effectiveSessionId,
        width,
        height,
        duration,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Erro Supabase:", error);
      throw error;
    }

    console.log("✅ Media salvo:", data.id);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("❌ MEDIA UPLOAD ERROR:", err);
    console.error("Stack:", err.stack);
    return NextResponse.json(
      { error: err.message ?? "Upload failed", details: err.toString() },
      { status: 500 }
    );
  }
}