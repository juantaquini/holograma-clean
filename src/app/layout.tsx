import "./globals.css";
import Script from "next/script";
import { IBM_Plex_Sans } from "next/font/google";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Subnav from "@/components/layout/Subnav";
import ColorThemeProvider from "@/app/(providers)/color-theme-provider";
import { AuthContextProvider } from "./(providers)/auth-provider";
import { PopupProvider } from "./(providers)/popup-provider";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plex",
});

export const metadata = {
  title: "Holograma",
  description: "Proyecto experimental con p5 y Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={plex.variable}>
      <body>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  var dark = {
    background: "#1d3343ff",
    lighter_bg: "#2c546dff",
    text: "#F8EAF6",
    text_secondary: "#FFB3B3",
    border: "#F8EAF6",
    button: "#E91E63",
    opacity_neutral: "#f8eaf699"
  };
  var light = {
    background: "#F5F5F5",
    lighter_bg: "#f4f4ddff",
    text: "#072A60",
    text_secondary: "#1976D2",
    border: "#303F9F",
    button: "#0d585aff",
    opacity_neutral: "#20437888"
  };
  var palette = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? dark : light;
  var r = document.documentElement;
  if (r && palette) {
    r.style.setProperty("--bg", palette.background);
    r.style.setProperty("--text", palette.text);
    r.style.setProperty("--text-secondary", palette.text_secondary);
    r.style.setProperty("--border", palette.border);
    r.style.setProperty("--lighter-bg", palette.lighter_bg);
    r.style.setProperty("--button", palette.button);
    if (palette.opacity_neutral) r.style.setProperty("--opacity-neutral", palette.opacity_neutral);
    r.style.setProperty("--bg-color", palette.background);
    r.style.setProperty("--text-color", palette.text);
    r.style.setProperty("--text-color-secondary", palette.text_secondary);
    r.style.setProperty("--border-color", palette.border);
    r.style.setProperty("--lighter-bg-color", palette.lighter_bg);
    r.style.setProperty("--button-color", palette.button);
    if (palette.opacity_neutral) r.style.setProperty("--opacity-neutral-color", palette.opacity_neutral);
  }
})();
            `.trim(),
          }}
        />
        <div className="app-content">
          <AuthContextProvider>
            <ColorThemeProvider>
              <PopupProvider>
                <Navbar />
                <Subnav />
                {children}
                <Footer />
              </PopupProvider>
            </ColorThemeProvider>
          </AuthContextProvider>
        </div>
      </body>
    </html>
  );
}
