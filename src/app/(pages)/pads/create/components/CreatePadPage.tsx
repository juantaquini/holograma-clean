"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/app/(providers)/auth-provider";
import CustomTextInput from "@/components/inputs/CustomTextInput";
import { MediaSection } from "@/app/(pages)/articles/components/form/MediaSection";
import { useArticleMedia } from "@/hooks/useArticleMedia";
import type { ExistingMedia, MediaKind } from "@/types/article";
import styles from "./CreatePadPage.module.css";

type FormDataType = {
  title: string;
};

export default function CreatePadPage({ channelId }: { channelId?: string | null }) {
  const { user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const sessionIdRef = useRef<string>(crypto.randomUUID());

  const initialMedia: ExistingMedia[] = [];
  const {
    existing,
    added,
    removed,
    order,
    setOrder,
    addFiles,
    removeExisting,
    removeAdded,
  } = useArticleMedia(initialMedia, sessionIdRef.current);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormDataType>({
    defaultValues: {
      title: "",
    },
  });

  useEffect(() => {
    if (!user) {
      router.replace("/");
    }
  }, [user, router]);

  if (!user) return null;

  const onSubmit = async (data: FormDataType) => {
    setSaving(true);

    if (added.some((m) => m.status === "uploading")) {
      alert("Wait until uploads finish.");
      setSaving(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("owner_uid", user.uid);
      if (channelId) formData.append("channel_id", channelId);

      removed.forEach((id) => {
        formData.append("removed_media_ids[]", id);
      });

      order.forEach((id) => {
        const existingMedia = existing.find((m) => m.id === id);
        const addedMedia = added.find((m) => m.id === id);

        const media = existingMedia ?? addedMedia;
        if (media && media.kind) {
          formData.append(
            "media_ids[]",
            JSON.stringify({ id: media.id, kind: media.kind })
          );
        }
      });

      const res = await fetch("/api/pads", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Error creating pad");

      const payload = await res.json();
      router.push(`/pads/${payload.pad_id}`);
    } catch (err) {
      console.error(err);
      alert("Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles["pad-create-container"]}>
      <header className={styles["pad-create-header"]}>
        <h1>Create pad</h1>
        <p>Upload images, audio, and video for this channel.</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className={styles["pad-create-form"]}>
        <CustomTextInput
          name="title"
          label="Title"
          register={register}
          error={errors.title}
        />

        <div className={styles["pad-create-grid"]}>
          <MediaSection
            title="Images"
            kind={"image" as MediaKind}
            existing={existing}
            added={added}
            order={order}
            setOrder={setOrder}
            removeExisting={removeExisting}
            removeAdded={removeAdded}
            addFiles={addFiles}
          />
          <MediaSection
            title="Videos"
            kind={"video" as MediaKind}
            existing={existing}
            added={added}
            order={order}
            setOrder={setOrder}
            removeExisting={removeExisting}
            removeAdded={removeAdded}
            addFiles={addFiles}
          />
          <MediaSection
            title="Audios"
            kind={"audio" as MediaKind}
            existing={existing}
            added={added}
            order={order}
            setOrder={setOrder}
            removeExisting={removeExisting}
            removeAdded={removeAdded}
            addFiles={addFiles}
          />
        </div>

        <button
          className={styles["pad-create-button"]}
          type="submit"
          disabled={saving}
        >
          {saving ? "Creating..." : "Create pad"}
        </button>
      </form>
    </div>
  );
}
