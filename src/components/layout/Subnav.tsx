"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Subnav.module.css";
import { useAuth } from "@/app/(providers)/auth-provider";
import { fetchGraphQL } from "@/lib/graphql/fetchGraphQL";

type ChannelData = {
  channelBySlug: {
    id: string;
    title: string;
    ownerUid: string;
    owner?: {
      uid: string;
      displayName?: string | null;
    } | null;
  } | null;
};

const CHANNEL_QUERY = `
  query Channel($uid: String!, $slug: String!) {
    channelBySlug(ownerUid: $uid, slug: $slug) {
      id
      title
      ownerUid
      owner {
        uid
        displayName
      }
    }
  }
`;

export default function Subnav() {
  const { user } = useAuth();
  const pathname = usePathname() ?? "";
  const [channelName, setChannelName] = useState<string | null>(null);
  const [channelOwner, setChannelOwner] = useState<string | null>(null);

  const feedHref = user?.uid ? `/feed/${user.uid}` : null;

  const channelMatch = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts[0] !== "channels" || parts.length < 3) return null;
    return { uid: parts[1], slug: parts[2] };
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!channelMatch) {
        setChannelName(null);
        setChannelOwner(null);
        return;
      }
      try {
        const data = await fetchGraphQL<ChannelData>(CHANNEL_QUERY, {
          uid: channelMatch.uid,
          slug: channelMatch.slug,
        });
        if (!cancelled) {
          setChannelName(data.channelBySlug?.title ?? null);
          setChannelOwner(
            data.channelBySlug?.owner?.displayName ??
              data.channelBySlug?.owner?.uid ??
              data.channelBySlug?.ownerUid ??
              channelMatch.uid
          );
        }
      } catch {
        if (!cancelled) {
          setChannelName(null);
          setChannelOwner(null);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [channelMatch]);



  if (channelName && channelOwner) {
    return (
      <nav className={styles["subnav"]}>
        <div className={styles["subnav-row"]}>
          <Link className={styles["subnav-link"]} href="/">
            Holograma
          </Link>
          <span className={styles["subnav-separator"]}/>
          <span className={styles["subnav-link"]}>{channelOwner}</span>
          <span className={styles["subnav-separator"]}/>
          <span className={styles["subnav-link"]}>{channelName}</span>
        </div>
      </nav>
    );
  }

  return (
    <nav className={styles["subnav"]}>
      <div className={styles["subnav-row"]}>
        <Link className={styles["subnav-link"]} href="/">
          Holograma
        </Link>
        <span className={styles["subnav-separator"]} />
        {feedHref && (
          <>
            <Link className={styles["subnav-link"]} href={feedHref}>
              Feed
            </Link>
            <span className={styles["subnav-separator"]} />
          </>
        )}
        <Link className={styles["subnav-link"]} href="/explore">
          Explore
        </Link>
      </div>
    </nav>
  );
}
