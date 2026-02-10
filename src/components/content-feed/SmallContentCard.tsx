"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./ContentFeedWithLines.module.css";

type SmallContentCardProps = {
  href: string;
  imageUrl: string | null;
  title: string;
  x: number;
  y: number;
};

export default function SmallContentCard({
  href,
  imageUrl,
  title,
  x,
  y,
}: SmallContentCardProps) {
  return (
    <Link
      href={href}
      className={styles.smallCard}
      style={{ left: x, top: y }}
    >
      <div className={styles.smallCardImage}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="120px"
          />
        ) : (
          <div className={styles.smallCardPlaceholder}>No image</div>
        )}
      </div>
    </Link>
  );
}
