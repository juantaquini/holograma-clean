"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/(providers)/auth-provider";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.uid) {
      router.replace(`/feed/${user.uid}`);
    }
  }, [user?.uid, router]);

  if (user?.uid) {
    return null;
  }

  return (
    <div>
      <h1 style={{ fontSize: "28px", letterSpacing: "0.6px" }}>Holograma</h1>
      <p style={{ color: "var(--text-color-secondary)" }}>
        Create playful audio pads with video, images, and your own recordings.
      </p>
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <Link href="/pads/create">Create pad</Link>
        <Link href="/explore">Explore pads</Link>
      </div>
    </div>
  );
}
