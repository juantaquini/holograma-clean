"use client";

import { useMemo, useRef, Dispatch, SetStateAction } from "react";
import { Reorder } from "framer-motion";
import { FiPlus } from "react-icons/fi";

import styles from "./MediaSection.module.css";
import { ExistingMedia, NewMedia, MediaKind } from "@/types/article";
import { MediaItem } from "./MediaItem";

interface Props {
  title: string;
  kind: MediaKind;

  existing: ExistingMedia[];
  added: NewMedia[];

  order: string[];
  setOrder: Dispatch<SetStateAction<string[]>>;

  removeExisting: (id: string) => void;
  removeAdded: (id: string) => void;
  addFiles: (files: FileList | null) => void;
}

export function MediaSection({
  title,
  kind,
  existing,
  added,
  order,
  setOrder,
  removeExisting,
  removeAdded,
  addFiles,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const items = useMemo(() => {
    return order
      .map(
        (id) =>
          existing.find((m) => m.id === id) ??
          added.find((m) => m.id === id)
      )
      .filter(
        (m): m is ExistingMedia | NewMedia =>
          !!m && m.kind === kind
      );
  }, [order, existing, added, kind]);

  // ✅ Handler personalizado que solo actualiza items del kind actual
  const handleReorder = (newItemIds: string[]) => {
    setOrder((prevOrder) => {
      // Separar IDs por kind
      const otherKindIds = prevOrder.filter((id) => {
        const item = existing.find((m) => m.id === id) ?? added.find((m) => m.id === id);
        return item && item.kind !== kind;
      });

      // Combinar: mantener otros kinds + nuevo orden del kind actual
      return [...otherKindIds, ...newItemIds];
    });
  };

  return (
    <section className={styles["media-section"]}>
      <p className={styles["media-section-title"]}>{title}</p>

      <Reorder.Group
        axis="x"
        values={items.map(item => item.id)}
        onReorder={handleReorder}
        className={styles["media-preview"]}
      >
        {items.map((item) => {
          const isUploading =
            "status" in item && item.status === "uploading";

          return (
            <Reorder.Item
              key={item.id}
              value={item.id}
              drag={!isUploading}
              className={styles["media-wrapper"]}
            >
              <div className={styles["media-inner"]}>
                <MediaItem url={item.url} kind={kind} />

                {isUploading && (
                  <div className={styles["upload-overlay"]}>
                    <div className={styles["upload-spinner"]} />
                  </div>
                )}

                {!isUploading && (
                  <button
                    type="button"
                    className={styles["remove-button"]}
                    onClick={() =>
                      "position" in item
                        ? removeExisting(item.id)
                        : removeAdded(item.id)
                    }
                  >
                    ✕
                  </button>
                )}
              </div>
            </Reorder.Item>
          );
        })}

        {/* ADD BUTTON */}
        <div
          className={styles["add-media-button"]}
          onClick={() => inputRef.current?.click()}
        >
          <FiPlus />
        </div>
      </Reorder.Group>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={`${kind}/*`}
        className={styles["hidden-input"]}
        onChange={(e) => addFiles(e.target.files)}
      />
    </section>
  );
}