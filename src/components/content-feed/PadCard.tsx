"use client";

import Link from "next/link";
import Image from "next/image";
import type { Pad } from "./types";
import styles from "./ContentFeedCards.module.css";

type PadCardProps = {
  pad: Pad;
  dataChannelId: string;
};

export default function PadCard({ pad, dataChannelId }: PadCardProps) {
  return (
    <Link
      href={`/pads/${pad.id}`}
      className={styles.card}
      data-channel-id={dataChannelId}
      data-content-card
    >
      <div className={styles.cardImage}>
        {pad.images?.[0] ? (
          <Image
            src={pad.images[0]}
            alt={pad.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className={styles.cardPlaceholder}>No image</div>
        )}
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardTitle}>{pad.title}</div>
      </div>
    </Link>
  );
}
