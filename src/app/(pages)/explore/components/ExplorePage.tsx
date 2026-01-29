"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./ExplorePage.module.css";
import { fetchGraphQL } from "@/lib/graphql/fetchGraphQL";

type Article = {
  id: string;
  title: string;
  artist?: string | null;
  content?: string | null;
  authorUid: string;
  createdAt: string;
  images: string[];
};

type ExploreData = {
  articles: Article[];
};

const EXPLORE_QUERY = `
  query Explore($limit: Int!, $offset: Int!) {
    articles(limit: $limit, offset: $offset) {
      id
      title
      images
    }
  }
`;
const PAGE_SIZE = 10;

const ExplorePage = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchGraphQL<ExploreData>(EXPLORE_QUERY, {
          limit: PAGE_SIZE,
          offset: 0,
        });
        const first = data.articles ?? [];
        setArticles(first);
        setHasMore(first.length === PAGE_SIZE);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "Unable to load explore.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const allArticleList = useMemo(() => articles, [articles]);

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
        <div className={styles["explore-loading"]}>Loading explore…</div>
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
      <div className={styles["explore-header"]}>
        <h1>Explore</h1>
        <p>Latest articles from every profile.</p>
      </div>
      <div className={styles["explore-divider"]} />

      <section className={styles["explore-section"]}>
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
