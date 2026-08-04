import clsx from "clsx";

export default function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "mx-auto w-full max-w-[1440px] px-6 sm:px-8 lg:px-20 xl:px-24",
        className,
      )}
    >
      {children}
    </div>
  );
}
