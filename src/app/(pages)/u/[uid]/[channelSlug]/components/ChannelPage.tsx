"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./ChannelPage.module.css";
import { fetchGraphQL } from "@/lib/graphql/fetchGraphQL";

type Channel = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  ownerUid: string;
  coverUrl?: string | null;
  owner?: {
    uid: string;
    displayName?: string | null;
  } | null;
};

type Article = {
  id: string;
  title: string;
  images: string[];
};

type Pad = {
  id: string;
  title: string;
  images: string[];
};

type ChannelData = {
  channelBySlug: Channel | null;
};

type ArticlesData = {
  articles: Article[];
};

type PadsData = {
  pads: Pad[];
};

const CHANNEL_QUERY = `
  query Channel($uid: String!, $slug: String!) {
    channelBySlug(ownerUid: $uid, slug: $slug) {
      id
      title
      slug
      description
      ownerUid
      coverUrl
      owner {
        uid
        displayName
      }
    }
  }
`;

const ARTICLES_QUERY = `
  query ChannelArticles($channelId: ID!, $limit: Int!) {
    articles(channelId: $channelId, limit: $limit) {
      id
      title
      images
    }
  }
`;

const PADS_QUERY = `
  query ChannelPads($channelId: ID!, $limit: Int!) {
    pads(channelId: $channelId, limit: $limit) {
      id
      title
      images
    }
  }
`;

const ChannelPage = ({ uid, channelSlug }: { uid: string; channelSlug: string }) => {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [pads, setPads] = useState<Pad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const channelData = await fetchGraphQL<ChannelData>(CHANNEL_QUERY, {
          uid,
          slug: channelSlug,
        });

        if (!channelData.channelBySlug) {
          setError("Channel not found.");
          setIsLoading(false);
          return;
        }

        setChannel(channelData.channelBySlug);

        const [articlesData, padsData] = await Promise.all([
          fetchGraphQL<ArticlesData>(ARTICLES_QUERY, {
            channelId: channelData.channelBySlug.id,
            limit: 64,
          }),
          fetchGraphQL<PadsData>(PADS_QUERY, {
            channelId: channelData.channelBySlug.id,
            limit: 64,
          }),
        ]);
        setArticles(articlesData.articles ?? []);
        setPads(padsData.pads ?? []);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "Unable to load channel.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [uid, channelSlug]);

  const ownerName =
    channel?.owner?.displayName || channel?.owner?.uid || channel?.ownerUid || uid;

  const items = useMemo(() => articles, [articles]);
  const padItems = useMemo(() => pads, [pads]);

  if (isLoading) {
    return (
      <div className={styles["channel-container"]}>
        <div className={styles["channel-loading"]}>Loading channel…</div>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className={styles["channel-container"]}>
        <div className={styles["channel-error"]}>{error || "Channel not found."}</div>
      </div>
    );
  }

  return (
    <div className={styles["channel-container"]}>
      <header className={styles["channel-header"]}>
        <div>
          <h1>{channel.title}</h1>
          {channel.description && <p>{channel.description}</p>}
        </div>
        <div className={styles["channel-actions"]}>
          <Link
            className={styles["channel-action"]}
            href={`/articles/create?channelId=${channel.id}`}
          >
            Create article
          </Link>
          <Link
            className={styles["channel-action"]}
            href={`/pads/create?channelId=${channel.id}`}
          >
            Create pad
          </Link>
          <div className={styles["channel-meta"]}>@{channel.slug}</div>
        </div>
      </header>

      {channel.coverUrl && (
        <div className={styles["channel-cover"]}>
          <Image
            src={channel.coverUrl}
            alt={channel.title}
            fill
            sizes="(max-width: 768px) 100vw, 70vw"
          />
        </div>
      )}

      {items.length === 0 && padItems.length === 0 && (
        <div className={styles["channel-empty"]}>No content yet.</div>
      )}

      {!!items.length && (
        <div className={styles["channel-section"]}>
          <div className={styles["channel-section-title"]}>Articles</div>
          <div className={styles["channel-grid"]}>
            {items.map((article) => (
              <Link key={article.id} href={`/articles/${article.id}`} className={styles["channel-card"]}>
                <div className={styles["channel-card-image"]}>
                  {article.images?.[0] ? (
                    <Image
                      src={article.images[0]}
                      alt={article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className={styles["channel-card-placeholder"]}>No image</div>
                  )}
                </div>
                <div className={styles["channel-card-body"]}>
                  <div className={styles["channel-card-title"]}>{article.title}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!!padItems.length && (
        <div className={styles["channel-section"]}>
          <div className={styles["channel-section-title"]}>Pads</div>
          <div className={styles["channel-grid"]}>
            {padItems.map((pad) => (
              <Link key={pad.id} href={`/pads/${pad.id}`} className={styles["channel-card"]}>
                <div className={styles["channel-card-image"]}>
                  {pad.images?.[0] ? (
                    <Image
                      src={pad.images[0]}
                      alt={pad.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className={styles["channel-card-placeholder"]}>No image</div>
                  )}
                </div>
                <div className={styles["channel-card-body"]}>
                  <div className={styles["channel-card-title"]}>{pad.title}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelPage;
