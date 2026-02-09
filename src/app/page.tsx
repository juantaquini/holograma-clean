"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/(providers)/auth-provider";
import { usePopup } from "@/app/(providers)/popup-provider";
import Login from "@/components/auth/Login";
import Signin from "@/components/auth/Signin";
import styles from "./page.module.css";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const { openPopup, closePopup } = usePopup();

  useEffect(() => {
    if (user?.uid) {
      router.replace(`/feed/${user.uid}`);
    }
  }, [user?.uid, router]);

  const openSignin = () => {
    openPopup(<Signin isPopup onClose={closePopup} onOpenLogin={openLogin} />);
  };

  const openLogin = () => {
    openPopup(<Login isPopup onClose={closePopup} onOpenSignin={openSignin} />);
  };

  if (user?.uid) {
    return null;
  }

  return (
    <div className={styles["hero"]}>
      <h1 className={styles["title"]}>Holograma</h1>

      <p className={styles["tagline"]}>
        Create interactive audiovisual pads by layering audio, images, and
        video. Play them using your keyboard or touch — like performing an
        instrument.
      </p>
      <p className={styles["description"]}>
        Holograma is a platform for creating interactive audiovisual instruments
        through layered compositions of sound, video, and imagery. It transforms
        multimedia into playable, expressive pads that can be performed in real
        time using a keyboard, MIDI controller, or touch interface.
      </p>

      <p className={styles["description"]}>
        Artists can upload their own recordings, field sounds, musical
        fragments, visual artworks, or video loops and map them to individual
        pads. Each layer can be customized to control timing, looping behavior,
        visual transitions, and playback interactions, enabling the creation of
        complex audiovisual performances from simple building blocks.
      </p>

      <p className={styles["description"]}>
        Holograma encourages experimentation and improvisation. Creators can
        start from scratch, building entirely new pads, or explore and
        reinterpret pads shared by other artists within the platform. This
        creates a collaborative ecosystem where audiovisual compositions evolve
        through reinterpretation, remixing, and collective exploration.
      </p>

      <p className={styles["description"]}>
        Holograma can be used for live performances, experimental music,
        audiovisual installations, creative coding exploration, or simply as a
        playful tool for discovering new ways to interact with sound and
        visuals.
      </p>

      <div className={styles["actions"]}>
        <button
          type="button"
          className={styles["primaryLink"]}
          onClick={openLogin}
        >
          Create a Pad
        </button>

        <Link href="/explore" className={styles["secondaryLink"]}>
          Explore Pads and Channels
        </Link>
      </div>

      <p className={styles["hint"]}>
        Sign in or create an account to start creating.
      </p>
    </div>
  );
}
