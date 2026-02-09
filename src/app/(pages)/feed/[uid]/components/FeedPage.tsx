"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./FeedPage.module.css";
import { fetchGraphQL } from "@/lib/graphql/fetchGraphQL";
import { useAuth } from "@/app/(providers)/auth-provider";
import LoadingSketch from "@/components/p5/loading/LoadingSketch";

type Pad = {
  id: string;
  title: string;
  images: string[];
  channel?: {
    id: string;
    title: string;
    slug: string;
    ownerUid: string;
  } | null;
};

type Channel = {
  id: string;
  title: string;
  slug: string;
  coverUrl?: string | null;
  ownerUid: string;
  owner?: {
    uid: string;
    displayName?: string | null;
  } | null;
};

type PadData = {
  pads: Pad[];
};

type ChannelData = {
  channelsByOwner: Channel[];
};

const PADS_QUERY = `
  query FeedPads($uid: String!, $limit: Int!) {
    pads(ownerUid: $uid, limit: $limit) {
      id
      title
      images
      channel {
        id
        title
        slug
        ownerUid
      }
    }
  }
`;

const CHANNELS_QUERY = `
  query FeedChannels($uid: String!) {
    channelsByOwner(ownerUid: $uid) {
      id
      title
      slug
      coverUrl
      ownerUid
      owner {
        uid
        displayName
      }
    }
  }
`;

const FeedPage = ({ uid }: { uid: string }) => {
  const { user } = useAuth();
  const [pads, setPads] = useState<Pad[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOwnFeed = user?.uid === uid;

  useEffect(() => {
    const load = async () => {
      try {
        const [padsData, channelsData] = await Promise.all([
          fetchGraphQL<PadData>(PADS_QUERY, {
            uid,
            limit: 96,
          }),
          fetchGraphQL<ChannelData>(CHANNELS_QUERY, {
            uid,
          }),
        ]);
        setPads(padsData.pads ?? []);
        setChannels(channelsData.channelsByOwner ?? []);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "Unable to load feed.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [uid]);

  const groupedPads = useMemo(() => {
    const map = new Map<
      string,
      { title: string; slug?: string | null; ownerUid?: string | null; items: Pad[] }
    >();
    pads.forEach((pad) => {
      const key = pad.channel?.id ?? "uncategorized";
      if (!map.has(key)) {
        map.set(key, {
          title: pad.channel?.title ?? "Uncategorized",
          slug: pad.channel?.slug ?? null,
          ownerUid: pad.channel?.ownerUid ?? null,
          items: [],
        });
      }
      map.get(key)!.items.push(pad);
    });
    return Array.from(map.values());
  }, [pads]);

  if (isLoading) {
    return (
          <LoadingSketch/>
    );
  }

  if (error) {
    return (
      <div className={styles["feed-container"]}>
        <div className={styles["feed-error"]}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles["feed-container"]}>
      {channels.length === 0 && pads.length === 0 && (
        <div className={styles["feed-empty"]}>
          <p className={styles["feed-empty-text"]}>No content yet.</p>
          {isOwnFeed && (
            <div className={styles["feed-empty-actions"]}>
              <Link className={styles["feed-empty-button"]} href="/pads/create">
                Create pad
              </Link>
              <Link className={styles["feed-empty-button-secondary"]} href="/channels/create">
                Create channel
              </Link>
            </div>
          )}
        </div>
      )}

      {!!channels.length && (
        <section className={styles["feed-section"]}>
          <div className={styles["feed-grid"]}>
            {channels.map((channel) => (
              <Link
                key={channel.id}
                href={`/channels/${channel.ownerUid}/${channel.slug}`}
                className={styles["feed-card"]}
              >
                <div className={styles["feed-card-image"]}>
                  {channel.coverUrl ? (
                    <Image
                      src={channel.coverUrl}
                      alt={channel.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className={styles["feed-channel-placeholder"]}>
                      <div className={styles["feed-channel-title"]}>
                        {channel.title}
                      </div>
                      <div className={styles["feed-channel-by"]}>by</div>
                      <div className={styles["feed-channel-user"]}>
                        {channel.owner?.displayName ||
                          channel.owner?.uid ||
                          channel.ownerUid}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!!groupedPads.length && (
        <div className={styles["feed-sections"]}>
          {groupedPads.map((section) => (
            <section key={section.title} className={styles["feed-section"]}>
              <div className={styles["feed-grid"]}>
                {section.items.map((pad) => (
                  <Link
                    key={pad.id}
                    href={`/pads/${pad.id}`}
                    className={styles["feed-card"]}
                  >
                    <div className={styles["feed-card-image"]}>
                      {pad.images?.[0] ? (
                        <Image
                          src={pad.images[0]}
                          alt={pad.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className={styles["feed-card-placeholder"]}>No image</div>
                      )}
                    </div>
                    <div className={styles["feed-card-body"]}>
                      <div className={styles["feed-card-title"]}>{pad.title}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedPage;
