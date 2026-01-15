"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/app/(providers)/auth-provider";

import CustomTextInput from "@/components/inputs/CustomTextInput";
import CustomTextArea from "@/components/inputs/CustomTextArea";

import { ExistingMedia, MediaKind, NewMedia } from "@/types/article";

import { MediaSection } from "./MediaSection";
import { useArticleMedia } from "@/hooks/useArticleMedia";

import styles from "./ArticleForm.module.css";

interface ArticleFormProps {
  mode: "create" | "edit";
  article?: {
    id: string;
    title: string;
    artist?: string;
    content: string;
    media: {
      id: string;
      url: string;
      kind: MediaKind;
    }[];
  };
}

interface FormDataType {
  title: string;
  artist?: string;
  content: string;
}

export default function ArticleForm({ mode, article }: ArticleFormProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [saving, setSaving] = useState(false);

  const initialMedia: ExistingMedia[] =
    article?.media.map((m, i) => ({
      ...m,
      position: i,
    })) ?? [];

  const {
    existing,
    added,
    removed,
    order,
    setOrder,
    addFiles,
    removeExisting,
    removeAdded,
  } = useArticleMedia(initialMedia);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormDataType>({
    defaultValues: {
      title: article?.title ?? "",
      artist: article?.artist ?? "",
      content: article?.content ?? "",
    },
  });

  if (!user) return <p>Tenés que estar logueado</p>;

  const onSubmit = async (data: FormDataType) => {
    setSaving(true);

    if (added.some((m) => m.status === "uploading")) {
      alert("Esperá a que termine la subida");
      setSaving(false);
      return;
    }

    try {
      const formData = new FormData();

      formData.append("title", data.title);
      formData.append("artist", data.artist || "");
      formData.append("content", data.content);

      if (mode === "create") {
        formData.append("author_uid", user.uid);
      }

      removed.forEach((id) => {
        formData.append("removed_media_ids[]", id);
      });

      // ✅ Usar el array `order` para las posiciones correctas
      order.forEach((id, position) => {
        const existingMedia = existing.find((m) => m.id === id);
        const addedMedia = added.find((m) => m.id === id);

        if (existingMedia) {
          // Media que ya existía: actualizar su posición
          formData.append(
            "media_positions[]",
            JSON.stringify({
              id: existingMedia.id,
              position,
            })
          );
        } else if (addedMedia && addedMedia.status === "ready") {
          // Media nueva: enviar con su posición en el orden
          formData.append(
            "media_ids[]",
            JSON.stringify({
              id: addedMedia.id,
              position,
            })
          );
        }
      });

      const res = await fetch(
        mode === "create" ? "/api/articles" : `/api/articles/${article!.id}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          body: formData,
        }
      );

      if (!res.ok) {
        throw new Error("Error guardando artículo");
      }

      router.push("/articles");
    } catch (err) {
      console.error(err);
      alert("Error");
    } finally {
      setSaving(false);
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles["article-form"]}>
      <div className={styles["article-create-input-pair"]}>
        <CustomTextInput
          name="title"
          label="Title"
          register={register}
          error={errors.title}
        />
        <CustomTextInput
          name="artist"
          label="Author"
          register={register}
          error={errors.artist}
        />
      </div>
      <div className={styles["article-create-input-pair"]}>
        <CustomTextArea name="content" label="Content" control={control} />
        <MediaSection
          title="Images"
          kind="image"
          existing={existing}
          added={added}
          order={order}
          setOrder={setOrder}
          removeExisting={removeExisting}
          removeAdded={removeAdded}
          addFiles={addFiles}
        />
      </div>
      <div className={styles["article-create-input-pair"]}>
        <MediaSection
          title="Videos"
          kind="video"
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
          kind="audio"
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
        className={styles["article-form-submit-button"]}
        type="submit"
        disabled={saving}
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
