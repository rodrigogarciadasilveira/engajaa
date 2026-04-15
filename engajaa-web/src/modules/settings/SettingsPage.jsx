import { useState, useEffect } from 'react';
import api from '../../services/api';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useTenant } from '../../contexts/TenantContext';

function formatNumber(n) {
  if (n == null) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

const TABS = ['Perfil conectado', 'Equipe', 'Plano'];

export default function SettingsPage() {
  const [tab, setTab] = useState(0);
  const [igFeedback, setIgFeedback] = useState(null);
  const { igAccount, plan, refresh } = useTenant();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('ig_connected')) {
      setIgFeedback({ type: 'success', msg: 'Instagram conectado com sucesso!' });
      if (refresh) refresh();
      window.history.replaceState({}, '', '/settings');
    } else if (params.get('ig_error')) {
      setIgFeedback({ type: 'error', msg: `Erro: ${params.get('ig_error')}` });
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

  return (
    <PageWrapper title="Configurações">
      {igFeedback && (
        <div style={{
          marginBottom: 16, padding: '10px 16px', borderRadius: 10, fontSize: 14, fontWeight: 600,
          background: igFeedback.type === 'success' ? '#D1FAE5' : '#FEE2E2',
          color: igFeedback.type === 'success' ? '#065F46' : '#991B1B',
        }}>
          {igFeedback.msg}
        </div>
      )}
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #EBEBF5', paddingBottom: 0 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '8px 20px', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: tab === i ? 800 : 500, fontSize: 14,
            color: tab === i ? '#7C3AED' : '#6B7280',
            borderBottom: tab === i ? '2.5px solid #7C3AED' : '2.5px solid transparent',
            marginBottom: -1,
          }}>{t}</button>
        ))}
      </div>

      {tab === 0 && <InstagramTab igAccount={igAccount} onRefresh={refresh} />}
      {tab === 1 && <TeamTab />}
      {tab === 2 && <PlanTab plan={plan} />}
    </PageWrapper>
  );
}

function InstagramTab({ igAccount, onRefresh }) {
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const connect = async () => {
    const { data } = await api.get('/instagram/connect');
    window.location.href = data.url;
  };

  const handleSync = async () => {
    setSyncing(true);
    setFeedback(null);
    try {
      const { data } = await api.post('/instagram/sync');
      setFeedback({ type: 'success', msg: `Sincronização concluída! ${data.synced} posts atualizados.` });
      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', msg: 'Erro ao sincronizar. Tente novamente.' });
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Tem certeza que deseja desconectar sua conta do Instagram? Todos os dados de posts serão removidos.')) return;
    setDisconnecting(true);
    try {
      await api.delete('/instagram/disconnect');
      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', msg: 'Erro ao desconectar. Tente novamente.' });
      setDisconnecting(false);
    }
  };

  return (
    <Card>
      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Conta Instagram</div>

      {feedback && (
        <div style={{
          marginBottom: 16, padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: feedback.type === 'success' ? '#D1FAE5' : '#FEE2E2',
          color: feedback.type === 'success' ? '#065F46' : '#991B1B',
        }}>
          {feedback.msg}
        </div>
      )}

      {igAccount?.connected ? (
        <div>
          {/* Profile row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            {igAccount.profilePictureUrl ? (
              <img
                src={igAccount.profilePictureUrl}
                alt={igAccount.username}
                style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid #EBEBF5' }}
                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
              display: igAccount.profilePictureUrl ? 'none' : 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: 22, flexShrink: 0,
            }}>
              {igAccount.username?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontWeight: 800, fontSize: 16 }}>@{igAccount.username}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: '#22C55E',
                  background: '#D1FAE5', padding: '2px 8px', borderRadius: 6,
                }}>● Conectado</span>
              </div>
              {igAccount.biography && (
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4, maxWidth: 400 }}>{igAccount.biography}</div>
              )}
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                Conectado em {new Date(igAccount.connectedAt).toLocaleDateString('pt-BR')}
                {igAccount.lastSyncAt && (
                  <span> · Última sync: {new Date(igAccount.lastSyncAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 24, padding: '16px 0', borderTop: '1px solid #EBEBF5', borderBottom: '1px solid #EBEBF5' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#111827' }}>{formatNumber(igAccount.followersCount)}</div>
              <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>Seguidores</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#111827' }}>{formatNumber(igAccount.postCount ?? igAccount.mediaCount)}</div>
              <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>Posts</div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <Button onClick={handleSync} disabled={syncing}>
              {syncing ? 'Sincronizando…' : 'Sincronizar agora'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleDisconnect}
              disabled={disconnecting}
              style={{ color: '#EF4444', borderColor: '#FCA5A5' }}
            >
              {disconnecting ? 'Desconectando…' : 'Desconectar'}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}>Nenhuma conta conectada.</p>
          <Button onClick={connect}>Conectar Instagram</Button>
        </div>
      )}
    </Card>
  );
}

function TeamTab() {
  const [users, setUsers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');

  useState(() => {
    api.get('/users').then(r => setUsers(r.data)).catch(() => {});
  }, []);

  const invite = async () => {
    if (!inviteEmail) return;
    await api.post('/users/invite', { email: inviteEmail, role: 'VIEWER' }).catch(() => {});
    setInviteEmail('');
    api.get('/users').then(r => setUsers(r.data)).catch(() => {});
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Membros da equipe</div>
        {users.map(u => (
          <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #EBEBF5' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{u.name || u.email}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>{u.email}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#7C3AED', background: '#7C3AED18', padding: '3px 10px', borderRadius: 6 }}>{u.role}</span>
          </div>
        ))}
      </Card>
      <Card>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Convidar usuário</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
            placeholder="email@exemplo.com"
            style={{ flex: 1, border: '1px solid #EBEBF5', borderRadius: 10, padding: '8px 12px', fontSize: 13 }} />
          <Button onClick={invite}>Enviar convite</Button>
        </div>
      </Card>
    </div>
  );
}

function PlanTab({ plan }) {
  const openBilling = async () => {
    const { data } = await api.post('/tenant/billing-portal');
    window.open(data.url, '_blank');
  };

  return (
    <Card>
      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Plano atual</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#7C3AED' }}>{plan?.plan || 'FREE'}</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Status: {plan?.status || '—'}</div>
        </div>
        <Button onClick={openBilling} variant="secondary">Gerenciar</Button>
      </div>
    </Card>
  );
}
