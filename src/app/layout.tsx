import Script from "next/script";
import { INTRO_BOOT_SCRIPT } from "@/lib/intro-session";

/**
 * Root layout persists across locale switches ([locale] remounts).
 * Intro boot must live here — a raw <script> in [locale]/layout throws on
 * client navigation (React never executes scripts rendered on the client).
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script
        id="intro-boot"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: INTRO_BOOT_SCRIPT }}
      />
      {children}
    </>
  );
}
