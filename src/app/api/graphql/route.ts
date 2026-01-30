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
  channel_id?: string | null;
  article_media?: Array<{
    position: number;
    media: ArticleMedia | ArticleMedia[] | null;
  }>;
  channels?: ChannelRow | ChannelRow[] | null;
  users?: UserRow | UserRow[] | null;
};

type ChannelRow = {
  id: string;
  owner_uid: string;
  title: string;
  slug: string;
  description?: string | null;
  cover_media?: { url: string } | { url: string }[] | null;
};

type UserRow = {
  uid: string;
  display_name?: string | null;
};

type SketchRow = {
  id: string;
  name: string;
  user_uid: string;
  created_at: string;
  channel_id?: string | null;
  sketch_media?: Array<{
    z_index: number;
    media: ArticleMedia | ArticleMedia[] | null;
  }>;
  channels?: ChannelRow | ChannelRow[] | null;
  users?: UserRow | UserRow[] | null;
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

  type Author {
    uid: String!
    displayName: String
  }

  type Channel {
    id: ID!
    title: String!
    slug: String!
    description: String
    ownerUid: String!
    coverUrl: String
    owner: Author
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
    channel: Channel
    author: Author
  }

  type Pad {
    id: ID!
    title: String!
    ownerUid: String!
    createdAt: String!
    images: [String!]!
    videos: [String!]!
    audios: [String!]!
    media: [Media!]!
    channel: Channel
    author: Author
  }

  type Query {
    articles(authorUid: String, channelId: ID, limit: Int, offset: Int): [Article!]!
    recentArticles(limit: Int): [Article!]!
    article(id: ID!): Article
    pads(ownerUid: String, channelId: ID, limit: Int, offset: Int): [Pad!]!
    pad(id: ID!): Pad
    channels(limit: Int, offset: Int): [Channel!]!
    channelsByOwner(ownerUid: String!): [Channel!]!
    channelBySlug(ownerUid: String!, slug: String!): Channel
  }

  type Mutation {
    createChannel(
      ownerUid: String!
      title: String!
      slug: String!
      description: String
      coverMediaId: ID
    ): Channel
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

const mapChannel = (channel: ChannelRow) => {
  const cover = Array.isArray(channel.cover_media)
    ? channel.cover_media[0]
    : channel.cover_media;
  return {
    id: channel.id,
    title: channel.title,
    slug: channel.slug,
    description: channel.description ?? null,
    ownerUid: channel.owner_uid,
    coverUrl: cover?.url ?? null,
    owner: null,
  };
};

const mapChannelWithOwner = (channel: ChannelRow, owner?: UserRow | null) => {
  const cover = Array.isArray(channel.cover_media)
    ? channel.cover_media[0]
    : channel.cover_media;
  return {
    id: channel.id,
    title: channel.title,
    slug: channel.slug,
    description: channel.description ?? null,
    ownerUid: channel.owner_uid,
    coverUrl: cover?.url ?? null,
    owner: owner ? { uid: owner.uid, displayName: owner.display_name ?? null } : null,
  };
};

const mapArticle = (article: ArticleRow) => {
  const rawChannel = Array.isArray(article.channels)
    ? article.channels[0]
    : article.channels;
  const channel = rawChannel ? mapChannel(rawChannel) : null;

  const rawAuthor = Array.isArray(article.users) ? article.users[0] : article.users;
  const author = rawAuthor
    ? { uid: rawAuthor.uid, displayName: rawAuthor.display_name ?? null }
    : null;

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
    channel,
    author,
  };
};

const mapPad = (sketch: SketchRow) => {
  const rawChannel = Array.isArray(sketch.channels)
    ? sketch.channels[0]
    : sketch.channels;
  const channel = rawChannel ? mapChannel(rawChannel) : null;

  const rawAuthor = Array.isArray(sketch.users) ? sketch.users[0] : sketch.users;
  const author = rawAuthor
    ? { uid: rawAuthor.uid, displayName: rawAuthor.display_name ?? null }
    : null;

  const sorted = (sketch.sketch_media || [])
    .sort((a, b) => a.z_index - b.z_index)
    .map((sm) => (Array.isArray(sm.media) ? sm.media[0] : sm.media))
    .filter(Boolean) as ArticleMedia[];

  return {
    id: sketch.id,
    title: sketch.name,
    ownerUid: sketch.user_uid,
    createdAt: sketch.created_at,
    images: sorted.filter((m) => m.kind === "image").map((m) => m.url),
    videos: sorted.filter((m) => m.kind === "video").map((m) => m.url),
    audios: sorted.filter((m) => m.kind === "audio").map((m) => m.url),
    media: sorted,
    channel,
    author,
  };
};

const fetchArticles = async ({
  authorUid,
  channelId,
  limit,
  offset,
}: {
  authorUid?: string | null;
  channelId?: string | null;
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
      channel_id,
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
      ),
      channels (
        id,
        owner_uid,
        title,
        slug,
        description,
        cover_media:media (url)
      ),
      users (
        uid,
        display_name
      )
    `
    )
    .order("created_at", { ascending: false })
    .range(safeOffset, safeOffset + safeLimit - 1);

  if (authorUid) {
    query = query.eq("author_uid", authorUid);
  }
  if (channelId) {
    query = query.eq("channel_id", channelId);
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
      channel_id,
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
      ),
      channels (
        id,
        owner_uid,
        title,
        slug,
        description,
        cover_media:media (url)
      ),
      users (
        uid,
        display_name
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  if (!data) return null;

  return mapArticle(data as ArticleRow);
};

const fetchPads = async ({
  ownerUid,
  channelId,
  limit,
  offset,
}: {
  ownerUid?: string | null;
  channelId?: string | null;
  limit?: number | null;
  offset?: number | null;
}) => {
  const safeLimit = clampLimit(limit);
  const safeOffset = clampOffset(offset);

  let query = supabase
    .from("sketch")
    .select(
      `
      id,
      name,
      user_uid,
      channel_id,
      created_at,
      sketch_media (
        z_index,
        media (
          id,
          url,
          kind,
          width,
          height,
          duration
        )
      ),
      channels (
        id,
        owner_uid,
        title,
        slug,
        description,
        cover_media:media (url)
      ),
      users (
        uid,
        display_name
      )
    `
    )
    .order("created_at", { ascending: false })
    .range(safeOffset, safeOffset + safeLimit - 1);

  if (ownerUid) {
    query = query.eq("user_uid", ownerUid);
  }
  if (channelId) {
    query = query.eq("channel_id", channelId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((sketch) => mapPad(sketch as SketchRow));
};

const fetchPadById = async (id: string) => {
  const { data, error } = await supabase
    .from("sketch")
    .select(
      `
      id,
      name,
      user_uid,
      channel_id,
      created_at,
      sketch_media (
        z_index,
        media (
          id,
          url,
          kind,
          width,
          height,
          duration
        )
      ),
      channels (
        id,
        owner_uid,
        title,
        slug,
        description,
        cover_media:media (url)
      ),
      users (
        uid,
        display_name
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  if (!data) return null;
  return mapPad(data as SketchRow);
};

const fetchChannelsByOwner = async (ownerUid: string) => {
  const { data, error } = await supabase
    .from("channels")
    .select(
      `
      id,
      owner_uid,
      title,
      slug,
      description,
      cover_media:media (url),
      users (
        uid,
        display_name
      )
    `
    )
    .eq("owner_uid", ownerUid)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map((row: any) =>
    mapChannelWithOwner(
      row as ChannelRow,
      Array.isArray(row.users) ? row.users[0] : row.users
    )
  );
};

const fetchChannelBySlug = async (ownerUid: string, slug: string) => {
  const { data, error } = await supabase
    .from("channels")
    .select(
      `
      id,
      owner_uid,
      title,
      slug,
      description,
      cover_media:media (url),
      users (
        uid,
        display_name
      )
    `
    )
    .eq("owner_uid", ownerUid)
    .eq("slug", slug)
    .single();

  if (error) throw error;
  if (!data) return null;
  const owner = Array.isArray((data as any).users) ? (data as any).users[0] : (data as any).users;
  return mapChannelWithOwner(data as ChannelRow, owner ?? null);
};

const fetchChannels = async ({
  limit,
  offset,
}: {
  limit?: number | null;
  offset?: number | null;
}) => {
  const safeLimit = clampLimit(limit);
  const safeOffset = clampOffset(offset);

  const { data, error } = await supabase
    .from("channels")
    .select(
      `
      id,
      owner_uid,
      title,
      slug,
      description,
      cover_media:media (url),
      users (
        uid,
        display_name
      )
    `
    )
    .order("created_at", { ascending: false })
    .range(safeOffset, safeOffset + safeLimit - 1);

  if (error) throw error;
  return (data || []).map((row: any) =>
    mapChannelWithOwner(
      row as ChannelRow,
      Array.isArray(row.users) ? row.users[0] : row.users
    )
  );
};

const createChannel = async ({
  ownerUid,
  title,
  slug,
  description,
  coverMediaId,
}: {
  ownerUid: string;
  title: string;
  slug: string;
  description?: string | null;
  coverMediaId?: string | null;
}) => {
  const { data, error } = await supabase
    .from("channels")
    .insert({
      owner_uid: ownerUid,
      title,
      slug,
      description: description ?? null,
      cover_media_id: coverMediaId ?? null,
    })
    .select(
      `
      id,
      owner_uid,
      title,
      slug,
      description,
      cover_media:media (url),
      users (
        uid,
        display_name
      )
    `
    )
    .single();

  if (error) throw error;
  if (!data) return null;
  const owner = Array.isArray((data as any).users) ? (data as any).users[0] : (data as any).users;
  return mapChannelWithOwner(data as ChannelRow, owner ?? null);
};

const root = {
  articles: ({
    authorUid,
    channelId,
    limit,
    offset,
  }: {
    authorUid?: string;
    channelId?: string;
    limit?: number;
    offset?: number;
  }) => fetchArticles({ authorUid, channelId, limit, offset }),
  recentArticles: ({ limit }: { limit?: number }) => fetchArticles({ limit }),
  article: ({ id }: { id: string }) => fetchArticleById(id),
  pads: ({
    ownerUid,
    channelId,
    limit,
    offset,
  }: {
    ownerUid?: string;
    channelId?: string;
    limit?: number;
    offset?: number;
  }) => fetchPads({ ownerUid, channelId, limit, offset }),
  pad: ({ id }: { id: string }) => fetchPadById(id),
  channels: ({ limit, offset }: { limit?: number; offset?: number }) =>
    fetchChannels({ limit, offset }),
  channelsByOwner: ({ ownerUid }: { ownerUid: string }) => fetchChannelsByOwner(ownerUid),
  channelBySlug: ({ ownerUid, slug }: { ownerUid: string; slug: string }) =>
    fetchChannelBySlug(ownerUid, slug),
  createChannel: ({
    ownerUid,
    title,
    slug,
    description,
    coverMediaId,
  }: {
    ownerUid: string;
    title: string;
    slug: string;
    description?: string;
    coverMediaId?: string;
  }) =>
    createChannel({
      ownerUid,
      title,
      slug,
      description,
      coverMediaId,
    }),
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
