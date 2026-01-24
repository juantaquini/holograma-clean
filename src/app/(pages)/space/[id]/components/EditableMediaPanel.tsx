"use client";
import { useState } from "react";
import EditableMediaList from "./EditableMediaList";

export default function EditableMediaPanel({ sketchMedia, sketchId }: { sketchMedia: any[]; sketchId: string }) {
  const [mediaList, setMediaList] = useState(sketchMedia);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (id: string, item: any) => {
    setEditingId(id);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleReplace = async (id: string) => {
    if (!file) return;
    setLoading(true);
    try {
      // Subir nuevo archivo a /api/media
      const fd = new FormData();
      fd.append("file", file);
      fd.append("session_id", sketchId);
      const mediaRes = await fetch("/api/media", { method: "POST", body: fd });
      const media = await mediaRes.json();
      if (!mediaRes.ok || !media?.id) throw new Error("Error subiendo archivo");
      // Actualizar sketch_media con nuevo media_id
      const patchRes = await fetch(`/api/sketch_media/${id}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ media_id: media.id }),
      });
      if (!patchRes.ok) throw new Error("Error actualizando media");
      window.location.reload();
    } catch (e) {
      alert("Error reemplazando archivo");
    } finally {
      setLoading(false);
      setEditingId(null);
      setFile(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que querés eliminar este archivo?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sketch_media/${id}/delete`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error eliminando archivo");
      window.location.reload();
    } catch (e) {
      alert("Error eliminando archivo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <EditableMediaList
        mediaList={mediaList}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
      {editingId && (
        <div className="mt-4 p-4 bg-black/60 rounded-lg flex flex-col items-center">
          <input type="file" onChange={handleFileChange} />
          <button
            className="mt-2 px-4 py-2 rounded bg-blue-500 text-white disabled:opacity-50"
            onClick={() => handleReplace(editingId)}
            disabled={loading || !file}
          >
            {loading ? "Actualizando..." : "Reemplazar archivo"}
          </button>
          <button className="mt-2 text-xs text-gray-400" onClick={() => setEditingId(null)}>Cancelar</button>
        </div>
      )}
    </div>
  );
}
