"use client";

import { FiMic } from "react-icons/fi";
import inputStyles from "@/components/inputs/InputStyles.module.css";
import styles from "./AudioRecorderInput.module.css";

type AudioRecorderInputProps = {
  recording: boolean;
  recordSecondsLeft: number;
  recordError: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
};

export default function AudioRecorderInput({
  recording,
  recordSecondsLeft,
  recordError,
  onStartRecording,
  onStopRecording,
}: AudioRecorderInputProps) {
  return (
    <div className={inputStyles["custom-input-container"]}>
      <span className={inputStyles["custom-input-label"]}>Record audio</span>
      <div className={styles["recorderInner"]}>
        <div className={styles["recorderActions"]}>
          <button
            type="button"
            className={`${styles["recorderButtonMic"]} ${recording ? styles["recorderButtonMicActive"] : ""}`}
            onClick={onStartRecording}
            disabled={recording}
            title={recording ? "Recording..." : "Start recording"}
            aria-label={recording ? "Recording" : "Start recording"}
          >
            <FiMic size={24} aria-hidden />
          </button>
          <button
            type="button"
            className={styles["recorderButtonSecondary"]}
            onClick={onStopRecording}
            disabled={!recording}
          >
            Stop
          </button>
        </div>
        <div className={styles["recorderStatus"]}>
          {recording
            ? `Recording... ${recordSecondsLeft}s left`
            : "Up to 60 seconds. Tap start to record."}
        </div>
        {recordError && (
          <div className={styles["recorderStatus"]}>{recordError}</div>
        )}
      </div>
    </div>
  );
}
