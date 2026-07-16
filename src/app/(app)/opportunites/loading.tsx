export default function Loading() {
  return (
    <div className="page" style={{ gridTemplateColumns: '1fr' }}>
      <div className="content" style={{ gap: 24 }}>
        <div className="skeleton" style={{ height: 120, borderRadius: 'var(--r-lg)' }} />
        <div className="skeleton" style={{ height: 56, borderRadius: 'var(--r-md)' }} />
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton" style={{ height: 220, borderRadius: 'var(--r-lg)' }} />
        ))}
      </div>
    </div>
  );
}
