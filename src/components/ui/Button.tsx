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
  primary: "btn-primary",
  outline: "btn-outline",
  ghost: "btn-ghost",
};

function classes(variant: BaseProps["variant"], className?: string) {
  return clsx("chrome-ltr", variantClasses[variant ?? "primary"], className);
}

export function Button({
  children,
  className,
  variant = "primary",
  showArrow = true,
  href,
  ...rest
}: BaseProps & { href?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const inner = (
    <>
      <span>{children}</span>
      {showArrow && <ArrowRight className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes(variant, className)}>
        {inner}
      </Link>
    );
  }
  return (
    <button className={classes(variant, className)} {...rest}>
      {inner}
    </button>
  );
}
