import { NextResponse } from "next/server";
import { graphql, buildSchema } from "graphql";
import { supabase } from "@/lib/supabase/supabase-server";

export const runtime = "nodejs";

type ArticleMedia = {
  id: string;
  url: string;
  kind: "image" | "video" | "audio";
  width?: number | null;
  height?: number | null;
  duration?: number | null;
};

type ArticleRow = {
  id: string;
  title: string;
  artist?: string | null;
  content?: string | null;
  author_uid: string;
  created_at: string;
  article_media?: Array<{
    position: number;
    media: ArticleMedia | ArticleMedia[] | null;
  }>;
};

const schema = buildSchema(`
  type Media {
    id: ID!
    url: String!
    kind: String!
    width: Float
    height: Float
    duration: Float
  }

  type Article {
    id: ID!
    title: String!
    artist: String
    content: String
    authorUid: String!
    createdAt: String!
    images: [String!]!
    videos: [String!]!
    audios: [String!]!
    media: [Media!]!
  }

  type Query {
    articles(authorUid: String, limit: Int, offset: Int): [Article!]!
    recentArticles(limit: Int): [Article!]!
    article(id: ID!): Article
  }
`);
const DEFAULT_LIMIT = 48;
const MAX_LIMIT = 100;

const clampLimit = (limit?: number | null) => {
  const value = limit && Number.isFinite(limit) ? Math.floor(limit) : DEFAULT_LIMIT;
  return Math.min(Math.max(value, 1), MAX_LIMIT);
};

const clampOffset = (offset?: number | null) => {
  const value = offset && Number.isFinite(offset) ? Math.floor(offset) : 0;
  return Math.max(value, 0);
};

const mapArticle = (article: ArticleRow) => {
  const sorted = (article.article_media || [])
    .sort((a, b) => a.position - b.position)
    .map((am) => (Array.isArray(am.media) ? am.media[0] : am.media))
    .filter(Boolean) as ArticleMedia[];

  return {
    id: article.id,
    title: article.title,
    artist: article.artist ?? null,
    content: article.content ?? null,
    authorUid: article.author_uid,
    createdAt: article.created_at,
    images: sorted.filter((m) => m.kind === "image").map((m) => m.url),
    videos: sorted.filter((m) => m.kind === "video").map((m) => m.url),
    audios: sorted.filter((m) => m.kind === "audio").map((m) => m.url),
    media: sorted,
  };
};

const fetchArticles = async ({
  authorUid,
  limit,
  offset,
}: {
  authorUid?: string | null;
  limit?: number | null;
  offset?: number | null;
}) => {
  const safeLimit = clampLimit(limit);
  const safeOffset = clampOffset(offset);

  let query = supabase
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
    .order("created_at", { ascending: false })
    .range(safeOffset, safeOffset + safeLimit - 1);

  if (authorUid) {
    query = query.eq("author_uid", authorUid);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((article) => mapArticle(article as ArticleRow));
};

const fetchArticleById = async (id: string) => {
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
    .eq("id", id)
    .single();

  if (error) throw error;
  if (!data) return null;

  return mapArticle(data as ArticleRow);
};

const root = {
  articles: ({
    authorUid,
    limit,
    offset,
  }: {
    authorUid?: string;
    limit?: number;
    offset?: number;
  }) => fetchArticles({ authorUid, limit, offset }),
  recentArticles: ({ limit }: { limit?: number }) => fetchArticles({ limit }),
  article: ({ id }: { id: string }) => fetchArticleById(id),
};

export async function POST(req: Request) {
  try {
    const { query, variables } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { errors: [{ message: "Missing GraphQL query" }] },
        { status: 400 }
      );
    }

    const result = await graphql({
      schema,
      source: query,
      rootValue: root,
      variableValues: variables ?? {},
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("❌ GRAPHQL ERROR:", err);
    return NextResponse.json(
      { errors: [{ message: err.message ?? "GraphQL error" }] },
      { status: 500 }
    );
  }
}
