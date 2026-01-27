import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
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
          <Link href="/interactives">Interactives</Link>
          <Link href="/articles">Articles</Link>
        </div>
      </div>

      <div className={styles["footer-bottom"]}>
        <span>© {new Date().getFullYear()} Holograma</span>
        <span>Made for curious minds.</span>
      </div>
    </footer>
  );
}
