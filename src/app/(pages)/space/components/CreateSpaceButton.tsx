"use client";

import { useRouter } from "next/navigation";

export default function CreateSpaceButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/space/create")}
      className="
        px-6 py-3 rounded-xl font-semibold
        bg-green-500 hover:bg-green-600
        transition
      "
    >
      + Crear Space
    </button>
  );
}
