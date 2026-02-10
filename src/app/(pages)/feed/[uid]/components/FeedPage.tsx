"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./FeedPage.module.css";
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

type PadData = { pads: Pad[] };
type ArticleData = { articles: Article[] };
type ChannelData = { channelsByOwner: Channel[] };

const PADS_QUERY = `
  query FeedPads($uid: String!, $limit: Int!) {
    pads(ownerUid: $uid, limit: $limit) {
      id
      title
      images
      channel { id title slug ownerUid }
    }
  }
`;

const ARTICLES_QUERY = `
  query FeedArticles($authorUid: String!, $limit: Int!) {
    articles(authorUid: $authorUid, limit: $limit) {
      id
      title
      images
      channel { id title slug ownerUid }
    }
  }
`;

const CHANNELS_QUERY = `
  query FeedChannels($uid: String!) {
    channelsByOwner(ownerUid: $uid) {
      id
      title
      slug
      coverUrl
      ownerUid
      owner { uid displayName }
    }
  }
`;

const FeedPage = ({ uid }: { uid: string }) => {
  const { user } = useAuth();
  const [pads, setPads] = useState<Pad[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOwnFeed = user?.uid === uid;

  useEffect(() => {
    const load = async () => {
      try {
        const [padsData, articlesData, channelsData] = await Promise.all([
          fetchGraphQL<PadData>(PADS_QUERY, { uid, limit: 96 }),
          fetchGraphQL<ArticleData>(ARTICLES_QUERY, { authorUid: uid, limit: 96 }),
          fetchGraphQL<ChannelData>(CHANNELS_QUERY, { uid }),
        ]);
        setPads(padsData.pads ?? []);
        setArticles(articlesData.articles ?? []);
        setChannels(channelsData.channelsByOwner ?? []);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "Unable to load feed.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [uid]);

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
    return <LoadingSketch />;
  }

  if (error) {
    return (
      <div className={styles["feed-container"]}>
        <div className={styles["feed-error"]}>{error}</div>
      </div>
    );
  }

  const emptyMessage = (
    <div className={styles["feed-empty"]}>
      <p className={styles["feed-empty-text"]}>No content yet.</p>
      {isOwnFeed && (
        <div className={styles["feed-empty-actions"]}>
          <Link className={styles["feed-empty-button"]} href="/pads/create">
            Create pad
          </Link>
          <Link className={styles["feed-empty-button"]} href="/articles/create">
            Create article
          </Link>
          <Link className={styles["feed-empty-button-secondary"]} href="/channels/create">
            Create channel
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <div className={styles["feed-container"]}>
      <ContentFeedWithLines
        channels={channels}
        sections={sections}
        emptyMessage={emptyMessage}
        persistChannelKey={`feed-${uid}`}
      />
    </div>
  );
};

export default FeedPage;
