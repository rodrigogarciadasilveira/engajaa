import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../../services/api';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import GrowthRadarWidget from './GrowthRadarWidget';

export default function DashboardPage() {
  const { user } = useAuth();
  const { igAccount } = useTenant();
  const [overview, setOverview] = useState(null);
  const [daily, setDaily] = useState([]);
  const [formats, setFormats] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    api.get('/analytics/overview').then(r => setOverview(r.data)).catch(() => {});
    api.get('/analytics/daily?days=7').then(r => setDaily(r.data)).catch(() => {});
    api.get('/analytics/by-format').then(r => setFormats(r.data)).catch(() => {});
    api.get('/suggestions').then(r => setSuggestions(r.data?.slice(0, 1) || [])).catch(() => {});
  }, []);

  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  const followersCount = igAccount?.followersCount ?? null;

  const metricCards = [
    { key: 'totalLikes',      label: 'Likes Obtidos',       icon: '❤️',  color: '#EF4444' },
    { key: 'totalReach',      label: 'Alcance Total',        icon: '👁️',  color: '#3B82F6' },
    { key: 'totalPosts',      label: 'Posts no Período',     icon: '📸',  color: '#7C3AED' },
    { key: 'engagementRate',  label: 'Taxa de Engajamento',  icon: '📈',  color: '#22C55E', suffix: '%' },
    { key: '_followers',      label: 'Seguidores',           icon: '👥',  color: '#F59E0B' },
  ];

  function getMetricValue(key, suffix) {
    if (key === '_followers') {
      if (followersCount == null) return '—';
      if (followersCount >= 1000000) return (followersCount / 1000000).toFixed(1) + 'M';
      if (followersCount >= 1000) return (followersCount / 1000).toFixed(1) + 'K';
      return String(followersCount);
    }
    if (!overview) return '…';
    const val = overview[key];
    if (val == null) return '—';
    return String(val) + (suffix || '');
  }

  const lastSyncLabel = igAccount?.lastSyncAt
    ? new Date(igAccount.lastSyncAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <PageWrapper
      title={`Olá, ${user?.name || 'usuário'}!`}
      subtitle={
        <span>
          {today.charAt(0).toUpperCase() + today.slice(1)}
          {lastSyncLabel && (
            <span style={{ marginLeft: 16, fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>
              Última sincronização: {lastSyncLabel}
            </span>
          )}
        </span>
      }
    >
      {/* Metric Cards — 5 cards with auto-fit */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {metricCards.map(({ key, label, icon, color, suffix }) => (
          <Card key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#111827' }}>
                  {getMetricValue(key, suffix)}
                </div>
              </div>
              <div style={{ fontSize: 22, background: color + '18', borderRadius: 10, padding: '6px 8px' }}>{icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Growth chart */}
        <Card>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 20 }}>Alcance Diário</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #EBEBF5', fontSize: 12 }} />
              <Area type="monotone" dataKey="reach" stroke="#7C3AED" strokeWidth={2.5} fill="url(#gradArea)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Content Insights */}
        <Card>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 16 }}>Insights do Conteúdo</div>
          {formats.slice(0, 3).map((f) => (
            <div key={f.format} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{f.format}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED' }}>{f.score}</span>
              </div>
              <div style={{ background: '#EBEBF5', borderRadius: 4, height: 6 }}>
                <div style={{
                  background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
                  width: `${Math.min(100, f.score / 10 * 100)}%`,
                  height: '100%', borderRadius: 4,
                }} />
              </div>
            </div>
          ))}
          {formats.length === 0 && <p style={{ fontSize: 13, color: '#6B7280' }}>Nenhum dado ainda.</p>}
        </Card>
      </div>

      {/* Suggestion of the Day */}
      {suggestions[0] && (
        <Card dark>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 6 }}>
                Sugestão do Dia
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 6 }}>
                {suggestions[0].icon} {suggestions[0].title}
              </div>
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>{suggestions[0].insight}</div>
            </div>
            <Button style={{ marginLeft: 24, flexShrink: 0 }}>Ver sugestões</Button>
          </div>
        </Card>
      )}

      {/* ── Radar de Crescimento ─────────────────────────────────────────── */}
      <div style={{ marginTop: 24 }}>
        <GrowthRadarWidget />
      </div>
    </PageWrapper>
  );
}
