"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./ChannelPage.module.css";
import { fetchGraphQL } from "@/lib/graphql/fetchGraphQL";
import { useAuth } from "@/app/(providers)/auth-provider";
import LoadingSketch from "@/components/p5/loading/LoadingSketch";

type Channel = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  ownerUid: string;
  coverUrl?: string | null;
  owner?: {
    uid: string;
    displayName?: string | null;
  } | null;
};

type Pad = {
  id: string;
  title: string;
  images: string[];
};

type ChannelData = {
  channelBySlug: Channel | null;
};

type PadsData = {
  pads: Pad[];
};

const CHANNEL_QUERY = `
  query Channel($uid: String!, $slug: String!) {
    channelBySlug(ownerUid: $uid, slug: $slug) {
      id
      title
      slug
      description
      ownerUid
      coverUrl
      owner {
        uid
        displayName
      }
    }
  }
`;

const PADS_QUERY = `
  query ChannelPads($channelId: ID!, $limit: Int!) {
    pads(channelId: $channelId, limit: $limit) {
      id
      title
      images
    }
  }
`;

const ChannelPage = ({ uid, channelSlug }: { uid: string; channelSlug: string }) => {
  const { user } = useAuth();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [pads, setPads] = useState<Pad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const channelData = await fetchGraphQL<ChannelData>(CHANNEL_QUERY, {
          uid,
          slug: channelSlug,
        });

        if (!channelData.channelBySlug) {
          setError("Channel not found.");
          setIsLoading(false);
          return;
        }

        setChannel(channelData.channelBySlug);

        const padsData = await fetchGraphQL<PadsData>(PADS_QUERY, {
          channelId: channelData.channelBySlug.id,
          limit: 64,
        });
        setPads(padsData.pads ?? []);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "Unable to load channel.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [uid, channelSlug]);

  const padItems = useMemo(() => pads, [pads]);

  if (isLoading) {
    return (
      <LoadingSketch/>
    );
  }

  if (error || !channel) {
    return (
      <div className={styles["channel-container"]}>
        <div className={styles["channel-error"]}>{error || "Channel not found."}</div>
      </div>
    );
  }

  return (
    <div className={styles["channel-container"]}>
      <header className={styles["channel-header"]}>
        <div>
          <h1>{channel.title}</h1>
          {channel.description && <p>{channel.description}</p>}
        </div>
        <div className={styles["channel-actions"]}>
          <Link
            className={styles["channel-action"]}
            href={`/pads/create?channelId=${channel.id}`}
          >
            Create pad
          </Link>
          {user?.uid === channel.ownerUid && (
            <Link
              className={styles["channel-action"]}
              href={`/channels/${channel.ownerUid}/${channel.slug}/edit`}
            >
              Edit channel
            </Link>
          )}
          <div className={styles["channel-meta"]}>@{channel.slug}</div>
        </div>
      </header>

      {channel.coverUrl && (
        <div className={styles["channel-cover"]}>
          <Image
            src={channel.coverUrl}
            alt={channel.title}
            fill
            sizes="(max-width: 768px) 100vw, 70vw"
          />
        </div>
      )}

      {padItems.length === 0 && (
        <div className={styles["channel-empty"]}>
          <p className={styles["channel-empty-text"]}>No content yet.</p>
          <Link
            className={styles["channel-empty-button"]}
            href={`/pads/create?channelId=${channel.id}`}
          >
            Create pad
          </Link>
        </div>
      )}

      {!!padItems.length && (
        <div className={styles["channel-section"]}>
          <div className={styles["channel-section-title"]}>Pads</div>
          <div className={styles["channel-grid"]}>
            {padItems.map((pad) => (
              <Link key={pad.id} href={`/pads/${pad.id}`} className={styles["channel-card"]}>
                <div className={styles["channel-card-image"]}>
                  {pad.images?.[0] ? (
                    <Image
                      src={pad.images[0]}
                      alt={pad.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className={styles["channel-card-placeholder"]}>No image</div>
                  )}
                </div>
                <div className={styles["channel-card-body"]}>
                  <div className={styles["channel-card-title"]}>{pad.title}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelPage;
