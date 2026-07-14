export default function StarOfDavid({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="50,6 91,74 9,74" />
      <polygon points="50,94 9,26 91,26" />
    </svg>
  );
}
