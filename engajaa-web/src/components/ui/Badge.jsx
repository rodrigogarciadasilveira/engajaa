const TAG_COLORS = {
  'Alto Impacto': '#22C55E',
  'Engajamento':  '#7C3AED',
  'Conversão':    '#3B82F6',
  'Audiência':    '#F59E0B',
};

export function Badge({ label, color }) {
  const c = color || TAG_COLORS[label] || '#6B7280';
  return (
    <span style={{
      background: c + '18',
      color: c,
      borderRadius: 7,
      padding: '2px 10px',
      fontSize: 11,
      fontWeight: 800,
      display: 'inline-block',
    }}>
      {label}
    </span>
  );
}
