const R = 19;
const C = 2 * Math.PI * R;

export function Ring({ value, accent = false }: { value: number; accent?: boolean }) {
  return (
    <div className={`ring${accent ? ' accent' : ''}`} role="img" aria-label={`Confidence ${value}%`}>
      <svg viewBox="0 0 44 44">
        <circle className="track" cx="22" cy="22" r={R} />
        <circle
          className="val"
          cx="22"
          cy="22"
          r={R}
          strokeDasharray={C}
          strokeDashoffset={C * (1 - value / 100)}
        />
      </svg>
      <span className="num">{value}</span>
    </div>
  );
}
