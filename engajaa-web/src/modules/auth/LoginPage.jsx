import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logoSvg from '../../assets/logo.svg';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch {
      setError('E-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8F7FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '40px 36px', width: 400, border: '1px solid #EBEBF5', boxShadow: '0 4px 24px rgba(124,58,237,0.08)' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <img src={logoSvg} alt="Engajaa" style={{ width: 40, height: 40 }} />
          <span style={{ fontWeight: 900, fontSize: 24, color: '#1E1B2E', letterSpacing: '-0.03em' }}>Engajaa</span>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827', marginBottom: 6 }}>Entrar</h1>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 28 }}>Cresça nas redes de verdade.</p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={labelStyle}>E-mail
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required placeholder="seu@email.com" style={inputStyle} />
          </label>
          <label style={labelStyle}>Senha
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required placeholder="••••••••" style={inputStyle} />
          </label>
          {error && <p style={{ fontSize: 13, color: '#EF4444', fontWeight: 600 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{
            background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
            color: '#fff', border: 'none', borderRadius: 12, padding: '12px',
            fontWeight: 700, fontSize: 14, cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.8 : 1, marginTop: 4,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 700, color: '#111827' };
const inputStyle = { border: '1px solid #EBEBF5', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#111827', background: '#F8F7FF', outline: 'none' };
