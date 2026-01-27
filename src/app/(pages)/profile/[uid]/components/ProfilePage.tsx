"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./ProfilePage.module.css";
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

type ProfileData = {
  articles: Article[];
};

const PROFILE_QUERY = `
  query Profile($uid: String!, $limit: Int!) {
    articles(authorUid: $uid, limit: $limit) {
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

const ProfilePage = ({ uid }: { uid: string }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchGraphQL<ProfileData>(PROFILE_QUERY, {
          uid,
          limit: 64,
        });
        setArticles(data.articles ?? []);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "No se pudo cargar el perfil.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [uid]);

  const hasContent = articles.length;

  if (isLoading) {
    return (
      <div className={styles["profile-container"]}>
        <div className={styles["profile-loading"]}>Cargando perfil…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles["profile-container"]}>
        <div className={styles["profile-error"]}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles["profile-container"]}>
      <header className={styles["profile-header"]}>
        <h1>Perfil</h1>
        <div className={styles["profile-uid"]}>{uid}</div>
        <p>Articulos publicados por este perfil.</p>
      </header>

      {!hasContent && (
        <div className={styles["profile-empty"]}>
          Aun no hay contenido para este perfil.
        </div>
      )}

      {!!articles.length && (
        <section className={styles["profile-section"]}>
          <div className={styles["profile-section-header"]}>
            <h2>Articulos</h2>
            <span>{articles.length}</span>
          </div>
          <div className={styles["profile-grid"]}>
            {articles.map((article) => (
              <Link
                key={`profile-article-${article.id}`}
                href={`/articles/${article.id}`}
                className={styles["profile-card"]}
              >
                <div className={styles["profile-card-image"]}>
                  {article.images?.[0] ? (
                    <Image
                      src={article.images[0]}
                      alt={article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className={styles["profile-card-placeholder"]}>
                      Sin imagen
                    </div>
                  )}
                </div>
                <div className={styles["profile-card-body"]}>
                  <div className={styles["profile-card-title"]}>{article.title}</div>
                  {article.artist && (
                    <div className={styles["profile-card-meta"]}>{article.artist}</div>
                  )}
                  <p className={styles["profile-card-text"]}>
                    {excerpt(article.content)}
                  </p>
                  <div className={styles["profile-card-footer"]}>
                    <span>{formatDate(article.createdAt)}</span>
                    <span>UID: {article.authorUid}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

    </div>
  );
};

export default ProfilePage;
