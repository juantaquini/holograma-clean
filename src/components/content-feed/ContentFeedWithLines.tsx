"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import ChannelCard from "./ChannelCard";
import SmallContentCard from "./SmallContentCard";
import type { Channel, ContentSection } from "./types";
import styles from "./ContentFeedWithLines.module.css";

const ACTIVE_CHANNEL_STORAGE_KEY = "content-feed-active-channel";

export type ContentFeedWithLinesProps = {
  channels: Channel[];
  sections: ContentSection[];
  emptyMessage?: React.ReactNode;
  isMobile?: boolean;
  /** Si se pasa, el canal activo se guarda en localStorage y se restaura al volver */
  persistChannelKey?: string;
};

const ITEM_SIZE = 90;
const PADDING = 40;
const ITEMS_TOP_LOCAL = 180;
const NODE_ABOVE_ITEMS = 80;

type VisibleItem = {
  type: "pad" | "article";
  id: string;
  href: string;
  imageUrl: string | null;
  title: string;
  x: number;
  y: number;
};

type LinePosition = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  branches: { x: number; y: number }[];
  width: number;
  height: number;
};

export default function ContentFeedWithLines({
  channels,
  sections,
  emptyMessage,
  isMobile: isMobileProp,
  persistChannelKey,
}: ContentFeedWithLinesProps) {
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [visibleItems, setVisibleItems] = useState<VisibleItem[]>([]);
  const [linePosition, setLinePosition] = useState<LinePosition | null>(null);
  const [isMobile, setIsMobile] = useState(isMobileProp ?? false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);

  const sectionsByChannel = useRef<Map<string, ContentSection>>(new Map());
  sectionsByChannel.current = new Map(sections.map((s) => [s.channelId, s]));

  useEffect(() => {
    if (isMobileProp !== undefined) {
      setIsMobile(isMobileProp);
      return;
    }
    const check = () => setIsMobile(window.innerWidth <= 968);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [isMobileProp]);

  const updateLayout = useCallback(() => {
    if (!activeChannelId || !containerRef.current) {
      setVisibleItems([]);
      setLinePosition(null);
      return;
    }

    const section = sectionsByChannel.current.get(activeChannelId);
    if (!section) {
      setVisibleItems([]);
      setLinePosition(null);
      return;
    }

    const items: VisibleItem[] = [
      ...section.pads.map((p) => ({
        type: "pad" as const,
        id: p.id,
        href: `/pads/${p.id}`,
        imageUrl: p.images?.[0] ?? null,
        title: p.title,
        x: 0,
        y: 0,
      })),
      ...section.articles.map((a) => ({
        type: "article" as const,
        id: a.id,
        href: `/articles/${a.id}`,
        imageUrl: a.images?.[0] ?? null,
        title: a.title,
        x: 0,
        y: 0,
      })),
    ];

    if (items.length === 0) {
      setVisibleItems([]);
      setLinePosition(null);
      return;
    }

    const container = containerRef.current;
    const channelEl = container.querySelector(
      `[data-channel-anchor="${activeChannelId}"]`
    ) as HTMLElement | null;

    if (!channelEl) {
      setVisibleItems([]);
      setLinePosition(null);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const channelRect = channelEl.getBoundingClientRect();

    const startX = channelRect.left - containerRect.left + channelRect.width / 2;
    const startY = channelRect.bottom - containerRect.top;

    const itemsContainer = container.querySelector(
      "[data-items-container]"
    ) as HTMLElement | null;
    if (!itemsContainer) {
      setVisibleItems([]);
      setLinePosition(null);
      return;
    }
    const itemsContainerRect = itemsContainer.getBoundingClientRect();
    const availableWidth = itemsContainerRect.width - PADDING * 2;
    const spacing = availableWidth / items.length;
    const startXOffset = PADDING + spacing / 2;
    const halfSize = ITEM_SIZE / 2;

    const itemsWithPositions: VisibleItem[] = items.map((item, index) => {
      const centerX = startXOffset + index * spacing;
      const x = centerX - halfSize;
      const y = ITEMS_TOP_LOCAL;
      return { ...item, x, y };
    });

    const offsetX = itemsContainerRect.left - containerRect.left;
    const offsetY = itemsContainerRect.top - containerRect.top;
    const branches = itemsWithPositions.map((item) => ({
      x: offsetX + item.x + halfSize,
      y: offsetY + item.y,
    }));
    const endY = offsetY + ITEMS_TOP_LOCAL - NODE_ABOVE_ITEMS;

    setVisibleItems(itemsWithPositions);
    setLinePosition({
      startX,
      startY,
      endX: startX,
      endY,
      branches,
      width: containerRect.width,
      height: containerRect.height,
    });
  }, [activeChannelId, isMobile]);

  useEffect(() => {
    updateLayout();
    window.addEventListener("resize", updateLayout);
    window.addEventListener("scroll", updateLayout, true);
    return () => {
      window.removeEventListener("resize", updateLayout);
      window.removeEventListener("scroll", updateLayout, true);
    };
  }, [updateLayout]);

  useEffect(() => {
    if (channels.length === 0) return;
    if (activeChannelId !== null) return;

    let restored = false;
    if (persistChannelKey && typeof window !== "undefined") {
      try {
        const key = `${ACTIVE_CHANNEL_STORAGE_KEY}-${persistChannelKey}`;
        const stored = localStorage.getItem(key);
        if (stored && stored.trim() !== "") {
          const storedId = stored.trim();
          const exists =
            channels.some((ch) => String(ch.id) === storedId) ||
            sectionsByChannel.current.has(storedId);
          if (exists) {
            setActiveChannelId(storedId);
            restored = true;
          }
        }
      } catch (_) {}
    }

    if (!restored) {
      const firstWithContent = channels.find((ch) => {
        const sec = sectionsByChannel.current.get(ch.id);
        return sec && (sec.pads.length + sec.articles.length) > 0;
      });
      if (firstWithContent) setActiveChannelId(firstWithContent.id);
    }
  }, [channels, sections, activeChannelId, persistChannelKey]);

  const handleChannelEnter = useCallback(
    (channelId: string) => {
      setActiveChannelId(channelId);
      if (persistChannelKey && typeof window !== "undefined") {
        try {
          localStorage.setItem(
            `${ACTIVE_CHANNEL_STORAGE_KEY}-${persistChannelKey}`,
            channelId
          );
        } catch (_) {}
      }
    },
    [persistChannelKey]
  );

  const isEmpty = channels.length === 0 && sections.length === 0;

  return (
    <div ref={containerRef} className={styles.container}>
      {isEmpty && emptyMessage}

      {channels.length > 0 && (
        <section className={styles.channelsSection}>
          <div className={styles.channelsRow}>
            {channels.map((channel) => (
              <div
                key={channel.id}
                className={styles.channelCardWrapper}
                data-channel-anchor={channel.id}
                onMouseEnter={() => handleChannelEnter(channel.id)}
              >
                <ChannelCard
                  channel={channel}
                  onMouseEnter={() => handleChannelEnter(channel.id)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <div
        ref={itemsContainerRef}
        className={styles.itemsContainer}
        data-items-container
        data-count={visibleItems.length}
      >
        {visibleItems.map((item) => (
          <SmallContentCard
            key={`${item.type}-${item.id}`}
            href={item.href}
            imageUrl={item.imageUrl}
            title={item.title}
            x={item.x}
            y={item.y}
          />
        ))}
      </div>

      {linePosition && linePosition.branches.length > 0 && (
        <svg
          className={styles.dottedLine}
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
}
