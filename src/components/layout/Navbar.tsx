"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./Navbar.module.css";
import { FiX } from "react-icons/fi";
import { usePopup } from "@/app/(providers)/popup-provider";
import { useAuth } from "@/app/(providers)/auth-provider";
import Login from "@/components/auth/Login";
import Signin from "@/components/auth/Signin";

const isMobile = () => window.innerWidth <= 1000;

export default function Navbar() {
  const [isMobileView, setIsMobileView] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { openPopup, closePopup } = usePopup();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!auth) {
    throw new Error("Navbar must be used inside AuthContextProvider");
  }

  const { user, logout } = auth;

  useEffect(() => {
    const onResize = () => {
      const mobile = isMobile();
      setIsMobileView(mobile);
      if (!mobile) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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

  const handleLinkClick = () => setMenuOpen(false);

  const initials = useMemo(() => {
    const name = user?.displayName?.trim();
    if (name) {
      const parts = name.split(" ").filter(Boolean);
      return parts.length === 1
        ? parts[0].slice(0, 2).toUpperCase()
        : `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    const email = user?.email?.split("@")[0] ?? "";
    if (email) return email.slice(0, 2).toUpperCase();
    return "U";
  }, [user?.displayName, user?.email]);

  /* ---------------- RENDER ---------------- */

  return (
    <>
      {isMobileView && (
        <div className={styles["navbar-mobile-row"]}>
          <Link className={styles["navbar-logo-mobile"]} href="/">
            HOLOGRAMA
          </Link>

          <div className={styles["navbar-mobile-actions"]}>
            {user?.uid && (
              <Link className={styles["navbar-create-pad"]} href="/pads/create">
                Create pad
              </Link>
            )}
            <button
              className={styles["navbar-avatar"]}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {user ? initials : "LOG"}
            </button>
          </div>
        </div>
      )}

      {!isMobileView && (
        <nav className={styles["navbar-horizontal-links"]}>
          <Link className={styles["navbar-logo-text"]} href="/">
            HOLOGRAMA
          </Link>

          <div className={styles["navbar-actions"]}>
            {user?.uid && (
              <Link className={styles["navbar-create-pad"]} href="/pads/create">
                Create pad
              </Link>
            )}
            <button
              className={styles["navbar-avatar"]}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {user ? initials : "LOG"}
            </button>
          </div>
        </nav>
      )}

      {menuOpen && (
        <>
          <div
            className={styles["navbar-overlay"]}
            onClick={() => setMenuOpen(false)}
          />
          <aside className={styles["navbar-sidebar"]}>
            <div className={styles["navbar-sidebar-header"]}>
              <span>{user ? initials : "Welcome"}</span>
              <button
                className={styles["navbar-sidebar-close"]}
                onClick={() => setMenuOpen(false)}
              >
                <FiX size={20} />
              </button>
            </div>

            <div className={styles["navbar-sidebar-links"]}>
              <Link href="/explore" onClick={handleLinkClick}>
                Explore
              </Link>
              {user?.uid && (
                <>
                  <Link href="/pads/create" onClick={handleLinkClick}>
                    Create pad
                  </Link>
                  <Link href={`/feed/${user.uid}`} onClick={handleLinkClick}>
                    Your feed
                  </Link>
                  <Link href={`/profile/${user.uid}`} onClick={handleLinkClick}>
                    Profile settings
                  </Link>
                  <Link href="/channels/create" onClick={handleLinkClick}>
                    Create channel
                  </Link>
                </>
              )}
            </div>

            <div className={styles["navbar-sidebar-footer"]}>
              {!user ? (
                <button
                  onClick={() => {
                    handleLinkClick();
                    openLogin();
                  }}
                >
                  Log in
                </button>
              ) : (
                <button
                  onClick={async () => {
                    handleLinkClick();
                    await handleLogout();
                  }}
                >
                  Log out
                </button>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
