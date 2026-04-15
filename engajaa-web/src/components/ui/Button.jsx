export function Button({ children, onClick, variant = 'primary', size = 'md', style, disabled }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none', transition: 'all 0.15s', borderRadius: 12, opacity: disabled ? 0.6 : 1,
    fontSize: size === 'sm' ? 12 : 14,
    padding: size === 'sm' ? '6px 14px' : '10px 20px',
  };

  const variants = {
    primary: { background: 'linear-gradient(135deg, #7C3AED, #3B82F6)', color: '#FFFFFF' },
    secondary: { background: 'transparent', border: '1.5px solid #7C3AED', color: '#7C3AED' },
    ghost: { background: 'transparent', color: '#6B7280' },
    danger: { background: 'transparent', border: '1.5px solid #EF4444', color: '#EF4444' },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={(e) => { if (!disabled && variant === 'primary') e.currentTarget.style.filter = 'brightness(1.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = ''; }}
    >
      {children}
    </button>
  );
}
