"use client";

import Link from "next/link";
import Image from "next/image";
import type { Channel } from "./types";
import styles from "./ContentFeedCards.module.css";

type ChannelCardProps = {
  channel: Channel;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export default function ChannelCard({
  channel,
  onMouseEnter,
  onMouseLeave,
}: ChannelCardProps) {
  const href = `/channels/${channel.ownerUid}/${channel.slug}`;

  return (
    <Link
      href={href}
      className={styles.card}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={styles.cardImage}>
        {channel.coverUrl ? (
          <Image
            src={channel.coverUrl}
            alt={channel.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className={styles.channelPlaceholder}>
            <div className={styles.channelTitle}>{channel.title}</div>
            <div className={styles.channelBy}>by</div>
            <div className={styles.channelUser}>
              {channel.owner?.displayName ?? channel.owner?.uid ?? channel.ownerUid}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
