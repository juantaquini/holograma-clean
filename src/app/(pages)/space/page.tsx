"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/(providers)/auth-provider";
import AudioRecorder from "@/components/pads/AudioRecorder";
import Container from "@/components/ui/Container";
import dynamic from "next/dynamic";
import { FaPlay, FaPause, FaTrash } from "react-icons/fa";

import styles from "./SpacePage.module.css";

const OptimizedPad = dynamic(() => import("./components/OptimizedPad"), { ssr: false });

type Pad = {
  id: string;
  title: string;
  audio_url: string;
  config: any;
  created_at: string;
};

export default function SpacePage() {
  const { user } = useAuth();
  const [pads, setPads] = useState<Pad[]>([]);
  const [selectedPad, setSelectedPad] = useState<Pad | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) fetchPads();
  }, [user]);

  const fetchPads = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/pads?user_id=${user.uid}`);
      const data = await res.json();
      if (Array.isArray(data)) setPads(data);
    } catch (e) {
      console.error("Error fetching pads:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = async (url: string) => {
    if (!user) return;

    const newPad = {
      title: `Idea Latente ${pads.length + 1}`,
      audio_url: url,
      user_id: user.uid,
      config: { color: "#ffffff", shape: "circle" },
    };

    try {
      const res = await fetch("/api/pads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPad),
      });
      const savedPad = await res.json();
      setPads([savedPad, ...pads]);
      setSelectedPad(savedPad);
    } catch (e) {
      console.error("Error saving pad:", e);
    }
  };

  if (!user)
    return (
      <Container className={styles.centered}>
        Inicia sesión para acceder a tu Espacio.
      </Container>
    );

  return (
    <div className={styles.page}>
      <Container>
        <div className={styles.grid}>
          {/* Left Column */}
          <div className={styles.leftColumn}>
            <h2 className={styles.title}>Ideas Latentes</h2>
            <div className={styles.padList}>
              {loading ? (
                <p className={styles.grayText}>Cargando...</p>
              ) : pads.length === 0 ? (
                <p className={styles.grayText}>No tienes ideas guardadas aún.</p>
              ) : (
                pads.map((pad) => (
                  <div
                    key={pad.id}
                    onClick={() => setSelectedPad(pad)}
                    className={`${styles.padItem} ${
                      selectedPad?.id === pad.id ? styles.padSelected : ""
                    }`}
                  >
                    <div className={styles.padTitle}>{pad.title}</div>
                    <div className={styles.padDate}>
                      {new Date(pad.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className={styles.recorder}>
              <AudioRecorder onUploadComplete={handleUploadComplete} userId={user.uid} />
            </div>
          </div>

          {/* Right Column */}
          <div className={styles.rightColumn}>
            {selectedPad ? (
              <OptimizedPad pad={selectedPad} />
            ) : (
              <div className={styles.placeholder}>
                Selecciona una idea para visualizarla en el Pad Dinámico
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
