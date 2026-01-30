"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/app/(providers)/auth-provider";
import CustomTextInput from "@/components/inputs/CustomTextInput";
import { MediaSection } from "@/app/(pages)/articles/components/form/MediaSection";
import { useArticleMedia } from "@/hooks/useArticleMedia";
import type { ExistingMedia, MediaKind } from "@/types/article";
import styles from "@/app/(pages)/pads/create/components/CreatePadPage.module.css";

type PadResponse = {
  id: string;
  title: string;
  ownerUid: string;
  channelId?: string | null;
  media: Array<{ id: string; url: string; kind: MediaKind }>;
};

type FormDataType = {
  title: string;
};

type PadFormProps = {
  mode: "create" | "edit";
  padId?: string;
  channelId?: string | null;
  onCancel?: () => void;
};

export default function PadForm({
  mode,
  padId,
  channelId,
  onCancel,
}: PadFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [pad, setPad] = useState<PadResponse | null>(null);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);

  const sessionIdRef = useRef<string>(crypto.randomUUID());

  const {
    existing,
    added,
    removed,
    order,
    setOrder,
    setExisting,
    addFiles,
    removeExisting,
    removeAdded,
  } = useArticleMedia([], sessionIdRef.current);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormDataType>({
    defaultValues: {
      title: "",
    },
  });

  useEffect(() => {
    if (user === undefined) return;

    if (!user) {
      router.replace(mode === "edit" ? "/pads" : "/");
      return;
    }

    if (mode !== "edit") {
      setLoading(false);
      return;
    }

    if (!padId) {
      router.replace("/pads");
      return;
    }

    const fetchPad = async () => {
      try {
        const res = await fetch(`/api/pads/${padId}`, { cache: "no-store" });

        if (!res.ok) {
          router.replace("/pads");
          return;
        }

        const data: PadResponse = await res.json();

        if (data.ownerUid !== user.uid) {
          router.replace(`/pads/${padId}`);
          return;
        }

        setPad(data);
        reset({ title: data.title });

        const initialMedia: ExistingMedia[] = (data.media || []).map(
          (m, index) => ({
            id: m.id,
            url: m.url,
            kind: m.kind,
            position: index,
          })
        );

        setExisting(initialMedia);
        setOrder(initialMedia.map((m) => m.id));
      } finally {
        setLoading(false);
      }
    };

    fetchPad();
  }, [mode, padId, user, router, reset, setExisting, setOrder]);

  if (loading) return null;
  if (!user) return null;
  if (mode === "edit" && !pad) return null;

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }

    if (mode === "edit" && padId) {
      router.push(`/pads/${padId}`);
      return;
    }

    router.back();
  };

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

      if (mode === "create") {
        formData.append("owner_uid", user.uid);
        if (channelId) formData.append("channel_id", channelId);
      } else if (pad?.channelId) {
        formData.append("channel_id", pad.channelId);
      }

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

      const res = await fetch(
        mode === "create" ? "/api/pads" : `/api/pads/${padId}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          body: formData,
        }
      );

      if (!res.ok) {
        throw new Error(mode === "create" ? "Error creating pad" : "Error updating pad");
      }

      const payload = mode === "create" ? await res.json() : null;
      const nextId = mode === "create" ? payload?.pad_id : padId;

      if (nextId) {
        router.push(`/pads/${nextId}`);
      } else {
        router.push("/pads");
      }
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
        <h1>{mode === "create" ? "Create pad for your channel" : "Edit pad"}</h1>
        {mode === "edit" && <p>Update media for this pad.</p>}
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
        </div>
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

        <div className={styles["pad-create-actions"]}>
          <button
            className={styles["pad-create-button-secondary"]}
            type="button"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className={styles["channel-create-button"]}
            type="submit"
            disabled={saving}
          >
            {saving
              ? mode === "create"
                ? "Creating..."
                : "Saving..."
              : mode === "create"
              ? "Create pad"
              : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
