export function VerifiedBadge({ size = "sm" }: { size?: "xs" | "sm" | "md" }) {
  const cls = {
    xs: "text-xs px-1.5 py-0.5 gap-0.5",
    sm: "text-xs px-2   py-1   gap-1",
    md: "text-sm px-2.5 py-1   gap-1",
  }[size];

  return (
    <span className={`inline-flex items-center font-semibold bg-green-900/40 text-green-400 border border-green-800/50 rounded-full ${cls}`}>
      <svg className="w-3 h-3 shrink-0" viewBox="0 0 12 12" fill="currentColor">
        <path fillRule="evenodd" d="M6 1a5 5 0 100 10A5 5 0 006 1zm2.78 3.97a.75.75 0 00-1.06-1.06L5.25 6.44 4.28 5.47a.75.75 0 00-1.06 1.06l1.5 1.5a.75.75 0 001.06 0l3-3z" clipRule="evenodd" />
      </svg>
      Verified
    </span>
  );
}
