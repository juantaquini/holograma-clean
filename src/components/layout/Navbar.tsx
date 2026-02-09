"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./Navbar.module.css";
import { FiX } from "react-icons/fi";
import { VscStarEmpty } from "react-icons/vsc";
import { usePopup } from "@/app/(providers)/popup-provider";
import { useAuth } from "@/app/(providers)/auth-provider";
import { useColorTheme } from "@/app/(providers)/color-theme-provider";
import { colorPalettes, type ThemeName } from "@/lib/color-palettes";
import Login from "@/components/auth/Login";
import Signin from "@/components/auth/Signin";
import { GiFallingStar } from "react-icons/gi";

const isMobile = () => window.innerWidth <= 1000;

export default function Navbar() {
  const [isMobileView, setIsMobileView] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { openPopup, closePopup } = usePopup();
  const auth = useAuth();
  const { theme, changeTheme } = useColorTheme();
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

  const availableThemes = useMemo(
    () => Object.keys(colorPalettes) as ThemeName[],
    [],
  );

  /* ---------------- RENDER ---------------- */

  return (
    <>
      {isMobileView && (
        <div className={styles["navbar-mobile-row"]}>
          <Link className={styles["navbar-logo-mobile"]} href="/">
            HOLOGRAMA
          </Link>

          <div className={styles["navbar-mobile-actions"]}>
            <button
              className={styles["navbar-avatar"]}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Open menu"
            >
              <GiFallingStar size={20} />
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
            {user ? (
              <button
                className={styles["navbar-avatar"]}
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Open menu"
              >
                <GiFallingStar size={20} />
              </button>
            ) : (
              <div className={styles["navbar-auth-actions"]}>
                <button
                  className={styles["navbar-auth-button"]}
                  onClick={openLogin}
                >
                  Log in
                </button>
                <button
                  className={styles["navbar-auth-button"]}
                  onClick={openSignin}
                >
                  Sign up
                </button>
              </div>
            )}
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

            <div className={styles["navbar-theme-section"]}>
              <div className={styles["navbar-theme-title"]}>Theme</div>
              <div className={styles["navbar-theme-grid"]}>
                {availableThemes.map((themeName) => (
                  <button
                    key={themeName}
                    type="button"
                    className={
                      themeName === theme
                        ? `${styles["navbar-theme-button"]} ${styles["navbar-theme-button-active"]}`
                        : styles["navbar-theme-button"]
                    }
                    onClick={() => changeTheme(themeName)}
                  >
                    {themeName}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles["navbar-sidebar-footer"]}>
              {!user ? (
                <div className={styles["navbar-sidebar-auth-buttons"]}>
                  <button
                    className={styles["navbar-sidebar-auth-btn"]}
                    onClick={() => {
                      handleLinkClick();
                      openLogin();
                    }}
                  >
                    Log in
                  </button>
                  <button
                    className={styles["navbar-sidebar-auth-btn"]}
                    onClick={() => {
                      handleLinkClick();
                      openSignin();
                    }}
                  >
                    Sign up
                  </button>
                </div>
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
