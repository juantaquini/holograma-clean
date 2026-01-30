"use client";

import PadForm from "@/app/(pages)/pads/components/PadForm";

export default function CreatePadPage({
  channelId,
}: {
  channelId?: string | null;
}) {
  return <PadForm mode="create" channelId={channelId} />;
}
