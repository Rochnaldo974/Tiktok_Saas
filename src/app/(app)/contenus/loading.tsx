export default function Loading() {
  return (
    <div className="page" style={{ gridTemplateColumns: '1fr' }}>
      <div className="content" style={{ gap: 20, maxWidth: 860 }}>
        <div className="skeleton" style={{ height: 110, borderRadius: 'var(--r-lg)' }} />
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton" style={{ height: 150, borderRadius: 'var(--r-lg)' }} />
        ))}
      </div>
    </div>
  );
}
