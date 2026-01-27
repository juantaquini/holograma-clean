"use client";

import { useEffect, useMemo, useState } from "react";
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
  recentArticles: Article[];
};

const EXPLORE_QUERY = `
  query Explore($limit: Int!, $recentLimit: Int!) {
    articles(limit: $limit) {
      id
      title
      artist
      content
      authorUid
      createdAt
      images
    }
    recentArticles(limit: $recentLimit) {
      id
      title
      artist
      content
      authorUid
      createdAt
      images
    }
  }
`;

const excerpt = (text?: string | null, max = 140) => {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trim()}…`;
};

const formatDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
};

const ExplorePage = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchGraphQL<ExploreData>(EXPLORE_QUERY, {
          limit: 48,
          recentLimit: 8,
        });
        setArticles(data.articles ?? []);
        setRecentArticles(data.recentArticles ?? []);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "No se pudo cargar explore.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const hasRecent = recentArticles.length;
  const hasAll = articles.length;

  const emptyRecent = !hasRecent && !isLoading;
  const emptyAll = !hasAll && !isLoading;

  const allArticleList = useMemo(() => articles, [articles]);

  if (isLoading) {
    return (
      <div className={styles["explore-container"]}>
        <div className={styles["explore-loading"]}>Cargando explore…</div>
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
        <p>Articulos de toda la comunidad.</p>
      </div>

      <section className={styles["explore-section"]}>
        <div className={styles["explore-section-header"]}>
          <h2>Recientes</h2>
          <span>Lo ultimo publicado</span>
        </div>

        {emptyRecent && (
          <div className={styles["explore-empty"]}>
            Todavia no hay publicaciones recientes.
          </div>
        )}

        {!!recentArticles.length && (
          <>
            <h3 className={styles["explore-subtitle"]}>Articulos</h3>
            <div className={styles["explore-grid"]}>
              {recentArticles.map((article) => (
                <div key={`recent-article-${article.id}`} className={styles["explore-card"]}>
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
                          Sin imagen
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className={styles["explore-card-body"]}>
                    <Link
                      href={`/articles/${article.id}`}
                      className={styles["explore-card-title-link"]}
                    >
                      <div className={styles["explore-card-title"]}>{article.title}</div>
                    </Link>
                    {article.artist && (
                      <div className={styles["explore-card-meta"]}>{article.artist}</div>
                    )}
                    <p className={styles["explore-card-text"]}>
                      {excerpt(article.content)}
                    </p>
                    <div className={styles["explore-card-footer"]}>
                      <span>{formatDate(article.createdAt)}</span>
                      <Link
                        href={`/profile/${article.authorUid}`}
                        className={styles["explore-card-link"]}
                      >
                        Ver perfil
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </section>

      <section className={styles["explore-section"]}>
        <div className={styles["explore-section-header"]}>
          <h2>Todo</h2>
          <span>Explora cada perfil</span>
        </div>

        {emptyAll && (
          <div className={styles["explore-empty"]}>No hay contenido todavia.</div>
        )}

        {!!allArticleList.length && (
          <>
            <h3 className={styles["explore-subtitle"]}>Articulos</h3>
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
                          Sin imagen
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className={styles["explore-card-body"]}>
                    <Link
                      href={`/articles/${article.id}`}
                      className={styles["explore-card-title-link"]}
                    >
                      <div className={styles["explore-card-title"]}>{article.title}</div>
                    </Link>
                    {article.artist && (
                      <div className={styles["explore-card-meta"]}>{article.artist}</div>
                    )}
                    <p className={styles["explore-card-text"]}>
                      {excerpt(article.content)}
                    </p>
                    <div className={styles["explore-card-footer"]}>
                      <span>{formatDate(article.createdAt)}</span>
                      <Link
                        href={`/profile/${article.authorUid}`}
                        className={styles["explore-card-link"]}
                      >
                        Ver perfil
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </section>
    </div>
  );
};

export default ExplorePage;
