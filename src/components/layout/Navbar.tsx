"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./Navbar.module.css";
import { useColorTheme } from "@/app/(providers)/color-theme-provider";
import { FiMenu, FiX } from "react-icons/fi";
import { usePopup } from "@/app/(providers)/popup-provider";
import { useAuth } from "@/app/(providers)/auth-provider";
import Login from "@/components/auth/Login";
import Signin from "@/components/auth/Signin";

const isMobile = () => window.innerWidth <= 1000;

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  const { theme, changeTheme } = useColorTheme();
  const { openPopup, closePopup } = usePopup();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isCalm = pathname?.includes("calm");

  if (!auth) {
    throw new Error("Navbar must be used inside AuthContextProvider");
  }

  const { user, logout } = auth;

  const cycleTheme = () => {
    const next =
      theme === "whitesmokeAzul"
        ? "azulMagenta"
        : theme === "azulMagenta"
        ? "marronCeleste"
        : "whitesmokeAzul";
    changeTheme(next);
  };

  useEffect(() => {
    const onResize = () => {
      const mobile = isMobile();
      setIsMobileView(mobile);
      if (!mobile) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ---------------- POPUPS ---------------- */

  const openSignin = () => {
    openPopup(<Signin isPopup onClose={closePopup} onOpenLogin={openLogin} />);
  };

  const openLogin = () => {
    openPopup(<Login isPopup onClose={closePopup} onOpenSignin={openSignin} />);
  };

  const handleLogout = async () => {
    await logout();
    closePopup();
    router.push("/");
  };

  const handleMobileLinkClick = () => setMobileMenuOpen(false);

  /* ---------------- RENDER ---------------- */

  return (
    <>
      {isMobileView && (
        <div className={styles["navbar-mobile-row"]}>
          <Link className={styles["navbar-logo-mobile"]} href="/">
            HOLOGRAMA
          </Link>

          <button
            className={styles["navbar-hamburger"]}
            onClick={() => setMobileMenuOpen((o) => !o)}
          >
            {mobileMenuOpen ? <FiX size={32} /> : <FiMenu size={28} />}
          </button>
        </div>
      )}

      {!isMobileView && (
        <nav className={styles["navbar-horizontal-links"]}>
          <Link className={styles["navbar-logo-text"]} href="/">
            HOLOGRAMA
          </Link>

          <div className={styles["navbar-links"]}>
            <Link href="/explore">EXPLORE</Link>
            <Link href="/interactives">INTERACTIVES</Link>
            <Link href="/articles">ARTICLES</Link>
            <button onClick={cycleTheme}>CHANGE SKIN</button>

            {!user ? (
              <button onClick={openLogin}>LOGIN</button>
            ) : (
              <button onClick={handleLogout}>LOGOUT</button>
            )}
          </div>
        </nav>
      )}

      {isMobileView && mobileMenuOpen && (
        <div className={styles["navbar-mobile-menu"]}>
          <div className={styles["navbar-mobile-column-links"]}>
            <Link href="/explore" onClick={handleMobileLinkClick}>
              EXPLORE
            </Link>
            <Link href="/interactives" onClick={handleMobileLinkClick}>
              INTERACTIVES
            </Link>
            <Link href="/articles" onClick={handleMobileLinkClick}>
              ARTICLES
            </Link>

            <button
              onClick={() => {
                cycleTheme();
                handleMobileLinkClick();
              }}
            >
              CHANGE SKIN
            </button>

            {!user ? (
              <button
                onClick={() => {
                  handleMobileLinkClick();
                  openLogin();
                }}
              >
                LOGIN
              </button>
            ) : (
              <button
                onClick={async () => {
                  handleMobileLinkClick();
                  await handleLogout();
                }}
              >
                LOGOUT
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
