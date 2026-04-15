import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

const PERIODS = [7, 30, 90];

const MEDIA_TYPE_LABELS = {
  IMAGE: 'Imagem',
  VIDEO: 'Vídeo',
  CAROUSEL_ALBUM: 'Carrossel',
};

const MEDIA_TYPE_COLORS = {
  IMAGE: '#3B82F6',
  VIDEO: '#EF4444',
  CAROUSEL_ALBUM: '#F59E0B',
};

function PostCard({ post }) {
  const thumb = post.thumbnailUrl || post.mediaUrl;
  const label = MEDIA_TYPE_LABELS[post.mediaType] || post.mediaType;
  const color = MEDIA_TYPE_COLORS[post.mediaType] || '#6B7280';
  const caption = post.caption ? post.caption.slice(0, 80) + (post.caption.length > 80 ? '…' : '') : null;

  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      border: '1px solid #EBEBF5',
      overflow: 'hidden',
      transition: 'box-shadow 0.15s, transform 0.15s',
      cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '100%', background: '#F3F4F6', overflow: 'hidden' }}>
        {thumb ? (
          <img
            src={thumb}
            alt={caption || 'post'}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: 'linear-gradient(135deg, #7C3AED22, #3B82F622)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32,
          }}>
            {post.mediaType === 'VIDEO' ? '🎬' : post.mediaType === 'CAROUSEL_ALBUM' ? '🖼️' : '📷'}
          </div>
        )}
        {/* Media type badge */}
        <div style={{
          position: 'absolute', top: 8, left: 8,
          background: color, color: '#fff',
          fontSize: 10, fontWeight: 800,
          padding: '2px 8px', borderRadius: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          {label}
        </div>
        {/* Permalink button */}
        {post.permalink && (
          <a
            href={post.permalink}
            target="_blank"
            rel="noreferrer"
            style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(0,0,0,0.55)', color: '#fff',
              fontSize: 10, fontWeight: 700,
              padding: '3px 8px', borderRadius: 6,
              textDecoration: 'none',
            }}
            onClick={e => e.stopPropagation()}
          >
            Ver ↗
          </a>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '12px 14px' }}>
        {caption && (
          <p style={{ fontSize: 12, color: '#374151', margin: '0 0 10px', lineHeight: 1.5 }}>{caption}</p>
        )}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>❤️ {post.likeCount?.toLocaleString() || 0}</span>
          <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>💬 {post.commentsCount?.toLocaleString() || 0}</span>
          <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>👁️ {post.reach?.toLocaleString() || 0}</span>
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>
          {new Date(post.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState(30);
  const [daily, setDaily] = useState([]);
  const [formats, setFormats] = useState([]);
  const [bestTimes, setBestTimes] = useState([]);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

  useEffect(() => {
    api.get(`/analytics/daily?days=${Math.min(period, 7)}`).then(r => setDaily(r.data)).catch(() => {});
    api.get(`/analytics/by-format?days=${period}`).then(r => setFormats(r.data)).catch(() => {});
    api.get('/analytics/best-times').then(r => setBestTimes(r.data)).catch(() => {});

    setPostsLoading(true);
    api.get('/analytics/posts')
      .then(r => setPosts(r.data || []))
      .catch(() => setPosts([]))
      .finally(() => setPostsLoading(false));
  }, [period]);

  return (
    <PageWrapper
      title="Análises"
      subtitle="Performance do seu perfil no Instagram"
      action={
        <div style={{ display: 'flex', gap: 8 }}>
          {PERIODS.map(d => (
            <button key={d} onClick={() => setPeriod(d)} style={{
              padding: '6px 16px', borderRadius: 8, border: '1.5px solid',
              borderColor: period === d ? '#7C3AED' : '#EBEBF5',
              background: period === d ? '#7C3AED18' : 'transparent',
              color: period === d ? '#7C3AED' : '#6B7280',
              fontWeight: 700, fontSize: 12, cursor: 'pointer',
            }}>
              {d} dias
            </button>
          ))}
        </div>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Alcance Diário</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={daily}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #EBEBF5', fontSize: 12 }} />
              <Bar dataKey="reach" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Engajamento Diário</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={daily}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #EBEBF5', fontSize: 12 }} />
              <Bar dataKey="engagement" fill="#7C3AED" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Format performance table */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Performance por Formato</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #EBEBF5' }}>
              {['Formato', 'Alcance', 'Engajamento', 'Salvamentos', 'Score'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '0 0 10px', color: '#6B7280', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {formats.map((f, i) => (
              <tr key={f.format} style={{ borderBottom: '1px solid #EBEBF5' }}>
                <td style={{ padding: '12px 0', fontWeight: 700, color: '#111827' }}>
                  {f.format}
                  {i === 0 && <Badge label="TOP" color="#22C55E" style={{ marginLeft: 8 }} />}
                </td>
                <td style={{ color: '#6B7280' }}>{f.reach.toLocaleString()}</td>
                <td style={{ color: '#6B7280' }}>{f.engagementRate}%</td>
                <td style={{ color: '#6B7280' }}>{f.saved.toLocaleString()}</td>
                <td style={{ fontWeight: 800, color: '#7C3AED' }}>{f.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {formats.length === 0 && <p style={{ color: '#6B7280', fontSize: 13, marginTop: 8 }}>Sem dados suficientes para o período.</p>}
      </Card>

      {/* Best times */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Melhores Horários para Postagem</div>
        <div style={{ display: 'flex', gap: 16 }}>
          {bestTimes.map((t, i) => (
            <div key={t.window} style={{
              flex: 1, background: i === 0 ? '#7C3AED18' : '#F8F7FF',
              border: `1px solid ${i === 0 ? '#7C3AED' : '#EBEBF5'}`,
              borderRadius: 12, padding: '16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: i === 0 ? '#7C3AED' : '#111827' }}>#{i + 1}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '6px 0' }}>{t.window}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>~{t.avgEngagement} engajamentos</div>
            </div>
          ))}
          {bestTimes.length === 0 && <p style={{ color: '#6B7280', fontSize: 13 }}>Dados insuficientes.</p>}
        </div>
      </Card>

      {/* Posts grid */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>Seus Posts</div>
            {posts.length > 0 && (
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{posts.length} posts sincronizados</div>
            )}
          </div>
        </div>

        {postsLoading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 14 }}>Carregando posts…</div>
        ) : posts.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: 32, color: '#6B7280', fontSize: 14 }}>
              Nenhum post encontrado para o período. Sincronize sua conta no Instagram nas Configurações.
            </div>
          </Card>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 16,
          }}>
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
