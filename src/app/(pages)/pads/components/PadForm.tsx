"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/app/(providers)/auth-provider";
import { usePopup } from "@/app/(providers)/popup-provider";
import CustomTextInput from "@/components/inputs/CustomTextInput";
import AudioRecorderInput from "@/components/inputs/AudioRecorderInput";
import { MediaSection } from "@/components/media/MediaSection";
import Login from "@/components/auth/Login";
import Signin from "@/components/auth/Signin";
import { usePadMedia } from "@/hooks/usePadMedia";
import type { ExistingMedia, MediaKind } from "@/types/media";
import { uploadMedia } from "@/lib/functions/uploadMedia";
import styles from "@/app/(pages)/pads/create/components/CreatePadPage.module.css";
import inputStyles from "@/components/inputs/InputStyles.module.css";

type PadResponse = {
  id: string;
  title: string;
  ownerUid: string;
  channelId?: string | null;
  config?: {
    backgroundColor?: string;
    text?: string;
  } | null;
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
  const { openPopup, closePopup } = usePopup();
  const [pad, setPad] = useState<PadResponse | null>(null);
  const [loading, setLoading] = useState(mode === "edit");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#0b0b0b");
  const [padText, setPadText] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [recordSecondsLeft, setRecordSecondsLeft] = useState(60);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);

  const sessionIdRef = useRef<string>(crypto.randomUUID());

  const {
    existing,
    added,
    removed,
    order,
    setOrder,
    setExisting,
    addFiles,
    addUploadedMedia,
    removeExisting,
    removeAdded,
  } = usePadMedia([], sessionIdRef.current);

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
      if (mode === "edit") router.replace("/pads");
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
      setLoadError(null);
      try {
        const res = await fetch(`/api/pads/${padId}`, { cache: "no-store" });

        if (!res.ok) {
          if (res.status === 404) {
            setLoadError("Pad not found");
          } else {
            setLoadError("Failed to load pad");
          }
          setLoading(false);
          return;
        }

        const data: PadResponse = await res.json();

        if (data.ownerUid !== user.uid) {
          router.replace(`/pads/${padId}`);
          return;
        }

        setPad(data);
        reset({ title: data.title });
        setBackgroundColor(data.config?.backgroundColor ?? "#0b0b0b");
        setPadText(data.config?.text ?? "");

        const initialMedia: ExistingMedia[] = (data.media || []).map(
          (m, index) => ({
            id: m.id,
            url: m.url,
            kind: m.kind,
            position: index,
          }),
        );

        setExisting(initialMedia);
        setOrder(initialMedia.map((m) => m.id));
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load pad");
      } finally {
        setLoading(false);
      }
    };

    fetchPad();
  }, [mode, padId, user, router, reset, setExisting, setOrder]);

  // Cleanup recording on unmount only; must be before any conditional return (Rules of Hooks)
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) {
        window.clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
    };
  }, []);

  if (!user) {
    if (mode === "edit") return null;
    const openLogin = () => {
      openPopup(<Login isPopup onClose={closePopup} onOpenSignin={openSignin} />);
    };
    const openSignin = () => {
      openPopup(<Signin isPopup onClose={closePopup} onOpenLogin={openLogin} />);
    };
    return (
      <div className={styles["pad-create-container"]}>
        <header className={styles["pad-create-header"]}>
          <h1>Create pad</h1>
          <p>Sign in or create an account to start making pads.</p>
        </header>
        <button
          type="button"
          className={styles["channel-create-button"]}
          onClick={openLogin}
        >
          Sign in
        </button>
      </div>
    );
  }

  if (mode === "edit") {
    if (loading) {
      return (
        <div className={styles["pad-create-container"]}>
          <header className={styles["pad-create-header"]}>
            <h1>Edit pad</h1>
            <p>Loading pad...</p>
          </header>
        </div>
      );
    }
    if (loadError) {
      return (
        <div className={styles["pad-create-container"]}>
          <header className={styles["pad-create-header"]}>
            <h1>Edit pad</h1>
            <p style={{ color: "var(--error-color, #c00)" }}>{loadError}</p>
          </header>
          <button
            type="button"
            className={styles["pad-create-button-secondary"]}
            onClick={() => router.push("/pads")}
          >
            Back to pads
          </button>
        </div>
      );
    }
    if (!pad) return null;
  }

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
      formData.append(
        "config",
        JSON.stringify({
          backgroundColor,
          text: padText,
        }),
      );

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
          formData.append("media_ids[]", JSON.stringify({ id: media.id }));
        }
      });

      const res = await fetch(
        mode === "create" ? "/api/pads" : `/api/pads/${padId}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          body: formData,
        },
      );

      if (!res.ok) {
        throw new Error(
          mode === "create" ? "Error creating pad" : "Error updating pad",
        );
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

  const stopRecording = () => {
    if (recordTimerRef.current) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  const startRecording = async () => {
    if (recording) return;
    setRecordError(null);
    setRecordSecondsLeft(60);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recordChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        setRecordSecondsLeft(60);

        if (!recordChunksRef.current.length) return;
        const blob = new Blob(recordChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const file = new File([blob], `pad-audio-${Date.now()}.webm`, {
          type: blob.type,
        });

        try {
          const media = await uploadMedia(file, sessionIdRef.current);
          addUploadedMedia(file, media);
        } catch (err: any) {
          setRecordError(err?.message ?? "Upload failed");
        }
      };

      recorder.start();
      setRecording(true);
      recordTimerRef.current = window.setInterval(() => {
        setRecordSecondsLeft((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setRecordError(err?.message ?? "Mic access denied");
      setRecording(false);
    }
  };

  return (
    <div className={styles["pad-create-container"]}>
      <header className={styles["pad-create-header"]}>
        <h1>{mode === "create" ? "Create pad" : "Edit pad"}</h1>
        {mode === "edit" && <p>Update media for this pad.</p>}
      </header>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={styles["pad-create-form"]}
      >
        <CustomTextInput
          name="title"
          label="Title"
          register={register}
          error={errors.title}
        />

        <div className={styles["pad-create-grid"]}>
          <label className={inputStyles["custom-input-container"]}>
            <span className={inputStyles["custom-input-label"]}>
              Background color
            </span>
            <input
              className={inputStyles["custom-color-input"]}
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
            />
          </label>
          <label className={inputStyles["custom-input-container"]}>
            <span className={inputStyles["custom-input-label"]}>Text</span>
            <textarea
              className={inputStyles["custom-text-area-input"]}
              value={padText}
              onChange={(e) => setPadText(e.target.value)}
              placeholder="Add text to your pad..."
            />
          </label>
        </div>

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
        <div className={styles["pad-create-grid"]}>
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
          <AudioRecorderInput
            recording={recording}
            recordSecondsLeft={recordSecondsLeft}
            recordError={recordError}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
          />
        </div>

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
