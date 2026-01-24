"use client";

import { useState } from "react";
import styles from "./EditableMediaList.module.css";

export default function EditableMediaList({ mediaList, onUpdate, onDelete }: {
  mediaList: any[];
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={styles["media-preview"]}>
      {mediaList.map((item) => (
        <div key={item.id} className={styles["media-wrapper"]}>
          {item.media?.kind === "image" && (
            <img src={item.media.url} alt="media" className={styles["media-thumb"]} />
          )}
          {item.media?.kind === "audio" && (
            <audio controls src={item.media.url} className={styles["media-thumb"]} />
          )}
          {item.media?.kind === "video" && (
            <video controls src={item.media.url} className={styles["media-thumb"]} />
          )}
          <div className={styles["media-actions"]}>
            <button
              className={`${styles["media-action-btn"]} ${styles.edit}`}
              onClick={() => onUpdate(item.id, item)}
            >
              Editar
            </button>
            <button
              className={`${styles["media-action-btn"]} ${styles.delete}`}
              onClick={() => onDelete(item.id)}
            >
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
