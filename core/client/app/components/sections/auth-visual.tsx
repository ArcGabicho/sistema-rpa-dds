export function AuthVisual() {
  return (
    <svg
      viewBox="0 0 500 800"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <rect width="500" height="800" className="fill-ink-950" />

      {/* Diagonal glass facets, echoing a faceted building facade. */}
      <polygon points="0,0 260,0 0,320" className="fill-ink-800" opacity="0.6" />
      <polygon points="260,0 500,0 500,140 120,420" className="fill-brass-500" opacity="0.16" />
      <polygon points="500,0 500,300 260,500 500,140" className="fill-ink-700" opacity="0.5" />
      <polygon points="120,420 500,140 500,300 260,500" className="fill-signal-400" opacity="0.08" />
      <polygon points="0,320 260,500 0,520" className="fill-ink-800" opacity="0.4" />
      <polygon points="0,520 260,500 500,300 500,560 180,800 0,800" className="fill-ink-900" opacity="0.7" />
      <polygon points="500,560 500,800 180,800" className="fill-brass-600" opacity="0.2" />

      {/* Faint mullion lines to sell the "glass panel" read. */}
      <g stroke="var(--color-paper)" strokeOpacity="0.08" strokeWidth="1.5">
        <line x1="0" y1="0" x2="260" y2="0" />
        <line x1="260" y1="0" x2="120" y2="420" />
        <line x1="120" y1="420" x2="0" y2="320" />
        <line x1="500" y1="140" x2="260" y2="500" />
        <line x1="260" y1="500" x2="500" y2="300" />
        <line x1="0" y1="520" x2="260" y2="500" />
        <line x1="500" y1="560" x2="180" y2="800" />
      </g>
    </svg>
  );
}
