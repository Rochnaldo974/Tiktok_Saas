export default function Loading() {
  return (
    <div className="page">
      <div className="content" style={{ gap: 28 }}>
        <div className="skeleton" style={{ height: 60, borderRadius: 'var(--r-md)', maxWidth: 520 }} />
        <div className="skeleton" style={{ height: 240, borderRadius: 'var(--r-xl)' }} />
        <div className="skeleton" style={{ height: 320, borderRadius: 'var(--r-lg)' }} />
      </div>
      <aside className="rail">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton" style={{ height: 140, borderRadius: 'var(--r-lg)' }} />
        ))}
      </aside>
    </div>
  );
}
