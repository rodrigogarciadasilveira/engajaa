import { useEffect, useState } from 'react';
import api from '../../services/api';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const STATUS_COLORS = { SCHEDULED: '#22C55E', DRAFT: '#F59E0B', PUBLISHED: '#6B7280', FAILED: '#EF4444' };
const STATUS_LABELS = { SCHEDULED: 'Agendado', DRAFT: 'Rascunho', PUBLISHED: 'Publicado', FAILED: 'Falhou' };

export default function SchedulerPage() {
  const [posts, setPosts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ mediaType: 'IMAGE', caption: '', scheduledAt: '', mediaUrls: [] });

  useEffect(() => {
    api.get('/scheduler/posts').then(r => setPosts(r.data)).catch(() => {});
  }, []);

  const create = async () => {
    try {
      const { data } = await api.post('/scheduler/posts', { ...form, mediaUrls: [] });
      setPosts(p => [data, ...p]);
      setShowModal(false);
      setForm({ mediaType: 'IMAGE', caption: '', scheduledAt: '', mediaUrls: [] });
    } catch (e) {
      alert(e.response?.data?.error || 'Erro ao criar agendamento');
    }
  };

  const remove = async (id) => {
    await api.delete(`/scheduler/posts/${id}`).catch(() => {});
    setPosts(p => p.filter(x => x.id !== id));
  };

  return (
    <PageWrapper
      title="Agendamento"
      subtitle="Calendário de publicações"
      action={<Button onClick={() => setShowModal(true)}>+ Nova publicação</Button>}
    >
      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #EBEBF5' }}>
              {['Data/Hora', 'Tipo', 'Legenda', 'Status', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '0 0 10px', color: '#6B7280', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {posts.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #EBEBF5' }}>
                <td style={{ padding: '12px 0', color: '#111827', fontWeight: 600 }}>
                  {new Date(p.scheduledAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td><Badge label={p.mediaType} color="#6B7280" /></td>
                <td style={{ color: '#6B7280', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.caption || '—'}
                </td>
                <td>
                  <Badge label={STATUS_LABELS[p.status]} color={STATUS_COLORS[p.status]} />
                </td>
                <td>
                  {['DRAFT', 'SCHEDULED'].includes(p.status) && (
                    <Button size="sm" variant="danger" onClick={() => remove(p.id)}>Remover</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && <p style={{ color: '#6B7280', fontSize: 13, marginTop: 12 }}>Nenhuma publicação agendada.</p>}
      </Card>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Nova Publicação</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={labelStyle}>Tipo de conteúdo
                <select value={form.mediaType} onChange={e => setForm(f => ({ ...f, mediaType: e.target.value }))} style={inputStyle}>
                  {['IMAGE', 'REELS', 'CAROUSEL', 'STORY'].map(t => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label style={labelStyle}>Legenda
                <textarea value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
                  style={{ ...inputStyle, height: 80, resize: 'vertical' }} placeholder="Escreva a legenda..." />
              </label>
              <label style={labelStyle}>Data e hora
                <input type="datetime-local" value={form.scheduledAt}
                  onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} style={inputStyle} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <Button onClick={create}>Salvar</Button>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

const labelStyle = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 700, color: '#111827' };
const inputStyle = { border: '1px solid #EBEBF5', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#111827', background: '#F8F7FF' };
