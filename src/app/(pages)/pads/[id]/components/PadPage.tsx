"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./PadPage.module.css";
import DynamicPad from "@/app/(pages)/articles/[id]/components/DynamicPad";
import { useAuth } from "@/app/(providers)/auth-provider";

type Pad = {
  id: string;
  title: string;
  ownerUid: string;
  channelId?: string | null;
  images: string[];
  videos: string[];
  audios: string[];
};

export default function PadPage({ id }: { id: string }) {
  const { user } = useAuth();
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
      <div className={styles["pad-container"]}>
        <div className={styles["pad-loading"]}>Loading pad…</div>
      </div>
    );
  }

  if (error || !pad) {
    return (
      <div className={styles["pad-container"]}>
        <div className={styles["pad-error"]}>{error || "Pad not found."}</div>
        <Link href="/explore" className={styles["pad-link"]}>
          Back to explore
        </Link>
      </div>
    );
  }

  return (
    <div className={styles["pad-container"]}>
      <header className={styles["pad-header"]}>
        <h4>{pad.title}</h4>
        {user?.uid === pad.ownerUid && (
          <Link className={styles["pad-link"]} href={`/pads/${pad.id}/edit`}>
            Edit pad
          </Link>
        )}
      </header>

      <DynamicPad audios={pad.audios} images={pad.images} videos={pad.videos} />
    </div>
  );
}
