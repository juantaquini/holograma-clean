"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/app/(providers)/auth-provider";
import { getIdToken } from "firebase/auth";

export default function CreateSpacePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const create = async () => {
    if (!name.trim()) return alert("Poné un nombre");
    if (!user) return alert("Tenés que iniciar sesión");
    setLoading(true);

    try {
      const token = await getIdToken(user);
      const res = await fetch("/api/sketches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error creando Space");
      router.push(`/interactives/${data.id}`);
    } catch (e) {
      alert("Error creando Space");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 rounded-xl bg-white/5 border border-white/10">
        <h1 className="text-2xl font-bold mb-6">Crear Space</h1>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del Space"
          className="w-full mb-4 p-3 rounded-lg bg-black/40"
        />

        <button
          onClick={create}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-green-500 hover:bg-green-600 font-bold"
        >
          {loading ? "Creando..." : "Crear"}
        </button>
      </div>
    </div>
  );
}
