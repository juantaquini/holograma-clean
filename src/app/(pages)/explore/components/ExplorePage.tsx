"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./ExplorePage.module.css";
import { fetchGraphQL } from "@/lib/graphql/fetchGraphQL";
import { useAuth } from "@/app/(providers)/auth-provider";

type ActiveSection = "channels" | "pads" | null;

type LinePosition = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  branches: { x: number; y: number }[];
  width: number;
  height: number;
};


type Channel = {
  id: string;
  title: string;
  slug: string;
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
  ownerUid: string;
  author?: {
    uid: string;
    displayName?: string | null;
  } | null;
  channel?: {
    id: string;
    title: string;
    slug: string;
    ownerUid: string;
  } | null;
};

type ExploreData = {
  channels: Channel[];
};

type PadData = {
  pads: Pad[];
};

const CHANNELS_QUERY = `
  query Channels($limit: Int!, $offset: Int!) {
    channels(limit: $limit, offset: $offset) {
      id
      title
      slug
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
  query Pads($limit: Int!, $offset: Int!) {
    pads(limit: $limit, offset: $offset) {
      id
      title
      images
      ownerUid
      author {
        uid
        displayName
      }
      channel {
        id
        title
        slug
        ownerUid
      }
    }
  }
`;

const ExplorePage = () => {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [pads, setPads] = useState<Pad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>("channels");
  const [linePosition, setLinePosition] = useState<LinePosition | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth <= 968);
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [channelsData, padsData] = await Promise.all([
          fetchGraphQL<ExploreData>(CHANNELS_QUERY, {
            limit: 12,
            offset: 0,
          }),
          fetchGraphQL<PadData>(PADS_QUERY, {
            limit: 12,
            offset: 0,
          }),
        ]);

        setChannels(channelsData.channels ?? []);
        setPads(padsData.pads ?? []);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "Unable to load explore.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const updateLinePosition = () => {
      if (!activeSection) {
        setLinePosition(null);
        return;
      }

      const container = document.querySelector(
        ".explore-page-container"
      ) as HTMLElement;
      const titleButton = document.querySelector(
        `[data-section="${activeSection}"]`
      ) as HTMLElement;
      const sectionEl = document.querySelector(
        `[data-section-block="${activeSection}"]`
      ) as HTMLElement;
      if (!titleButton || !container || !sectionEl) return;

      const containerRect = container.getBoundingClientRect();
      const titleRect = titleButton.getBoundingClientRect();

      const startX = titleRect.left + titleRect.width / 2 - containerRect.left;
      const startY = titleRect.bottom - containerRect.top + (isMobile ? 24 : 32);
      const endY = startY + (isMobile ? 60 : 100);

      const cards = sectionEl.querySelectorAll(
        ".explore-card"
      ) as NodeListOf<HTMLElement>;
      const branches: { x: number; y: number }[] = [];

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        branches.push({
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.top - containerRect.top,
        });
      });

      setLinePosition({
        startX,
        startY,
        endX: startX,
        endY,
        branches,
        width: containerRect.width,
        height: containerRect.height,
      });
    };

    const raf = requestAnimationFrame(updateLinePosition);
    window.addEventListener("resize", updateLinePosition);
    window.addEventListener("scroll", updateLinePosition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateLinePosition);
      window.removeEventListener("scroll", updateLinePosition);
    };
  }, [activeSection, isMobile, channels.length, pads.length]);

  const handleSectionChange = useCallback((section: ActiveSection) => {
    setActiveSection(section);
    try {
      localStorage.setItem("exploreActiveSection", section ?? "");
    } catch {}
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("exploreActiveSection");
    if (saved === "channels" || saved === "pads") {
      setActiveSection(saved);
    }
  }, []);

  if (isLoading) {
    return (
      <div className={styles["explore-container"]}>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles["explore-container"]}>
        <div className={styles["explore-error"]}>{error}</div>
      </div>
    );
  }

  return (
    <div className={`${styles["explore-container"]} explore-page-container`}>
      <section
        className={styles["explore-section"]}
        data-section-block="channels"
      >
        {channels.length === 0 && (
          <div className={styles["explore-empty"]}>
            <p className={styles["explore-empty-text"]}>No channels yet.</p>
            {user && (
              <Link className={styles["explore-empty-button"]} href="/channels/create">
                Create channel
              </Link>
            )}
          </div>
        )}
        {!!channels.length && (
          <div className={styles["explore-grid"]}>
            {channels.map((channel) => (
              <Link
                key={channel.id}
                href={`/channels/${channel.ownerUid}/${channel.slug}`}
                className={styles["explore-card"]}
              >
                <div className={styles["explore-card-image"]}>
                  {channel.coverUrl ? (
                    <Image
                      src={channel.coverUrl}
                      alt={channel.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className={styles["explore-channel-placeholder"]}>
                      <div className={styles["explore-channel-title"]}>
                        {channel.title}
                      </div>
                      <div className={styles["explore-channel-by"]}>by</div>
                      <div className={styles["explore-channel-user"]}>
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
        )}
      </section>

      <section
        className={styles["explore-section"]}
        data-section-block="pads"
      >
        {pads.length === 0 && (
          <div className={styles["explore-empty"]}>
            <p className={styles["explore-empty-text"]}>No pads yet.</p>
            {user && (
              <Link className={styles["explore-empty-button"]} href="/pads/create">
                Create pad
              </Link>
            )}
          </div>
        )}
        {!!pads.length && (
          <div className={styles["explore-grid"]}>
            {pads.map((pad) => (
              <Link
                key={pad.id}
                href={`/pads/${pad.id}`}
                className={styles["explore-card"]}
              >
                <div className={styles["explore-card-image"]}>
                  {pad.images?.[0] ? (
                    <Image
                      src={pad.images[0]}
                      alt={pad.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className={styles["explore-card-placeholder"]}>No image</div>
                  )}
                </div>
                <div className={styles["explore-card-body"]}>
                  <div className={styles["explore-card-title"]}>{pad.title}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {linePosition && linePosition.branches.length > 0 && (
        <svg
          className={styles["explore-dotted-line"]}
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 ${linePosition.width} ${linePosition.height}`}
          preserveAspectRatio="none"
          width="100%"
          height="100%"
          style={{ overflow: "visible" }}
        >
          <line
            x1={linePosition.startX}
            y1={linePosition.startY}
            x2={linePosition.endX}
            y2={linePosition.endY}
            stroke="var(--text-color)"
            strokeWidth="2"
            strokeDasharray="5,5"
            fill="none"
          />
          {linePosition.branches.map((branch, index) => (
            <line
              key={index}
              x1={linePosition.endX}
              y1={linePosition.endY}
              x2={branch.x}
              y2={branch.y}
              stroke="var(--text-color)"
              strokeWidth="2"
              strokeDasharray="5,5"
              fill="none"
            />
          ))}
        </svg>
      )}
    </div>
  );
};

export default ExplorePage;
