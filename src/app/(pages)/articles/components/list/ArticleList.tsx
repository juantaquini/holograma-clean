"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/(providers)/auth-provider";
import Link from "next/link";
import Image from "next/image";
import styles from "./ArticleList.module.css";
import LoadingSketch from "@/components/p5/loading/LoadingSketch";

interface Article {
  id: string;
  title: string;
  artist?: string;
  content: string;
  images: string[];
  audios: string[];
  videos: string[];
  author_uid: string;
}

interface UserData {
  role: string;
}

interface ArticleListProps {
  filterUid?: string;
}

const ArticleList = ({ filterUid }: ArticleListProps) => {
  const { user } = useAuth();

  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMine, setShowMine] = useState(false);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch("/api/articles", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch articles");
        const data = await res.json();
        setArticles(data);
      } catch (err) {
        console.error(err);
        setArticles([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticles();
  }, []);

  useEffect(() => {
    const checkRole = async () => {
      if (!user?.uid) return;
      try {
        const res = await fetch(`/api/users/${user.uid}`, { cache: "no-store" });
        if (!res.ok) return;
        const data: UserData = await res.json();
        console.log(data)
        setIsAdmin(data.role === "admin");
      } catch {
        setIsAdmin(false);
      }
    };
    checkRole();
  }, [user]);

  if (isLoading) return <LoadingSketch />;

  if (!articles.length) {
    return (
      <div className={styles["articles-main-layout"]}>
        <p className={styles["articles-empty-message"]}>There are no articles yet.</p>
        {isAdmin && (
          <Link href="/articles/create" className={styles["articles-create-button"]}>
            Create the first article
          </Link>
        )}
      </div>
    );
  }

  const targetUid = filterUid ?? (showMine && user?.uid ? user.uid : undefined);
  const list = targetUid ? articles.filter(a => a.author_uid === targetUid) : articles;

  if (!list.length) {
    return (
      <div className={styles["articles-main-layout"]}>
        <p className={styles["articles-empty-message"]}>No articles match this filter.</p>
      </div>
    );
  }

  const featured = list[0];
  const rest = list.slice(1);

  return (
    <div className={styles["articles-main-layout"]}>
      {/* ACTIONS */}
      <div className={styles["articles-actions-row"]}>
        {isAdmin && (
          <Link href="/articles/create" className={styles["articles-create-button"]}>
            Create new article
          </Link>
        )}
      </div>
      {/* FEATURED */}
      <div className={styles["articles-featured-container"]}>
        <Link href={`/articles/${featured.id}`} className={styles["articles-featured-article"]}>
          <div className={styles["articles-featured-content"]}>
            <h1 className={styles["articles-featured-title"]}>{featured.title}</h1>
            {featured.artist && (
              <h3 className={styles["articles-featured-artist"]}>{featured.artist}</h3>
            )}
            <p className={styles["articles-featured-content-text"]}>{featured.content}</p>
          </div>

          {/* Featured image */}
          {featured.images?.[0] && (
            <Image
              className={styles["articles-featured-image"]}
              src={featured.images[0]}
              alt={featured.title}
              width={800}
              height={600}
              priority
            />
          )}
        </Link>

        {/* SIDE LIST */}
        <div className={styles["articles-side-column"]}>
          {rest.map((article, idx) => (
            <div key={article.id}>
              <Link href={`/articles/${article.id}`} className={styles["articles-side-article-link"]}>
                <div className={styles["articles-side-article"]}>
                  <div className={styles["articles-side-texts"]}>
                    <span className={styles["articles-side-title"]}>{article.title}</span>
                    {article.artist && (
                      <span className={styles["articles-side-artist"]}>{article.artist}</span>
                    )}
                    <span className={styles["articles-side-content"]}>{article.content}</span>
                  </div>

                  {/* Thumbnail */}
                  {article.images?.[0] && (
                    <div className={styles["articles-side-image-container"]}>
                      <Image
                        className={styles["articles-side-image"]}
                        src={article.images[0]}
                        alt={article.title}
                        width={200}
                        height={150}
                      />
                    </div>
                  )}
                </div>
              </Link>

              {idx < rest.length - 1 && (
                <svg
                  className={styles["articles-side-separator"]}
                  xmlns="http://www.w3.org/2000/svg"
                  width="100%"
                  height="10"
                >
                  <line
                    x1="0"
                    y1="5"
                    x2="100%"
                    y2="5"
                    stroke="var(--text-color)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArticleList;
