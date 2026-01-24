// types/pad.ts
export interface PadConfig {
  color?: string;
  shape?: string;
  images?: string[];
  videos?: string[];
  [key: string]: any;
}

export interface Pad {
  id: string;
  title: string;
  audio_url: string;
  config: PadConfig;
  user_id: string;
  created_at: string;
}

// Para compatibilidad con DynamicPad
export interface PadForPlayer {
  audios: string[];
  images?: string[];
  videos?: string[];
}