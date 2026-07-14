import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

type BaseProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "outline" | "ghost";
  showArrow?: boolean;
};

const variantClasses: Record<string, string> = {
  primary:
    "bg-accent text-white hover:bg-accent/90 border border-accent",
  outline:
    "border border-border-strong text-text hover:border-accent hover:text-accent bg-transparent",
  ghost: "text-text hover:text-accent bg-transparent",
};

function classes(variant: BaseProps["variant"], className?: string) {
  return clsx(
    "chrome-ltr inline-flex items-center gap-2.5 rounded-full px-6 py-3 text-[13px] font-medium uppercase tracking-[0.12em] transition-all duration-300",
    variantClasses[variant ?? "outline"],
    className,
  );
}

export function Button({
  children,
  className,
  variant = "outline",
  showArrow = true,
  href,
  ...rest
}: BaseProps & { href?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  if (href) {
    return (
      <Link href={href} className={classes(variant, className)}>
        <span>{children}</span>
        {showArrow && (
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        )}
      </Link>
    );
  }
  return (
    <button className={classes(variant, className)} {...rest}>
      <span>{children}</span>
      {showArrow && <ArrowRight className="h-3.5 w-3.5" />}
    </button>
  );
}
