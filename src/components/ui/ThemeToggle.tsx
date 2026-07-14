"use client";

import clsx from "clsx";
import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations("common");
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? t("switchToDark") : t("switchToLight")}
      className={clsx(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted transition-colors duration-200 hover:border-accent hover:text-accent",
        className,
      )}
    >
      {isLight ? <Moon className="h-[15px] w-[15px]" /> : <Sun className="h-[15px] w-[15px]" />}
    </button>
  );
}
