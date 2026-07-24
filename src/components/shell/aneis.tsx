export function Aneis({ legal, docs, op }: { legal: number; docs: number; op: number }) {
  const C = 90;
  const ESP = 14;

  const anel = (r: number, val: number, cls: "a" | "b" | "c") => {
    const circ = 2 * Math.PI * r;
    return (
      <g key={cls}>
        <circle cx={C} cy={C} r={r} className={`an__t an__t--${cls}`} strokeWidth={ESP} fill="none" />
        <circle
          cx={C}
          cy={C}
          r={r}
          className={`an__v an__v--${cls}`}
          strokeWidth={ESP}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(val / 100) * circ} ${circ}`}
          transform={`rotate(-90 ${C} ${C})`}
        />
      </g>
    );
  };

  return (
    <svg viewBox="0 0 180 180" className="an">
      {anel(72, legal, "a")}
      {anel(54, docs, "b")}
      {anel(36, op, "c")}
    </svg>
  );
}
