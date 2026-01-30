"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./CreateChannelPage.module.css";
import { useAuth } from "@/app/(providers)/auth-provider";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export default function CreateChannelPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace("/");
    }
  }, [user, router]);

  useEffect(() => {
    if (!title) return;
    setSlug((prev) => (prev ? prev : slugify(title)));
  }, [title]);

  const canSubmit = useMemo(() => {
    return !!user?.uid && title.trim().length > 2 && slug.trim().length > 2;
  }, [user?.uid, title, slug]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_uid: user.uid,
          title: title.trim(),
          slug: slugify(slug),
          description: description.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Failed to create channel");
      }

      router.push(`/u/${user.uid}/${slugify(slug)}`);
    } catch (err: any) {
      setError(err.message ?? "Failed to create channel");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className={styles["channel-create-container"]}>
      <header className={styles["channel-create-header"]}>
        <h1>Create channel</h1>
        <p>Organize your content into public channels.</p>
      </header>

      <form className={styles["channel-create-form"]} onSubmit={onSubmit}>
        <label className={styles["channel-create-label"]}>
          Title
          <input
            className={styles["channel-create-input"]}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Let there be light"
            required
          />
        </label>

        <label className={styles["channel-create-label"]}>
          Slug
          <input
            className={styles["channel-create-input"]}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="let-there-be-light"
            required
          />
        </label>

        <label className={styles["channel-create-label"]}>
          Description
          <textarea
            className={styles["channel-create-textarea"]}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this channel..."
            rows={4}
          />
        </label>

        {error && <div className={styles["channel-create-error"]}>{error}</div>}

        <button
          className={styles["channel-create-button"]}
          type="submit"
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create channel"}
        </button>
      </form>
    </div>
  );
}
