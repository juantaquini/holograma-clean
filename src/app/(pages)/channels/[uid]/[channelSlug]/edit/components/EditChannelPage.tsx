"use client";

import ChannelForm from "@/app/(pages)/channels/components/ChannelForm";

export default function EditChannelPage({
  uid,
  channelSlug,
}: {
  uid: string;
  channelSlug: string;
}) {
  return <ChannelForm mode="edit" uid={uid} channelSlug={channelSlug} isPopup />;
}
