"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./ExplorePage.module.css";
import { fetchGraphQL } from "@/lib/graphql/fetchGraphQL";

type Article = {
  id: string;
  title: string;
  images: string[];
  authorUid: string;
  author?: {
    uid: string;
    displayName?: string | null;
  } | null;
  channel?: {
    id: string;
    title: string;
    slug: string;
    ownerUid: string;
  } | null;
};

type Channel = {
  id: string;
  title: string;
  slug: string;
  ownerUid: string;
  coverUrl?: string | null;
  owner?: {
    uid: string;
    displayName?: string | null;
  } | null;
};

type Pad = {
  id: string;
  title: string;
  images: string[];
  ownerUid: string;
  author?: {
    uid: string;
    displayName?: string | null;
  } | null;
  channel?: {
    id: string;
    title: string;
    slug: string;
    ownerUid: string;
  } | null;
};

type ExploreData = {
  articles: Article[];
};

type ChannelData = {
  channels: Channel[];
};

type PadData = {
  pads: Pad[];
};

const EXPLORE_QUERY = `
  query Explore($limit: Int!, $offset: Int!) {
    articles(limit: $limit, offset: $offset) {
      id
      title
      images
      authorUid
      author {
        uid
        displayName
      }
      channel {
        id
        title
        slug
        ownerUid
      }
    }
  }
`;

const CHANNELS_QUERY = `
  query Channels($limit: Int!, $offset: Int!) {
    channels(limit: $limit, offset: $offset) {
      id
      title
      slug
      ownerUid
      coverUrl
      owner {
        uid
        displayName
      }
    }
  }
`;

const PADS_QUERY = `
  query Pads($limit: Int!, $offset: Int!) {
    pads(limit: $limit, offset: $offset) {
      id
      title
      images
      ownerUid
      author {
        uid
        displayName
      }
      channel {
        id
        title
        slug
        ownerUid
      }
    }
  }
`;
const PAGE_SIZE = 10;

const ExplorePage = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [pads, setPads] = useState<Pad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [articlesData, channelsData, padsData] = await Promise.all([
          fetchGraphQL<ExploreData>(EXPLORE_QUERY, {
            limit: PAGE_SIZE,
            offset: 0,
          }),
          fetchGraphQL<ChannelData>(CHANNELS_QUERY, {
            limit: 12,
            offset: 0,
          }),
          fetchGraphQL<PadData>(PADS_QUERY, {
            limit: 12,
            offset: 0,
          }),
        ]);

        const first = articlesData.articles ?? [];
        setArticles(first);
        setHasMore(first.length === PAGE_SIZE);
        setChannels(channelsData.channels ?? []);
        setPads(padsData.pads ?? []);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "Unable to load explore.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const data = await fetchGraphQL<ExploreData>(EXPLORE_QUERY, {
          limit: PAGE_SIZE,
          offset: articles.length,
        });
      const next = data.articles ?? [];
      setArticles((prev) => [...prev, ...next]);
      setHasMore(next.length === PAGE_SIZE);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Unable to load more.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const allArticleList = useMemo(() => articles, [articles]);

  useEffect(() => {
    if (!loaderRef.current) return;
    const target = loaderRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoadingMore, articles.length]);

  if (isLoading) {
    return (
      <div className={styles["explore-container"]}>
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

  return (
    <div className={styles["explore-container"]}>
      <section className={styles["explore-section"]}>
        <div className={styles["explore-section-title"]}>Channels</div>
        {channels.length === 0 && (
          <div className={styles["explore-empty"]}>No channels yet.</div>
        )}
        {!!channels.length && (
          <div className={styles["explore-grid"]}>
            {channels.map((channel) => (
              <Link
                key={channel.id}
                href={`/channels/${channel.ownerUid}/${channel.slug}`}
                className={styles["explore-card"]}
              >
                <div className={styles["explore-card-image"]}>
                  {channel.coverUrl ? (
                    <Image
                      src={channel.coverUrl}
                      alt={channel.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className={styles["explore-channel-placeholder"]}>
                      <div className={styles["explore-channel-title"]}>
                        {channel.title}
                      </div>
                      <div className={styles["explore-channel-by"]}>by</div>
                      <div className={styles["explore-channel-user"]}>
                        {channel.owner?.displayName ||
                          channel.owner?.uid ||
                          channel.ownerUid}
                      </div>
                    </div>
                  )}
                </div>
                <div className={styles["explore-card-body"]}>
                  <div className={styles["explore-card-title"]}>{channel.title}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className={styles["explore-section"]}>
        <div className={styles["explore-section-title"]}>Pads</div>
        {pads.length === 0 && (
          <div className={styles["explore-empty"]}>No pads yet.</div>
        )}
        {!!pads.length && (
          <div className={styles["explore-grid"]}>
            {pads.map((pad) => (
              <Link
                key={pad.id}
                href={`/pads/${pad.id}`}
                className={styles["explore-card"]}
              >
                <div className={styles["explore-card-image"]}>
                  {pad.images?.[0] ? (
                    <Image
                      src={pad.images[0]}
                      alt={pad.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className={styles["explore-card-placeholder"]}>No image</div>
                  )}
                </div>
                <div className={styles["explore-card-body"]}>
                  <div className={styles["explore-card-title"]}>{pad.title}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className={styles["explore-section"]}>
        <div className={styles["explore-section-title"]}>Articles</div>
        {allArticleList.length === 0 && (
          <div className={styles["explore-empty"]}>No articles yet.</div>
        )}

        {!!allArticleList.length && (
          <div className={styles["explore-grid"]}>
            {allArticleList.map((article) => (
              <div key={`article-${article.id}`} className={styles["explore-card"]}>
                <Link
                  href={`/articles/${article.id}`}
                  className={styles["explore-card-media-link"]}
                >
                  <div className={styles["explore-card-image"]}>
                    {article.images?.[0] ? (
                      <Image
                        src={article.images[0]}
                        alt={article.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className={styles["explore-card-placeholder"]}>
                        No image
                      </div>
                    )}
                  </div>
                  <div className={styles["explore-card-body"]}>
                    <div className={styles["explore-card-title"]}>{article.title}</div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div ref={loaderRef} className={styles["explore-loader"]}>
            {isLoadingMore ? "Loading more…" : "Scroll to load more"}
          </div>
        )}
        {!hasMore && allArticleList.length > 0 && (
          <div className={styles["explore-loader"]}>End of list</div>
        )}
      </section>
    </div>
  );
};

export default ExplorePage;
