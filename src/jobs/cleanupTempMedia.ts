// src/jobs/cleanupTempMedia.ts
import cloudinary from "@/lib/cloudinary/cloudinary";
import { supabase } from "@/lib/supabase/supabase-server";

export async function cleanupTempMedia() {
  const { data: media, error } = await supabase
    .from("media")
    .select("id, public_id")
    .eq("status", "temp")
    .lt("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

  if (error) throw error;

  for (const m of media ?? []) {
    try {
      await cloudinary.uploader.destroy(m.public_id, {
        resource_type: "auto",
      });

      await supabase.from("media").delete().eq("id", m.id);
    } catch (e) {
      console.error("Cleanup failed for media", m.id, e);
    }
  }
}
