export default function Logo({ size = 26 }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 40 46" fill="none" aria-hidden="true">
      <path d="M22 3c-6-2-11 3-9 9 1 4 6 6 9 9 4 4 2 11-4 13-5 2-10-2-9-7" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M10 30c4 8 18 10 24 0-2 9-8 14-16 14S6 38 10 30z" fill="currentColor" />
    </svg>
  );
}
