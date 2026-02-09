"use client";

import Link from "next/link";
import { usePopup } from "@/app/(providers)/popup-provider";
import Login from "@/components/auth/Login";
import Signin from "@/components/auth/Signin";
import styles from "./Footer.module.css";

export default function Footer() {
  const { openPopup, closePopup } = usePopup();

  const openSignin = () => {
    openPopup(<Signin isPopup onClose={closePopup} onOpenLogin={openLogin} />);
  };

  const openLogin = () => {
    openPopup(<Login isPopup onClose={closePopup} onOpenSignin={openSignin} />);
  };

  return (
    <footer className={styles["footer"]}>
      <div className={styles["footer-inner"]}>
        <div className={styles["footer-brand"]}>
          <div className={styles["footer-logo"]}>HOLOGRAMA</div>
          <p className={styles["footer-tagline"]}>
            Experimental media, sound, and interactive art.
          </p>
        </div>

        <div className={styles["footer-links"]}>
          <Link href="/explore">Explore</Link>
        </div>
      </div>

      <div className={styles["footer-bottom"]}>
        <span>© {new Date().getFullYear()} Holograma</span>
        <span>Made for curious minds.</span>
      </div>
    </footer>
  );
}
