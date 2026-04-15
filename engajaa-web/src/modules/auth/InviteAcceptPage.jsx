import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import logoSvg from '../../assets/logo.svg';

export default function InviteAcceptPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/invite/accept', { token, ...form });
      navigate('/login');
    } catch {
      setError('Link inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8F7FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '40px 36px', width: 400, border: '1px solid #EBEBF5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <img src={logoSvg} alt="Engajaa" style={{ width: 36, height: 36 }} />
          <span style={{ fontWeight: 900, fontSize: 22, color: '#1E1B2E', letterSpacing: '-0.03em' }}>Engajaa</span>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>Aceitar convite</h1>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={ls}>Nome<input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required style={is} placeholder="Seu nome" /></label>
          <label style={ls}>Senha<input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={8} style={is} placeholder="Crie uma senha" /></label>
          {error && <p style={{ color: '#EF4444', fontSize: 13 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #7C3AED, #3B82F6)', color: '#fff', border: 'none', borderRadius: 12, padding: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            {loading ? 'Criando conta…' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  );
}

const ls = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 700, color: '#111827' };
const is = { border: '1px solid #EBEBF5', borderRadius: 10, padding: '10px 14px', fontSize: 14, background: '#F8F7FF' };
