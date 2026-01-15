import "./globals.css";
import { IBM_Plex_Sans } from "next/font/google";

import Navbar from "@/components/layout/Navbar";
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
        <div className="app-content">
          <AuthContextProvider>
            <ColorThemeProvider>
              <PopupProvider>
                <Navbar />
                {children}
              </PopupProvider>
            </ColorThemeProvider>
          </AuthContextProvider>
        </div>
      </body>
    </html>
  );
}
