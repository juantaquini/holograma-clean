"use client";

import Link from "next/link";
import Image from "next/image";
import type { Article } from "./types";
import styles from "./ContentFeedCards.module.css";

type ArticleCardProps = {
  article: Article;
  dataChannelId: string;
};

export default function ArticleCard({ article, dataChannelId }: ArticleCardProps) {
  return (
    <Link
      href={`/articles/${article.id}`}
      className={styles.card}
      data-channel-id={dataChannelId}
      data-content-card
    >
      <div className={styles.cardImage}>
        {article.images?.[0] ? (
          <Image
            src={article.images[0]}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className={styles.cardPlaceholder}>No image</div>
        )}
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardTitle}>{article.title}</div>
      </div>
    </Link>
  );
}
