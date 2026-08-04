import {
  Geist,
  Geist_Mono,
  IBM_Plex_Sans_Hebrew,
  IBM_Plex_Sans_Arabic,
} from "next/font/google";

export const fontLatin = Geist({
  variable: "--font-latin",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const fontMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  display: "swap",
});

export const fontHebrew = IBM_Plex_Sans_Hebrew({
  variable: "--font-he",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const fontArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ar",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});
