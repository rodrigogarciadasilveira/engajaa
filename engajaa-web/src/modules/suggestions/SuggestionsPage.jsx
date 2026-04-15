import { useEffect, useState } from 'react';
import api from '../../services/api';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/suggestions')
      .then(r => setSuggestions(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const refresh = async () => {
    setLoading(true);
    api.post('/suggestions/refresh')
      .then(r => setSuggestions(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  return (
    <PageWrapper
      title="Sugestões com IA"
      subtitle="Geradas com base nos dados reais do seu perfil"
      action={<Button onClick={refresh} disabled={loading} size="sm">🔄 Atualizar</Button>}
    >
      {loading && <p style={{ color: '#6B7280', fontSize: 14 }}>Gerando sugestões…</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {suggestions.map((s, i) => (
          <Card key={i} style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }}
            onClick={() => setExpanded(expanded === i ? null : i)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ fontSize: 28 }}>{s.icon}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Badge label={s.tag} />
                <Badge label={s.type} color="#6B7280" />
              </div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 6 }}>{s.title}</div>
            <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>{s.insight}</div>

            {expanded === i && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #EBEBF5', display: 'flex', gap: 10 }}>
                <Button size="sm">✍️ Criar conteúdo</Button>
                <Button size="sm" variant="secondary">📅 Agendar</Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {!loading && suggestions.length === 0 && (
        <Card>
          <p style={{ color: '#6B7280', fontSize: 14, textAlign: 'center' }}>
            Conecte sua conta do Instagram para gerar sugestões personalizadas.
          </p>
        </Card>
      )}
    </PageWrapper>
  );
}
