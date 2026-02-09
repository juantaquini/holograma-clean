"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./PadPage.module.css";
import DynamicPad from "@/components/pads/DynamicPad";
import { useAuth } from "@/app/(providers)/auth-provider";
import LoadingSketch from "@/components/p5/loading/LoadingSketch";

type Pad = {
  id: string;
  title: string;
  ownerUid: string;
  channelId?: string | null;
  images: string[];
  videos: string[];
  audios: string[];
  config?: {
    backgroundColor?: string;
    text?: string;
  };
  media: Array<{
    id: string;
    url: string;
    kind: "image" | "video" | "audio";
  }>;
};

export default function PadPage({ id }: { id: string }) {
  const { user } = useAuth();
  const headerActionsRef = useRef<HTMLDivElement>(null);
  const [pad, setPad] = useState<Pad | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/pads/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Pad not found");
        const data = await res.json();
        setPad(data);
      } catch (err: any) {
        setError(err.message ?? "Unable to load pad.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id]);

  if (isLoading) {
    return (
<LoadingSketch/>
    );
  }

  if (error || !pad) {
    return (
      <div className={styles["pad-container"]}>
        <div className={styles["pad-error"]}>{error || "Pad not found."}</div>
        <Link href="/explore" className={styles["button-secondary"]}>
          Back to explore
        </Link>
      </div>
    );
  }

  return (
    <div className={styles["pad-container"]}>
      <header className={styles["pad-header"]}>
        <div className={styles["pad-title-row"]}>
          {user?.uid === pad.ownerUid && (
            <Link className={styles["button-secondary"]} href={`/pads/${pad.id}/edit`}>
              Edit pad
            </Link>
          )}
        </div>
        <div ref={headerActionsRef} className={styles["pad-header-dynamic"]} />
      </header>

      <DynamicPad
        media={pad.media ?? []}
        config={pad.config}
        headerActionsRef={headerActionsRef}
      />
    </div>
  );
}
