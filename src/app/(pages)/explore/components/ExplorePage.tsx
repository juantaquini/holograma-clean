"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./ExplorePage.module.css";
import { fetchGraphQL } from "@/lib/graphql/fetchGraphQL";
import { useAuth } from "@/app/(providers)/auth-provider";
import LoadingSketch from "@/components/p5/loading/LoadingSketch";
import {
  ContentFeedWithLines,
  type Channel,
  type Pad,
  type Article,
  type ContentSection,
} from "@/components/content-feed";

type ExploreChannelsData = { channels: Channel[] };
type PadData = { pads: Pad[] };
type ArticleData = { articles: Article[] };

const CHANNELS_QUERY = `
  query Channels($limit: Int!, $offset: Int!) {
    channels(limit: $limit, offset: $offset) {
      id
      title
      slug
      ownerUid
      coverUrl
      owner { uid displayName }
    }
  }
`;

const PADS_QUERY = `
  query Pads($limit: Int!, $offset: Int!) {
    pads(limit: $limit, offset: $offset) {
      id
      title
      images
      channel { id title slug ownerUid }
    }
  }
`;

const ARTICLES_QUERY = `
  query Articles($limit: Int!) {
    articles(limit: $limit) {
      id
      title
      images
      channel { id title slug ownerUid }
    }
  }
`;

const ExplorePage = () => {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [pads, setPads] = useState<Pad[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [channelsData, padsData, articlesData] = await Promise.all([
          fetchGraphQL<ExploreChannelsData>(CHANNELS_QUERY, { limit: 48, offset: 0 }),
          fetchGraphQL<PadData>(PADS_QUERY, { limit: 48, offset: 0 }),
          fetchGraphQL<ArticleData>(ARTICLES_QUERY, { limit: 48 }),
        ]);
        setChannels(channelsData.channels ?? []);
        setPads(padsData.pads ?? []);
        setArticles(articlesData.articles ?? []);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "Unable to load explore.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const sections = useMemo((): ContentSection[] => {
    const map = new Map<string, ContentSection>();
    pads.forEach((pad) => {
      const key = pad.channel?.id ?? "uncategorized";
      if (!map.has(key)) {
        map.set(key, {
          channelId: key,
          title: pad.channel?.title ?? "Uncategorized",
          slug: pad.channel?.slug ?? null,
          ownerUid: pad.channel?.ownerUid ?? null,
          pads: [],
          articles: [],
        });
      }
      map.get(key)!.pads.push(pad);
    });
    articles.forEach((article) => {
      const key = article.channel?.id ?? "uncategorized";
      if (!map.has(key)) {
        map.set(key, {
          channelId: key,
          title: article.channel?.title ?? "Uncategorized",
          slug: article.channel?.slug ?? null,
          ownerUid: article.channel?.ownerUid ?? null,
          pads: [],
          articles: [],
        });
      }
      map.get(key)!.articles.push(article);
    });
    return Array.from(map.values());
  }, [pads, articles]);

  if (isLoading) {
    return (
      <div className={styles["explore-container"]}>
        <LoadingSketch />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles["explore-container"]}>
        <div className={styles["explore-error"]}>{error}</div>
      </div>
    );
  }

  const emptyMessage = (
    <div className={styles["explore-empty"]}>
      <p className={styles["explore-empty-text"]}>No content yet.</p>
      {user && (
        <Link className={styles["explore-empty-button"]} href="/channels/create">
          Create channel
        </Link>
      )}
    </div>
  );

  return (
    <div className={`${styles["explore-container"]} explore-page-container`}>
      <ContentFeedWithLines
        channels={channels}
        sections={sections}
        emptyMessage={emptyMessage}
        persistChannelKey="explore"
      />
    </div>
  );
};

export default ExplorePage;
