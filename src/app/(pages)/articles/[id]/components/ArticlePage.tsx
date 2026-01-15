"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/(providers)/auth-provider";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Container from "@/components/ui/Container";
import LoadingSketch from "@/components/p5/loading/LoadingSketch";
import Link from "next/link";
import styles from "./ArticlePage.module.css";
import AudioPlaylistPlayer from "./AudioPlaylistPlayer";
import DynamicPad from "./DynamicPad";

interface ArticleMedia {
  id: string;
  url: string;
  kind: "image" | "video" | "audio";
  width?: number | null;
  height?: number | null;
  duration?: number | null;
}

interface Article {
  id: string;
  title: string;
  artist?: string;
  content: string;
  images: string[];
  audios: string[];
  videos: string[];
  media: ArticleMedia[];
  author_uid: string;
  created_at: string;
}

interface ArticlePageProps {
  id: string;
}

const ArticlePage = ({ id }: ArticlePageProps) => {
  const { user } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/articles/${id}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          if (res.status === 404) {
            setError("Article not found");
          } else {
            setError("Failed to load article");
          }
          return;
        }

        const data: Article = await res.json();
        setArticle(data);
      } catch (err) {
        console.error("Error fetching article:", err);
        setError("An error occurred while loading the article");
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  if (isLoading) return <LoadingSketch />;

  if (error || !article) {
    return (
      <Container className={styles["error-container"]}>
        <div className={styles["error-content"]}>
          <h2 className={styles["error-title"]}>
            {error || "Article not found"}
          </h2>
          <Link href="/articles" className={styles["error-link"]}>
            ← Back to articles
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <div className={styles["article-layout"]}>
      {/* Images Gallery */}
      {article.images.length > 0 && (
        <div className={styles["gallery-container"]}>
          <div className={styles["gallery-scroll"]}>
            {article.images.map((img, idx) => (
              <div key={idx} className={styles["gallery-item"]}>
                <Image
                  src={img}
                  alt={`${article.title} - Image ${idx + 1}`}
                  width={1200}
                  height={800}
                  sizes="100vw"
                  className={styles["gallery-image"]}
                  priority={idx === 0}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Section */}
      <Container className={styles["content-wrapper"]}>
        {/* Header Row */}
        <div className={styles["header-row"]}>
          <div className={styles["header-info"]}>
            {article.artist && (
              <p className={styles["article-artist"]}>{article.artist}</p>
            )}
          </div>
          <h1 className={styles["article-title"]}>{article.title}</h1>

          <div className={styles["header-actions"]}>
            {user?.uid === article.author_uid && (
              <Link
                href={`/articles/${article.id}/edit`}
                className={styles["edit-button"]}
              >
                Edit
              </Link>
            )}
          </div>
        </div>

        <div className={styles["main-content"]}>
          <div className={styles["content-inner"]}>
            {article.audios.length > 0 && (
              <div className={styles["media-section"]}>
                <AudioPlaylistPlayer audioUrls={article.audios} />
              </div>
            )}
            <div className={styles["article-content-container"]}>
              <div
                className={styles["article-content"]}
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
              {article.videos.length > 0 && (
                <video
                  className={styles["video-player"]}
                  src={article.videos[0]}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              )}
            </div>
                          {article.audios.length > 0 && (
                <DynamicPad
                  audios={article.audios}
                  images={article.images}
                  videos={article.videos}
                />
              )}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ArticlePage;
