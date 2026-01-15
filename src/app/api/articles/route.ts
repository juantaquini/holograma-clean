import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabase-server";
import cloudinary from "@/lib/cloudinary/cloudinary";

export const runtime = "nodejs";

type ArticleMedia = {
  id: string;
  url: string;
  kind: "image" | "video" | "audio";
  width?: number | null;
  height?: number | null;
  duration?: number | null;
};

type Article = {
  id: string;
  title: string;
  artist?: string;
  content: string;
  author_uid: string;
  created_at: string;
  images: string[];
  videos: string[];
  audios: string[];
  media: ArticleMedia[];
};

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("article")
      .select(
        `
        id,
        title,
        artist,
        content,
        author_uid,
        created_at,
        article_media (
          position,
          media (
            id,
            url,
            kind,
            width,
            height,
            duration
          )
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    const articles: Article[] = (data || []).map((article: any) => {
      const sorted = (article.article_media || [])
        .sort((a: any, b: any) => a.position - b.position)
        .map((am: any) => am.media)
        .filter(Boolean);

      return {
        ...article,
        images: sorted
          .filter((m: any) => m.kind === "image")
          .map((m: any) => m.url),
        videos: sorted
          .filter((m: any) => m.kind === "video")
          .map((m: any) => m.url),
        audios: sorted
          .filter((m: any) => m.kind === "audio")
          .map((m: any) => m.url),
        media: sorted,
      };
    });

    return NextResponse.json(articles, { status: 200 });
  } catch (err: any) {
    console.error("❌ GET ARTICLES ERROR:", err);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const title = formData.get("title") as string;
    const artist = formData.get("artist") as string;
    const content = formData.get("content") as string;
    const author_uid = formData.get("author_uid") as string;

    if (!title || !author_uid) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    /* =======================
       1️⃣ CREATE ARTICLE
       ======================= */

    const { data: article, error: articleError } = await supabase
      .from("article")
      .insert({
        title,
        artist,
        content,
        author_uid,
      })
      .select()
      .single();

    if (articleError) throw articleError;

    /* =======================
       2️⃣ ASSOCIATE MEDIA
       ======================= */

    const mediaRaw = formData.getAll("media_ids[]") as string[];

    if (mediaRaw.length > 0) {
      const rows = mediaRaw.map((item) => {
        const { id, position } = JSON.parse(item);
        return {
          article_id: article.id,
          media_id: id,
          position,
        };
      });

      const { error: linkError } = await supabase
        .from("article_media")
        .insert(rows);

      if (linkError) throw linkError;

      /* =======================
         3️⃣ FINALIZE MEDIA
         ======================= */

      const mediaIds = rows.map((r) => r.media_id);

      const { error: mediaUpdateError } = await supabase
        .from("media")
        .update({
          status: "ready",
          session_id: null,
        })
        .in("id", mediaIds);

      if (mediaUpdateError) throw mediaUpdateError;
    }

    /* =======================
       DONE
       ======================= */

    return NextResponse.json(
      { success: true, article_id: article.id },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("❌ CREATE ARTICLE ERROR:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
