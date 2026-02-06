"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./ProfilePage.module.css";
import { fetchGraphQL } from "@/lib/graphql/fetchGraphQL";
import { useAuth } from "@/app/(providers)/auth-provider";

type Pad = {
  id: string;
  title: string;
  createdAt: string;
  images: string[];
};

type ProfileData = {
  pads: Pad[];
};

const PROFILE_QUERY = `
  query Profile($uid: String!, $limit: Int!) {
    pads(ownerUid: $uid, limit: $limit) {
      id
      title
      createdAt
      images
    }
  }
`;

const excerpt = (text?: string | null, max = 140) => {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trim()}…`;
};

const formatDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
};

const ProfilePage = ({ uid }: { uid: string }) => {
  const { user } = useAuth();
  const [pads, setPads] = useState<Pad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOwnProfile = user?.uid === uid;

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchGraphQL<ProfileData>(PROFILE_QUERY, {
          uid,
          limit: 64,
        });
        setPads(data.pads ?? []);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "No se pudo cargar el perfil.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [uid]);

  const hasContent = pads.length;

  if (isLoading) {
    return (
      <div className={styles["profile-container"]}>
        <div className={styles["profile-loading"]}>Cargando perfil…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles["profile-container"]}>
        <div className={styles["profile-error"]}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles["profile-container"]}>
      <header className={styles["profile-header"]}>
        <div className={styles["profile-title-row"]}>
          <div className={styles["profile-actions"]}>
            <Link href="/channels/create" className={styles["profile-feed-link"]}>
              Create channel
            </Link>
            <Link href={`/feed/${uid}`} className={styles["profile-feed-link"]}>
              View public feed
            </Link>
          </div>
        </div>
      </header>
      {!hasContent && (
        <div className={styles["profile-empty"]}>
          <p className={styles["profile-empty-text"]}>No uploads yet.</p>
          {isOwnProfile && (
            <Link className={styles["profile-empty-button"]} href="/pads/create">
              Create pad
            </Link>
          )}
        </div>
      )}

      {!!pads.length && (
        <section className={styles["profile-section"]}>
          <div className={styles["profile-grid"]}>
            {pads.map((pad) => (
              <Link
                key={`profile-pad-${pad.id}`}
                href={`/pads/${pad.id}`}
                className={styles["profile-card"]}
              >
                <div className={styles["profile-card-image"]}>
                  {pad.images?.[0] ? (
                    <Image
                      src={pad.images[0]}
                      alt={pad.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className={styles["profile-card-placeholder"]}>
                      No image
                    </div>
                  )}
                </div>
                <div className={styles["profile-card-body"]}>
                  <div className={styles["profile-card-title"]}>{pad.title}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

    </div>
  );
};

export default ProfilePage;
