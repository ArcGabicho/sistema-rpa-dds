// Looking up at a glass curtain wall: ridge lines converge on a vanishing
// point above the frame, so panes shrink toward the top. Panes catch more
// light toward the top-right and fall into shade toward the bottom-left,
// where headlines sit, so text stays legible over them.
//
// Two tones, both from the hero robot's palette: "dark" (its navies and
// deep blues — the login, the dashboard frame, the CTA band) and "light"
// (its pale glass blues — the public page heroes).
const WIDTH = 1440;
const HEIGHT = 900;
const VANISHING_POINT = { x: 900, y: -900 };
const RIDGE_BASES = [-700, -300, 60, 380, 660, 920, 1180, 1460, 1800];
const FLOOR_YS = [0, 70, 150, 245, 360, 500, 670, 900];

type Tone = "dark" | "light";

const THEMES: Record<
  Tone,
  {
    // Ordered from least to most light-catching.
    panes: string[];
    lines: { color: string; opacity: number };
    folds: { color: string; opacity: number }[];
    foldLines: { color: string; opacity: number };
    shade: string;
  }
> = {
  dark: {
    panes: ["#17273a", "#1a2f4a", "#1a3a60", "#24456b", "#345574", "#3472ad", "#3675b0"],
    lines: { color: "#ffffff", opacity: 0.1 },
    folds: [
      { color: "#94e2ff", opacity: 0.08 },
      { color: "#68a7df", opacity: 0.1 },
    ],
    foldLines: { color: "#ffffff", opacity: 0.22 },
    shade:
      "linear-gradient(to top right, rgb(23 39 58 / 0.92), rgb(23 39 58 / 0.4) 45%, rgb(23 39 58 / 0) 100%)",
  },
  light: {
    panes: ["#ffffff", "#f5faff", "#ebf5ff", "#e2f1fe", "#d6ebfe", "#c8e5fe", "#b3d9fb"],
    lines: { color: "#9dcaf1", opacity: 0.35 },
    folds: [
      { color: "#68a7df", opacity: 0.08 },
      { color: "#359cfd", opacity: 0.06 },
    ],
    foldLines: { color: "#68a7df", opacity: 0.3 },
    shade:
      "linear-gradient(to top right, rgb(255 255 255 / 0.95), rgb(255 255 255 / 0.5) 50%, rgb(255 255 255 / 0) 100%)",
  },
};

function ridgeX(base: number, y: number) {
  const t = (y - VANISHING_POINT.y) / (HEIGHT - VANISHING_POINT.y);
  return VANISHING_POINT.x + (base - VANISHING_POINT.x) * t;
}

function paneIndex(col: number, row: number, count: number) {
  const light = col / (RIDGE_BASES.length - 2) - row / (FLOOR_YS.length - 2);
  // Deterministic per-pane jitter, so neighbouring panes reflect differently.
  const jitter = ((col * 7 + row * 13) % 5) - 2;
  const index = Math.round(3 + light * 2.5 + jitter * 0.6);
  return Math.min(Math.max(index, 0), count - 1);
}

const PANE_SHAPES = RIDGE_BASES.slice(0, -1).flatMap((left, col) => {
  const right = RIDGE_BASES[col + 1];
  return FLOOR_YS.slice(0, -1).map((top, row) => {
    const bottom = FLOOR_YS[row + 1];
    const points = [
      [ridgeX(left, top), top],
      [ridgeX(right, top), top],
      [ridgeX(right, bottom), bottom],
      [ridgeX(left, bottom), bottom],
    ];
    return { key: `${col}-${row}`, points: points.join(" "), col, row };
  });
});

export function FacadeBackdrop({ tone = "dark" }: { tone?: Tone }) {
  const theme = THEMES[tone];

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <rect width={WIDTH} height={HEIGHT} fill={theme.panes[0]} />

        {PANE_SHAPES.map((pane) => (
          <polygon
            key={pane.key}
            points={pane.points}
            fill={theme.panes[paneIndex(pane.col, pane.row, theme.panes.length)]}
          />
        ))}

        {/* Angled glass folds crossing the facade. */}
        <polygon points="240,0 980,0 520,610" fill={theme.folds[0].color} opacity={theme.folds[0].opacity} />
        <polygon points="520,610 980,0 1440,420" fill={theme.folds[1].color} opacity={theme.folds[1].opacity} />

        <g stroke={theme.lines.color} strokeOpacity={theme.lines.opacity} strokeWidth="2">
          {RIDGE_BASES.map((base) => (
            <line key={base} x1={ridgeX(base, 0)} y1={0} x2={base} y2={HEIGHT} />
          ))}
          {FLOOR_YS.map((y) => (
            <line key={y} x1={0} y1={y} x2={WIDTH} y2={y} />
          ))}
        </g>
        <g stroke={theme.foldLines.color} strokeOpacity={theme.foldLines.opacity} strokeWidth="2" fill="none">
          <polyline points="240,0 520,610 1440,420" />
          <line x1="980" y1="0" x2="520" y2="610" />
        </g>
      </svg>
      <div className="absolute inset-0" style={{ backgroundImage: theme.shade }} />
    </div>
  );
}
