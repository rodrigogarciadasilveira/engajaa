import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logoSvg from '../../assets/logo.svg';

const NAV = [
  { to: '/',             label: 'Dashboard',    icon: '⬛' },
  { to: '/analytics',    label: 'Análises',     icon: '📊' },
  { to: '/growth-radar', label: 'Radar',        icon: '🎯' },
  { to: '/suggestions',  label: 'Sugestões IA', icon: '🤖' },
  { to: '/scheduler',    label: 'Agendamento',  icon: '📅' },
  { to: '/settings',     label: 'Configurações', icon: '⚙️' },
];

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logoWrap}>
        <img src={logoSvg} alt="Engajaa icon" style={styles.logoIcon} />
        <span style={styles.logoText}>Engajaa</span>
      </div>

      <nav style={styles.nav}>
        {NAV.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            ...styles.navItem,
            ...(isActive ? styles.navItemActive : {}),
          })}>
            {({ isActive }) => (
              <>
                {isActive && <span style={styles.activeBorder} />}
                <span style={styles.navIcon}>{icon}</span>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div style={styles.footer}>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>{user?.email?.[0]?.toUpperCase() || 'U'}</div>
          <div>
            <div style={styles.userEmail}>{user?.email || '—'}</div>
            <div style={styles.userRole}>{user?.role}</div>
          </div>
        </div>
        <button onClick={logout} style={styles.logoutBtn}>Sair</button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 220, minHeight: '100vh', background: '#1E1B2E',
    display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, zIndex: 100,
    borderRight: '1px solid #353050',
  },
  logoWrap: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '24px 20px 20px',
    borderBottom: '1px solid #353050',
  },
  logoIcon: { width: 32, height: 32 },
  logoText: {
    fontFamily: "'DM Sans', sans-serif", fontWeight: 900, fontSize: 20,
    color: '#FFFFFF', letterSpacing: '-0.03em',
  },
  nav: { flex: 1, padding: '12px 0' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
    color: '#9CA3AF', fontSize: 13, fontWeight: 500, position: 'relative',
    transition: 'background 0.15s', cursor: 'pointer',
  },
  navItemActive: {
    background: 'linear-gradient(135deg, #7C3AED22, #6366F122)',
    color: '#FFFFFF', fontWeight: 700,
  },
  activeBorder: {
    position: 'absolute', left: 0, top: 4, bottom: 4, width: 3,
    background: 'linear-gradient(135deg, #7C3AED, #3B82F6)', borderRadius: '0 3px 3px 0',
  },
  navIcon: { fontSize: 16, width: 20, textAlign: 'center' },
  footer: {
    padding: '16px 20px', borderTop: '1px solid #353050',
  },
  userInfo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: {
    width: 32, height: 32, borderRadius: '50%',
    background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0,
  },
  userEmail: { color: '#E5E7EB', fontSize: 12, fontWeight: 500 },
  userRole: { color: '#6B7280', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' },
  logoutBtn: {
    width: '100%', padding: '8px', background: 'transparent',
    border: '1.5px solid #353050', borderRadius: 8,
    color: '#9CA3AF', fontSize: 12, fontWeight: 700, cursor: 'pointer',
  },
};
