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
        Build pads that combine audio, images and video in layers. Play them with your keyboard or touch—each layer maps to a key or a tap, like an instrument.
      </p>
      <p className={styles["description"]}>
        Add your own recordings, choose a visual for each layer, and share your pads. Create from scratch or explore what others have made.
      </p>
      <div className={styles["actions"]}>
        <button
          type="button"
          className={styles["primaryLink"]}
          onClick={openLogin}
        >
          Create a pad
        </button>
        <Link href="/explore" className={styles["secondaryLink"]}>
          Explore pads and channels
        </Link>
      </div>
      <p className={styles["hint"]}>
        Sign in or create an account to start making pads.
      </p>
    </div>
  );
}
