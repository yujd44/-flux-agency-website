"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/navigation";

function isServicesHref(href: string | null) {
  if (!href) return false;
  return /\/services(?:\/|$|\?|#)/.test(href) || href === "/services";
}

/**
 * Soft opacity/gradient wipe when navigating to /services.
 */
export default function PortalTransition() {
  const pathname = usePathname();
  const prev = useRef(pathname);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const flash = () => {
      overlay.classList.remove("portal-wipe-active");
      // force reflow so re-triggering animation works
      void overlay.offsetWidth;
      overlay.classList.add("portal-wipe-active");
      window.setTimeout(() => overlay.classList.remove("portal-wipe-active"), 560);
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!isServicesHref(href)) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      flash();
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (prev.current === pathname) return;
    const from = prev.current;
    prev.current = pathname;
    const enteredServices =
      pathname === "/services" || pathname.endsWith("/services");
    const leftHome = from === "/" || from === "";
    if (enteredServices && leftHome) {
      const overlay = overlayRef.current;
      if (!overlay) return;
      overlay.classList.add("portal-wipe-active");
      const t = window.setTimeout(() => overlay.classList.remove("portal-wipe-active"), 520);
      return () => window.clearTimeout(t);
    }
  }, [pathname]);

  return (
    <div
      ref={overlayRef}
      className="portal-wipe pointer-events-none fixed inset-0 z-[80]"
      aria-hidden="true"
    />
  );
}
