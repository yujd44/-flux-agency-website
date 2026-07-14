import clsx from "clsx";

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "start",
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "text-content max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <div className="mb-4 flex items-center gap-3 text-[13px] font-medium uppercase tracking-[0.2em] text-accent">
          <span className="h-px w-6 bg-accent/60" />
          {eyebrow}
        </div>
      )}
      <h2 className="text-3xl font-semibold leading-[1.15] tracking-tight text-text sm:text-4xl lg:text-[44px]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">{subtitle}</p>
      )}
    </div>
  );
}
