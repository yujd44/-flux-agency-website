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
        <div className="chrome-ltr mb-4 inline-flex items-center gap-3">
          <span className="eng-marker" aria-hidden="true" />
          <span className="label-mono text-muted">{eyebrow}</span>
        </div>
      )}
      <h2 className="text-3xl font-medium leading-[1.1] tracking-tight text-text sm:text-4xl lg:text-[44px]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-5 text-lg leading-[1.7] text-muted sm:text-xl">{subtitle}</p>
      )}
    </div>
  );
}
