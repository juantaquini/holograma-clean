"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/(providers)/auth-provider";
import Image from "next/image";
import Container from "@/components/ui/Container";
import LoadingSketch from "@/components/p5/loading/LoadingSketch";
import Link from "next/link";
import styles from "./ArticlePage.module.css";
import AudioPlaylistPlayer from "./AudioPlaylistPlayer";
import DynamicPad from "./DynamicPad";
import { fetchGraphQL } from "@/lib/graphql/fetchGraphQL";

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
  content?: string | null;
  images: string[];
  audios: string[];
  videos: string[];
  media: ArticleMedia[];
  authorUid: string;
  createdAt: string;
}

interface ArticlePageProps {
  id: string;
}

const ArticlePage = ({ id }: ArticlePageProps) => {
  const { user } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const data = await fetchGraphQL<{ article: Article | null }>(
          `
            query Article($id: ID!) {
              article(id: $id) {
                id
                title
                artist
                content
                images
                audios
                videos
                media {
                  id
                  url
                  kind
                  width
                  height
                  duration
                }
                authorUid
                createdAt
              }
            }
          `,
          { id }
        );

        if (!data.article) {
          setError("Article not found");
          return;
        }

        setArticle(data.article);
      } catch (err) {
        console.error("Error fetching article:", err);
        setError("An error occurred while loading the article");
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  useEffect(() => {
    if (!article) return;
    setImagesLoaded(0);
    setAudioReady(article.audios.length === 0);
    setVideoReady(article.videos.length === 0);
  }, [article]);

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

  const imagesReady = article.images.length === 0 || imagesLoaded >= article.images.length;
  const mediaReady = imagesReady && audioReady && videoReady;

  return (
    <div className={styles["article-layout"]}>
      {/* Images Gallery */}
      {article.images.length > 0 && (
        <div className={styles["gallery-container"]}>
          {!imagesReady && (
            <div className={styles["gallery-skeleton"]}>
              <div className={styles["skeleton-block"]} />
              <span className={styles["skeleton-label"]}>Loading media…</span>
            </div>
          )}
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
                  onLoadingComplete={() => {
                    setImagesLoaded((count) => count + 1);
                  }}
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
            {user?.uid === article.authorUid && (
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
                {!audioReady && (
                  <div className={styles["audio-skeleton"]}>
                    <div className={styles["skeleton-row"]} />
                    <div className={styles["skeleton-wave"]} />
                    <span className={styles["skeleton-label"]}>
                      Loading audio…
                    </span>
                  </div>
                )}
                <div
                  className={
                    audioReady
                      ? styles["audio-ready"]
                      : styles["audio-hidden"]
                  }
                >
                  <AudioPlaylistPlayer
                    audioUrls={article.audios}
                    onReady={() => setAudioReady(true)}
                  />
                </div>
              </div>
            )}
            <div className={styles["article-content-container"]}>
              <div
                className={styles["article-content"]}
                dangerouslySetInnerHTML={{ __html: article.content ?? "" }}
              />
              {article.videos.length > 0 && (
                <video
                  className={styles["video-player"]}
                  src={article.videos[0]}
                  autoPlay
                  muted
                  loop
                  playsInline
                  webkit-playsinline=""
                  x-webkit-airplay="deny"
                  disablePictureInPicture
                  controlsList="nodownload nofullscreen noremoteplayback"
                  style={{ pointerEvents: 'none' }}
                  onContextMenu={(e) => e.preventDefault()}
                  onLoadedData={() => setVideoReady(true)}
                  onError={() => setVideoReady(true)}
                />
              )}
            </div>
            {article.audios.length > 0 && mediaReady && (
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