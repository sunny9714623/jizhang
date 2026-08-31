type Slice = { id: string; label: string; fen: number; color: string };

function arc(cx: number, cy: number, r: number, start: number, end: number): string {
  const to = (a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  const [x1, y1] = to(start);
  const [x2, y2] = to(end);
  const large = end - start > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

export function Donut({
  slices,
  center,
  sub,
  onPick,
}: {
  slices: Slice[];
  center: string;
  sub: string;
  onPick: (id: string) => void;
}) {
  const total = slices.reduce((s, x) => s + x.fen, 0) || 1;
  const cx = 140;
  const cy = 140;
  const r = 56;
  let angle = -Math.PI / 2;
  const arcs = slices
    .filter((s) => s.fen > 0)
    .map((s) => {
      const sweep = (s.fen / total) * Math.PI * 2;
      const start = angle;
      const end = angle + Math.max(sweep, 0.02);
      angle = end;
      const mid = (start + end) / 2;
      const labelR = 102;
      return {
        ...s,
        start,
        end,
        lx: cx + labelR * Math.cos(mid),
        ly: cy + labelR * Math.sin(mid),
        pct: (s.fen / total) * 100,
      };
    });

  return (
    <svg viewBox="0 0 280 280" className="mx-auto block w-full max-w-[300px]">
      {arcs.length === 0 ? (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-border)" strokeWidth="22" />
      ) : (
        arcs.map((a) => (
          <path
            key={a.id}
            d={arc(cx, cy, r, a.start, a.end)}
            fill="none"
            stroke={a.color}
            strokeWidth="22"
            strokeLinecap="butt"
            className="cursor-pointer"
            onClick={() => onPick(a.id)}
          />
        ))
      )}
      <text x={cx} y={cy - 8} textAnchor="middle" className="fill-muted" fontSize="11">
        {sub}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="fill-fg" fontSize="16" fontFamily="var(--font-display)">
        {center}
      </text>
      {arcs.map((a) =>
        a.pct >= 6 ? (
          <text
            key={`${a.id}-l`}
            x={a.lx}
            y={a.ly}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-fg"
            fontSize="10"
          >
            {a.label} {a.pct.toFixed(0)}%
          </text>
        ) : null,
      )}
    </svg>
  );
}
