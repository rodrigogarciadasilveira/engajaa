export function Card({ children, style, dark }) {
  return (
    <div style={{
      background: dark ? 'linear-gradient(135deg, #1E1B2E, #2A2640)' : '#FFFFFF',
      border: dark ? 'none' : '1px solid #EBEBF5',
      borderRadius: 20, padding: '20px 24px',
      transition: 'box-shadow 0.2s',
      ...style,
    }}>
      {children}
    </div>
  );
}
