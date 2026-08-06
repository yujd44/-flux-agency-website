import {
  IBM_Plex_Sans,
  IBM_Plex_Sans_Arabic,
  IBM_Plex_Sans_Hebrew,
  JetBrains_Mono,
  Unbounded,
} from "next/font/google";

/** Body / UI — tech grotesk with Latin + Cyrillic. */
export const fontLatin = IBM_Plex_Sans({
  variable: "--font-latin",
  subsets: ["latin", "cyrillic", "latin-ext", "cyrillic-ext"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

/** Console / HUD accents. */
export const fontMono = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

/** Display headlines — geometric, cosmic presence; Cyrillic-capable. */
export const fontHeadline = Unbounded({
  variable: "--font-headline",
  subsets: ["latin", "cyrillic", "latin-ext", "cyrillic-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

/** Accent uses the same display family via CSS (--font-accent → --font-headline). */
export const fontAccent = fontHeadline;

/**
 * Hebrew UI — same IBM Plex Sans family as Latin/Cyrillic (not Noto).
 * Loaded on every locale so language switches don't fetch a new face.
 */
export const fontHebrew = IBM_Plex_Sans_Hebrew({
  variable: "--font-he",
  subsets: ["hebrew", "latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

/**
 * Arabic UI — matching IBM Plex Sans Arabic companion.
 * Loaded on every locale so language switches don't fetch a new face.
 */
export const fontArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ar",
  subsets: ["arabic", "latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  preload: true,
});
