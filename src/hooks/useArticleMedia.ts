import { useRef, useState, Dispatch, SetStateAction } from "react";
import { ExistingMedia, NewMedia, MediaKind } from "@/types/article";
import { uploadMedia } from "@/lib/functions/uploadMedia";

interface UseArticleMediaReturn {
  existing: ExistingMedia[];
  added: NewMedia[];
  removed: string[];
  order: string[];
  setOrder: Dispatch<SetStateAction<string[]>>;
  setExisting: Dispatch<SetStateAction<ExistingMedia[]>>;
  addFiles: (files: FileList | null) => Promise<void>;
  removeExisting: (id: string) => void;
  removeAdded: (id: string) => void;
}

export function useArticleMedia(initial: ExistingMedia[] = []): UseArticleMediaReturn {
  const [existing, setExisting] = useState<ExistingMedia[]>(initial);
  const [added, setAdded] = useState<NewMedia[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);

  const [order, setOrder] = useState<string[]>(
    initial.map((m) => m.id)
  );

  const sessionId = useRef(crypto.randomUUID());

  const addFiles = async (files: FileList | null) => {
    if (!files) return;

    for (const file of Array.from(files)) {
      const kind: MediaKind = file.type.startsWith("image")
        ? "image"
        : file.type.startsWith("video")
        ? "video"
        : "audio";

      const tempId = crypto.randomUUID();
      const tempUrl = URL.createObjectURL(file);

      setAdded((p) => [
        ...p,
        {
          id: tempId,
          file,
          url: tempUrl,
          kind,
          status: "uploading",
        },
      ]);

      setOrder((p) => [...p, tempId]);

      try {
        const media = await uploadMedia(file, sessionId.current);

        setAdded((p) =>
          p.map((m) =>
            m.id === tempId
              ? { ...media, file, status: "ready" }
              : m
          )
        );

        setOrder((p) =>
          p.map((id) => (id === tempId ? media.id : id))
        );

        URL.revokeObjectURL(tempUrl);
      } catch (err) {
        console.error(err);
        setAdded((p) =>
          p.map((m) =>
            m.id === tempId ? { ...m, status: "error" } : m
          )
        );
      }
    }
  };

  const removeExisting = (id: string) => {
    setExisting((p) => p.filter((m) => m.id !== id));
    setRemoved((p) => [...p, id]);
    setOrder((p) => p.filter((x) => x !== id));
  };

  const removeAdded = (id: string) => {
    setAdded((p) => {
      const item = p.find((m) => m.id === id);
      if (item?.url.startsWith("blob:")) {
        URL.revokeObjectURL(item.url);
      }
      return p.filter((m) => m.id !== id);
    });

    setOrder((p) => p.filter((x) => x !== id));
  };

  return {
    existing,
    added,
    removed,
    order,
    setOrder,
    setExisting,
    addFiles,
    removeExisting,
    removeAdded,
  };
}