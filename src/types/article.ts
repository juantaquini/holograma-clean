export type MediaKind = "image" | "video" | "audio";

export type UploadStatus = "uploading" | "ready" | "error";

export interface BaseMedia {
  id: string;
  url: string;
  kind: MediaKind;
}

export interface ExistingMedia extends BaseMedia {
  position: number;
}

export interface NewMedia extends BaseMedia {
  id: string;       
  file: File;
  url: string;
  kind: MediaKind;
  status: UploadStatus;
}
