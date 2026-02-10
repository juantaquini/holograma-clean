export type ChannelInfo = {
  id: string;
  title: string;
  slug: string;
  ownerUid: string;
};

export type Channel = {
  id: string;
  title: string;
  slug: string;
  ownerUid: string;
  coverUrl?: string | null;
  owner?: { uid: string; displayName?: string | null } | null;
};

export type Pad = {
  id: string;
  title: string;
  images: string[];
  channel?: ChannelInfo | null;
};

export type Article = {
  id: string;
  title: string;
  images: string[];
  channel?: ChannelInfo | null;
};

export type ContentSection = {
  channelId: string;
  title: string;
  slug?: string | null;
  ownerUid?: string | null;
  pads: Pad[];
  articles: Article[];
};
