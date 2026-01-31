"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/(pages)/channels/create/components/CreateChannelPage.module.css";
import { useAuth } from "@/app/(providers)/auth-provider";
import { fetchGraphQL } from "@/lib/graphql/fetchGraphQL";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

type Channel = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  ownerUid: string;
};

type ChannelData = {
  channelBySlug: Channel | null;
};

type ChannelFormProps = {
  mode: "create" | "edit";
  uid?: string;
  channelSlug?: string;
  isPopup?: boolean;
  onClose?: () => void;
};

const CHANNEL_QUERY = `
  query Channel($uid: String!, $slug: String!) {
    channelBySlug(ownerUid: $uid, slug: $slug) {
      id
      title
      slug
      description
      ownerUid
    }
  }
`;

export default function ChannelForm({
  mode,
  uid,
  channelSlug,
  isPopup = false,
  onClose,
}: ChannelFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user === undefined) return;

    if (!user) {
      router.replace("/");
      return;
    }

    if (mode !== "edit") return;
    if (!uid || !channelSlug) return;

    const load = async () => {
      try {
        const data = await fetchGraphQL<ChannelData>(CHANNEL_QUERY, {
          uid,
          slug: channelSlug,
        });

        if (!data.channelBySlug) {
          router.replace("/explore");
          return;
        }

        if (data.channelBySlug.ownerUid !== user.uid) {
      router.replace(`/channels/${uid}/${channelSlug}`);
          return;
        }

        const channelData = data.channelBySlug;
        setChannel(channelData);
        setTitle(channelData.title);
        setSlug(channelData.slug);
        setDescription(channelData.description ?? "");
      } catch (err: any) {
        setError(err.message ?? "Failed to load channel");
      }
    };

    load();
  }, [user, router, uid, channelSlug, mode]);

  useEffect(() => {
    if (!title) return;
    setSlug((prev) => (prev ? prev : slugify(title)));
  }, [title]);

  const canSubmit = useMemo(() => {
    return !!user?.uid && title.trim().length > 2 && slug.trim().length > 2;
  }, [user?.uid, title, slug]);

  const handleCancel = () => {
    onClose?.();

    if (mode === "edit" && channel) {
      const targetUid = uid ?? channel.ownerUid;
      router.push(`/channels/${targetUid}/${channel.slug}`);
      return;
    }

    router.back();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !canSubmit) return;
    if (mode === "edit" && !channel?.id) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        mode === "create" ? "/api/channels" : `/api/channels/${channel?.id}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            owner_uid: mode === "create" ? user.uid : undefined,
            title: title.trim(),
            slug: slugify(slug),
            description: description.trim() || null,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          data?.error ||
            (mode === "create"
              ? "Failed to create channel"
              : "Failed to update channel")
        );
      }

      const targetUid = mode === "create" ? user.uid : uid ?? channel?.ownerUid;
      router.push(`/channels/${targetUid}/${slugify(slug)}`);
    } catch (err: any) {
      setError(
        err.message ??
          (mode === "create"
            ? "Failed to create channel"
            : "Failed to update channel")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  if (mode === "edit" && !channel) {
    return null;
  }

  const content = (
    <div className={styles["channel-create-container"]}>
      <header className={styles["channel-create-header"]}>
        <h1>{mode === "create" ? "Create channel" : "Edit channel"}</h1>
        <p>
          {mode === "create"
            ? "Organize your pads under a public channel."
            : "Update your channel details."}
        </p>
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

        <div className={styles["channel-create-actions"]}>
          <button
            className={styles["channel-create-button-secondary"]}
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className={styles["channel-create-button"]}
            type="submit"
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting
              ? mode === "create"
                ? "Creating..."
                : "Saving..."
              : mode === "create"
              ? "Create channel"
              : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );

  if (!isPopup) return content;

  return (
    <div className={styles["channel-create-overlay"]}>
      <div className={styles["channel-create-modal"]}>{content}</div>
    </div>
  );
}
