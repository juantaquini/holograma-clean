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
        <div className={styles["profile-title-row"]}>
          <div className={styles["profile-actions"]}>
            <Link href="/channels/create" className={styles["profile-feed-link"]}>
              Create channel
            </Link>
            <Link href={`/feed/${uid}`} className={styles["profile-feed-link"]}>
              View public feed
            </Link>
          </div>
        </div>
      </header>
      {!hasContent && (
        <div className={styles["profile-empty"]}>
          No uploads yet.
        </div>
      )}

      {!!articles.length && (
        <section className={styles["profile-section"]}>
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
                      No image
                    </div>
                  )}
                </div>
                <div className={styles["profile-card-body"]}>
                  <div className={styles["profile-card-title"]}>{article.title}</div>
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
