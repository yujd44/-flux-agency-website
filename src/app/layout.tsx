/**
 * Root layout persists across locale switches ([locale] remounts).
 * Do not put beforeInteractive Script here without owning <html><head> —
 * a fragment-wrapped Script errors on client locale navigation.
 * Intro gate is CSS + LogoIntro useLayoutEffect (no boot <script>).
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
