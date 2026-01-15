import "./globals.css";
import localFont from "next/font/local";
import { IBM_Plex_Sans } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import ColorThemeProvider from "@/app/(providers)/color-theme-provider";
import { AuthContextProvider } from "./(providers)/auth-provider";
import { PopupProvider } from "./(providers)/popup-provider";

const array = localFont({
  src: [
    {
      path: "../fonts/array/Array-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/array/Array-Semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/array/Array-BoldWide.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-array",
});

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
    <html lang="es" className={`${array.variable} ${plex.variable}`}>
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
