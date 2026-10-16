// Looking up at a glass curtain wall: ridge lines converge on a vanishing
// point above the frame, so panes shrink toward the top. Panes catch more
// light toward the top-right and fall into shadow toward the bottom-left,
// where the headline sits, so the text stays legible over them.
const WIDTH = 1440;
const HEIGHT = 900;
const VANISHING_POINT = { x: 900, y: -900 };
const RIDGE_BASES = [-700, -300, 60, 380, 660, 920, 1180, 1460, 1800];
const FLOOR_YS = [0, 70, 150, 245, 360, 500, 670, 900];

// Steel-blue glass, darkest first.
const TONES = ["#0d1722", "#132130", "#1a2c3e", "#22384d", "#2c4660", "#3a5774", "#56718c"];

function ridgeX(base: number, y: number) {
  const t = (y - VANISHING_POINT.y) / (HEIGHT - VANISHING_POINT.y);
  return VANISHING_POINT.x + (base - VANISHING_POINT.x) * t;
}

function paneTone(col: number, row: number) {
  const light = col / (RIDGE_BASES.length - 2) - row / (FLOOR_YS.length - 2);
  // Deterministic per-pane jitter, so neighbouring panes reflect differently.
  const jitter = ((col * 7 + row * 13) % 5) - 2;
  const index = Math.round(3 + light * 2.5 + jitter * 0.6);
  return TONES[Math.min(Math.max(index, 0), TONES.length - 1)];
}

const PANES = RIDGE_BASES.slice(0, -1).flatMap((left, col) => {
  const right = RIDGE_BASES[col + 1];
  return FLOOR_YS.slice(0, -1).map((top, row) => {
    const bottom = FLOOR_YS[row + 1];
    const points = [
      [ridgeX(left, top), top],
      [ridgeX(right, top), top],
      [ridgeX(right, bottom), bottom],
      [ridgeX(left, bottom), bottom],
    ];
    return { key: `${col}-${row}`, points: points.join(" "), fill: paneTone(col, row) };
  });
});

export function FacadeBackdrop() {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="facade-backdrop-shade" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#060c14" stopOpacity="0" />
          <stop offset="0.55" stopColor="#060c14" stopOpacity="0.35" />
          <stop offset="1" stopColor="#060c14" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      <rect width={WIDTH} height={HEIGHT} fill={TONES[0]} />

      {PANES.map((pane) => (
        <polygon key={pane.key} points={pane.points} fill={pane.fill} />
      ))}

      {/* Angled glass folds crossing the facade. */}
      <polygon points="240,0 980,0 520,610" fill="#9fb4c8" opacity="0.14" />
      <polygon points="520,610 980,0 1440,420" fill="#6f8aa4" opacity="0.12" />

      <g stroke="#ffffff" strokeOpacity="0.1" strokeWidth="2">
        {RIDGE_BASES.map((base) => (
          <line key={base} x1={ridgeX(base, 0)} y1={0} x2={base} y2={HEIGHT} />
        ))}
        {FLOOR_YS.map((y) => (
          <line key={y} x1={0} y1={y} x2={WIDTH} y2={y} />
        ))}
      </g>
      <g stroke="#ffffff" strokeOpacity="0.22" strokeWidth="2" fill="none">
        <polyline points="240,0 520,610 1440,420" />
        <line x1="980" y1="0" x2="520" y2="610" />
      </g>

      <rect width={WIDTH} height={HEIGHT} fill="url(#facade-backdrop-shade)" />
    </svg>
  );
}
