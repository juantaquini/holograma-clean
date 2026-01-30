"use client";

import PadForm from "@/app/(pages)/pads/components/PadForm";

export default function EditPadPage({ id }: { id: string }) {
  return <PadForm mode="edit" padId={id} />;
}
