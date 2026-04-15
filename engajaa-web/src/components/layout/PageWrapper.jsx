export function PageWrapper({ title, subtitle, children, action }) {
  return (
    <div style={{ padding: '32px 32px 48px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>{title}</h1>
          {subtitle && <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
