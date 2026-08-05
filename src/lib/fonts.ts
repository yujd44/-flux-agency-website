import {
  IBM_Plex_Sans,
  JetBrains_Mono,
  Noto_Sans_Arabic,
  Noto_Sans_Hebrew,
  Unbounded,
} from "next/font/google";

/** Body / UI — tech grotesk with Latin + Cyrillic. */
export const fontLatin = IBM_Plex_Sans({
  variable: "--font-latin",
  subsets: ["latin", "cyrillic", "latin-ext", "cyrillic-ext"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

/** Console / HUD accents. */
export const fontMono = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** Display headlines — geometric, cosmic presence; Cyrillic-capable. */
export const fontHeadline = Unbounded({
  variable: "--font-headline",
  subsets: ["latin", "cyrillic", "latin-ext", "cyrillic-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** Accent uses the same display family via CSS (--font-accent → --font-headline). */
export const fontAccent = fontHeadline;

export const fontHebrew = Noto_Sans_Hebrew({
  variable: "--font-he",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const fontArabic = Noto_Sans_Arabic({
  variable: "--font-ar",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});
